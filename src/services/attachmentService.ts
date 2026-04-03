import { PatientAttachment, AttachmentVisibility } from "@/types/attachment";
import { api } from "@/lib/api";

export const attachmentService = {
  list: (patientId: string): Promise<PatientAttachment[]> =>
    api.get<{ data: PatientAttachment[] }>(`/v1/patients/${patientId}/attachments`)
      .then((r) => r.data),

  upload: async (
    patientId: string,
    _psychologistId: string,
    file: File,
    visibility: AttachmentVisibility = "private_to_psychologist",
    _role: "psychologist" | "patient" = "psychologist"
  ): Promise<PatientAttachment> => {
    const form = new FormData();
    form.append("file", file);
    return api.upload<{ data: PatientAttachment }>(
      `/v1/patients/${patientId}/attachments?visibility=${visibility}`,
      form
    ).then((r) => r.data);
  },

  delete: (attachment: PatientAttachment): Promise<void> =>
    api.delete(`/v1/patients/${attachment.patient_id}/attachments/${attachment.id}`),

  getDownloadUrl: async (patientId: string, attachmentId: string): Promise<string> =>
    api.get<{ data: { signedUrl: string } }>(
      `/v1/patients/${patientId}/attachments/${attachmentId}/download-url`
    ).then((r) => r.data.signedUrl),
};
