export type PlanStatus = 'active' | 'completed' | 'archived';
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'paused' | 'cancelled';
export type GoalPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TreatmentPlan {
  id: string;
  patient_id: string;
  psychologist_id: string;
  title: string;
  description: string | null;
  status: PlanStatus;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  goals?: TreatmentGoal[];
}

export interface TreatmentGoal {
  id: string;
  treatment_plan_id: string;
  patient_id: string;
  psychologist_id: string;
  title: string;
  description: string | null;
  status: GoalStatus;
  priority: GoalPriority;
  target_date: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}