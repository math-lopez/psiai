import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const serviceToken = Deno.env.get('PROCESSING_SERVICE_INTERNAL_TOKEN');
  
  // Endpoint específico para análise de sessão única
  const SESSION_ANALYSIS_URL = "https://session-analysis-service-production.up.railway.app/process-session-analysis";

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Não autorizado');

    const { sessionId } = await req.json();
    if (!sessionId) throw new Error('sessionId é obrigatório');

    // 1. Buscar a sessão e validar propriedade
    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select('*, patient:patients(id, full_name)')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) throw new Error('Sessão não encontrada');

    // 2. Montar o payload conforme especificado
    const payload = {
      sessionId: session.id,
      patientId: session.patient_id,
      psychologistId: session.psychologist_id,
      session: {
        id: session.id,
        sessionDate: session.session_date,
        manualNotes: session.manual_notes || "",
        transcript: session.transcript || "",
        highlights: session.highlights || [],
        nextSteps: session.next_steps || ""
      }
    };

    console.log(`[analyze-session-ai] Enviando análise de sessão para: ${SESSION_ANALYSIS_URL}`);

    // 3. Chamar o serviço externo de IA
    const response = await fetch(SESSION_ANALYSIS_URL, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${serviceToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Serviço de IA retornou erro: ${errorText}`);
    }

    const result = await response.json();

    // 4. Salvar o resultado estruturado na nova tabela
    const { error: upsertError } = await supabase
      .from('session_ai_analysis')
      .upsert({
        session_id: sessionId,
        patient_id: session.patient_id,
        psychologist_id: session.psychologist_id,
        summary: result.summary || "",
        key_patterns: result.key_patterns || [],
        risk_flags: result.risk_flags || [],
        recommendations: result.recommendations || [],
        updated_at: new Date().toISOString()
      }, { onConflict: 'session_id' });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error(`[analyze-session-ai] Erro: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})