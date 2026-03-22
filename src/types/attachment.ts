export type AttachmentVisibility = 'private_to_psychologist' | 'shared_with_patient';
export type AttachmentUploadedBy = 'psychologist' | 'patient';

export interface PatientAttachment {
  id: string;
  patient_id: string;
  psychologist_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  visibility: AttachmentVisibility;
  uploaded_by: AttachmentUploadedBy;
  created_at: string;
}