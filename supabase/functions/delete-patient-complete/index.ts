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
  
  // Usamos o Service Role para ter poder de deletar usuários e arquivos sem restrições de RLS
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Validar o psicólogo logado (Segurança)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Não autorizado');

    const { data: { user: psychologist }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !psychologist) throw new Error('Token inválido');

    const { patientId } = await req.json();
    if (!patientId) throw new Error('patientId é obrigatório');

    console.log(`[delete-patient-complete] Iniciando exclusão do paciente ${patientId} por ${psychologist.email}`);

    // 2. Verificar se o paciente pertence a este psicólogo
    const { data: patient, error: pError } = await supabaseAdmin
      .from('patients')
      .select('id, full_name')
      .eq('id', patientId)
      .eq('psychologist_id', psychologist.id)
      .single();

    if (pError || !patient) throw new Error('Paciente não encontrado ou você não tem permissão para excluí-lo.');

    // 3. Buscar o user_id (Auth) do paciente para deletar a conta depois
    const { data: access } = await supabaseAdmin
      .from('patient_access')
      .select('user_id')
      .eq('patient_id', patientId)
      .maybeSingle();

    const patientAuthUserId = access?.user_id;

    // 4. Coletar caminhos de todos os arquivos nos buckets
    const [sessionsRes, attachmentsRes] = await Promise.all([
      supabaseAdmin.from('sessions').select('audio_file_path').eq('patient_id', patientId),
      supabaseAdmin.from('patient_attachments').select('file_path').eq('patient_id', patientId)
    ]);

    const sessionFiles = sessionsRes.data?.map(s => s.audio_file_path).filter(Boolean) as string[] || [];
    const attachmentFiles = attachmentsRes.data?.map(a => a.file_path).filter(Boolean) as string[] || [];

    // 5. LIMPEZA: Remover arquivos físicos
    if (sessionFiles.length > 0) {
      console.log(`[delete-patient-complete] Removendo ${sessionFiles.length} áudios...`);
      await supabaseAdmin.storage.from('session-files').remove(sessionFiles);
    }
    if (attachmentFiles.length > 0) {
      console.log(`[delete-patient-complete] Removendo ${attachmentFiles.length} documentos...`);
      await supabaseAdmin.storage.from('patient-attachments').remove(attachmentFiles);
    }

    // 6. LIMPEZA: Deletar registro do banco (o CASCADE cuidará das sessões, logs, etc)
    const { error: dbDeleteError } = await supabaseAdmin
      .from('patients')
      .delete()
      .eq('id', patientId);

    if (dbDeleteError) throw dbDeleteError;

    // 7. LIMPEZA FINAL: Deletar a conta de Autenticação do paciente (se existir)
    if (patientAuthUserId) {
      console.log(`[delete-patient-complete] Removendo conta Auth do paciente: ${patientAuthUserId}`);
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(patientAuthUserId);
      if (authDeleteError) console.error("[delete-patient-complete] Erro ao deletar usuário Auth:", authDeleteError.message);
    }

    return new Response(JSON.stringify({ success: true, message: 'Paciente e todos os dados foram removidos permanentemente.' }), { 
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (err: any) {
    console.error(`[delete-patient-complete] Erro: ${err.message}`);
    return new Response(JSON.stringify({ success: false, error: err.message }), { 
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});