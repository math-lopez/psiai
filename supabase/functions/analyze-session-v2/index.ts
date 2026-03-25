import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const serviceUrl = Deno.env.get('PROCESSING_SERVICE_URL');
  const serviceToken = Deno.env.get('PROCESSING_SERVICE_PARECER_CLINICO_TOKEN');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Não autorizado');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Token inválido');

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error('sessionId é obrigatório');

    const { data: session, error: sError } = await supabase
      .from('sessions')
      .select('*, patient:patients(id, full_name)')
      .eq('id', sessionId)
      .single();

    if (sError || !session) throw new Error('Sessão não encontrada');
    if (session.psychologist_id !== user.id) throw new Error('Acesso negado');
    
    // 1. MARCAR COMO PROCESSANDO IMEDIATAMENTE NO BANCO
    // Isso vai disparar o Realtime no Front-end
    await supabase.from('session_ai_analysis').upsert({
      session_id: sessionId,
      patient_id: session.patient_id,
      psychologist_id: session.psychologist_id,
      status: 'processing',
      updated_at: new Date().toISOString()
    }, { onConflict: 'session_id' });

    // 2. RETORNAR SUCESSO PARA O FRONT-END (FIRE AND FORGET)
    // Infelizmente o Deno Edge Runtime termina a execução após o retorno. 
    // Para tarefas muito longas, o ideal é que o Python atualize o banco diretamente.
    // Mas vamos tentar manter a conexão aberta o máximo possível ou usar Realtime para compensar quedas.
    
    const payload = {
      patientId: session.patient_id,
      psychologistId: session.psychologist_id,
      patient: { id: session.patient?.id, name: session.patient?.full_name },
      sessions: [{
        id: session.id,
        sessionDate: session.session_date,
        manualNotes: session.manual_notes,
        transcript: session.transcript,
        highlights: session.highlights || [],
        nextSteps: session.next_steps,
        clinicalNotes: session.clinical_notes,
        interventions: session.interventions,
        sessionSummaryManual: session.session_summary_manual
      }]
    };

    console.log(`[analyze-session-v2] Chamando Python para sessão ${sessionId}...`);

    // Iniciamos a chamada. Se o Deno matar a função por tempo, o Python ainda pode terminar o trabalho
    // se ele tiver permissão para dar o update de volta no banco.
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
      throw new Error(`Serviço Python: ${errorText}`);
    }

    const aiResult = await apiResponse.json();

    // 3. ATUALIZAR COM RESULTADO FINAL
    await supabase.from('session_ai_analysis').upsert({
      session_id: sessionId,
      patient_id: session.patient_id,
      psychologist_id: session.psychologist_id,
      summary: aiResult.summary,
      key_patterns: aiResult.key_patterns || [],
      risk_flags: aiResult.risk_flags || [],
      recommendations: aiResult.recommendations || [],
      status: 'completed',
      updated_at: new Date().toISOString()
    }, { onConflict: 'session_id' });

    return new Response(JSON.stringify({ success: true, status: 'processing_triggered' }), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error(`[analyze-session-v2] Erro: ${err.message}`);
    // Opcional: Marcar erro no banco para o Realtime avisar o front
    return new Response(JSON.stringify({ success: false, error: err.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})