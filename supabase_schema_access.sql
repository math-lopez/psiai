-- 1. Tabela de Vínculo de Acesso do Paciente
CREATE TABLE IF NOT EXISTS public.patient_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    psychologist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- Preenchido após o cadastro/vínculo do paciente
    status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('inactive', 'invited', 'active', 'suspended')),
    invite_token TEXT UNIQUE,
    invited_at TIMESTAMPTZ,
    last_access_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id) -- Um paciente só tem um registro de acesso
);

-- RLS para patient_access (Gerenciado pelo Psicólogo)
ALTER TABLE public.patient_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "psychologist_manage_access" ON public.patient_access
    FOR ALL TO authenticated USING (auth.uid() = psychologist_id);

CREATE POLICY "patient_view_own_access" ON public.patient_access
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2. Atualização das Políticas de RLS para o Diário (Acesso do Paciente)
-- Nota: O psicólogo continua tendo acesso total via política 'psychologist_manage_logs' já existente.

-- Permitir que o paciente veja logs COMPARTILHADOS ou que ele mesmo CRIOU
CREATE POLICY "patient_view_logs" ON public.patient_logs
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.patient_access 
            WHERE patient_access.user_id = auth.uid() 
            AND patient_access.patient_id = public.patient_logs.patient_id
            AND (public.patient_logs.visibility IN ('shared_with_patient', 'private_to_patient') OR public.patient_logs.created_by = 'patient')
        )
    );

-- Permitir que o paciente CRIE seus próprios logs
CREATE POLICY "patient_create_logs" ON public.patient_logs
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.patient_access 
            WHERE patient_access.user_id = auth.uid() 
            AND patient_access.patient_id = public.patient_logs.patient_id
        ) AND created_by = 'patient'
    );

-- 3. Atualização das Políticas de RLS para Prompts/Tarefas
CREATE POLICY "patient_view_prompts" ON public.patient_log_prompts
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.patient_access 
            WHERE patient_access.user_id = auth.uid() 
            AND patient_access.patient_id = public.patient_log_prompts.patient_id
        )
    );

-- Índices
CREATE INDEX IF NOT EXISTS idx_patient_access_user ON public.patient_access(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_access_token ON public.patient_access(invite_token);