export type LogType = 'weekly_journal' | 'emotional_record' | 'thought_record' | 'homework' | 'free_entry';
export type VisibilityType = 'private_to_psychologist' | 'shared_with_patient';
export type CreatedByType = 'psychologist' | 'patient';
export type PromptType = 'weekly_journal' | 'emotional_record' | 'thought_record' | 'homework' | 'custom';
export type PromptStatus = 'active' | 'completed' | 'archived';

export interface PatientLog {
  id: string;
  patient_id: string;
  psychologist_id: string;
  title: string | null;
  content: string;
  log_type: LogType;
  mood: string | null;
  visibility: VisibilityType;
  created_by: CreatedByType;
  created_at: string;
  updated_at: string;
  attachments?: PatientLogAttachment[];
}

export interface PatientLogPrompt {
  id: string;
  patient_id: string;
  psychologist_id: string;
  title: string;
  description: string | null;
  prompt_type: PromptType;
  status: PromptStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientLogAttachment {
  id: string;
  patient_log_id: string;
  patient_id: string;
  psychologist_id: string;
  file_name: string;
  file_path: string;
  created_at: string;
}