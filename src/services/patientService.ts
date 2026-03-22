import { supabase } from "@/integrations/supabase/client";
import { Patient } from "@/types";
import { PLAN_LIMITS, SubscriptionTier } from "@/config/plans";

export const patientService = {
  list: async (): Promise<Patient[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('psychologist_id', user.id)
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

    // Verificar Limites do Plano
    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('id', user.id)
      .single();

    const tier = (profile?.subscription_tier as SubscriptionTier) || 'free';
    const limit = PLAN_LIMITS[tier].maxPatients;

    // Conta apenas os pacientes DESTE psicólogo para validar o limite
    const { count } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true })
      .eq('psychologist_id', user.id);

    if (count !== null && count >= limit) {
      throw new Error(`Limite atingido! Seu plano ${PLAN_LIMITS[tier].name} permite apenas ${limit} pacientes. Faça um upgrade para continuar.`);
    }

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