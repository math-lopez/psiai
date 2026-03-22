export type AccessStatus = 'inactive' | 'invited' | 'active' | 'suspended';

export interface PatientAccess {
  id: string;
  patient_id: string;
  psychologist_id: string;
  user_id: string | null;
  status: AccessStatus;
  invite_token: string | null;
  invited_at: string | null;
  last_access_at: string | null;
  created_at: string;
  updated_at: string;
}