import { supabase } from "@/integrations/supabase/client";
import { PatientLog, PatientLogPrompt, LogType, PromptStatus } from "@/types/diary";

export const diaryService = {
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

    const { data, error } = await supabase
      .from('patient_logs')
      .insert([{ ...log, psychologist_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  updateLog: async (id: string, updates: Partial<PatientLog>): Promise<PatientLog> => {
    const { data, error } = await supabase
      .from('patient_logs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
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
  },

  deletePrompt: async (id: string): Promise<void> => {
    const { error } = await supabase.from('patient_log_prompts').delete().eq('id', id);
    if (error) throw error;
  }
};