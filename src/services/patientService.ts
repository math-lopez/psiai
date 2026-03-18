import { supabase } from "@/integrations/supabase/client";
import { Patient, PatientStatus } from "@/types";

export const patientService = {
  list: async (): Promise<Patient[]> => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('full_name', { ascending: true });
    
    if (error) throw error;
    return data as Patient[];
  },

  getById: async (id: string): Promise<Patient | null> => {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as Patient;
  },

  create: async (patient: Omit<Patient, 'id' | 'created_at' | 'updated_at' | 'psychologist_id'>): Promise<Patient> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const { data, error } = await supabase
      .from('patients')
      .insert([{ ...patient, psychologist_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data as Patient;
  },

  update: async (id: string, patient: Partial<Patient>): Promise<Patient> => {
    const { data, error } = await supabase
      .from('patients')
      .update(patient)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Patient;
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('patients')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};