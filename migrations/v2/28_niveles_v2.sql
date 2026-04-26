-- ==============================================================================
-- PAS ROBOTICS MANAGE - Niveles v2
-- ==============================================================================
-- Cambios:
--   1. lu_tipo_actividad.categoria: ampliar ENUM (bateria, correa, filtro,
--      desiccant, limpieza)
--   2. lu_nivel_mantenimiento.ambito: ENUM('manipulador','controlador',
--      'drive_unit','eje_externo')
--   3. Seed de los 9 niveles canonicos (N1, N2_INF, N2_SUP, N3, N_CTRL, N_DU,
--      N0_EJE, N1_EJE, N2_EJE)
--   4. actividad_preventiva.ejes: CSV de ejes que cubre la actividad
--   5. actividad_nivel: M:N actividad <-> nivel con flag obligatoria
--   6. Migrar nivel(VARCHAR) -> nivel_id(FK) en TODAS las tablas que lo usan:
--      - mantenimiento_horas_familia (+ controlador_modelo_id + revisado)
--      - mantenimiento_horas_modelo
--      - consumibles_nivel
--      - oferta_componente
--      - oferta_sistema
--   7. Seed inicial de actividad_nivel (programable, re-ejecutable con IGNORE)
--
-- Mapping niveles antiguos:
--   '1' -> 'N1', '2_inferior' -> 'N2_INF', '2_superior' -> 'N2_SUP', '3' -> 'N3'
--
-- IMPORTANTE: si algun row queda con nivel_id NULL despues del UPDATE significa
-- que tenia un codigo no contemplado; revisar antes de continuar.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. lu_tipo_actividad.categoria: ampliar ENUM
-- ------------------------------------------------------------------------------
ALTER TABLE lu_tipo_actividad
  MODIFY COLUMN categoria ENUM(
    'inspeccion','lubricacion','reemplazo','overhaul','analisis',
    'bateria','correa','filtro','desiccant','limpieza','otro'
  ) NOT NULL DEFAULT 'otro';

-- ------------------------------------------------------------------------------
-- 2. lu_nivel_mantenimiento.ambito
-- ------------------------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'lu_nivel_mantenimiento'
     AND column_name = 'ambito') = 0,
  'ALTER TABLE lu_nivel_mantenimiento
     ADD COLUMN ambito ENUM(''manipulador'',''controlador'',''drive_unit'',''eje_externo'')
       NOT NULL DEFAULT ''manipulador'' AFTER descripcion',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 3. Seed de niveles canonicos
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO lu_nivel_mantenimiento (codigo, nombre, descripcion, ambito, orden) VALUES
  ('N1',     'Nivel 1',           'Revision general y limpieza',         'manipulador',  10),
  ('N2_INF', 'Nivel 2 Inferior',  'N1 + lubricacion ejes 1, 2, 3, 4',    'manipulador',  20),
  ('N2_SUP', 'Nivel 2 Superior',  'N1 + lubricacion ejes 5, 6',          'manipulador',  30),
  ('N3',     'Nivel 3',           'N1 + lubricacion de todos los ejes',  'manipulador',  40),
  ('N_CTRL', 'Nivel Controlador', 'Mantenimiento completo del armario',  'controlador',  50),
  ('N_DU',   'Nivel Drive Unit',  'Mantenimiento completo del drive',    'drive_unit',   60),
  ('N0_EJE', 'Eje sin revision',  'Eje externo no intervenido',          'eje_externo',  70),
  ('N1_EJE', 'Eje N1',            'Control general y limpieza',          'eje_externo',  80),
  ('N2_EJE', 'Eje N2',            'N1 + lubricacion',                    'eje_externo',  90);

