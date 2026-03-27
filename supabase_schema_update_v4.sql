-- Remove a restrição antiga
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_processing_status_check;

-- Adiciona a nova restrição incluindo o status 'cancelled'
ALTER TABLE sessions ADD CONSTRAINT sessions_processing_status_check 
CHECK (processing_status IN ('draft', 'queued', 'processing', 'completed', 'error', 'cancelled'));