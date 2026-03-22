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
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Não autorizado')

    const { sessionId } = await req.json()
    if (!sessionId) throw new Error('sessionId é obrigatório')

    console.log(`[analyze-session-v2] Iniciando análise profunda para sessão: ${sessionId}`);

    // Busca os dados da sessão
    const { data: session, error: sError } = await supabase
      .from('sessions')
      .select('*, patient:patients(full_name)')
      .eq('id', sessionId)
      .single();

    if (sError || !session) throw new Error('Sessão não encontrada');
    if (!session.transcript && !session.manual_notes) throw new Error('Sessão sem conteúdo para análise');

    // SIMULAÇÃO DE ANÁLISE IA (Aqui você integraria com OpenAI/Anthropic no futuro)
    const mockAnalysis = {
      summary: "O paciente demonstrou progresso significativo na regulação emocional. Relatou melhora nos conflitos familiares, embora ainda apresente resistência ao abordar traumas de infância.",
      key_patterns: [
        "Uso de humor como mecanismo de defesa",
        "Melhora na percepção de gatilhos ansiosos",
        "Foco excessivo em validação externa"
      ],
      risk_flags: session.clinical_notes?.toLowerCase().includes('risco') ? ["Atenção a ideações mencionadas nas notas clínicas"] : [],
      recommendations: [
        "Aprofundar técnica de reestruturação cognitiva",
        "Manter diário de pensamentos focado no ambiente de trabalho",
        "Investigar padrão de evitação em relações sociais"
      ]
    };

    // Salva ou atualiza a análise
    const { error: upsertError } = await supabase
      .from('session_ai_analysis')
      .upsert({
        session_id: sessionId,
        patient_id: session.patient_id,
        psychologist_id: session.psychologist_id,
        summary: mockAnalysis.summary,
        key_patterns: mockAnalysis.key_patterns,
        risk_flags: mockAnalysis.risk_flags,
        recommendations: mockAnalysis.recommendations,
        updated_at: new Date().toISOString()
      }, { onConflict: 'session_id' });

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ success: true }), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error(`[analyze-session-v2] Erro: ${err.message}`);
    return new Response(JSON.stringify({ error: err.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
})