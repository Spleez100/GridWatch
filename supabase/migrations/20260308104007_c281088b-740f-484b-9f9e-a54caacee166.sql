-- Add hierarchical infrastructure support to nodes table
ALTER TABLE public.nodes 
ADD COLUMN parent_node_id uuid REFERENCES public.nodes(id) ON DELETE CASCADE,
ADD COLUMN infrastructure_level text NOT NULL DEFAULT 'station',
ADD COLUMN feeder_name text,
ADD COLUMN is_visible_default boolean NOT NULL DEFAULT true;

-- Create index for efficient parent-child lookups
CREATE INDEX idx_nodes_parent ON public.nodes(parent_node_id);
CREATE INDEX idx_nodes_level ON public.nodes(infrastructure_level);

-- Update existing TCN stations to have proper infrastructure level
UPDATE public.nodes 
SET infrastructure_level = CASE 
  WHEN station_type = 'transmission' THEN 'transmission'
  WHEN station_type = 'generation' THEN 'generation'
  WHEN station_type = 'distribution' OR station_type = 'substation' THEN 'distribution'
  ELSE 'station'
END
WHERE parent_node_id IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.nodes.infrastructure_level IS 'Hierarchy: transmission > distribution > feeder > transformer > service_area > pole';
COMMENT ON COLUMN public.nodes.parent_node_id IS 'References parent infrastructure node for hierarchical drill-down';
COMMENT ON COLUMN public.nodes.is_visible_default IS 'Whether to show on map by default (false for street-level poles to reduce clutter)';