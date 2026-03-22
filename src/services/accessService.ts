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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    // Gerar um token simples para o convite
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const { data, error } = await supabase
      .from('patient_access')
      .upsert({
        patient_id: patientId,
        psychologist_id: user.id,
        invite_token: token,
        status: 'invited',
        invited_at: new Date().toISOString()
      }, { onConflict: 'patient_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  revokeAccess: async (patientId: string): Promise<void> => {
    const { error } = await supabase
      .from('patient_access')
      .update({ status: 'suspended', invite_token: null })
      .eq('patient_id', patientId);
    
    if (error) throw error;
  }
};