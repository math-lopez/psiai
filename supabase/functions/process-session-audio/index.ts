import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 1. Tratar CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  const serviceUrl = Deno.env.get('PROCESSING_SERVICE_URL')
  const serviceToken = Deno.env.get('PROCESSING_SERVICE_INTERNAL_TOKEN')

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    // 3. Validar JWT e obter usuário
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Não autorizado: Header ausente')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))
    if (authError || !user) throw new Error('Não autorizado: Token inválido')

    // 5. Validar input
    const { sessionId } = await req.json()
    if (!sessionId) throw new Error('sessionId é obrigatório')

    console.log(`[process-session-audio] Iniciando processo para sessão ${sessionId} (User: ${user.id})`)

    // 6. Buscar sessão e validar ownership
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single()

    if (fetchError || !session) throw new Error('Sessão não encontrada')
    if (session.psychologist_id !== user.id) throw new Error('Acesso negado: Você não é o dono desta sessão')

    // 8. Validar áudio
    if (!session.audio_file_path) throw new Error('Esta sessão não possui arquivo de áudio para processar')

    // 9. Impedir reenvio se já estiver processando
    if (['queued', 'processing'].includes(session.processing_status)) {
       return new Response(JSON.stringify({ 
         success: true, 
         message: 'Sessão já está em processamento', 
         status: session.processing_status 
       }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // 11. Atualizar para Queued
    await supabase.from('sessions').update({
      processing_status: 'queued',
      processing_requested_at: new Date().toISOString(),
      processing_error: null
    }).eq('id', sessionId)

    // 12. Iniciar processamento real
    await supabase.from('sessions').update({
      processing_status: 'processing',
      processing_started_at: new Date().toISOString(),
      processing_attempts: (session.processing_attempts || 0) + 1
    }).eq('id', sessionId)

    // 13. Baixar arquivo do Storage
    console.log(`[process-session-audio] Baixando arquivo: ${session.audio_file_path}`)
    const { data: audioBlob, error: downloadError } = await supabase.storage
      .from('session-files')
      .download(session.audio_file_path)

    if (downloadError || !audioBlob) throw new Error(`Erro ao baixar áudio do storage: ${downloadError?.message}`)

    // 14. Preparar envio para serviço externo
    if (!serviceUrl || !serviceToken) {
        throw new Error('Serviço de processamento não configurado (Env vars ausentes)')
    }

    const formData = new FormData()
    formData.append('file', audioBlob, session.audio_file_name || 'audio.mp3')
    formData.append('sessionId', sessionId)

    console.log(`[process-session-audio] Enviando para serviço externo: ${serviceUrl}`)
    
    const serviceResponse = await fetch(serviceUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceToken}`
      },
      body: formData
    })

    if (!serviceResponse.ok) {
      const errorText = await serviceResponse.text()
      throw new Error(`Serviço externo retornou erro (${serviceResponse.status}): ${errorText}`)
    }

    const result = await serviceResponse.json()

    // 19. Sucesso - Atualizar sessão
    const { error: updateError } = await supabase.from('sessions').update({
      processing_status: 'completed',
      processing_finished_at: new Date().toISOString(),
      transcript: result.text || '',
      highlights: result.highlights || [],
      next_steps: result.next_steps || '',
      processing_error: null
    }).eq('id', sessionId)

    if (updateError) throw updateError

    console.log(`[process-session-audio] Sessão ${sessionId} processada com sucesso`)

    return new Response(JSON.stringify({
      success: true,
      sessionId,
      status: 'completed'
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err: any) {
    console.error(`[process-session-audio] Erro crítico: ${err.message}`)
    
    // 20. Registrar erro no banco se tivermos o sessionId
    const requestBody = await req.clone().json().catch(() => ({}))
    const sId = requestBody.sessionId
    
    if (sId) {
      await supabase.from('sessions').update({
        processing_status: 'error',
        processing_finished_at: new Date().toISOString(),
        processing_error: err.message
      }).eq('id', sId)
    }

    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), { 
      status: 400, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    })
  }
})