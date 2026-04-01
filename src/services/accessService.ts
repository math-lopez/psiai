import { supabase } from "@/integrations/supabase/client";
import { PatientAccess } from "@/types/access";

export const accessService = {
  getAccessByPatientId: async (patientId: string): Promise<PatientAccess | null> => {
    const { data, error } = await supabase
      .from('patient_access')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  createInvite: async (patientId: string): Promise<PatientAccess> => {
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const { data, error } = await supabase
      .from('patient_access')
      .upsert({
        patient_id: patientId,
        invite_token: token,
        status: 'invited',
        invited_at: new Date().toISOString()
      }, { onConflict: 'patient_id' })
      .select()
      .single();
    
    if (error) throw error;
    return data as PatientAccess;
  },

  /**
   * NOVO FLUXO: Ativação direta pelo psicólogo via Edge Function
   * Retorna a senha gerada (seja aleatória ou fixa)
   */
  activateDirectly: async (patientId: string, email: string, password?: string, patientName?: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('create-patient-user', {
      body: { patientId, email, password, patientName, action: 'create' }
    });
    
    if (error || (data && !data.success)) {
      throw new Error(data?.error || "Erro ao ativar conta do paciente.");
    }

    return data.password; // Retornamos a senha para mostrar no frontend
  },

  /**
   * RESET DE SENHA: Pelo psicólogo via Edge Function
   */
  resetPasswordDirectly: async (patientId: string, email: string, password?: string): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('create-patient-user', {
      body: { patientId, email, password, action: 'reset_password' }
    });
    
    if (error || (data && !data.success)) {
      throw new Error(data?.error || "Erro ao redefinir senha do paciente.");
    }

    return data.password;
  },

  revokeAccess: async (patientId: string): Promise<void> => {
    const { error } = await supabase
      .from('patient_access')
      .update({
        status: 'inactive',
        user_id: null,
        invite_token: null,
        updated_at: new Date().toISOString()
      })
      .eq('patient_id', patientId);
    
    if (error) throw error;
  }
};