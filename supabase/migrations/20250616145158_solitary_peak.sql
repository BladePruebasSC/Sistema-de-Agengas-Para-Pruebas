/*
  # Crear tabla de reseñas y calificaciones

  1. Nueva Tabla
    - `reviews`
      - `id` (uuid, primary key)
      - `client_name` (text) - Nombre del cliente
      - `client_phone` (text) - Teléfono del cliente (para verificación)
      - `rating` (integer) - Calificación de 1 a 5 estrellas
      - `comment` (text) - Comentario de la reseña
      - `service_used` (text) - Servicio que utilizó
      - `barber_id` (uuid) - Barbero que atendió (opcional)
      - `is_verified` (boolean) - Si la reseña está verificada (cliente real)
      - `is_approved` (boolean) - Si la reseña está aprobada por admin
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Seguridad
    - Habilitar RLS en la tabla reviews
    - Políticas para lectura pública y escritura pública
    - Políticas de administración para usuarios autenticados
*/

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name text NOT NULL,
  client_phone text NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text NOT NULL,
  service_used text NOT NULL,
  barber_id uuid REFERENCES barbers(id),
  is_verified boolean DEFAULT false,
  is_approved boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Políticas para reviews
CREATE POLICY "Enable read access for approved reviews" 
ON reviews FOR SELECT 
TO public 
USING (is_approved = true);

CREATE POLICY "Enable insert for all users" 
ON reviews FOR INSERT 
TO public 
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" 
ON reviews FOR UPDATE 
TO authenticated 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users only" 
ON reviews FOR DELETE 
TO authenticated 
USING (true);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_barber ON reviews(barber_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);