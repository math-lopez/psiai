-- Remove a restrição de visibilidade antiga
ALTER TABLE public.patient_logs 
DROP CONSTRAINT IF EXISTS patient_logs_visibility_check;

-- Adiciona a nova restrição com todos os níveis de privacidade necessários
ALTER TABLE public.patient_logs 
ADD CONSTRAINT patient_logs_visibility_check 
CHECK (visibility IN (
    'private_to_psychologist', 
    'shared_with_patient', 
    'private_to_patient', 
    'shared_with_psychologist'
));

-- Aproveitando para garantir que o log_type também esteja correto
ALTER TABLE public.patient_logs 
DROP CONSTRAINT IF EXISTS patient_logs_log_type_check;

ALTER TABLE public.patient_logs 
ADD CONSTRAINT patient_logs_log_type_check 
CHECK (log_type IN (
    'weekly_journal', 
    'emotional_record', 
    'thought_record', 
    'homework', 
    'free_entry', 
    'general'
));