-- ------------------------------------------------------------------------------
-- 4. actividad_preventiva.ejes (CSV)
-- ------------------------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'actividad_preventiva'
     AND column_name = 'ejes') = 0,
  'ALTER TABLE actividad_preventiva
     ADD COLUMN ejes VARCHAR(50) NULL
       COMMENT ''CSV de ejes que cubre la actividad (1,2,3,4). NULL = no asociada a eje''
       AFTER componente',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 5. actividad_nivel (M:N)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS actividad_nivel (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  actividad_id    INT NOT NULL,
  nivel_id        INT NOT NULL,
  obligatoria     BOOLEAN NOT NULL DEFAULT TRUE
                  COMMENT 'false = extra opcional dentro del nivel (baterias, correas, etc)',
  observaciones   VARCHAR(500) NULL,
  orden           INT NOT NULL DEFAULT 0,
  created_at      DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_an_actividad FOREIGN KEY (actividad_id) REFERENCES actividad_preventiva(id) ON DELETE CASCADE,
  CONSTRAINT fk_an_nivel     FOREIGN KEY (nivel_id)     REFERENCES lu_nivel_mantenimiento(id) ON DELETE CASCADE,
  UNIQUE KEY uq_an (actividad_id, nivel_id),
  INDEX idx_an_nivel (nivel_id),
  INDEX idx_an_actividad (actividad_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==============================================================================
-- 6. Migrar nivel(VARCHAR) -> nivel_id(FK) en todas las tablas
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 6a. mantenimiento_horas_familia: anadir nivel_id, controlador_modelo_id, revisado
-- ------------------------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'mantenimiento_horas_familia'
     AND column_name = 'nivel_id') = 0,
  'ALTER TABLE mantenimiento_horas_familia
     ADD COLUMN nivel_id INT NULL AFTER nivel,
     ADD COLUMN controlador_modelo_id INT NULL AFTER modelo_componente_id,
     ADD COLUMN revisado BOOLEAN NOT NULL DEFAULT FALSE AFTER horas',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Todas las filas migradas quedan revisado=FALSE (pendientes de validar
-- contra los datos del Excel de Daniel). Cuando se valide cada una, se
-- marca true desde la UI o un UPDATE manual.
-- (revisado ya tiene DEFAULT FALSE; este UPDATE es no-op explicito documental)
UPDATE mantenimiento_horas_familia
SET revisado = FALSE
WHERE revisado IS NULL OR revisado = TRUE;

UPDATE mantenimiento_horas_familia mhf
SET nivel_id = (
  SELECT id FROM lu_nivel_mantenimiento WHERE codigo = CASE mhf.nivel
    WHEN '1' THEN 'N1'
    WHEN '2_inferior' THEN 'N2_INF'
    WHEN '2_superior' THEN 'N2_SUP'
    WHEN '3' THEN 'N3'
    ELSE mhf.nivel
  END
)
WHERE nivel_id IS NULL;

-- Fail-fast: abortar con DIV/0 si quedan rows sin mapeo. Mensaje en alias.
SELECT IF(
  (SELECT COUNT(*) FROM mantenimiento_horas_familia WHERE nivel_id IS NULL) = 0,
  'OK',
  (SELECT 1/0 AS abort_rows_sin_mapeo_en_mantenimiento_horas_familia)
) AS check_mhf;

-- Forzar NOT NULL + indices/FKs (idempotente: solo si nivel_id es nullable)
SET @sql = (SELECT IF(
  (SELECT IS_NULLABLE FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_familia' AND column_name='nivel_id') = 'YES',
  'ALTER TABLE mantenimiento_horas_familia MODIFY COLUMN nivel_id INT NOT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- FK nivel_id (si no existe)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_familia' AND constraint_name='fk_mhf_nivel') = 0,
  'ALTER TABLE mantenimiento_horas_familia
     ADD CONSTRAINT fk_mhf_nivel FOREIGN KEY (nivel_id) REFERENCES lu_nivel_mantenimiento(id)',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- FK controlador_modelo_id (si no existe)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_familia' AND constraint_name='fk_mhf_ctrl') = 0,
  'ALTER TABLE mantenimiento_horas_familia
     ADD CONSTRAINT fk_mhf_ctrl FOREIGN KEY (controlador_modelo_id) REFERENCES modelos_componente(id) ON DELETE CASCADE',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Indice controlador
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_familia' AND index_name='idx_mhf_ctrl') = 0,
  'CREATE INDEX idx_mhf_ctrl ON mantenimiento_horas_familia (controlador_modelo_id)',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Reemplazar UNIQUE: PRIMERO crear el nuevo (cubre familia_id como prefijo
-- izquierdo, util para FK), LUEGO dropear el viejo. InnoDB rechaza dropear
-- un unique si es el unico indice cubriendo una columna FK.
-- Nombre temporal uq_mhf_new para no chocar con el viejo uq_mhf.
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_familia' AND index_name='uq_mhf_new') = 0
  AND
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_familia' AND column_name='nivel_id') > 0,
  'ALTER TABLE mantenimiento_horas_familia
     ADD UNIQUE KEY uq_mhf_new (familia_id, modelo_componente_id, controlador_modelo_id, nivel_id)',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop viejo uq_mhf (si todavia existe y referencia columna 'nivel')
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_familia'
     AND index_name='uq_mhf' AND non_unique=0
     AND column_name='nivel') > 0,
  'ALTER TABLE mantenimiento_horas_familia DROP INDEX uq_mhf',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Renombrar uq_mhf_new -> uq_mhf (limpieza)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_familia' AND index_name='uq_mhf_new') > 0
  AND
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_familia' AND index_name='uq_mhf') = 0,
  'ALTER TABLE mantenimiento_horas_familia RENAME INDEX uq_mhf_new TO uq_mhf',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop columna nivel string (si existe)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_familia' AND column_name='nivel') > 0,
  'ALTER TABLE mantenimiento_horas_familia DROP COLUMN nivel',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 6b. mantenimiento_horas_modelo (legacy)
