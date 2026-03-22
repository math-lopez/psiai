-- Tabela de Planos Terapêuticos
CREATE TABLE IF NOT EXISTS public.treatment_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    psychologist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para treatment_plans
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "psychologist_manage_plans" ON public.treatment_plans
    FOR ALL TO authenticated USING (auth.uid() = psychologist_id);

-- Tabela de Objetivos Terapêuticos
CREATE TABLE IF NOT EXISTS public.treatment_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    treatment_plan_id UUID REFERENCES public.treatment_plans(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    psychologist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused', 'cancelled')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    target_date DATE,
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para treatment_goals
ALTER TABLE public.treatment_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "psychologist_manage_goals" ON public.treatment_goals
    FOR ALL TO authenticated USING (auth.uid() = psychologist_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient ON public.treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_goals_plan ON public.treatment_goals(treatment_plan_id);