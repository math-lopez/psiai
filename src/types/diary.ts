export type LogType = 'mood' | 'thought' | 'exercise' | 'general';
export type PromptStatus = 'active' | 'completed' | 'archived';
export type VisibilityType = 'private_to_patient' | 'shared_with_psychologist' | 'private_to_psychologist' | 'shared_with_patient';

export interface PatientLog {
  id: string;
  patient_id: string;
  psychologist_id: string;
  content: string;
  mood: string | null;
  log_type: LogType;
  visibility: VisibilityType;
  created_by: 'patient' | 'psychologist';
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