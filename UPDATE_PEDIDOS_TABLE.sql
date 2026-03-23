-- Update pedidos table to match the application structure
-- Run this in Supabase SQL Editor if the table doesn't have all required fields

-- Add missing columns if they don't exist
ALTER TABLE pedidos
ADD COLUMN IF NOT EXISTS fecha_creacion timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS fecha_entrega date,
ADD COLUMN IF NOT EXISTS sucursal text,
ADD COLUMN IF NOT EXISTS cliente_personalizado text,
ADD COLUMN IF NOT EXISTS productos jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS observaciones text,
ADD COLUMN IF NOT EXISTS estado text DEFAULT 'procesado';

-- Rename old columns if they exist (only if migrating from old schema)
-- ALTER TABLE pedidos RENAME COLUMN products TO productos_old;
-- ALTER TABLE pedidos RENAME COLUMN createdat TO createdat_old;
-- ALTER TABLE pedidos RENAME COLUMN updatedat TO updatedat_old;

-- Verify the structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'pedidos' ORDER BY ordinal_position;
