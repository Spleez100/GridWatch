
CREATE TABLE public.ai_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id uuid REFERENCES public.nodes(id) ON DELETE SET NULL,
  node_name text,
  city text,
  state text,
  event_type text NOT NULL,
  source_query text,
  source_snippet text,
  confidence integer NOT NULL DEFAULT 50,
  raw_extraction jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "AI events are publicly readable" ON public.ai_events
  FOR SELECT USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_events;
