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

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', // Usando service role para criar usuários
      { auth: { persistSession: false } }
    )

    const { email, password, patientId, action } = await req.json()

    console.log(`[create-patient-user] Ação: ${action || 'create'} para paciente ${patientId} com email ${email}`);

    if (action === 'reset_password') {
      // 1. Localizar o usuário pelo email
      const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers()
      if (listError) throw listError
      
      const user = users.find(u => u.email === email)
      if (!user) throw new Error("Usuário não encontrado para este e-mail.")

      // 2. Atualizar a senha do usuário
      const { error: resetError } = await supabaseClient.auth.admin.updateUserById(
        user.id,
        { password: password }
      )
      if (resetError) throw resetError

      return new Response(JSON.stringify({ success: true, message: "Senha redefinida com sucesso." }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Fluxo padrão de criação (se não for reset)
    // 1. Criar o usuário no Auth (já confirmado)
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // PULA A CONFIRMAÇÃO DE EMAIL
    })

    if (authError) throw authError

    // 2. Criar ou Atualizar o registro em patient_access
    const { error: accessError } = await supabaseClient
      .from('patient_access')
      .upsert({
        patient_id: patientId,
        user_id: authUser.user.id,
        status: 'active',
        updated_at: new Date().toISOString()
      }, { onConflict: 'patient_id' })

    if (accessError) throw accessError

    return new Response(JSON.stringify({ success: true, userId: authUser.user.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error(`[create-patient-user] Erro:`, error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})