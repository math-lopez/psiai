-- 1. TABELA DE PERFIS (Dados do Psicólogo)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  crp TEXT,
  phone TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABELA DE PACIENTES
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  psychologist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  cpf TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  gender TEXT,
  notes TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  emergency_contact TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABELA DE SESSÕES
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  psychologist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  session_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 50,
  record_type TEXT CHECK (record_type IN ('manual', 'audio', 'ambos')),
  manual_notes TEXT,
  audio_file_name TEXT,
  audio_file_path TEXT,
  processing_status TEXT DEFAULT 'draft' CHECK (processing_status IN ('draft', 'queued', 'processing', 'completed', 'error')),
  transcript TEXT,
  highlights TEXT[],
  next_steps TEXT,
  additional_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. SEGURANÇA (RLS - Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- 5. POLÍTICAS DE ACESSO (Garante que um psicólogo não veja dados do outro)
CREATE POLICY "profiles_self_access" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id);
CREATE POLICY "patients_owner_access" ON public.patients FOR ALL TO authenticated USING (auth.uid() = psychologist_id);
CREATE POLICY "sessions_owner_access" ON public.sessions FOR ALL TO authenticated USING (auth.uid() = psychologist_id);

-- 6. AUTOMAÇÃO: CRIAR PERFIL AO CADASTRAR USUÁRIO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, crp)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'crp'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para ativar a função acima
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();