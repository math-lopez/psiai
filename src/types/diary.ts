export type LogType = 'weekly_journal' | 'emotional_record' | 'thought_record' | 'homework' | 'free_entry' | 'general';
export type PromptStatus = 'active' | 'completed' | 'archived';
export type VisibilityType = 'private_to_psychologist' | 'shared_with_patient' | 'private_to_patient' | 'shared_with_psychologist';

export interface PatientLog {
  id: string;
  patient_id: string;
  psychologist_id: string;
  title: string | null;
  content: string;
  log_type: LogType;
  mood: string | null;
  visibility: VisibilityType;
  created_by: 'psychologist' | 'patient';
  created_at: string;
  updated_at: string;
  attachments?: PatientLogAttachment[];
}

export interface PatientLogAttachment {
  id: string;
  patient_log_id: string;
  file_name: string;
  file_path: string;
  created_at: string;
}

export interface PatientLogPrompt {
  id: string;
  patient_id: string;
  psychologist_id: string;
  title: string;
  description: string | null;
  prompt_type: string;
  status: PromptStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}