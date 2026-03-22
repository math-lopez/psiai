-- ==========================================
-- FASE 4: DIÁRIO DO PACIENTE E REGISTROS
-- ==========================================

-- 1. Tabela de Registros (Logs)
CREATE TABLE public.patient_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    psychologist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text,
    content text NOT NULL,
    log_type text NOT NULL CHECK (log_type IN ('weekly_journal', 'emotional_record', 'thought_record', 'homework', 'free_entry')),
    mood text,
    visibility text NOT NULL DEFAULT 'private_to_psychologist' CHECK (visibility IN ('private_to_psychologist', 'shared_with_patient')),
    created_by text NOT NULL DEFAULT 'psychologist' CHECK (created_by IN ('psychologist', 'patient')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Tabela de Prompts/Tarefas (Prompts)
CREATE TABLE public.patient_log_prompts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    psychologist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    prompt_type text NOT NULL CHECK (prompt_type IN ('weekly_journal', 'emotional_record', 'thought_record', 'homework', 'custom')),
    status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
    due_date timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Tabela de Anexos
CREATE TABLE public.patient_log_attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_log_id uuid NOT NULL REFERENCES public.patient_logs(id) ON DELETE CASCADE,
    patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    psychologist_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name text NOT NULL,
    file_path text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as novas tabelas
ALTER TABLE public.patient_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_log_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_log_attachments ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança (Psychologist Ownership)
CREATE POLICY "psychologist_access_logs" ON public.patient_logs
    FOR ALL TO authenticated USING (auth.uid() = psychologist_id);

CREATE POLICY "psychologist_access_prompts" ON public.patient_log_prompts
    FOR ALL TO authenticated USING (auth.uid() = psychologist_id);

CREATE POLICY "psychologist_access_attachments" ON public.patient_log_attachments
    FOR ALL TO authenticated USING (auth.uid() = psychologist_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patient_logs_updated_at BEFORE UPDATE ON public.patient_logs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_patient_log_prompts_updated_at BEFORE UPDATE ON public.patient_log_prompts FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_patient_logs_patient_id ON public.patient_logs(patient_id);
CREATE INDEX idx_patient_log_prompts_patient_id ON public.patient_log_prompts(patient_id);