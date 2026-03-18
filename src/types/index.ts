export type SessionStatus = 'draft' | 'queued' | 'processing' | 'completed' | 'error';
export type SessionRecordType = 'manual' | 'audio' | 'ambos';
export type PatientStatus = 'ativo' | 'inativo';

export interface Profile {
  id: string;
  full_name: string | null;
  crp: string | null;
  email: string | null;
  phone: string | null;
  updated_at: string;
}

export interface Patient {
  id: string;
  psychologist_id: string;
  full_name: string;
  birth_date: string;
  cpf: string | null;
  phone: string;
  email: string;
  gender: string;
  notes: string | null;
  status: PatientStatus;
  emergency_contact: string | null;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  psychologist_id: string;
  patient_id: string;
  session_date: string;
  duration_minutes: number;
  record_type: SessionRecordType;
  manual_notes: string | null;
  audio_file_name: string | null;
  audio_file_path: string | null;
  processing_status: SessionStatus;
  transcript: string | null;
  highlights: string[] | null;
  next_steps: string | null;
  additional_notes: string | null;
  created_at: string;
  updated_at: string;
  // Join fields
  patient?: {
    full_name: string;
  };
}

export interface DashboardStats {
  totalPatients: number;
  totalSessions: number;
  pendingProcessing: number;
  completedSessions: number;
}