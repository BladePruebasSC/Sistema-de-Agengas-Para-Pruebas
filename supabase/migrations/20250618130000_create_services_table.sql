CREATE TABLE public.services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL
);

COMMENT ON COLUMN public.services.duration IS 'Duration in minutes';

INSERT INTO public.services (id, name, price, duration) VALUES
('1', 'Adulto', 1000, 45),
('2', 'Joven', 800, 45),
('3', 'Tijeras', 2000, 45);
