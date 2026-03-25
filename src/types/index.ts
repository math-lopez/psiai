export type TherapeuticApproach = 'TCC' | 'PSICANALISE' | 'HUMANISTA';

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  therapeutic_approach: TherapeuticApproach; // Novo campo
  updated_at?: string;
}

// ... rest of the file