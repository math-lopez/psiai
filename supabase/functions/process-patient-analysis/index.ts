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
  const pythonServiceUrl = Deno.env.get('PYTHON_ANALYSIS_SERVICE_URL'); // Futuro serviço
  const pythonServiceToken = Deno.env.get('PYTHON_ANALYSIS_SERVICE_TOKEN');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Não autorizado');

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) throw new Error('Token inválido');

    const { patientId } = await req.json();
    if (!patientId) throw new Error('patientId é obrigatório');

    // 1. Validar ownership e buscar dados do paciente
    const { data: patient, error: pError } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .eq('psychologist_id', user.id)
      .single();

    if (pError || !patient) throw new Error('Paciente não encontrado ou acesso negado');

    // 2. Buscar todas as sessões do paciente
    const { data: sessions, error: sError } = await supabase
      .from('sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('session_date', { ascending: true });

    if (sError) throw sError;

    // 3. Criar ou atualizar registro de análise para status 'processing'
    const { data: analysisRecord, error: aError } = await supabase
      .from('patient_ai_analyses')
      .insert([{
        patient_id: patientId,
        psychologist_id: user.id,
        status: 'processing',
        source_session_count: sessions?.length || 0,
        source_last_session_at: sessions?.[sessions.length - 1]?.session_date || null
      }])
      .select()
      .single();

    if (aError) throw aError;

    // 4. Montar Payload Consolidado para o futuro serviço Python
    const payload = {
      patientId: patient.id,
      psychologistId: user.id,
      patient: {
        id: patient.id,
        name: patient.full_name
      },
      sessions: sessions.map(s => ({
        id: s.id,
        sessionDate: s.session_date,
        manualNotes: s.manual_notes,
        transcript: s.transcript,
        highlights: s.highlights,
        nextSteps: s.next_steps
      }))
    };

    console.log(`[process-patient-analysis] Payload preparado para o paciente ${patient.id}. Total de sessões: ${sessions.length}`);

    // 5. Placeholder para chamada ao serviço Python
    // Por enquanto, simulamos uma resposta de sucesso ou erro dependendo da config
    if (!pythonServiceUrl) {
       console.log("[process-patient-analysis] Python Service URL não configurada. Simulando resposta...");
       
       // Simulando um delay e resposta automática para teste da estrutura
       await supabase.from('patient_ai_analyses').update({
         status: 'completed',
         generated_summary: `Análise consolidada de ${sessions.length} sessões. O paciente apresenta evolução constante nas queixas relatadas inicialmente. (Simulação)`,
         generated_recommendations: ["Manter foco nas técnicas de TCC", "Explorar gatilhos de ansiedade social"],
         generated_risk_flags: []
       }).eq('id', analysisRecord.id);

    } else {
       // AQUI ENTRARÁ A CHAMADA REAL NO PRÓXIMO PASSO
       /*
       const response = await fetch(pythonServiceUrl, {
         method: 'POST',
         headers: { 
           'Authorization': `Bearer ${pythonServiceToken}`,
           'Content-Type': 'application/json'
         },
         body: JSON.stringify(payload)
       });
       const result = await response.json();
       // Atualizar banco com o resultado real...
       */
    }

    return new Response(JSON.stringify({ success: true, analysisId: analysisRecord.id }), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error(`[process-patient-analysis] Erro: ${err.message}`);
    return new Response(JSON.stringify({ success: false, error: err.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});