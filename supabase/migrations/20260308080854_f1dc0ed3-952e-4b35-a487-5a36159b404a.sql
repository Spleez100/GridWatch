
-- Locations table for nationwide coverage
CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'neighborhood',
  state text NOT NULL,
  lga text,
  city text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  population_estimate integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Locations are publicly readable" ON public.locations FOR SELECT USING (true);

-- Add location_id to nodes
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.locations(id) ON DELETE SET NULL;

-- Add infrastructure event types
ALTER TABLE public.ai_events DROP CONSTRAINT IF EXISTS ai_events_event_type_check;

-- Add realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.locations;

-- Create index for fast location matching
CREATE INDEX IF NOT EXISTS idx_locations_name ON public.locations (name);
CREATE INDEX IF NOT EXISTS idx_locations_state ON public.locations (state);
CREATE INDEX IF NOT EXISTS idx_locations_city ON public.locations (city);
CREATE INDEX IF NOT EXISTS idx_locations_type ON public.locations (type);
CREATE INDEX IF NOT EXISTS idx_ai_events_severity ON public.ai_events (severity);
CREATE INDEX IF NOT EXISTS idx_ai_events_created ON public.ai_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_nodes_severity ON public.nodes (severity);
CREATE INDEX IF NOT EXISTS idx_nodes_status ON public.nodes (status);
