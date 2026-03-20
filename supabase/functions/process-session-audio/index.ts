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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado: Cabeçalho de autorização ausente');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) {
      throw new Error('Não autorizado: Token inválido');
    }

    const body = await req.json();
    sessionId = body.sessionId;

    if (!sessionId) {
      throw new Error('sessionId é obrigatório');
    }

    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      throw new Error('Sessão não encontrada no banco de dados');
    }

    // Se já estiver processando, não iniciamos de novo para evitar erros de concorrência
    if (session.processing_status === 'processing') {
      return new Response(JSON.stringify({ success: true, message: 'Já está em processamento' }), { 
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Marcamos como processando para o usuário ver o feedback
    await supabase.from('sessions').update({
      processing_status: 'processing',
      processing_started_at: new Date().toISOString(),
      processing_attempts: (session.processing_attempts || 0) + 1,
      processing_error: null
    }).eq('id', sessionId);

    // Baixamos o áudio do Storage
    const { data: audioBlob, error: downloadError } = await supabase.storage
      .from('session-files')
      .download(session.audio_file_path);

    if (downloadError || !audioBlob) {
      throw new Error(`Erro ao baixar áudio do storage: ${downloadError?.message}`);
    }

    if (!serviceUrl || !serviceToken) {
      throw new Error('Configuração de serviço de IA ausente nas variáveis de ambiente');
    }

    // NORMALIZAÇÃO DE MIME TYPE:
    // O erro "audio/x-m4a" acontece porque a IA não reconhece esse prefixo "x-".
    // Vamos detectar a extensão e forçar um MIME type padrão.
    const fileName = session.audio_file_name || 'audio.mp3';
    const ext = fileName.split('.').pop()?.toLowerCase();
    let mimeType = audioBlob.type;

    if (ext === 'm4a') mimeType = 'audio/mp4';
    else if (ext === 'mp3') mimeType = 'audio/mpeg';
    else if (ext === 'wav') mimeType = 'audio/wav';
    else if (ext === 'webm') mimeType = 'audio/webm';

    // Criamos um novo arquivo com o MIME type correto para garantir a aceitação pela IA
    const fileToSend = new File([audioBlob], fileName, { type: mimeType });

    const formData = new FormData();
    formData.append('file', fileToSend);
    formData.append('sessionId', sessionId);

    console.log(`[process-session-audio] Enviando arquivo ${fileName} (${mimeType}) para a IA...`);

    const serviceResponse = await fetch(serviceUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${serviceToken}` },
      body: formData
    });

    if (!serviceResponse.ok) {
      const errorData = await serviceResponse.text();
      console.error(`[process-session-audio] Erro na resposta do serviço de IA: ${errorData}`);
      throw new Error(`Serviço de IA retornou erro: ${errorData}`);
    }

    const result = await serviceResponse.json();

    // Sucesso! Salvamos os resultados
    const { error: updateError } = await supabase.from('sessions').update({
      processing_status: 'completed',
      processing_finished_at: new Date().toISOString(),
      transcript: result.text || result.transcript || '',
      highlights: Array.isArray(result.highlights) ? result.highlights : [],
      next_steps: result.next_steps || '',
    }).eq('id', sessionId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, status: 'completed' }), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error(`[process-session-audio] Erro crítico: ${err.message}`);
    
    if (sessionId) {
      await supabase.from('sessions').update({
        processing_status: 'error',
        processing_finished_at: new Date().toISOString(),
        processing_error: err.message
      }).eq('id', sessionId);
    }

    return new Response(JSON.stringify({ success: false, error: err.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});