export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'error';

export interface PatientAIAnalysis {
  id: string;
  patient_id: string;
  psychologist_id: string;
  status: AnalysisStatus;
  analysis_type: string;
  source_session_count: number;
  source_last_session_at: string | null;
  generated_summary: string | null;
  generated_recommendations: string[] | null;
  generated_risk_flags: string[] | null;
  processing_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalysisPayload {
  patientId: string;
  psychologistId: string;
  patient: {
    id: string;
    name: string;
  };
  sessions: {
    id: string;
    sessionDate: string;
    manualNotes: string | null;
    transcript: string | null;
    highlights: string[] | null;
    nextSteps: string | null;
  }[];
}