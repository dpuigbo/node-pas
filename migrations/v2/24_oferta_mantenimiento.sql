-- ==============================================================================
-- PAS ROBOTICS MANAGE - Schema de mantenimiento + oferta-componente
-- ==============================================================================
-- Anade lo necesario para generar ofertas con mantenimiento por componente:
--
-- 1. Subtipos nuevos en consumible_catalogo (eib, limpieza)
-- 2. Tabla mantenimiento_horas_modelo (horas + coste limpieza por nivel)
-- 3. Campo tipo_bateria_medida en modelos_componente (SMB | EIB)
-- 4. Tabla oferta_componente (M:N con detalle: nivel + opciones)
-- 5. Tipo de oferta: mantenimiento | solo_limpieza
--
-- El coeficiente 15% (aceite total para limpieza/merma) se aplica en el
-- calculo backend, no en BD.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Catalogo: ampliar enum tipo de consumible para incluir 'limpieza'
-- ------------------------------------------------------------------------------
-- 'eib' es subtipo del tipo 'bateria' existente
-- 'limpieza' es un tipo nuevo (extender ENUM)

-- Extender ConsumibleTipo para incluir 'limpieza'
ALTER TABLE consumible_catalogo
  MODIFY COLUMN tipo ENUM(
    'aceite','grasa','bateria','filtro','ventilador','rodamiento',
    'sello','cable','ball_screw','tope_mecanico','tarjeta','desiccant',
    'limpieza','otro'
  ) NOT NULL;

-- Seed inicial de consumibles de limpieza (genericos, sin codigo ABB)
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, fabricante, unidad, notas) VALUES
  ('limpieza', 'pano',         'Trapos / panios de limpieza', NULL, 'ud',  'Para limpieza general durante mantenimiento'),
  ('limpieza', 'desengrasante','Liquido desengrasante',        NULL, 'L',   'Desengrasante industrial estandar'),
  ('limpieza', 'aerosol',      'Aerosol limpiador electrico',  NULL, 'ud',  'Para componentes electricos'),
  ('limpieza', 'guantes',      'Guantes nitrilo',              NULL, 'par', 'Proteccion personal'),
  ('limpieza', 'aspirador',    'Filtro aspirador ESD',         NULL, 'ud',  'Filtro repuesto aspirador ESD-protected');

-- ------------------------------------------------------------------------------
-- 2. tipo_bateria_medida en modelos_componente (mech_unit)
-- ------------------------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'modelos_componente'
     AND column_name = 'tipo_bateria_medida') = 0,
  'ALTER TABLE modelos_componente
     ADD COLUMN tipo_bateria_medida ENUM(''smb'',''eib'') NULL COMMENT ''Solo aplica a mechanical_unit''',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 3. mantenimiento_horas_modelo (horas + coste limpieza por nivel)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS mantenimiento_horas_modelo (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  modelo_componente_id  INT NOT NULL,
  nivel                 VARCHAR(20) NOT NULL COMMENT '1, 2_inferior, 2_superior, 3, completo',
  horas                 DECIMAL(8,2) NULL COMMENT 'Horas de trabajo del mantenimiento',
  coste_limpieza        DECIMAL(10,2) NULL COMMENT 'Coste consumibles de limpieza (€)',
  notas                 VARCHAR(500),
  created_at            DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at            DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_mhm_modelo FOREIGN KEY (modelo_componente_id) REFERENCES modelos_componente(id) ON DELETE CASCADE,
  UNIQUE KEY uq_mhm (modelo_componente_id, nivel),
  INDEX idx_mhm_modelo (modelo_componente_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Oferta: tipo (mantenimiento | solo_limpieza)
-- ------------------------------------------------------------------------------
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'ofertas'
     AND column_name = 'tipo_oferta') = 0,
  'ALTER TABLE ofertas
     ADD COLUMN tipo_oferta ENUM(''mantenimiento'',''solo_limpieza'')
       NOT NULL DEFAULT ''mantenimiento''
       COMMENT ''Mantenimiento incluye aceites/baterias + limpieza; solo_limpieza solo lo segundo''',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ------------------------------------------------------------------------------
-- 5. oferta_componente (detalle por componente del sistema en una oferta)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS oferta_componente (
  id                       INT AUTO_INCREMENT PRIMARY KEY,
  oferta_id                INT NOT NULL,
  componente_sistema_id    INT NOT NULL,
  -- Nivel mantenimiento elegido
  nivel                    VARCHAR(20) NULL COMMENT '1, 2_inferior, 2_superior, 3 (mech_unit) | completo (otros)',
  -- Opciones de cambio
  con_baterias             TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'mech_unit: SMB/EIB; controller/drive: pilas',
  con_aceite               TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'external_axis: cambia aceite si tiene',
  -- Snapshot calculado (campo coste/precio totales para auditoria)
  horas                    DECIMAL(8,2) NULL,
  coste_consumibles        DECIMAL(10,2) NULL,
  precio_consumibles       DECIMAL(10,2) NULL,
  coste_limpieza           DECIMAL(10,2) NULL,
  -- Notas opcionales del operario
  notas                    VARCHAR(500),
  created_at               DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at               DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_oc_oferta FOREIGN KEY (oferta_id) REFERENCES ofertas(id) ON DELETE CASCADE,
  CONSTRAINT fk_oc_comp FOREIGN KEY (componente_sistema_id) REFERENCES componentes_sistema(id) ON DELETE CASCADE,
  UNIQUE KEY uq_oc (oferta_id, componente_sistema_id),
  INDEX idx_oc_oferta (oferta_id),
  INDEX idx_oc_comp (componente_sistema_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ==============================================================================
-- Verificacion
-- ==============================================================================
SELECT
  (SELECT COUNT(*) FROM consumible_catalogo WHERE tipo = 'limpieza') AS consumibles_limpieza,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='modelos_componente' AND column_name='tipo_bateria_medida') AS col_tipo_bateria,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema=DATABASE() AND table_name='mantenimiento_horas_modelo') AS tabla_horas,
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='ofertas' AND column_name='tipo_oferta') AS col_tipo_oferta,
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema=DATABASE() AND table_name='oferta_componente') AS tabla_oferta_componente;
