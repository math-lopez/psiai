import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Lidar com o preflight do CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Configurações do Supabase e do Serviço de IA (Secrets configurados no seu Vault)
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const serviceUrl = Deno.env.get('PROCESSING_SERVICE_URL');
  const serviceToken = Deno.env.get('PROCESSING_SERVICE_PARECER_CLINICO_TOKEN');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 2. Validação de Autenticação Real (JWT)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado: Cabeçalho de autorização ausente');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Não autorizado: Token inválido ou expirado');
    }

    // 3. Obter ID da sessão
    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new Error('sessionId é obrigatório');
    }

    console.log(`[analyze-session-v2] Iniciando análise real para sessão: ${sessionId} (Solicitado por: ${user.id})`);

    // 4. Buscar dados da sessão e do paciente com validação de Ownership
    const { data: session, error: sError } = await supabase
      .from('sessions')
      .select('*, patient:patients(id, full_name)')
      .eq('id', sessionId)
      .single();

    if (sError || !session) {
      throw new Error('Sessão não encontrada no banco de dados');
    }

    // SEGURANÇA: Validar se o usuário logado é o dono da sessão
    if (session.psychologist_id !== user.id) {
      console.error(`[analyze-session-v2] BLOQUEIO DE SEGURANÇA: User ${user.id} tentou acessar sessão do Psicólogo ${session.psychologist_id}`);
      throw new Error('Acesso negado: Você não tem permissão para analisar esta sessão');
    }
    
    // 5. Regras de Conteúdo: Validar se existe algo relevante para a IA analisar
    const hasContent = !!(
      (session.transcript && session.transcript.trim().length > 15) || 
      (session.manual_notes && session.manual_notes.trim().length > 15) || 
      (session.clinical_notes && session.clinical_notes.trim().length > 15) || 
      (session.interventions && session.interventions.trim().length > 15) || 
      (session.session_summary_manual && session.session_summary_manual.trim().length > 15) ||
      (session.highlights && session.highlights.length > 0)
    );

    if (!hasContent) {
      throw new Error('Sessão sem conteúdo clínico suficiente para análise profunda. Por favor, adicione notas ou finalize a transcrição.');
    }

    // 6. Montar Payload estruturado para o serviço Python
    const payload = {
      sessionId: session.id,
      patientId: session.patient_id,
      psychologistId: session.psychologist_id,
      patient: {
        id: session.patient?.id,
        name: session.patient?.full_name
      },
      session: {
        id: session.id,
        sessionDate: session.session_date,
        manualNotes: session.manual_notes,
        transcript: session.transcript,
        highlights: Array.isArray(session.highlights) ? session.highlights : [],
        nextSteps: session.next_steps,
        clinicalNotes: session.clinical_notes,
        interventions: session.interventions,
        sessionSummaryManual: session.session_summary_manual
      }
    };

    if (!serviceUrl || !serviceToken) {
      console.error("[analyze-session-v2] Erro de configuração: PROCESSING_SERVICE_URL ou TOKEN não encontrados.");
      throw new Error('Serviço de IA não configurado corretamente no servidor.');
    }

    // 7. Chamada ao serviço Python real (Railway)
    console.log(`[analyze-session-v2] Enviando dados para processamento em: ${serviceUrl}/process-session-analysis`);

    const apiResponse = await fetch(`${serviceUrl}/process-session-analysis`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${serviceToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`[analyze-session-v2] Serviço Python retornou erro (${apiResponse.status}): ${errorText}`);
      throw new Error(`O motor de IA encontrou um erro técnico. Tente novamente em alguns instantes.`);
    }

    const aiResult = await apiResponse.json();

    // Validar formato da resposta recebida da IA
    if (!aiResult.success || !aiResult.summary) {
       console.error("[analyze-session-v2] Resposta da IA inválida ou incompleta:", aiResult);
       throw new Error("A IA retornou um resultado processado com falhas.");
    }

    // 8. Persistir os dados reais no banco de dados
    const { error: upsertError } = await supabase
      .from('session_ai_analysis')
      .upsert({
        session_id: sessionId,
        patient_id: session.patient_id,
        psychologist_id: session.psychologist_id,
        summary: aiResult.summary,
        key_patterns: Array.isArray(aiResult.key_patterns) ? aiResult.key_patterns : [],
        risk_flags: Array.isArray(aiResult.risk_flags) ? aiResult.risk_flags : [],
        recommendations: Array.isArray(aiResult.recommendations) ? aiResult.recommendations : [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'session_id' });

    if (upsertError) {
      console.error("[analyze-session-v2] Erro ao salvar análise no Supabase:", upsertError);
      throw new Error("Não foi possível salvar os resultados da análise no banco de dados.");
    }

    console.log(`[analyze-session-v2] Análise profunda concluída com sucesso para a sessão ${sessionId}`);

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error(`[analyze-session-v2] Erro Crítico: ${err.message}`);
    return new Response(JSON.stringify({ 
      success: false, 
      error: err.message 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})