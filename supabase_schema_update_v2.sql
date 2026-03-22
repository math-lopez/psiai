-- Adicionando campos para enriquecimento clínico
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS clinical_notes TEXT,
ADD COLUMN IF NOT EXISTS interventions TEXT,
ADD COLUMN IF NOT EXISTS session_summary_manual TEXT;

-- Comentários para documentação do schema
COMMENT ON COLUMN public.sessions.clinical_notes IS 'Notas técnicas e observações clínicas detalhadas da sessão.';
COMMENT ON COLUMN public.sessions.interventions IS 'Descrição das intervenções e técnicas utilizadas pelo terapeuta.';
COMMENT ON COLUMN public.sessions.session_summary_manual IS 'Resumo técnico manual elaborado pelo psicólogo.';