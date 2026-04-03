import { PatientAccess, AccessStatus } from "@/types/access";
import { api } from "@/lib/api";

export const accessService = {
  getAccessByPatientId: (patientId: string): Promise<PatientAccess | null> =>
    api.get<{ data: PatientAccess | null }>(`/v1/patients/${patientId}/access`)
      .then((r) => r.data),

  createInvite: (patientId: string): Promise<PatientAccess> =>
    api.post<{ data: PatientAccess }>(`/v1/patients/${patientId}/access/invite`)
      .then((r) => r.data),

  updateStatus: (patientId: string, status: AccessStatus): Promise<void> =>
    api.patch(`/v1/patients/${patientId}/access/status`, { status }),

  revokeAccess: (patientId: string): Promise<void> =>
    api.post(`/v1/patients/${patientId}/access/revoke`),
};
