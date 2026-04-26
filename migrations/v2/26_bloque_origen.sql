-- ==============================================================================
-- PAS ROBOTICS MANAGE - Vincular bloques de calendario con su origen
-- ==============================================================================
-- Anade columnas opcionales a oferta_bloque_calendario para identificar de
-- donde viene un bloque colocado:
--
--   - oferta_componente_id  → bloque originado por mantenimiento de un componente
--                              (permite descontar horas pendientes del candidato)
--   - origen_tipo            → 'componente' | 'desplazamiento' | 'manual' | 'comida'
--
-- Asi el endpoint /bloques-candidatos puede calcular horas pendientes:
--   horas_componente_total - SUM(horas de bloques con oferta_componente_id = X)
-- ==============================================================================

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'oferta_bloque_calendario'
     AND column_name = 'oferta_componente_id') = 0,
  'ALTER TABLE oferta_bloque_calendario
     ADD COLUMN oferta_componente_id INT NULL
       COMMENT ''Vincula con oferta_componente cuando el bloque cubre mantenimiento de un componente concreto''',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'oferta_bloque_calendario'
     AND column_name = 'origen_tipo') = 0,
  'ALTER TABLE oferta_bloque_calendario
     ADD COLUMN origen_tipo ENUM(''componente'',''desplazamiento'',''manual'',''comida'')
       NOT NULL DEFAULT ''manual''',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- FK al componente (con SET NULL si se borra el componente)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE table_schema = DATABASE()
     AND table_name = 'oferta_bloque_calendario'
     AND constraint_name = 'fk_obc_componente') = 0,
  'ALTER TABLE oferta_bloque_calendario
     ADD CONSTRAINT fk_obc_componente
       FOREIGN KEY (oferta_componente_id) REFERENCES oferta_componente(id) ON DELETE SET NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Indice para lookup por componente
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE()
     AND table_name = 'oferta_bloque_calendario'
     AND index_name = 'idx_obc_componente') = 0,
  'CREATE INDEX idx_obc_componente ON oferta_bloque_calendario (oferta_componente_id)',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Verificacion
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='oferta_bloque_calendario' AND column_name='oferta_componente_id') AS col_oferta_comp,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='oferta_bloque_calendario' AND column_name='origen_tipo') AS col_origen,
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE table_schema=DATABASE() AND table_name='oferta_bloque_calendario' AND constraint_name='fk_obc_componente') AS fk_creada;
