import { supabase } from "@/integrations/supabase/client";
import { PatientLog, PatientLogPrompt, LogType, PromptStatus } from "@/types/diary";

export const diaryService = {
  // Retorna os IDs necessários para o portal do paciente
  getPatientContext: async (): Promise<{ patientId: string; psychologistId: string } | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    // Busca o vínculo ativo e mais recente (suporta troca de psicólogo)
    const { data: accessList, error } = await supabase
      .from('patient_access')
      .select('patient_id, psychologist_id, patients!inner(status)')
      .eq('user_id', user.id)
      .eq('patients.status', 'ativo')
      .order('updated_at', { ascending: false });
    
    const data = accessList?.[0];

    if (error || !data) {
      console.error("Erro ao buscar contexto do paciente:", error);
      return null;
    }

    return {
      patientId: data.patient_id,
      psychologistId: data.psychologist_id
    };
  },

  getMyPatientId: async (): Promise<string | null> => {
    const context = await diaryService.getPatientContext();
    return context?.patientId || null;
  },

  // Logs / Registros
  listLogs: async (patientId: string): Promise<PatientLog[]> => {
    const { data, error } = await supabase
      .from('patient_logs')
      .select('*, attachments:patient_log_attachments(*)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  createLog: async (log: Partial<PatientLog>): Promise<PatientLog> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const logData = {
      ...log,
      psychologist_id: log.psychologist_id || user.id
    };

    const { data, error } = await supabase
      .from('patient_logs')
      .insert([logData])
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  updateLog: async (id: string, updates: Partial<PatientLog>): Promise<PatientLog> => {
    const { data, error } = await supabase
      .from('patient_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  deleteLog: async (id: string): Promise<void> => {
    const { error } = await supabase.from('patient_logs').delete().eq('id', id);
    if (error) throw error;
  },

  // Prompts / Tarefas
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
      .insert([{ ...prompt, psychologist_id: user.id }])
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  updatePrompt: async (id: string, updates: Partial<PatientLogPrompt>): Promise<PatientLogPrompt> => {
    const { data, error } = await supabase
      .from('patient_log_prompts')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  deletePrompt: async (id: string): Promise<void> => {
    const { error } = await supabase.from('patient_log_prompts').delete().eq('id', id);
    if (error) throw error;
  }
};