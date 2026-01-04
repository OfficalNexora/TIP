-- Migration to add missing persistence columns to the analyses table
ALTER TABLE public.analyses 
ADD COLUMN IF NOT EXISTS full_text TEXT,
ADD COLUMN IF NOT EXISTS confidence INTEGER;

-- Optional: Comments for clarity
COMMENT ON COLUMN public.analyses.full_text IS 'Stores the raw extracted text from the audited document.';
COMMENT ON COLUMN public.analyses.confidence IS 'Stores the numeric (0-100) integrity score derived from AI analysis.';
