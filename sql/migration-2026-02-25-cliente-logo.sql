-- Add logo column to clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS logo VARCHAR(500) NULL;