-- ------------------------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'mantenimiento_horas_modelo'
     AND column_name = 'nivel_id') = 0,
  'ALTER TABLE mantenimiento_horas_modelo ADD COLUMN nivel_id INT NULL AFTER nivel',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE mantenimiento_horas_modelo mhm
SET nivel_id = (
  SELECT id FROM lu_nivel_mantenimiento WHERE codigo = CASE mhm.nivel
    WHEN '1' THEN 'N1'
    WHEN '2_inferior' THEN 'N2_INF'
    WHEN '2_superior' THEN 'N2_SUP'
    WHEN '3' THEN 'N3'
    ELSE mhm.nivel
  END
)
WHERE nivel_id IS NULL;

SELECT IF(
  (SELECT COUNT(*) FROM mantenimiento_horas_modelo WHERE nivel_id IS NULL) = 0,
  'OK',
  (SELECT 1/0 AS abort_rows_sin_mapeo_en_mantenimiento_horas_modelo)
) AS check_mhm;

SET @sql = (SELECT IF(
  (SELECT IS_NULLABLE FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_modelo' AND column_name='nivel_id') = 'YES',
  'ALTER TABLE mantenimiento_horas_modelo MODIFY COLUMN nivel_id INT NOT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_modelo' AND constraint_name='fk_mhm_nivel') = 0,
  'ALTER TABLE mantenimiento_horas_modelo
     ADD CONSTRAINT fk_mhm_nivel FOREIGN KEY (nivel_id) REFERENCES lu_nivel_mantenimiento(id)',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Reemplazar UNIQUE: crear nuevo PRIMERO (cubre modelo_componente_id como
-- prefijo izquierdo, FK necesita indice), luego drop viejo, luego rename.
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_modelo' AND index_name='uq_mhm_new') = 0
  AND
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_modelo' AND column_name='nivel_id') > 0,
  'ALTER TABLE mantenimiento_horas_modelo
     ADD UNIQUE KEY uq_mhm_new (modelo_componente_id, nivel_id)',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_modelo'
     AND index_name='uq_mhm' AND non_unique=0 AND column_name='nivel') > 0,
  'ALTER TABLE mantenimiento_horas_modelo DROP INDEX uq_mhm',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_modelo' AND index_name='uq_mhm_new') > 0
  AND
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_modelo' AND index_name='uq_mhm') = 0,
  'ALTER TABLE mantenimiento_horas_modelo RENAME INDEX uq_mhm_new TO uq_mhm',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_modelo' AND column_name='nivel') > 0,
  'ALTER TABLE mantenimiento_horas_modelo DROP COLUMN nivel',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 6c. consumibles_nivel
-- ------------------------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'consumibles_nivel'
     AND column_name = 'nivel_id') = 0,
  'ALTER TABLE consumibles_nivel ADD COLUMN nivel_id INT NULL AFTER nivel',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE consumibles_nivel cn
SET nivel_id = (
  SELECT id FROM lu_nivel_mantenimiento WHERE codigo = CASE cn.nivel
    WHEN '1' THEN 'N1'
    WHEN '2_inferior' THEN 'N2_INF'
    WHEN '2_superior' THEN 'N2_SUP'
    WHEN '3' THEN 'N3'
    ELSE cn.nivel
  END
)
WHERE nivel_id IS NULL;

