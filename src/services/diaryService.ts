import { PatientLog, PatientLogPrompt } from "@/types/diary";
import { api } from "@/lib/api";

export const diaryService = {
  // --- Portal do Paciente ---

  getPatientContext: (): Promise<{ patientId: string; psychologistId: string } | null> =>
    api.get<{ data: { patientId: string; psychologistId: string } }>("/v1/diary/me/context")
      .then((r) => r.data)
      .catch(() => null),

  getMyPatientId: async (): Promise<string | null> => {
    const ctx = await diaryService.getPatientContext();
    return ctx?.patientId ?? null;
  },

  listMyLogs: (): Promise<PatientLog[]> =>
    api.get<{ data: PatientLog[] }>("/v1/diary/me/logs").then((r) => r.data),

  createMyLog: (log: Partial<PatientLog>): Promise<PatientLog> =>
    api.post<{ data: PatientLog }>("/v1/diary/me/logs", log).then((r) => r.data),

  updateMyLog: (id: string, updates: Partial<PatientLog>): Promise<PatientLog> =>
    api.put<{ data: PatientLog }>(`/v1/diary/me/logs/${id}`, updates).then((r) => r.data),

  deleteMyLog: (id: string): Promise<void> =>
    api.delete(`/v1/diary/me/logs/${id}`),

  listMyPrompts: (): Promise<PatientLogPrompt[]> =>
    api.get<{ data: PatientLogPrompt[] }>("/v1/diary/me/prompts").then((r) => r.data),

  updateMyPrompt: (id: string, updates: Partial<PatientLogPrompt>): Promise<PatientLogPrompt> =>
    api.patch<{ data: PatientLogPrompt }>(`/v1/diary/me/prompts/${id}`, updates).then((r) => r.data),

  // --- Psicólogo ---

  listLogs: (patientId: string): Promise<PatientLog[]> =>
    api.get<{ data: PatientLog[] }>(`/v1/patients/${patientId}/diary/logs`).then((r) => r.data),

  createLog: (log: Partial<PatientLog>): Promise<PatientLog> =>
    api.post<{ data: PatientLog }>(`/v1/patients/${log.patient_id}/diary/logs`, log).then((r) => r.data),

  updateLog: (id: string, updates: Partial<PatientLog>): Promise<PatientLog> =>
    api.put<{ data: PatientLog }>(`/v1/diary/logs/${id}`, updates).then((r) => r.data),

  deleteLog: (id: string): Promise<void> =>
    api.delete(`/v1/diary/logs/${id}`),

  listPrompts: (patientId: string): Promise<PatientLogPrompt[]> =>
    api.get<{ data: PatientLogPrompt[] }>(`/v1/patients/${patientId}/diary/prompts`).then((r) => r.data),

  createPrompt: (prompt: Partial<PatientLogPrompt>): Promise<PatientLogPrompt> =>
    api.post<{ data: PatientLogPrompt }>(`/v1/patients/${prompt.patient_id}/diary/prompts`, prompt).then((r) => r.data),

  updatePrompt: (id: string, updates: Partial<PatientLogPrompt>): Promise<PatientLogPrompt> =>
    api.put<{ data: PatientLogPrompt }>(`/v1/patients/${(updates as any).patient_id}/diary/prompts/${id}`, updates).then((r) => r.data),

  deletePrompt: (patientId: string, id: string): Promise<void> =>
    api.delete(`/v1/patients/${patientId}/diary/prompts/${id}`),
};
