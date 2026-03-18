export type SessionStatus = 'rascunho' | 'aguardando' | 'processando' | 'concluido' | 'erro';
export type SessionRecordType = 'manual' | 'audio' | 'ambos';
export type PatientStatus = 'ativo' | 'inativo';

export interface User {
  id: string;
  name: string;
  crp: string;
  email: string;
  phone: string;
}

export interface Patient {
  id: string;
  fullName: string;
  birthDate: string;
  cpf?: string;
  phone: string;
  email: string;
  gender: string;
  notes?: string;
  status: PatientStatus;
  emergencyContact?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  id: string;
  patientId: string;
  patientName: string;
  sessionDate: string;
  durationMinutes: number;
  recordType: SessionRecordType;
  manualNotes?: string;
  audioFileName?: string;
  audioUrl?: string;
  processingStatus: SessionStatus;
  transcript?: string;
  highlights?: string[];
  nextSteps?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalPatients: number;
  totalSessions: number;
  pendingProcessing: number;
  completedSessions: number;
}