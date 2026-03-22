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
  const serviceUrl = Deno.env.get('PROCESSING_SERVICE_URL');
  const serviceToken = Deno.env.get('PROCESSING_SERVICE_INTERNAL_TOKEN');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Não autorizado');

    const { patientId } = await req.json();
    if (!patientId) throw new Error('patientId é obrigatório');

    // 1. Coletar todos os dados relevantes do paciente
    const [patientRes, sessionsRes, goalsRes, logsRes] = await Promise.all([
      supabase.from('patients').select('*').eq('id', patientId).single(),
      supabase.from('sessions').select('*').eq('patient_id', patientId).order('session_date', { ascending: false }).limit(5),
      supabase.from('treatment_goals').select('*').eq('patient_id', patientId),
      supabase.from('patient_logs').select('*').eq('patient_id', patientId).eq('visibility', 'shared_with_psychologist').order('created_at', { ascending: false }).limit(10)
    ]);

    const patient = patientRes.data;
    const sessions = sessionsRes.data || [];
    const goals = goalsRes.data || [];
    const logs = logsRes.data || [];

    // 2. Formatar os dados para a IA
    const context = {
      patient_info: {
        name: patient.full_name,
        age: patient.birth_date ? Math.floor((new Date().getTime() - new Date(patient.birth_date).getTime()) / 31557600000) : 'N/A',
        notes: patient.notes
      },
      recent_sessions: sessions.map(s => ({
        date: s.session_date,
        summary: s.session_summary_manual || s.manual_notes,
        clinical_notes: s.clinical_notes,
        highlights: s.highlights
      })),
      treatment_goals: goals.map(g => ({ title: g.title, status: g.status })),
      recent_diary_entries: logs.map(l => ({ content: l.content, mood: l.mood, date: l.created_at }))
    };

    if (!serviceUrl || !serviceToken) throw new Error('Configuração de IA ausente');

    // 3. Chamar o serviço de IA para análise clínica consolidada
    const response = await fetch(serviceUrl + "/analyze-history", {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${serviceToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(context)
    });

    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(`IA Service Error: ${errorMsg}`);
    }

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (err: any) {
    console.error(`[analyze-patient] Erro: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
})