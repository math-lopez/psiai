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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const resendApiKey = Deno.env.get('RESEND_API_KEY') // Você deve configurar este segredo no console do Supabase
    
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey,
      { auth: { persistSession: false } }
    )

    const { email, password, patientId, action, patientName } = await req.json()

    // Geração de senha aleatória se não for fornecida (fluxo automático)
    const finalPassword = password || Math.random().toString(36).substring(2, 10) + "!"

    console.log(`[create-patient-user] Ação: ${action || 'create'} | Paciente: ${patientName || patientId} | Email: ${email} | Senha Gerada: ${finalPassword}`);

    // Função auxiliar para enviar e-mail via Resend
    const sendWelcomeEmail = async (toEmail: string, name: string, pass: string) => {
      if (!resendApiKey) {
        console.warn("[create-patient-user] RESEND_API_KEY não configurada. E-mail não enviado.");
        return;
      }

      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: 'PsiAI <onboarding@resend.dev>', // Em produção, use seu domínio verificado
            to: [toEmail],
            subject: 'Seu acesso ao Portal Terapêutico está pronto!',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px;">
                <h2 style="color: #4f46e5;">Olá, ${name}!</h2>
                <p>Seu psicólogo liberou seu acesso ao nosso portal. Agora você pode acompanhar seu diário e atividades entre as sessões.</p>
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px; color: #64748b;">Seus dados de acesso:</p>
                  <p style="margin: 10px 0 5px 0;"><strong>E-mail:</strong> ${toEmail}</p>
                  <p style="margin: 0;"><strong>Senha Temporária:</strong> <span style="color: #4f46e5; font-weight: bold; font-family: monospace; font-size: 18px;">${pass}</span></p>
                </div>
                <p>Recomendamos que você altere sua senha após o primeiro acesso para sua total segurança.</p>
                <a href="${req.headers.get('origin') || 'http://localhost:32109'}/login" 
                   style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 10px;">
                   Acessar Meu Portal
                </a>
                <p style="font-size: 12px; color: #94a3b8; margin-top: 30px; border-top: 1px solid #f1f5f9; padding-top: 20px;">
                  Este é um e-mail automático. Se você não esperava este convite, por favor desconsidere.
                </p>
              </div>
            `,
          }),
        });
        const data = await res.json();
        console.log(`[create-patient-user] Resposta Resend:`, data);
      } catch (err) {
        console.error(`[create-patient-user] Erro ao enviar e-mail:`, err.message);
      }
    };

    if (action === 'reset_password') {
      // 1. Localizar o usuário pelo email
      const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers()
      if (listError) throw listError
      
      const user = users.find(u => u.email === email)
      if (!user) throw new Error("Usuário não encontrado para este e-mail.")

      // 2. Atualizar a senha do usuário
      const { error: resetError } = await supabaseClient.auth.admin.updateUserById(
        user.id,
        { password: finalPassword }
      )
      if (resetError) throw resetError

      // Envia e-mail de nova senha se o Resend estiver ativo
      await sendWelcomeEmail(email, patientName || "Paciente", finalPassword);

      console.log(`[create-patient-user] Senha REDEFINIDA para: ${finalPassword}`);

      return new Response(JSON.stringify({ success: true, message: "Senha redefinida e e-mail enviado.", password: finalPassword }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    // Fluxo padrão de criação (se não for reset)
    // 1. Criar o usuário no Auth (já confirmado)
    const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
      email: email,
      password: finalPassword,
      email_confirm: true,
      user_metadata: { 
        role: 'patient',
        full_name: patientName 
      }
    })

    if (authError) {
      // Se o usuário já existir, apenas vinculamos ao paciente (pode ser um paciente que já teve acesso antes)
      if (authError.message.includes("already has been registered")) {
        const { data: { users } } = await supabaseClient.auth.admin.listUsers()
        const existingUser = users.find(u => u.email === email)
        if (existingUser) {
          const { error: accessError } = await supabaseClient
            .from('patient_access')
            .upsert({
              patient_id: patientId,
              user_id: existingUser.id,
              status: 'active',
              updated_at: new Date().toISOString()
            }, { onConflict: 'patient_id' })
          
          if (accessError) throw accessError
          return new Response(JSON.stringify({ success: true, message: "Vínculo atualizado para usuário existente." }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          })
        }
      }
      throw authError
    }

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

    // 3. ENVIAR E-MAIL DE BOAS-VINDAS COM A SENHA
    await sendWelcomeEmail(email, patientName || "Paciente", finalPassword);

    return new Response(JSON.stringify({ 
      success: true, 
      userId: authUser.user.id, 
      password: finalPassword 
    }), {
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