SELECT IF(
  (SELECT COUNT(*) FROM consumibles_nivel WHERE nivel_id IS NULL) = 0,
  'OK',
  (SELECT 1/0 AS abort_rows_sin_mapeo_en_consumibles_nivel)
) AS check_cn;

SET @sql = (SELECT IF(
  (SELECT IS_NULLABLE FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='consumibles_nivel' AND column_name='nivel_id') = 'YES',
  'ALTER TABLE consumibles_nivel MODIFY COLUMN nivel_id INT NOT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE table_schema=DATABASE() AND table_name='consumibles_nivel' AND constraint_name='fk_cn_nivel') = 0,
  'ALTER TABLE consumibles_nivel
     ADD CONSTRAINT fk_cn_nivel FOREIGN KEY (nivel_id) REFERENCES lu_nivel_mantenimiento(id)',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Reemplazar UNIQUE: crear nuevo PRIMERO (cubre modelo_id como prefijo
-- izquierdo, util para FK consumiblesNivel.modeloId), luego drop viejo.
-- InnoDB rechaza dropear el unique si era el unico indice cubriendo modelo_id.
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema=DATABASE() AND table_name='consumibles_nivel' AND index_name='uq_cn_modelo_nivel') = 0
  AND
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='consumibles_nivel' AND column_name='nivel_id') > 0,
  'ALTER TABLE consumibles_nivel
     ADD UNIQUE KEY uq_cn_modelo_nivel (modelo_id, nivel_id)',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Drop unique antiguo por columna 'nivel' (cualquier nombre)
SET @old_uq := (SELECT index_name FROM information_schema.statistics
  WHERE table_schema=DATABASE() AND table_name='consumibles_nivel'
    AND non_unique=0 AND column_name='nivel'
  LIMIT 1);
SET @sql = IF(@old_uq IS NOT NULL,
  CONCAT('ALTER TABLE consumibles_nivel DROP INDEX `', @old_uq, '`'),
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='consumibles_nivel' AND column_name='nivel') > 0,
  'ALTER TABLE consumibles_nivel DROP COLUMN nivel',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 6d. oferta_componente (nivel es nullable: solo migramos lo que tenia valor)
-- ------------------------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'oferta_componente'
     AND column_name = 'nivel_id') = 0,
  'ALTER TABLE oferta_componente ADD COLUMN nivel_id INT NULL AFTER nivel',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE oferta_componente oc
SET nivel_id = (
  SELECT id FROM lu_nivel_mantenimiento WHERE codigo = CASE oc.nivel
    WHEN '1' THEN 'N1'
    WHEN '2_inferior' THEN 'N2_INF'
    WHEN '2_superior' THEN 'N2_SUP'
    WHEN '3' THEN 'N3'
    ELSE oc.nivel
  END
)
WHERE oc.nivel IS NOT NULL AND oc.nivel_id IS NULL;

-- Fail-fast solo si hay rows con nivel string SET y nivel_id NULL
SELECT IF(
  (SELECT COUNT(*) FROM oferta_componente
   WHERE nivel IS NOT NULL AND nivel_id IS NULL) = 0,
  'OK',
  (SELECT 1/0 AS abort_rows_sin_mapeo_en_oferta_componente)
) AS check_oc;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE table_schema=DATABASE() AND table_name='oferta_componente' AND constraint_name='fk_oc_nivel') = 0,
  'ALTER TABLE oferta_componente
     ADD CONSTRAINT fk_oc_nivel FOREIGN KEY (nivel_id) REFERENCES lu_nivel_mantenimiento(id)',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='oferta_componente' AND column_name='nivel') > 0,
  'ALTER TABLE oferta_componente DROP COLUMN nivel',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 6e. oferta_sistema (nivel NOT NULL con default '1')
-- ------------------------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'oferta_sistema'
     AND column_name = 'nivel_id') = 0,
  'ALTER TABLE oferta_sistema ADD COLUMN nivel_id INT NULL AFTER nivel',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE oferta_sistema os
