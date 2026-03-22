-- 1. Tabela de Logs do Paciente (Diário)
CREATE TABLE IF NOT EXISTS public.patient_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    psychologist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    log_type TEXT NOT NULL CHECK (log_type IN ('weekly_journal', 'emotional_record', 'thought_record', 'homework', 'free_entry', 'general')),
    mood TEXT,
    visibility TEXT NOT NULL DEFAULT 'private_to_psychologist' CHECK (visibility IN ('private_to_psychologist', 'shared_with_patient', 'private_to_patient', 'shared_with_psychologist')),
    created_by TEXT NOT NULL DEFAULT 'psychologist' CHECK (created_by IN ('psychologist', 'patient')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Prompts/Tarefas Terapêuticas
CREATE TABLE IF NOT EXISTS public.patient_log_prompts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    psychologist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    prompt_type TEXT NOT NULL CHECK (prompt_type IN ('weekly_journal', 'emotional_record', 'thought_record', 'homework', 'custom')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Anexos dos Logs
CREATE TABLE IF NOT EXISTS public.patient_log_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_log_id UUID REFERENCES public.patient_logs(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    psychologist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE public.patient_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psychologist_manage_logs" ON public.patient_logs
    FOR ALL TO authenticated USING (auth.uid() = psychologist_id);

ALTER TABLE public.patient_log_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psychologist_manage_prompts" ON public.patient_log_prompts
    FOR ALL TO authenticated USING (auth.uid() = psychologist_id);

ALTER TABLE public.patient_log_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psychologist_manage_attachments" ON public.patient_log_attachments
    FOR ALL TO authenticated USING (auth.uid() = psychologist_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_patient_logs_patient ON public.patient_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_log_prompts_patient ON public.patient_log_prompts(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_log_attachments_log ON public.patient_log_attachments(patient_log_id);