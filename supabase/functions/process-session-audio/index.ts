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

  let sessionId: string | null = null;
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  const serviceUrl = Deno.env.get('PROCESSING_SERVICE_URL');
  const serviceToken = Deno.env.get('PROCESSING_SERVICE_INTERNAL_TOKEN');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Autenticação do Usuário
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Não autorizado' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Token inválido' }), { 
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 2. Extração e Validação do Body (apenas uma vez)
    const body = await req.json();
    sessionId = body.sessionId;

    if (!sessionId) {
      return new Response(JSON.stringify({ success: false, error: 'sessionId é obrigatório' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    console.log(`[process-session-audio] Iniciando para sessão ${sessionId} (User: ${user.id})`);

    // 3. Busca da Sessão e Validação de Propriedade
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return new Response(JSON.stringify({ success: false, error: 'Sessão não encontrada' }), { 
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (session.psychologist_id !== user.id) {
      return new Response(JSON.stringify({ success: false, error: 'Acesso negado' }), { 
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (!session.audio_file_path) {
      return new Response(JSON.stringify({ success: false, error: 'Sessão sem arquivo de áudio' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 4. Verificação de Status de Processamento
    if (['queued', 'processing'].includes(session.processing_status)) {
      return new Response(JSON.stringify({ 
        success: true, 
        sessionId, 
        status: session.processing_status,
        message: 'Já em processamento' 
      }), { 
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 5. Início do Fluxo de Status (Queued -> Processing)
    await supabase.from('sessions').update({
      processing_status: 'queued',
      processing_requested_at: new Date().toISOString(),
      processing_error: null
    }).eq('id', sessionId);

    await supabase.from('sessions').update({
      processing_status: 'processing',
      processing_started_at: new Date().toISOString(),
      processing_attempts: (session.processing_attempts || 0) + 1
    }).eq('id', sessionId);

    // 6. Download do Áudio do Storage
    console.log(`[process-session-audio] Baixando áudio: ${session.audio_file_path}`);
    const { data: audioBlob, error: downloadError } = await supabase.storage
      .from('session-files')
      .download(session.audio_file_path);

    if (downloadError || !audioBlob) {
      throw new Error(`Erro no download do storage: ${downloadError?.message || 'Arquivo não encontrado'}`);
    }

    // 7. Chamada ao Serviço Externo de IA
    if (!serviceUrl || !serviceToken) {
      throw new Error('Serviço de IA não configurado no servidor');
    }

    const formData = new FormData();
    formData.append('file', audioBlob, session.audio_file_name || 'audio.mp3');
    formData.append('sessionId', sessionId);

    console.log(`[process-session-audio] Enviando para serviço externo: ${serviceUrl}`);
    const serviceResponse = await fetch(serviceUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${serviceToken}` },
      body: formData
    });

    if (!serviceResponse.ok) {
      const errorText = await serviceResponse.text();
      throw new Error(`Serviço de IA falhou (${serviceResponse.status}): ${errorText}`);
    }

    const result = await serviceResponse.json();

    // 8. Validação da Resposta da IA
    if (!result.success || typeof result.text !== 'string') {
      throw new Error('Serviço de IA retornou uma resposta inválida ou incompleta');
    }

    // 9. Sucesso: Atualização Final dos Dados
    const { error: updateError } = await supabase.from('sessions').update({
      processing_status: 'completed',
      processing_finished_at: new Date().toISOString(),
      transcript: result.text,
      highlights: Array.isArray(result.highlights) ? result.highlights : [],
      next_steps: result.next_steps || '',
      processing_error: null
    }).eq('id', sessionId);

    if (updateError) throw updateError;

    console.log(`[process-session-audio] Sessão ${sessionId} processada com sucesso`);

    return new Response(JSON.stringify({
      success: true,
      sessionId,
      status: 'completed'
    }), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error(`[process-session-audio] Erro crítico: ${err.message}`);
    
    // 10. Tratamento de Erro e Atualização de Status no Banco
    if (sessionId) {
      await supabase.from('sessions').update({
        processing_status: 'error',
        processing_finished_at: new Date().toISOString(),
        processing_error: err.message
      }).eq('id', sessionId);
    }

    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});