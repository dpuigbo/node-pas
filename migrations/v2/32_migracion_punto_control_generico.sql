-- ==============================================================================
-- 32_migracion_punto_control_generico.sql
-- ==============================================================================
-- Convierte actividad_preventiva en una tabla con dos modos:
--   - Particular por familia (familia_id NOT NULL, tipo_componente_aplicable NULL)
--   - Genérica por tipo     (familia_id NULL,    tipo_componente_aplicable NOT NULL)
-- Migra las 38 filas de punto_control_generico a actividad_preventiva como
-- genéricas. Después dropea punto_control_generico.
--
-- Idempotente:
--   - Los ALTER usan SELECT IF para ver si la columna ya existe.
--   - El INSERT solo se ejecuta si punto_control_generico aún existe.
--   - DROP TABLE IF EXISTS al final.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ALTER actividad_preventiva: familia_id NULL
-- ------------------------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT IS_NULLABLE FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'actividad_preventiva'
     AND column_name = 'familia_id') = 'NO',
  'ALTER TABLE actividad_preventiva MODIFY COLUMN familia_id INT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 2. ALTER actividad_preventiva: ADD tipo_componente_aplicable
-- ------------------------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'actividad_preventiva'
     AND column_name = 'tipo_componente_aplicable') = 0,
  'ALTER TABLE actividad_preventiva
     ADD COLUMN tipo_componente_aplicable
       ENUM(''mechanical_unit'',''controller'',''drive_unit'',''external_axis'',''todos'')
       NULL AFTER familia_id',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 3. ALTER actividad_preventiva: ADD orden
-- ------------------------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'actividad_preventiva'
     AND column_name = 'orden') = 0,
  'ALTER TABLE actividad_preventiva
     ADD COLUMN orden INT NOT NULL DEFAULT 0 AFTER tipo_componente_aplicable',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 4. INSERTAR las 38 filas de punto_control_generico (solo si la tabla existe)
-- ------------------------------------------------------------------------------
SET @tipo_inspeccion_id := (SELECT id FROM lu_tipo_actividad WHERE codigo = 'inspeccion' LIMIT 1);

-- Fail-fast si no existe el tipo 'inspeccion' (no debería pasar)
SELECT IF(
  @tipo_inspeccion_id IS NOT NULL,
  'OK',
  (SELECT 1/0 AS abort_falta_tipo_inspeccion)
) AS check_tipo_inspeccion;

-- INSERT por categoría (cada uno protegido contra tabla inexistente)

