/*
  # Crear tablas para barberos y configuración avanzada

  1. Nuevas Tablas
    - `barbers` - Información de los barberos
    - `business_hours` - Horarios de trabajo por día
    - `barber_schedules` - Horarios específicos por barbero
    
  2. Modificaciones
    - Agregar columna `barber_id` a appointments
    - Agregar columna `cancelled` a appointments para ocultar en lugar de borrar
    - Actualizar admin_settings con nuevas configuraciones

  3. Seguridad
    - Habilitar RLS en todas las nuevas tablas
    - Políticas apropiadas para cada tabla
*/

-- Crear tabla de barberos
CREATE TABLE IF NOT EXISTS barbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Crear tabla de horarios de negocio
CREATE TABLE IF NOT EXISTS business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Domingo, 6=Sábado
  is_open boolean DEFAULT true,
  morning_start time,
  morning_end time,
  afternoon_start time,
  afternoon_end time,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(day_of_week)
);

-- Crear tabla de horarios específicos por barbero
CREATE TABLE IF NOT EXISTS barber_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id uuid REFERENCES barbers(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_available boolean DEFAULT true,
  morning_start time,
  morning_end time,
  afternoon_start time,
  afternoon_end time,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(barber_id, day_of_week)
);

-- Agregar columnas a appointments
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS barber_id uuid REFERENCES barbers(id),
ADD COLUMN IF NOT EXISTS cancelled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS cancelled_at timestamptz;

-- Actualizar admin_settings para incluir nuevas configuraciones
ALTER TABLE admin_settings 
ADD COLUMN IF NOT EXISTS restricted_hours text[] DEFAULT ARRAY['7:00 AM', '8:00 AM'],
ADD COLUMN IF NOT EXISTS multiple_barbers_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS default_barber_id uuid REFERENCES barbers(id);

-- Habilitar RLS
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_schedules ENABLE ROW LEVEL SECURITY;

-- Políticas para barbers
CREATE POLICY "Enable read access for all users" ON barbers FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON barbers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON barbers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users only" ON barbers FOR DELETE TO authenticated USING (true);

-- Políticas para business_hours
CREATE POLICY "Enable read access for all users" ON business_hours FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON business_hours FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON business_hours FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users only" ON business_hours FOR DELETE TO authenticated USING (true);

-- Políticas para barber_schedules
CREATE POLICY "Enable read access for all users" ON barber_schedules FOR SELECT TO public USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON barber_schedules FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Enable update for authenticated users only" ON barber_schedules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete for authenticated users only" ON barber_schedules FOR DELETE TO authenticated USING (true);

-- Insertar horarios de negocio por defecto
INSERT INTO business_hours (day_of_week, is_open, morning_start, morning_end, afternoon_start, afternoon_end) VALUES
(0, true, '10:00', '15:00', NULL, NULL), -- Domingo
(1, true, '07:00', '12:00', '15:00', '21:00'), -- Lunes
(2, true, '07:00', '12:00', '15:00', '21:00'), -- Martes
(3, true, '07:00', '12:00', '15:00', '19:00'), -- Miércoles
(4, true, '07:00', '12:00', '15:00', '21:00'), -- Jueves
(5, true, '07:00', '12:00', '15:00', '21:00'), -- Viernes
(6, true, '07:00', '12:00', '15:00', '21:00') -- Sábado
ON CONFLICT (day_of_week) DO NOTHING;

-- Insertar barbero por defecto
INSERT INTO barbers (name, phone, is_active) VALUES
('Gastón', '+18092033894', true)
ON CONFLICT DO NOTHING;

-- Actualizar configuración por defecto
UPDATE admin_settings 
SET 
  restricted_hours = ARRAY['7:00 AM', '8:00 AM'],
  multiple_barbers_enabled = false,
  default_barber_id = (SELECT id FROM barbers WHERE name = 'Gastón' LIMIT 1)
WHERE id = (SELECT id FROM admin_settings LIMIT 1);

-- Crear índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_appointments_barber_date ON appointments(barber_id, date, cancelled);
CREATE INDEX IF NOT EXISTS idx_barber_schedules_barber_day ON barber_schedules(barber_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_business_hours_day ON business_hours(day_of_week);