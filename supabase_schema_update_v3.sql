-- Adiciona as colunas clínicas como nulas por padrão para garantir compatibilidade
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS clinical_notes text,
ADD COLUMN IF NOT EXISTS interventions text,
ADD COLUMN IF NOT EXISTS session_summary_manual text;

-- Comentários para documentação do banco
COMMENT ON COLUMN public.sessions.clinical_notes IS 'Notas técnicas e fenomenológicas do psicólogo';
COMMENT ON COLUMN public.sessions.interventions IS 'Descrição das intervenções e técnicas utilizadas na sessão';
COMMENT ON COLUMN public.sessions.session_summary_manual IS 'Resumo executivo manual feito pelo profissional';