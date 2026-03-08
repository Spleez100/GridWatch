
-- Create timestamp update function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create nodes table
CREATE TABLE public.nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  disco TEXT NOT NULL,
  band TEXT NOT NULL,
  area_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'POWER_AVAILABLE',
  confidence INTEGER NOT NULL DEFAULT 50,
  avg_supply_hours DOUBLE PRECISION NOT NULL DEFAULT 12,
  tariff_per_kwh DOUBLE PRECISION NOT NULL DEFAULT 50,
  last_outage TIMESTAMPTZ,
  report_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nodes are publicly readable"
  ON public.nodes FOR SELECT
  USING (true);

CREATE INDEX idx_nodes_status ON public.nodes(status);
CREATE INDEX idx_nodes_city ON public.nodes(city);
CREATE INDEX idx_nodes_state ON public.nodes(state);
CREATE INDEX idx_nodes_disco ON public.nodes(disco);
CREATE INDEX idx_nodes_lat_lng ON public.nodes(latitude, longitude);

CREATE TRIGGER update_nodes_updated_at
  BEFORE UPDATE ON public.nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id UUID NOT NULL REFERENCES public.nodes(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reports are publicly readable"
  ON public.reports FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert reports"
  ON public.reports FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_reports_node_id ON public.reports(node_id);
CREATE INDEX idx_reports_created_at ON public.reports(created_at);
CREATE INDEX idx_reports_session ON public.reports(session_id, node_id, created_at);

-- Create grid_status table
CREATE TABLE public.grid_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  status TEXT NOT NULL DEFAULT 'GRID_STABLE',
  total_nodes INTEGER NOT NULL DEFAULT 0,
  powered_nodes INTEGER NOT NULL DEFAULT 0,
  outage_nodes INTEGER NOT NULL DEFAULT 0,
  intermittent_nodes INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grid_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Grid status is publicly readable"
  ON public.grid_status FOR SELECT
  USING (true);

-- Insert initial grid status row
INSERT INTO public.grid_status (status) VALUES ('GRID_STABLE');

-- Create grid_events table for timeline
CREATE TABLE public.grid_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  node_id UUID REFERENCES public.nodes(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  node_name TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.grid_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Grid events are publicly readable"
  ON public.grid_events FOR SELECT
  USING (true);

CREATE INDEX idx_grid_events_created_at ON public.grid_events(created_at);

-- Enable realtime for nodes and grid_status
ALTER PUBLICATION supabase_realtime ADD TABLE public.nodes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grid_status;
ALTER PUBLICATION supabase_realtime ADD TABLE public.grid_events;
