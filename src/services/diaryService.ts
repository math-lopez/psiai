import { supabase } from "@/integrations/supabase/client";
import { PatientLog, PatientLogPrompt } from "@/types/diary";

export const diaryService = {
  // Retorna o contexto completo do paciente (v81)
  getPatientContext: async (): Promise<{ patientId: string; psychologistId: string } | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('patient_access')
      .select('patient_id, psychologist_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (error || !data) return null;
    return {
      patientId: data.patient_id,
      psychologistId: data.psychologist_id
    };
  },

  // Logs com carregamento de anexos
  listLogs: async (patientId: string): Promise<PatientLog[]> => {
    const { data, error } = await supabase
      .from('patient_logs')
      .select('*, attachments:patient_log_attachments(*)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Criação robusta injetando IDs de segurança (v81)
  createLog: async (log: Partial<PatientLog>, files?: File[]): Promise<PatientLog> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    // Garantir IDs de segurança
    let psychologistId = log.psychologist_id;
    let patientId = log.patient_id;

    if (!psychologistId || !patientId) {
      const context = await diaryService.getPatientContext();
      if (context) {
        psychologistId = context.psychologistId;
        patientId = context.patientId;
      } else {
        // Se for o psicólogo criando diretamente
        psychologistId = user.id;
      }
    }

    const { data: newLog, error: logError } = await supabase
      .from('patient_logs')
      .insert([{
        ...log,
        patient_id: patientId,
        psychologist_id: psychologistId,
        created_by: log.created_by || (patientId === user.id ? 'patient' : 'psychologist')
      }])
      .select()
      .single();
    
    if (logError) throw logError;

    // Upload de anexos se houver (v81 feature)
    if (files && files.length > 0 && newLog) {
      for (const file of files) {
        const filePath = `diary/${patientId}/${newLog.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('session-files')
          .upload(filePath, file);

        if (!uploadError) {
          await supabase.from('patient_log_attachments').insert({
            patient_log_id: newLog.id,
            patient_id: patientId,
            psychologist_id: psychologistId,
            file_name: file.name,
            file_path: filePath
          });
        }
      }
    }

    return newLog;
  },

  // Prompts / Tarefas completas
  listPrompts: async (patientId: string): Promise<PatientLogPrompt[]> => {
    const { data, error } = await supabase
      .from('patient_log_prompts')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  createPrompt: async (prompt: Partial<PatientLogPrompt>): Promise<PatientLogPrompt> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const { data, error } = await supabase
      .from('patient_log_prompts')
      .insert([{ 
        ...prompt, 
        psychologist_id: user.id,
        status: prompt.status || 'active'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  updatePrompt: async (id: string, updates: Partial<PatientLogPrompt>): Promise<PatientLogPrompt> => {
    const { data, error } = await supabase
      .from('patient_log_prompts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};