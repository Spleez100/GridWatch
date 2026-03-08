ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS voltage_class text NOT NULL DEFAULT '132/33kV';
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS tcn_region text NOT NULL DEFAULT 'LAGOS';
ALTER TABLE public.nodes ADD COLUMN IF NOT EXISTS station_type text NOT NULL DEFAULT 'substation';