import { supabase } from "@/integrations/supabase/client";
import { PatientAttachment, AttachmentVisibility } from "@/types/attachment";
import { sanitizeFileName } from "@/lib/file-utils";

const BUCKET_NAME = 'patient-attachments';

export const attachmentService = {
  list: async (patientId: string): Promise<PatientAttachment[]> => {
    const { data, error } = await supabase
      .from('patient_attachments')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  upload: async (
    patientId: string,
    psychologistId: string,
    file: File,
    visibility: AttachmentVisibility = 'private_to_psychologist',
    role: 'psychologist' | 'patient' = 'psychologist'
  ): Promise<PatientAttachment> => {
    const timestamp = Date.now();
    const sanitizedName = sanitizeFileName(file.name);
    const filePath = `${psychologistId}/${patientId}/${timestamp}-${sanitizedName}`;

    // 1. Upload para o Storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file);

    if (storageError) throw storageError;

    // 2. Registro no Banco de Dados
    const { data, error: dbError } = await supabase
      .from('patient_attachments')
      .insert([{
        patient_id: patientId,
        psychologist_id: psychologistId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: file.type,
        visibility: role === 'patient' ? 'shared_with_patient' : visibility,
        uploaded_by: role
      }])
      .select()
      .single();

    if (dbError) throw dbError;
    return data;
  },

  delete: async (attachment: PatientAttachment): Promise<void> => {
    // 1. Remove do Storage
    await supabase.storage.from(BUCKET_NAME).remove([attachment.file_path]);
    
    // 2. Remove do Banco
    const { error } = await supabase
      .from('patient_attachments')
      .delete()
      .eq('id', attachment.id);
    
    if (error) throw error;
  },

  getDownloadUrl: async (path: string): Promise<string> => {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 3600);
    
    if (error) throw error;
    return data.signedUrl;
  }
};