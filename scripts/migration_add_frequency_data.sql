-- Migration to add structured frequency data to projects
ALTER TABLE projects ADD COLUMN IF NOT EXISTS frequency_number INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS frequency_unit TEXT;

-- Update existing records with default values if necessary, 
-- or leave as NULL and handle in the migration script.
COMMENT ON COLUMN projects.frequency_number IS 'Cantidad para el cálculo de frecuencia';
COMMENT ON COLUMN projects.frequency_unit IS 'Unidad para el cálculo de frecuencia (day, week, month)';
