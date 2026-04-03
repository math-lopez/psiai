import { api } from "@/lib/api";

export const storageService = {
  uploadSessionAudio: async (
    _userId: string,
    _patientId: string,
    sessionId: string,
    file: File
  ): Promise<{ path: string; name: string }> => {
    const form = new FormData();
    form.append("file", file);
    return api.upload(`/v1/sessions/${sessionId}/audio`, form);
  },

  deleteFile: (sessionId: string): Promise<void> =>
    api.delete(`/v1/sessions/${sessionId}/audio`),

  getSignedUrl: (sessionId: string): Promise<string> =>
    api.get<{ url: string }>(`/v1/sessions/${sessionId}/audio-url`).then((r) => r.url),
};
