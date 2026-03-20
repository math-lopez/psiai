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

    const body = await req.json();
    sessionId = body.sessionId;

    if (!sessionId) {
      return new Response(JSON.stringify({ success: false, error: 'sessionId é obrigatório' }), { 
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

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

    // Bloqueia apenas se já estiver em processamento ativo (evita duplicidade)
    if (session.processing_status === 'processing') {
      return new Response(JSON.stringify({ success: true, message: 'Já processando' }), { 
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // 5. Início do Fluxo
    await supabase.from('sessions').update({
      processing_status: 'processing',
      processing_started_at: new Date().toISOString(),
      processing_attempts: (session.processing_attempts || 0) + 1,
      processing_error: null
    }).eq('id', sessionId);

    const { data: audioBlob, error: downloadError } = await supabase.storage
      .from('session-files')
      .download(session.audio_file_path);

    if (downloadError || !audioBlob) {
      throw new Error(`Erro no download: ${downloadError?.message}`);
    }

    if (!serviceUrl || !serviceToken) {
      throw new Error('Serviço de IA não configurado');
    }

    const formData = new FormData();
    formData.append('file', audioBlob, session.audio_file_name || 'audio.mp3');
    formData.append('sessionId', sessionId);

    const serviceResponse = await fetch(serviceUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${serviceToken}` },
      body: formData
    });

    if (!serviceResponse.ok) {
      const errorText = await serviceResponse.text();
      throw new Error(`Serviço de IA falhou: ${errorText}`);
    }

    const result = await serviceResponse.json();

    const { error: updateError } = await supabase.from('sessions').update({
      processing_status: 'completed',
      processing_finished_at: new Date().toISOString(),
      transcript: result.text,
      highlights: Array.isArray(result.highlights) ? result.highlights : [],
      next_steps: result.next_steps || '',
    }).eq('id', sessionId);

    if (updateError) throw updateError;

    return new Response(JSON.stringify({ success: true, status: 'completed' }), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
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