SET nivel_id = (
  SELECT id FROM lu_nivel_mantenimiento WHERE codigo = CASE os.nivel
    WHEN '1' THEN 'N1'
    WHEN '2_inferior' THEN 'N2_INF'
    WHEN '2_superior' THEN 'N2_SUP'
    WHEN '3' THEN 'N3'
    ELSE os.nivel
  END
)
WHERE nivel_id IS NULL;

SELECT IF(
  (SELECT COUNT(*) FROM oferta_sistema WHERE nivel_id IS NULL) = 0,
  'OK',
  (SELECT 1/0 AS abort_rows_sin_mapeo_en_oferta_sistema)
) AS check_os;

SET @sql = (SELECT IF(
  (SELECT IS_NULLABLE FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='oferta_sistema' AND column_name='nivel_id') = 'YES',
  'ALTER TABLE oferta_sistema MODIFY COLUMN nivel_id INT NOT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE table_schema=DATABASE() AND table_name='oferta_sistema' AND constraint_name='fk_os_nivel') = 0,
  'ALTER TABLE oferta_sistema
     ADD CONSTRAINT fk_os_nivel FOREIGN KEY (nivel_id) REFERENCES lu_nivel_mantenimiento(id)',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='oferta_sistema' AND column_name='nivel') > 0,
  'ALTER TABLE oferta_sistema DROP COLUMN nivel',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 6f. intervencion_sistema (mismo patron que oferta_sistema)
-- ------------------------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'intervencion_sistema'
     AND column_name = 'nivel_id') = 0,
  'ALTER TABLE intervencion_sistema ADD COLUMN nivel_id INT NULL AFTER nivel',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

UPDATE intervencion_sistema is_
SET nivel_id = (
  SELECT id FROM lu_nivel_mantenimiento WHERE codigo = CASE is_.nivel
    WHEN '1' THEN 'N1'
    WHEN '2_inferior' THEN 'N2_INF'
    WHEN '2_superior' THEN 'N2_SUP'
    WHEN '3' THEN 'N3'
    ELSE is_.nivel
  END
)
WHERE nivel_id IS NULL;

SELECT IF(
  (SELECT COUNT(*) FROM intervencion_sistema WHERE nivel_id IS NULL) = 0,
  'OK',
  (SELECT 1/0 AS abort_rows_sin_mapeo_en_intervencion_sistema)
) AS check_is;

SET @sql = (SELECT IF(
  (SELECT IS_NULLABLE FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='intervencion_sistema' AND column_name='nivel_id') = 'YES',
  'ALTER TABLE intervencion_sistema MODIFY COLUMN nivel_id INT NOT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.table_constraints
   WHERE table_schema=DATABASE() AND table_name='intervencion_sistema' AND constraint_name='fk_is_nivel') = 0,
  'ALTER TABLE intervencion_sistema
     ADD CONSTRAINT fk_is_nivel FOREIGN KEY (nivel_id) REFERENCES lu_nivel_mantenimiento(id)',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='intervencion_sistema' AND column_name='nivel') > 0,
  'ALTER TABLE intervencion_sistema DROP COLUMN nivel',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ==============================================================================
-- 6g. Parsear ejes desde componente para actividades de lubricacion
-- ==============================================================================
-- Patron: extraer ejes del texto libre de componente para que el seed posterior
-- pueda asignar correctamente N2_INF (ejes 1-4) y N2_SUP (ejes 5-6).
-- Solo aplica a actividades de categoria='lubricacion' que aun tengan ejes NULL.
-- Re-ejecutable: el WHERE clause garantiza idempotencia.
-- ==============================================================================
UPDATE actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
SET ap.ejes = CASE
  -- Patrones explicitos primero (mas restrictivos)
  WHEN ap.componente REGEXP '[Ee]jes?[[:space:]]*1[[:space:]]*[a-]?[[:space:]]*4'           THEN '1,2,3,4'
  WHEN ap.componente REGEXP '[Ee]jes?[[:space:]]*5[[:space:]]*[a-]?[[:space:]]*6'           THEN '5,6'
  WHEN ap.componente REGEXP '[Ee]jes?[[:space:]]*1[[:space:]]*[a-]?[[:space:]]*6'           THEN '1,2,3,4,5,6'
  WHEN ap.componente REGEXP '[Tt]odos[[:space:]]+los[[:space:]]+ejes'                       THEN '1,2,3,4,5,6'
  -- Eje individual
  WHEN ap.componente REGEXP '[Ee]je[[:space:]]+1([^0-9]|$)'                                 THEN '1'
  WHEN ap.componente REGEXP '[Ee]je[[:space:]]+2([^0-9]|$)'                                 THEN '2'
  WHEN ap.componente REGEXP '[Ee]je[[:space:]]+3([^0-9]|$)'                                 THEN '3'
  WHEN ap.componente REGEXP '[Ee]je[[:space:]]+4([^0-9]|$)'                                 THEN '4'
  WHEN ap.componente REGEXP '[Ee]je[[:space:]]+5([^0-9]|$)'                                 THEN '5'
  WHEN ap.componente REGEXP '[Ee]je[[:space:]]+6([^0-9]|$)'                                 THEN '6'
  WHEN ap.componente REGEXP '[Mm]uneca|[Ww]rist'                                            THEN '5,6'
  ELSE NULL
END
WHERE ap.ejes IS NULL
  AND lta.categoria = 'lubricacion';

-- Reporte: actividades de lubricacion sin ejes parseados (revisar manualmente)
SELECT 'actividades_lubricacion_sin_ejes' AS info, COUNT(*) AS pendientes_revisar
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
WHERE lta.categoria = 'lubricacion' AND ap.ejes IS NULL;

-- ==============================================================================
-- 7. Seed inicial de actividad_nivel (programable, re-ejecutable con INSERT IGNORE)
-- ==============================================================================
-- Reglas:
--   a) Manipulador + lubricacion -> N3 obligatoria
--      + N2_INF si ejes contiene 1,2,3,4
--      + N2_SUP si ejes contiene 5,6
--   b) Manipulador + inspeccion/limpieza/analisis -> N1, N2_INF, N2_SUP, N3 (obligatoria)
--   c) Manipulador + extras (bateria/correa/filtro/desiccant/reemplazo/overhaul/otro)
--      -> N1, N2_INF, N2_SUP, N3 (obligatoria=false)
--   d) Controlador -> N_CTRL (obligatoria salvo extras)
--   e) Drive Unit -> N_DU (obligatoria salvo extras)
--   f) Eje externo + lubricacion -> N2_EJE
--      Eje externo + inspeccion/limpieza/analisis -> N1_EJE y N2_EJE
--      Eje externo + extras -> N1_EJE y N2_EJE (obligatoria=false)
-- ==============================================================================

