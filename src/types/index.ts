export type TherapeuticApproach = 'TCC' | 'PSICANALISE' | 'HUMANISTA';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'basic' | 'pro' | 'ultra';
  therapeutic_approach: TherapeuticApproach;
  updated_at?: string;
}

export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'draft';
export type ProcessingStatus = 'draft' | 'queued' | 'processing' | 'completed' | 'error' | 'cancelled';
export type SessionRecordType = 'audio' | 'manual' | 'ambos';

export interface Session {
  id: string;
  patient_id: string;
  psychologist_id: string;
  session_date: string;
  duration_minutes: number;
  status: SessionStatus;
  record_type: SessionRecordType;
  processing_status: ProcessingStatus;
  manual_notes: string | null;
  clinical_notes: string | null;
  interventions: string | null;
  session_summary_manual: string | null;
  transcript: string | null;
  highlights: string[] | null;
  next_steps: string | null;
  audio_file_name: string | null;
  audio_file_path: string | null;
  meeting_link: string | null;
  created_at: string;
  updated_at: string;
  patient?: {
    full_name: string;
    email: string;
  };
}

export interface Patient {
  id: string;
  psychologist_id: string;
  full_name: string;
  birth_date: string;
  cpf: string | null;
  gender: string;
  email: string;
  phone: string;
  emergency_contact: string | null;
  notes: string | null;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalPatients: number;
  totalSessions: number;
  pendingProcessing: number;
  completedSessions: number;
}

export interface User {
  id: string;
  name: string;
  crp: string;
  email: string;
  phone?: string;
}