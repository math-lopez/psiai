import { TreatmentPlan, TreatmentGoal } from "@/types/treatment";
import { api } from "@/lib/api";

export const treatmentService = {
  listPlans: (patientId: string): Promise<TreatmentPlan[]> =>
    api.get<{ data: TreatmentPlan[] }>(`/v1/patients/${patientId}/treatment/plans`)
      .then((r) => r.data),

  getActivePlan: (patientId: string): Promise<TreatmentPlan | null> =>
    api.get<{ data: TreatmentPlan | null }>(`/v1/patients/${patientId}/treatment/plans/active`)
      .then((r) => r.data),

  createPlan: (plan: Partial<TreatmentPlan>): Promise<TreatmentPlan> =>
    api.post<{ data: TreatmentPlan }>(`/v1/patients/${plan.patient_id}/treatment/plans`, plan)
      .then((r) => r.data),

  updatePlan: (patientId: string, id: string, updates: Partial<TreatmentPlan>): Promise<TreatmentPlan> =>
    api.put<{ data: TreatmentPlan }>(`/v1/patients/${patientId}/treatment/plans/${id}`, updates)
      .then((r) => r.data),

  deletePlan: (patientId: string, id: string): Promise<void> =>
    api.delete(`/v1/patients/${patientId}/treatment/plans/${id}`),

  createGoal: (goal: Partial<TreatmentGoal>): Promise<TreatmentGoal> =>
    api.post<{ data: TreatmentGoal }>(
      `/v1/patients/${goal.patient_id}/treatment/plans/${goal.treatment_plan_id}/goals`,
      goal
    ).then((r) => r.data),

  updateGoal: (patientId: string, planId: string, id: string, updates: Partial<TreatmentGoal>): Promise<TreatmentGoal> =>
    api.put<{ data: TreatmentGoal }>(
      `/v1/patients/${patientId}/treatment/plans/${planId}/goals/${id}`,
      updates
    ).then((r) => r.data),

  deleteGoal: (patientId: string, planId: string, id: string): Promise<void> =>
    api.delete(`/v1/patients/${patientId}/treatment/plans/${planId}/goals/${id}`),
};
