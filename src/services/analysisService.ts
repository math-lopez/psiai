import { PatientAIAnalysis } from "@/types/analysis";
import { api } from "@/lib/api";

export const analysisService = {
  getLatestAnalysis: (patientId: string): Promise<PatientAIAnalysis | null> =>
    api.get<{ data: PatientAIAnalysis | null }>(`/v1/patients/${patientId}/analysis/latest`)
      .then((r) => r.data),

  requestAnalysis: (patientId: string): Promise<void> =>
    api.post(`/v1/patients/${patientId}/analysis/request`),
};
