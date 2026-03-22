import { supabase } from "@/integrations/supabase/client";
import { PatientLog, PatientLogPrompt } from "@/types/diary";

export const diaryService = {
  getPatientContext: async (): Promise<{ patientId: string; psychologistId: string } | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('patient_access')
      .select('patient_id, psychologist_id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();
    
    if (error || !data) return null;
    return { patientId: data.patient_id, psychologistId: data.psychologist_id };
  },

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

    const entry = {
      ...log,
      psychologist_id: log.psychologist_id || user.id,
      created_by: log.created_by || 'psychologist'
    };

    const { data, error } = await supabase
      .from('patient_logs')
      .insert([entry])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  updateLog: async (id: string, log: Partial<PatientLog>): Promise<PatientLog> => {
    const { data, error } = await supabase
      .from('patient_logs')
      .update(log)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  deleteLog: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('patient_logs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

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
  },

  deletePrompt: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('patient_log_prompts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};