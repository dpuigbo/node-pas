-- ==============================================================================
-- PAS ROBOTICS MANAGE - Refactor de horas y consumibles por familia/actividad
-- ==============================================================================
-- 1) mantenimiento_horas_familia: horas + notas por (familia, nivel) — opcional
--    modelo_componente_id para controladores (que las tienen por variante)
-- 2) consumibles_limpieza_modelo: consumibles de limpieza vinculados al modelo
--    (no por nivel, siempre se aplican)
-- 3) actividad_preventiva.niveles: CSV de niveles que cubre la actividad
--    (vacio = aplica a todos los niveles)
--
-- Esto sustituye gradualmente:
--   - mantenimiento_horas_modelo  → mantenimiento_horas_familia
--   - consumibles_nivel.consumibles aceites/grasas → leidos de actividad_preventiva
--   - mantenimiento_horas_modelo.coste_limpieza → consumibles_limpieza_modelo
-- (las tablas viejas siguen existiendo de momento, fallback)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. mantenimiento_horas_familia
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mantenimiento_horas_familia (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  familia_id            INT NOT NULL,
  modelo_componente_id  INT NULL COMMENT 'NULL = aplica a toda la familia. Para controladores se usa por variante.',
  nivel                 VARCHAR(20) NOT NULL,
  horas                 DECIMAL(8,2) NULL,
  notas                 VARCHAR(500),
  created_at            DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at            DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_mhf_familia FOREIGN KEY (familia_id) REFERENCES lu_familia(id) ON DELETE CASCADE,
  CONSTRAINT fk_mhf_modelo FOREIGN KEY (modelo_componente_id) REFERENCES modelos_componente(id) ON DELETE CASCADE,
  UNIQUE KEY uq_mhf (familia_id, modelo_componente_id, nivel),
  INDEX idx_mhf_familia (familia_id),
  INDEX idx_mhf_modelo (modelo_componente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. consumibles_limpieza_modelo
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS consumibles_limpieza_modelo (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  modelo_componente_id  INT NOT NULL,
  consumible_id         INT NOT NULL,
  cantidad              DECIMAL(10,3) NOT NULL DEFAULT 1,
  unidad                VARCHAR(20) NULL,
  notas                 VARCHAR(255) NULL,
  created_at            DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at            DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_clm_modelo FOREIGN KEY (modelo_componente_id) REFERENCES modelos_componente(id) ON DELETE CASCADE,
  CONSTRAINT fk_clm_consumible FOREIGN KEY (consumible_id) REFERENCES consumible_catalogo(id) ON DELETE CASCADE,
  UNIQUE KEY uq_clm (modelo_componente_id, consumible_id),
  INDEX idx_clm_modelo (modelo_componente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. actividad_preventiva.niveles (CSV de niveles que cubre la actividad)
-- ------------------------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'actividad_preventiva'
     AND column_name = 'niveles') = 0,
  'ALTER TABLE actividad_preventiva
     ADD COLUMN niveles VARCHAR(50) NULL
       COMMENT ''CSV de niveles que cubre la actividad (1, 2_inferior, 2_superior, 3). Vacio = todos los niveles.''',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ==============================================================================
-- Verificacion
-- ==============================================================================
SELECT
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_familia') AS tabla_horas_familia,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema=DATABASE() AND table_name='consumibles_limpieza_modelo') AS tabla_limpieza,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='actividad_preventiva' AND column_name='niveles') AS col_niveles_act;
