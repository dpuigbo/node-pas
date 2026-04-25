-- ==============================================================================
-- PAS ROBOTICS MANAGE - Linkar actividades + puntos_control a consumible_catalogo
-- ==============================================================================
-- Fase C-3:
--   1. Tabla M:N actividad_consumible (actividad_preventiva ↔ consumible)
--   2. Tabla M:N actividad_cabinet_consumible (cabinet ↔ consumible)
--   3. Tabla M:N actividad_drive_module_consumible (DM ↔ consumible)
--   4. Anade consumible_id a punto_control_generico (1 punto = 1 consumible típico)
--
-- Las tablas M:N permiten poblar progresivamente: cada actividad puede usar
-- 0..N consumibles con cantidad y unidad. Inicialmente vacias; populables
-- desde la UI o via script futuro que parse el campo "componente".
-- ==============================================================================

CREATE TABLE IF NOT EXISTS actividad_consumible (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  actividad_preventiva_id INT NOT NULL,
  consumible_id           INT NOT NULL,
  cantidad                DECIMAL(10,3) NULL,
  unidad                  VARCHAR(20) NULL,
  notas                   VARCHAR(255) NULL,
  CONSTRAINT fk_actcons_act FOREIGN KEY (actividad_preventiva_id) REFERENCES actividad_preventiva(id) ON DELETE CASCADE,
  CONSTRAINT fk_actcons_cons FOREIGN KEY (consumible_id) REFERENCES consumible_catalogo(id),
  UNIQUE KEY uq_act_cons (actividad_preventiva_id, consumible_id),
  INDEX idx_actcons_act (actividad_preventiva_id),
  INDEX idx_actcons_cons (consumible_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci
  COMMENT 'Consumibles requeridos por cada actividad preventiva';

CREATE TABLE IF NOT EXISTS actividad_cabinet_consumible (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  actividad_cabinet_id    INT NOT NULL,
  consumible_id           INT NOT NULL,
  cantidad                DECIMAL(10,3) NULL,
  unidad                  VARCHAR(20) NULL,
  notas                   VARCHAR(255) NULL,
  CONSTRAINT fk_actcabcons_act FOREIGN KEY (actividad_cabinet_id) REFERENCES actividad_cabinet(id) ON DELETE CASCADE,
  CONSTRAINT fk_actcabcons_cons FOREIGN KEY (consumible_id) REFERENCES consumible_catalogo(id),
  UNIQUE KEY uq_actcab_cons (actividad_cabinet_id, consumible_id),
  INDEX idx_actcabcons_act (actividad_cabinet_id),
  INDEX idx_actcabcons_cons (consumible_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci
  COMMENT 'Consumibles requeridos por actividades de cabinet';

CREATE TABLE IF NOT EXISTS actividad_drive_module_consumible (
  id                          INT AUTO_INCREMENT PRIMARY KEY,
  actividad_drive_module_id   INT NOT NULL,
  consumible_id               INT NOT NULL,
  cantidad                    DECIMAL(10,3) NULL,
  unidad                      VARCHAR(20) NULL,
  notas                       VARCHAR(255) NULL,
  CONSTRAINT fk_actdmcons_act FOREIGN KEY (actividad_drive_module_id) REFERENCES actividad_drive_module(id) ON DELETE CASCADE,
  CONSTRAINT fk_actdmcons_cons FOREIGN KEY (consumible_id) REFERENCES consumible_catalogo(id),
  UNIQUE KEY uq_actdm_cons (actividad_drive_module_id, consumible_id),
  INDEX idx_actdmcons_act (actividad_drive_module_id),
  INDEX idx_actdmcons_cons (consumible_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci
  COMMENT 'Consumibles requeridos por actividades de drive module';

-- punto_control_generico: anade consumible_id (opcional, 1 punto = 1 consumible tipico)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'punto_control_generico'
     AND column_name = 'consumible_id') = 0,
  'ALTER TABLE punto_control_generico
     ADD COLUMN consumible_id INT NULL AFTER notas,
     ADD CONSTRAINT fk_pcg_consumible FOREIGN KEY (consumible_id) REFERENCES consumible_catalogo(id),
     ADD INDEX idx_pcg_consumible (consumible_id)',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Verificacion
SELECT
  'tablas creadas' AS info,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'actividad_consumible') AS act_cons,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'actividad_cabinet_consumible') AS cab_cons,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'actividad_drive_module_consumible') AS dm_cons,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = 'punto_control_generico' AND column_name = 'consumible_id') AS pcg_col;
