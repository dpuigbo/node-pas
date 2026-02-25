-- Remove planta references from sistemas
ALTER TABLE sistemas DROP FOREIGN KEY IF EXISTS sistemas_planta_id_fkey;
ALTER TABLE sistemas DROP COLUMN IF EXISTS planta_id;

-- Remove planta references from maquinas
ALTER TABLE maquinas DROP INDEX IF EXISTS maquinas_cliente_id_planta_id_nombre_key;
ALTER TABLE maquinas DROP FOREIGN KEY IF EXISTS maquinas_planta_id_fkey;
ALTER TABLE maquinas DROP COLUMN IF EXISTS planta_id;

-- Add new unique constraint for maquinas (clienteId + nombre)
ALTER TABLE maquinas ADD UNIQUE INDEX maquinas_cliente_id_nombre_key (cliente_id, nombre);

-- Drop plantas table
DROP TABLE IF EXISTS plantas;
