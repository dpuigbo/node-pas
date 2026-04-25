-- ==============================================================================
-- PAS ROBOTICS MANAGE - Componente padre (multimove con ejes por robot)
-- ==============================================================================
-- En sistemas multimove, cada robot+DU tiene asociados sus PROPIOS ejes
-- externos (no se comparten a nivel sistema).
--
-- Anade componente_padre_id a componentes_sistema (self-FK opcional).
--   - NULL = top-level (controladora, robot principal, DUs, ejes sin asignar)
--   - Para ejes en multimove: apunta al robot al que pertenecen
--   - Para robots adicionales: apunta a su drive_unit
-- ==============================================================================

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'componentes_sistema'
     AND column_name = 'componente_padre_id') = 0,
  'ALTER TABLE componentes_sistema
     ADD COLUMN componente_padre_id INT NULL AFTER orden,
     ADD CONSTRAINT fk_comp_padre FOREIGN KEY (componente_padre_id)
       REFERENCES componentes_sistema(id) ON DELETE SET NULL,
     ADD INDEX idx_comp_padre (componente_padre_id)',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificacion
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'componentes_sistema'
     AND column_name = 'componente_padre_id') AS columna_creada,
  (SELECT COUNT(*) FROM componentes_sistema) AS total_componentes,
  (SELECT COUNT(*) FROM componentes_sistema WHERE componente_padre_id IS NOT NULL) AS con_padre;
