
ALTER TABLE public.ai_events ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'MODERATE';
ALTER TABLE public.ai_events ADD COLUMN IF NOT EXISTS source_platform text NOT NULL DEFAULT 'web';
ALTER TABLE public.ai_events ADD COLUMN IF NOT EXISTS signal_count integer NOT NULL DEFAULT 1;
ALTER TABLE public.ai_events ADD COLUMN IF NOT EXISTS location text;

ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS severity text NOT NULL DEFAULT 'LOW';
