export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'ultra';

export interface PlanLimits {
  name: string;
  price: number;
  maxPatients: number;
  maxSessionsPerMonth: number;
  maxTranscriptionsPerMonth: number; // Novo limite
  description: string;
}

export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  free: {
    name: 'Gratuito',
    price: 0,
    maxPatients: 10,
    maxSessionsPerMonth: 10,
    maxTranscriptionsPerMonth: 0, // Sem transcrição
    description: 'Ideal para quem está começando.'
  },
  basic: {
    name: 'Básico',
    price: 19.90,
    maxPatients: 100,
    maxSessionsPerMonth: 1000,
    maxTranscriptionsPerMonth: 10, // 10 transcrições/mês
    description: 'Para profissionais em crescimento.'
  },
  pro: {
    name: 'Profissional',
    price: 37.90,
    maxPatients: 1000,
    maxSessionsPerMonth: 10000,
    maxTranscriptionsPerMonth: Infinity, // Ilimitado
    description: 'Gestão completa para clínicas médias.'
  },
  ultra: {
    name: 'Ultra',
    price: 59.90,
    maxPatients: Infinity,
    maxSessionsPerMonth: Infinity,
    maxTranscriptionsPerMonth: Infinity, // Ilimitado
    description: 'Liberdade total sem limites.'
  }
};