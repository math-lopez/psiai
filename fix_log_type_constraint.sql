-- Remove a restrição antiga se ela existir
ALTER TABLE public.patient_logs 
DROP CONSTRAINT IF EXISTS patient_logs_log_type_check;

-- Cria a nova restrição com a lista completa de tipos suportados
ALTER TABLE public.patient_logs 
ADD CONSTRAINT patient_logs_log_type_check 
CHECK (log_type IN ('weekly_journal', 'emotional_record', 'thought_record', 'homework', 'free_entry', 'general'));