-- a-1) Manipulador + lubricacion -> N3 (siempre)
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id, TRUE
FROM actividad_preventiva ap
JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
JOIN lu_nivel_mantenimiento lnm ON lnm.codigo = 'N3'
WHERE f.tipo = 'mechanical_unit' AND lta.categoria = 'lubricacion';

-- a-2) Manipulador + lubricacion en eje 1-4 -> N2_INF
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id, TRUE
FROM actividad_preventiva ap
JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
JOIN lu_nivel_mantenimiento lnm ON lnm.codigo = 'N2_INF'
WHERE f.tipo = 'mechanical_unit' AND lta.categoria = 'lubricacion'
  AND ap.ejes IS NOT NULL
  AND (FIND_IN_SET('1', ap.ejes) > 0
    OR FIND_IN_SET('2', ap.ejes) > 0
    OR FIND_IN_SET('3', ap.ejes) > 0
    OR FIND_IN_SET('4', ap.ejes) > 0);

-- a-3) Manipulador + lubricacion en eje 5-6 -> N2_SUP
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id, TRUE
FROM actividad_preventiva ap
JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
JOIN lu_nivel_mantenimiento lnm ON lnm.codigo = 'N2_SUP'
WHERE f.tipo = 'mechanical_unit' AND lta.categoria = 'lubricacion'
  AND ap.ejes IS NOT NULL
  AND (FIND_IN_SET('5', ap.ejes) > 0
    OR FIND_IN_SET('6', ap.ejes) > 0);

-- b) Manipulador + inspeccion/limpieza/analisis -> N1, N2_INF, N2_SUP, N3
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id, TRUE
FROM actividad_preventiva ap
JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
CROSS JOIN lu_nivel_mantenimiento lnm
WHERE f.tipo = 'mechanical_unit'
  AND lta.categoria IN ('inspeccion','limpieza','analisis')
  AND lnm.codigo IN ('N1','N2_INF','N2_SUP','N3');

