import { TherapeuticApproach } from "@/types";

export interface AppFeatures {
  hasTherapeuticPlan: boolean;
  hasDiary: boolean;
  hasSessions: boolean; // Comum a todos
  hasFiles: boolean;    // Comum a todos
}

export const APPROACH_FEATURES: Record<TherapeuticApproach, AppFeatures> = {
  TCC: {
    hasTherapeuticPlan: true,
    hasDiary: true,
    hasSessions: true,
    hasFiles: true,
  },
  PSICANALISE: {
    hasTherapeuticPlan: false,
    hasDiary: false,
    hasSessions: true,
    hasFiles: true,
  },
  HUMANISTA: {
    hasTherapeuticPlan: false,
    hasDiary: false,
    hasSessions: true,
    hasFiles: true,
  },
};