-- 4a) manipulador → mechanical_unit
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = DATABASE() AND table_name = 'punto_control_generico') > 0,
  CONCAT('INSERT INTO actividad_preventiva
     (familia_id, tipo_componente_aplicable, tipo_actividad_id, componente, intervalo_texto_legacy, notas, orden)
     SELECT NULL, ''mechanical_unit'', ', @tipo_inspeccion_id, ', pcg.componente, pcg.intervalo_texto,
       CONCAT(IFNULL(pcg.descripcion_accion, ''''),
              CASE WHEN pcg.condicion IS NOT NULL THEN CONCAT(''\nCondición: '', pcg.condicion) ELSE '''' END),
       IFNULL(pcg.orden, 0)
     FROM punto_control_generico pcg
     WHERE pcg.categoria = ''manipulador'''),
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4b) controladora → controller
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = DATABASE() AND table_name = 'punto_control_generico') > 0,
  CONCAT('INSERT INTO actividad_preventiva
     (familia_id, tipo_componente_aplicable, tipo_actividad_id, componente, intervalo_texto_legacy, notas, orden)
     SELECT NULL, ''controller'', ', @tipo_inspeccion_id, ', pcg.componente, pcg.intervalo_texto,
       CONCAT(IFNULL(pcg.descripcion_accion, ''''),
              CASE WHEN pcg.condicion IS NOT NULL THEN CONCAT(''\nCondición: '', pcg.condicion) ELSE '''' END),
       IFNULL(pcg.orden, 0)
     FROM punto_control_generico pcg
     WHERE pcg.categoria = ''controladora'''),
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4c) drive_module → drive_unit (no hay filas hoy, pero por completitud)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = DATABASE() AND table_name = 'punto_control_generico') > 0,
  CONCAT('INSERT INTO actividad_preventiva
     (familia_id, tipo_componente_aplicable, tipo_actividad_id, componente, intervalo_texto_legacy, notas, orden)
     SELECT NULL, ''drive_unit'', ', @tipo_inspeccion_id, ', pcg.componente, pcg.intervalo_texto,
       CONCAT(IFNULL(pcg.descripcion_accion, ''''),
              CASE WHEN pcg.condicion IS NOT NULL THEN CONCAT(''\nCondición: '', pcg.condicion) ELSE '''' END),
       IFNULL(pcg.orden, 0)
     FROM punto_control_generico pcg
     WHERE pcg.categoria = ''drive_module'''),
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4d) eje_externo → external_axis
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = DATABASE() AND table_name = 'punto_control_generico') > 0,
  CONCAT('INSERT INTO actividad_preventiva
     (familia_id, tipo_componente_aplicable, tipo_actividad_id, componente, intervalo_texto_legacy, notas, orden)
     SELECT NULL, ''external_axis'', ', @tipo_inspeccion_id, ', pcg.componente, pcg.intervalo_texto,
       CONCAT(IFNULL(pcg.descripcion_accion, ''''),
              CASE WHEN pcg.condicion IS NOT NULL THEN CONCAT(''\nCondición: '', pcg.condicion) ELSE '''' END),
       IFNULL(pcg.orden, 0)
     FROM punto_control_generico pcg
     WHERE pcg.categoria = ''eje_externo'''),
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 4e) cabling y seguridad → 'todos'
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema = DATABASE() AND table_name = 'punto_control_generico') > 0,
  CONCAT('INSERT INTO actividad_preventiva
     (familia_id, tipo_componente_aplicable, tipo_actividad_id, componente, intervalo_texto_legacy, notas, orden)
     SELECT NULL, ''todos'', ', @tipo_inspeccion_id, ', pcg.componente, pcg.intervalo_texto,
       CONCAT(IFNULL(pcg.descripcion_accion, ''''),
              CASE WHEN pcg.condicion IS NOT NULL THEN CONCAT(''\nCondición: '', pcg.condicion) ELSE '''' END),
       IFNULL(pcg.orden, 0)
     FROM punto_control_generico pcg
     WHERE pcg.categoria IN (''cabling'', ''seguridad'')'),
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 5. ADD CHECK constraint (XOR familia_id / tipo_componente_aplicable)
-- ------------------------------------------------------------------------------
-- Cada actividad debe ser O bien específica de familia O bien genérica de tipo,
-- nunca ambas ni ninguna. Aplicado DESPUÉS del INSERT para evitar fallos.
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE table_schema = DATABASE()
     AND table_name = 'actividad_preventiva'
     AND constraint_name = 'chk_familia_xor_tipo') = 0,
  'ALTER TABLE actividad_preventiva
     ADD CONSTRAINT chk_familia_xor_tipo CHECK (
       (familia_id IS NOT NULL AND tipo_componente_aplicable IS NULL)
       OR
       (familia_id IS NULL AND tipo_componente_aplicable IS NOT NULL)
     )',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 6. Verificación de conteo
-- ------------------------------------------------------------------------------
SELECT '=== Verificación: total actividad_preventiva tras migración ===' AS info;
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN familia_id IS NOT NULL AND tipo_componente_aplicable IS NULL THEN 1 ELSE 0 END) AS particulares,
  SUM(CASE WHEN familia_id IS NULL AND tipo_componente_aplicable IS NOT NULL THEN 1 ELSE 0 END) AS genericas,
  SUM(CASE WHEN familia_id IS NULL AND tipo_componente_aplicable IS NULL THEN 1 ELSE 0 END) AS invalidas_xor,
  SUM(CASE WHEN familia_id IS NOT NULL AND tipo_componente_aplicable IS NOT NULL THEN 1 ELSE 0 END) AS invalidas_ambas
FROM actividad_preventiva;

SELECT '=== Distribución de genéricas por tipo_componente_aplicable ===' AS info;
SELECT tipo_componente_aplicable, COUNT(*) AS total
FROM actividad_preventiva
WHERE familia_id IS NULL
GROUP BY tipo_componente_aplicable
ORDER BY total DESC;

-- ------------------------------------------------------------------------------
-- 7. DROP TABLE punto_control_generico (idempotente)
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS punto_control_generico;

SELECT '=== punto_control_generico drop verificado ===' AS info;
SELECT COUNT(*) AS tabla_aun_existe
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_name = 'punto_control_generico';