-- c) Manipulador + extras -> mismos niveles obligatoria=false
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id, FALSE
FROM actividad_preventiva ap
JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
CROSS JOIN lu_nivel_mantenimiento lnm
WHERE f.tipo = 'mechanical_unit'
  AND lta.categoria IN ('bateria','correa','filtro','desiccant','reemplazo','overhaul','otro')
  AND lnm.codigo IN ('N1','N2_INF','N2_SUP','N3');

-- d) Controlador -> N_CTRL (obligatoria salvo extras)
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id,
  CASE WHEN lta.categoria IN ('bateria','correa','filtro','desiccant','reemplazo','overhaul','otro')
       THEN FALSE ELSE TRUE END
FROM actividad_preventiva ap
JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
JOIN lu_nivel_mantenimiento lnm ON lnm.codigo = 'N_CTRL'
WHERE f.tipo = 'controller';

-- e) Drive Unit -> N_DU (obligatoria salvo extras)
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id,
  CASE WHEN lta.categoria IN ('bateria','correa','filtro','desiccant','reemplazo','overhaul','otro')
       THEN FALSE ELSE TRUE END
FROM actividad_preventiva ap
JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
JOIN lu_nivel_mantenimiento lnm ON lnm.codigo = 'N_DU'
WHERE f.tipo = 'drive_unit';

-- f-1) Eje externo + lubricacion -> N2_EJE
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id, TRUE
FROM actividad_preventiva ap
JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
JOIN lu_nivel_mantenimiento lnm ON lnm.codigo = 'N2_EJE'
WHERE f.tipo = 'external_axis' AND lta.categoria = 'lubricacion';

-- f-2) Eje externo + inspeccion/limpieza/analisis -> N1_EJE y N2_EJE
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id, TRUE
FROM actividad_preventiva ap
JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
CROSS JOIN lu_nivel_mantenimiento lnm
WHERE f.tipo = 'external_axis'
  AND lta.categoria IN ('inspeccion','limpieza','analisis')
  AND lnm.codigo IN ('N1_EJE','N2_EJE');

-- f-3) Eje externo + extras -> N1_EJE y N2_EJE obligatoria=false
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id, FALSE
FROM actividad_preventiva ap
JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
CROSS JOIN lu_nivel_mantenimiento lnm
WHERE f.tipo = 'external_axis'
  AND lta.categoria IN ('bateria','correa','filtro','desiccant','reemplazo','overhaul','otro')
  AND lnm.codigo IN ('N1_EJE','N2_EJE');

-- ==============================================================================
-- Verificacion final
-- ==============================================================================
SELECT
  -- Estructura
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='lu_nivel_mantenimiento' AND column_name='ambito') AS col_ambito,
  (SELECT COUNT(*) FROM lu_nivel_mantenimiento) AS niveles_total,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='actividad_preventiva' AND column_name='ejes') AS col_ejes,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema=DATABASE() AND table_name='actividad_nivel') AS tabla_actividad_nivel,
  -- Migraciones nivel_id
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_familia' AND column_name='nivel_id') AS mhf_nivel_id,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_familia' AND column_name='controlador_modelo_id') AS mhf_ctrl_id,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_modelo' AND column_name='nivel_id') AS mhm_nivel_id,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='consumibles_nivel' AND column_name='nivel_id') AS cn_nivel_id,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='oferta_componente' AND column_name='nivel_id') AS oc_nivel_id,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='oferta_sistema' AND column_name='nivel_id') AS os_nivel_id,
  -- Confirmar que las columnas string fueron eliminadas
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_familia' AND column_name='nivel') AS mhf_nivel_string_quedan,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='consumibles_nivel' AND column_name='nivel') AS cn_nivel_string_quedan,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='oferta_componente' AND column_name='nivel') AS oc_nivel_string_quedan,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='oferta_sistema' AND column_name='nivel') AS os_nivel_string_quedan,
  -- Seed counts
  (SELECT COUNT(*) FROM actividad_nivel) AS actividad_nivel_filas,
  (SELECT COUNT(*) FROM actividad_nivel WHERE obligatoria=TRUE) AS act_nivel_obligatorias,
  (SELECT COUNT(*) FROM actividad_nivel WHERE obligatoria=FALSE) AS act_nivel_extras;
