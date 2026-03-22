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
  
  // URL específica para análise conforme seu exemplo de curl bem-sucedido
  const ANALYSIS_URL = "https://patient-analysis-service-production.up.railway.app/process-patient-analysis";

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Não autorizado');

    const { patientId } = await req.json();
    if (!patientId) throw new Error('patientId é obrigatório');

    // 1. Buscar dados do paciente e sessões
    const [patientRes, sessionsRes] = await Promise.all([
      supabase.from('patients').select('*').eq('id', patientId).single(),
      supabase.from('sessions').select('*').eq('patient_id', patientId).order('session_date', { ascending: false }).limit(10)
    ]);

    const patient = patientRes.data;
    const sessions = sessionsRes.data || [];

    if (!patient) throw new Error('Paciente não encontrado');

    // 2. Montar o payload conforme o curl (camelCase e estrutura aninhada)
    const payload = {
      patientId: patient.id,
      psychologistId: patient.psychologist_id,
      patient: {
        id: patient.id,
        name: patient.full_name
      },
      sessions: sessions.map(s => ({
        id: s.id,
        sessionDate: s.session_date,
        manualNotes: s.manual_notes || "",
        transcript: s.transcript || "",
        highlights: s.highlights || [],
        nextSteps: s.next_steps || ""
      }))
    };

    console.log(`[analyze-patient-history] Enviando análise JSON para: ${ANALYSIS_URL}`);

    // 3. Chamar o serviço externo
    const response = await fetch(ANALYSIS_URL, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${serviceToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[analyze-patient-history] Resposta de erro: ${errorText}`);
      throw new Error(`Erro no Serviço de Análise: ${errorText}`);
    }

    const result = await response.json();
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error(`[analyze-patient-history] Erro: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})