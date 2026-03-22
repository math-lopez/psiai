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

  // Configurações do Supabase e do Serviço de IA
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const serviceUrl = Deno.env.get('PROCESSING_SERVICE_URL');
  const serviceToken = Deno.env.get('PROCESSING_SERVICE_PARECER_CLINICO_TOKEN');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 2. Validação de Autenticação (JWT)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado: Cabeçalho de autorização ausente');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Não autorizado: Token inválido');
    }

    // 3. Obter ID da sessão
    const { sessionId } = await req.json();
    if (!sessionId) {
      throw new Error('sessionId é obrigatório');
    }

    // 4. Buscar dados da sessão e do paciente
    const { data: session, error: sError } = await supabase
      .from('sessions')
      .select('*, patient:patients(id, full_name)')
      .eq('id', sessionId)
      .single();

    if (sError || !session) {
      throw new Error('Sessão não encontrada');
    }

    // Validação de Ownership
    if (session.psychologist_id !== user.id) {
      throw new Error('Acesso negado');
    }
    
    // 5. Montar Payload EXATAMENTE como o serviço Python espera (sessions como array)
    const payload = {
      patientId: session.patient_id,
      psychologistId: session.psychologist_id,
      patient: {
        id: session.patient?.id,
        name: session.patient?.full_name
      },
      sessions: [
        {
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
      ]
    };

    if (!serviceUrl || !serviceToken) {
      throw new Error('Configuração do serviço de IA pendente no servidor.');
    }

    // 6. Chamada ao serviço Python no endpoint correto
    console.log(`[analyze-session-v2] Enviando análise para o endpoint: ${serviceUrl}/process-patient-analysis`);

    const apiResponse = await fetch(`${serviceUrl}/process-patient-analysis`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${serviceToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!apiResponse.ok) {
      const errorText = await apiResponse.text();
      console.error(`[analyze-session-v2] Erro no Python (${apiResponse.status}): ${errorText}`);
      throw new Error(`Serviço de IA retornou erro: ${errorText}`);
    }

    const aiResult = await apiResponse.json();

    if (!aiResult.success || !aiResult.summary) {
       throw new Error("A IA não retornou um resultado válido.");
    }

    // 7. Persistir resultado real
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

    if (upsertError) throw upsertError;

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