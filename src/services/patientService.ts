import { Patient } from "@/types";
import { api } from "@/lib/api";

export const patientService = {
  list: (): Promise<Patient[]> =>
    api.get("/v1/patients"),

  getById: (id: string): Promise<Patient> =>
    api.get(`/v1/patients/${id}`),

  create: (patient: Omit<Patient, "id" | "created_at" | "updated_at" | "psychologist_id">): Promise<Patient> =>
    api.post("/v1/patients", patient),

  update: (id: string, patient: Partial<Patient>): Promise<Patient> =>
    api.put(`/v1/patients/${id}`, patient),

  delete: (id: string): Promise<void> =>
    api.delete(`/v1/patients/${id}`),
};
