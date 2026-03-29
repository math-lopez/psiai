-- Adiciona coluna de status do agendamento
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'scheduled' 
CHECK (status IN ('scheduled', 'completed', 'cancelled', 'draft'));

-- Adiciona coluna para o link da reunião (Google Meet, etc)
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS meeting_link text;

-- Atualiza as sessões existentes para 'completed' se já tiverem transcrição, caso contrário 'draft'
UPDATE sessions 
SET status = CASE 
    WHEN processing_status = 'completed' THEN 'completed' 
    ELSE 'draft' 
END 
WHERE status IS NULL;