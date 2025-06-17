/*
  # Agregar configuración para habilitar/deshabilitar reseñas

  1. Cambios
    - Agregar columna `reviews_enabled` a la tabla admin_settings
    - Establecer valor por defecto como true (habilitado)

  2. Datos
    - Actualizar configuración existente para incluir reviews_enabled = true
*/

-- Agregar columna reviews_enabled a admin_settings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'admin_settings' AND column_name = 'reviews_enabled'
  ) THEN
    ALTER TABLE admin_settings ADD COLUMN reviews_enabled boolean DEFAULT true;
  END IF;
END $$;

-- Actualizar configuración existente para habilitar reseñas por defecto
UPDATE admin_settings 
SET reviews_enabled = true 
WHERE reviews_enabled IS NULL;