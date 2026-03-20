export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'ultra';

export interface PlanLimits {
  name: string;
  price: number;
  maxPatients: number;
  maxSessionsPerMonth: number;
  maxTranscriptionsPerMonth: number;
  hasTherapeuticInsights: boolean; // Novo campo
  description: string;
}

export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  free: {
    name: 'Gratuito',
    price: 0,
    maxPatients: 10,
    maxSessionsPerMonth: 10,
    maxTranscriptionsPerMonth: 0,
    hasTherapeuticInsights: false,
    description: 'Ideal para quem está começando.'
  },
  basic: {
    name: 'Básico',
    price: 19.90,
    maxPatients: 100,
    maxSessionsPerMonth: 1000,
    maxTranscriptionsPerMonth: 10,
    hasTherapeuticInsights: false,
    description: 'Para profissionais em crescimento.'
  },
  pro: {
    name: 'Profissional',
    price: 37.90,
    maxPatients: 1000,
    maxSessionsPerMonth: 10000,
    maxTranscriptionsPerMonth: Infinity,
    hasTherapeuticInsights: false,
    description: 'Gestão completa para clínicas médias.'
  },
  ultra: {
    name: 'Ultra',
    price: 59.90,
    maxPatients: Infinity,
    maxSessionsPerMonth: Infinity,
    maxTranscriptionsPerMonth: Infinity,
    hasTherapeuticInsights: true, // Apenas Ultra tem insights
    description: 'Liberdade total e inteligência máxima.'
  }
};