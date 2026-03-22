import { supabase } from "@/integrations/supabase/client";
import { TreatmentPlan, TreatmentGoal } from "@/types/treatment";

export const treatmentService = {
  // Planos
  listPlans: async (patientId: string): Promise<TreatmentPlan[]> => {
    const { data, error } = await supabase
      .from('treatment_plans')
      .select('*, goals:treatment_goals(*)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  createPlan: async (plan: Partial<TreatmentPlan>): Promise<TreatmentPlan> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const { data, error } = await supabase
      .from('treatment_plans')
      .insert([{ ...plan, psychologist_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  updatePlan: async (id: string, updates: Partial<TreatmentPlan>): Promise<TreatmentPlan> => {
    const { data, error } = await supabase
      .from('treatment_plans')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  deletePlan: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('treatment_plans')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Objetivos
  listGoals: async (planId: string): Promise<TreatmentGoal[]> => {
    const { data, error } = await supabase
      .from('treatment_goals')
      .select('*')
      .eq('treatment_plan_id', planId)
      .order('priority', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  createGoal: async (goal: Partial<TreatmentGoal>): Promise<TreatmentGoal> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Não autenticado");

    const { data, error } = await supabase
      .from('treatment_goals')
      .insert([{ ...goal, psychologist_id: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  updateGoal: async (id: string, updates: Partial<TreatmentGoal>): Promise<TreatmentGoal> => {
    const { data, error } = await supabase
      .from('treatment_goals')
      .update({
        ...updates,
        completed_at: updates.status === 'completed' ? new Date().toISOString() : null
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  deleteGoal: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('treatment_goals')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
};