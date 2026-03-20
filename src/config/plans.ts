export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'ultra';

export interface PlanLimits {
  name: string;
  price: number;
  maxPatients: number;
  maxSessionsPerMonth: number;
  description: string;
}

export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
  free: {
    name: 'Gratuito',
    price: 0,
    maxPatients: 10,
    maxSessionsPerMonth: 10,
    description: 'Ideal para quem está começando.'
  },
  basic: {
    name: 'Básico',
    price: 19.90,
    maxPatients: 100,
    maxSessionsPerMonth: 1000,
    description: 'Para profissionais em crescimento.'
  },
  pro: {
    name: 'Profissional',
    price: 37.90,
    maxPatients: 1000,
    maxSessionsPerMonth: 10000,
    description: 'Gestão completa para clínicas médias.'
  },
  ultra: {
    name: 'Ultra',
    price: 59.90, // Sugestão de valor para o ilimitado
    maxPatients: Infinity,
    maxSessionsPerMonth: Infinity,
    description: 'Liberdade total sem limites.'
  }
};