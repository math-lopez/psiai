import { supabase } from "@/integrations/supabase/client";
import { PatientAIAnalysis, AnalysisStatus } from "@/types/analysis";

export const analysisService = {
  getLatestAnalysis: async (patientId: string): Promise<PatientAIAnalysis | null> => {
    const { data, error } = await supabase
      .from('patient_ai_analyses')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  requestAnalysis: async (patientId: string): Promise<void> => {
    const { error } = await supabase.functions.invoke('process-patient-analysis', {
      body: { patientId }
    });
    
    if (error) throw error;
  }
};