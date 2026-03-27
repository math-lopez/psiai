export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'ultra';

export interface PlanLimits {
  name: string;
  price: number;
  maxPatients: number;
  maxSessionsPerMonth: number;
  maxTranscriptionsPerMonth: number;
  hasTherapeuticInsights: boolean;
  description: string;
}

export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  free: {
    name: 'Gratuito',
    price: 0,
    maxPatients: 3, // Reduzido de 10 para 3
    maxSessionsPerMonth: 5,
    maxTranscriptionsPerMonth: 0,
    hasTherapeuticInsights: false,
    description: 'Ideal para experimentação e início de carreira.'
  },
  basic: {
    name: 'Básico',
    price: 19.90,
    maxPatients: 15, // Reduzido de 100 para 15
    maxSessionsPerMonth: 30,
    maxTranscriptionsPerMonth: 5, // Reduzido de 10 para 5
    hasTherapeuticInsights: false,
    description: 'Para profissionais que estão começando a crescer.'
  },
  pro: {
    name: 'Profissional',
    price: 37.90,
    maxPatients: 50, // Definido um limite (antes era 1000)
    maxSessionsPerMonth: 200,
    maxTranscriptionsPerMonth: 30, // Definido um limite (antes era Infinity)
    hasTherapeuticInsights: false,
    description: 'Gestão completa para clínicas em ritmo acelerado.'
  },
  ultra: {
    name: 'Ultra',
    price: 59.90,
    maxPatients: Infinity,
    maxSessionsPerMonth: Infinity,
    maxTranscriptionsPerMonth: Infinity,
    hasTherapeuticInsights: true,
    description: 'Liberdade total e inteligência artificial avançada.'
  }
};