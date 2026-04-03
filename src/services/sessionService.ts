import { Session, DashboardStats } from "@/types";
import { api } from "@/lib/api";

export const sessionService = {
  getStats: (): Promise<DashboardStats> =>
    api.get("/v1/sessions/stats"),

  list: (): Promise<Session[]> =>
    api.get("/v1/sessions"),

  getByPatientId: (patientId: string): Promise<Session[]> =>
    api.get(`/v1/patients/${patientId}/sessions`),

  getById: (id: string): Promise<Session> =>
    api.get(`/v1/sessions/${id}`),

  create: async (session: any, audioFile?: File): Promise<Session> => {
    const created = await api.post<Session>("/v1/sessions", session);

    if (audioFile && created) {
      const form = new FormData();
      form.append("file", audioFile);
      await api.upload(`/v1/sessions/${created.id}/audio`, form);
      // re-fetch para ter audio_file_path atualizado
      return api.get<Session>(`/v1/sessions/${created.id}`);
    }

    return created;
  },

  createRecurrent: (baseSession: any, untilDate: string): Promise<void> =>
    api.post("/v1/sessions/recurrent", {
      ...baseSession,
      until_date: untilDate,
    }),

  update: (id: string, session: any): Promise<Session> =>
    api.put(`/v1/sessions/${id}`, session),

  delete: (id: string): Promise<void> =>
    api.delete(`/v1/sessions/${id}`),

  finishSession: (id: string): Promise<void> =>
    api.post(`/v1/sessions/${id}/finish`),

  cancelSession: (id: string): Promise<void> =>
    api.post(`/v1/sessions/${id}/cancel`),

  processAudio: (sessionId: string): Promise<void> =>
    api.post(`/v1/sessions/${sessionId}/process-audio`),

  getSessionAIAnalysis: (sessionId: string) =>
    api.get(`/v1/sessions/${sessionId}/ai-analysis`),
};
