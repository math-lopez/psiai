import { mockPatients } from "@/lib/mockData";
import { Patient } from "@/types";

export const patientService = {
  list: async (): Promise<Patient[]> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    return mockPatients;
  },

  getById: async (id: string): Promise<Patient | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return mockPatients.find(p => p.id === id);
  },

  create: async (patient: Omit<Patient, 'id' | 'createdAt' | 'updatedAt'>): Promise<Patient> => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    const newPatient: Patient = {
      ...patient,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    return newPatient;
  },

  update: async (id: string, data: Partial<Patient>): Promise<Patient> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const index = mockPatients.findIndex(p => p.id === id);
    return { ...mockPatients[index], ...data };
  }
};