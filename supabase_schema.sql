-- Adicionar campos de assinatura ao perfil
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Garantir que os valores iniciais estejam corretos para usuários existentes
UPDATE public.profiles SET subscription_tier = 'free' WHERE subscription_tier IS NULL;