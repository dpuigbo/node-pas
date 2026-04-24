-- ==============================================================================
-- PAS ROBOTICS MANAGE - Schema v2 (adaptado a BD REAL u306143177_admin_db)
-- ==============================================================================
-- Este fichero preserva TODAS las tablas existentes en tu BD actual:
--   aceites, actividades_mantenimiento, clientes, compatibilidad_controlador,
--   componentes_informe, componentes_sistema, configuracion_app, consumibles,
--   consumibles_nivel, document_templates, fabricantes, informes, intervenciones,
--   intervencion_sistema, lubricacion_reductora, maquinas, modelos_componente,
--   oferta_sistema, ofertas, pedidos_compra, plantas, sistemas, usuarios,
--   versiones_template
--
-- ACCIONES:
--   - NO elimina ninguna tabla existente
--   - CREA tablas de lookup y negocio nuevas (compatibilidad, cabinet, etc.)
--   - ALTERA modelos_componente, aceites con columnas adicionales
--
-- ORDEN DE EJECUCIÓN:
--   1) 01_schema_ddl.sql (este fichero)
--   2) 02_migration.sql
--   3) 03_seed_catalogo.sql
--   4) 04_seed_demo.sql (OPCIONAL, crea cliente "ACME" de demo sin tocar tu "xx")
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. LOOKUPS NUEVOS
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS lu_generacion_controlador (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  codigo          VARCHAR(50) NOT NULL UNIQUE,
  nombre          VARCHAR(100) NOT NULL,
  drive_system    VARCHAR(50),
  anio_desde      SMALLINT,
  anio_hasta      SMALLINT,
  activo          TINYINT(1) NOT NULL DEFAULT 1,
  orden           INT NOT NULL DEFAULT 0,
  notas           TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lu_familia (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  fabricante_id     INT NOT NULL,
  codigo            VARCHAR(80) NOT NULL,
  tipo              ENUM('mechanical_unit','external_axis','controller','drive_unit') NOT NULL,
  descripcion       VARCHAR(255),
  activa            TINYINT(1) NOT NULL DEFAULT 1,
  UNIQUE KEY uq_fam_fab_cod (fabricante_id, codigo, tipo),
  CONSTRAINT fk_familia_fab FOREIGN KEY (fabricante_id) REFERENCES fabricantes(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lu_tipo_actividad (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  codigo            VARCHAR(50) NOT NULL UNIQUE,
  nombre            VARCHAR(100) NOT NULL,
  categoria         ENUM('inspeccion','lubricacion','reemplazo','overhaul','analisis','otro')
                    NOT NULL DEFAULT 'otro',
  requiere_parada   TINYINT(1) NOT NULL DEFAULT 1,
  orden             INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lu_unidad_intervalo (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  codigo            VARCHAR(30) NOT NULL UNIQUE,
  nombre            VARCHAR(50) NOT NULL,
  factor_horas      DECIMAL(12,4),
  orden             INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lu_nivel_mantenimiento (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  codigo            VARCHAR(20) NOT NULL UNIQUE,
  nombre            VARCHAR(50) NOT NULL,
  descripcion       VARCHAR(255),
  orden             INT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 2. ALTERACIONES A TABLAS EXISTENTES
-- ------------------------------------------------------------------------------

-- 2.1 modelos_componente: añadir FK a familia + generacion
-- IMPORTANTE: conservamos `familia` (string), `niveles` (CSV), `aceites_config` (JSON)
--             para no romper el frontend existente.
ALTER TABLE modelos_componente
  ADD COLUMN familia_id INT NULL AFTER familia,
  ADD COLUMN generacion_controlador_id INT NULL AFTER familia_id,
  ADD CONSTRAINT fk_modcomp_familia FOREIGN KEY (familia_id) REFERENCES lu_familia(id),
  ADD CONSTRAINT fk_modcomp_gen FOREIGN KEY (generacion_controlador_id) REFERENCES lu_generacion_controlador(id);

-- 2.2 aceites: añadir codigo canonico, categoria, notas tecnicas
ALTER TABLE aceites
  ADD COLUMN codigo_canonico VARCHAR(100) NULL AFTER nombre,
  ADD COLUMN categoria ENUM('aceite','grasa','food_grade','foundry','harmonic','otro')
    NOT NULL DEFAULT 'otro' AFTER unidad,
  ADD COLUMN notas_tecnicas TEXT AFTER categoria;

ALTER TABLE aceites ADD UNIQUE KEY uq_aceite_cod (codigo_canonico);

-- 2.3 compatibilidad_controlador: añadir nota
ALTER TABLE compatibilidad_controlador
  ADD COLUMN notas VARCHAR(255) NULL;

-- ------------------------------------------------------------------------------
-- 3. COMPATIBILIDAD DE EJES EXTERNOS (tri-via)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS compatibilidad_eje_permitida (
  eje_modelo_id       INT NOT NULL,
  familia_id          INT NOT NULL,
  PRIMARY KEY (eje_modelo_id, familia_id),
  CONSTRAINT fk_cep_eje FOREIGN KEY (eje_modelo_id) REFERENCES modelos_componente(id) ON DELETE CASCADE,
  CONSTRAINT fk_cep_fam FOREIGN KEY (familia_id) REFERENCES lu_familia(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT 'Whitelist: si el eje tiene filas aqui, SOLO estas familias son compatibles';

CREATE TABLE IF NOT EXISTS compatibilidad_eje_excluye (
  eje_modelo_id       INT NOT NULL,
  familia_id          INT NOT NULL,
  PRIMARY KEY (eje_modelo_id, familia_id),
  CONSTRAINT fk_cex_eje FOREIGN KEY (eje_modelo_id) REFERENCES modelos_componente(id) ON DELETE CASCADE,
  CONSTRAINT fk_cex_fam FOREIGN KEY (familia_id) REFERENCES lu_familia(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT 'Blacklist: si el eje tiene filas aqui, TODAS las familias son compatibles excepto estas';

CREATE TABLE IF NOT EXISTS compatibilidad_eje_controlador (
  eje_modelo_id           INT NOT NULL,
  controlador_modelo_id   INT NOT NULL,
  PRIMARY KEY (eje_modelo_id, controlador_modelo_id),
  CONSTRAINT fk_cec_eje FOREIGN KEY (eje_modelo_id) REFERENCES modelos_componente(id) ON DELETE CASCADE,
  CONSTRAINT fk_cec_ctrl FOREIGN KEY (controlador_modelo_id) REFERENCES modelos_componente(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT 'Whitelist de controladores que el eje externo requiere';

-- ------------------------------------------------------------------------------
-- 4. ACEITES - ALIAS DE MATCHING
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS aceite_alias (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  aceite_id       INT NOT NULL,
  alias           VARCHAR(200) NOT NULL,
  UNIQUE KEY uq_alias (alias),
  CONSTRAINT fk_alias_aceite FOREIGN KEY (aceite_id) REFERENCES aceites(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 5. LUBRICACION NORMALIZADA (reemplaza lubricacion_reductora)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS lubricacion (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  modelo_componente_id    INT NOT NULL,
  eje                     VARCHAR(30) NOT NULL,
  aceite_id               INT NULL,
  cantidad_valor          DECIMAL(10,3) NULL,
  cantidad_unidad         ENUM('ml','l','g','kg','pcs','n_a') NULL,
  cantidad_texto_legacy   VARCHAR(100) NULL,
  variante_trm_legacy     VARCHAR(200) NULL,
  tipo_lubricante_legacy  VARCHAR(200) NULL,
  web_config              VARCHAR(100) NULL,
  notas                   TEXT,
  CONSTRAINT fk_lub_modelo FOREIGN KEY (modelo_componente_id) REFERENCES modelos_componente(id) ON DELETE CASCADE,
  CONSTRAINT fk_lub_aceite FOREIGN KEY (aceite_id) REFERENCES aceites(id),
  INDEX idx_lub_modelo (modelo_componente_id),
  INDEX idx_lub_aceite (aceite_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 6. ACTIVIDAD PREVENTIVA NORMALIZADA (reemplaza actividades_mantenimiento)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS actividad_preventiva (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  familia_id              INT NOT NULL,
  tipo_actividad_id       INT NOT NULL,
  documento               VARCHAR(80) NULL,
  componente              VARCHAR(500) NOT NULL,
  intervalo_horas         INT NULL,
  intervalo_meses         SMALLINT NULL,
  intervalo_condicion     ENUM('periodico','condicion','alerta_baja','mixto','n_a') NOT NULL DEFAULT 'periodico',
  intervalo_texto_legacy  VARCHAR(200) NULL,
  intervalo_foundry_horas INT NULL,
  intervalo_foundry_meses SMALLINT NULL,
  notas                   TEXT,
  CONSTRAINT fk_actprev_familia FOREIGN KEY (familia_id) REFERENCES lu_familia(id),
  CONSTRAINT fk_actprev_tipo FOREIGN KEY (tipo_actividad_id) REFERENCES lu_tipo_actividad(id),
  INDEX idx_actprev_familia (familia_id),
  INDEX idx_actprev_tipo (tipo_actividad_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 7. CABINET Y DRIVE MODULE (NUEVAS - datos del Excel v7)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS actividad_cabinet (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  cabinet_modelo_id       INT NOT NULL,
  tipo_actividad_id       INT NOT NULL,
  documento               VARCHAR(80) NULL,
  componente              VARCHAR(500) NOT NULL,
  tipo_cabinet            ENUM('controlador','cabinet_auxiliar') NOT NULL DEFAULT 'controlador',
  generacion_hw           VARCHAR(80) NULL,
  intervalo_horas         INT NULL,
  intervalo_meses         SMALLINT NULL,
  intervalo_condicion     ENUM('periodico','condicion','alerta_baja','mixto','n_a') NOT NULL DEFAULT 'periodico',
  intervalo_texto_legacy  VARCHAR(200) NULL,
  notas                   TEXT,
  CONSTRAINT fk_actcab_cab FOREIGN KEY (cabinet_modelo_id) REFERENCES modelos_componente(id) ON DELETE CASCADE,
  CONSTRAINT fk_actcab_tipo FOREIGN KEY (tipo_actividad_id) REFERENCES lu_tipo_actividad(id),
  INDEX idx_actcab_cab (cabinet_modelo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS actividad_drive_module (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  drive_module_modelo_id  INT NOT NULL,
  controlador_asociado_id INT NOT NULL,
  tipo_actividad_id       INT NOT NULL,
  documento               VARCHAR(80) NULL,
  componente              VARCHAR(500) NOT NULL,
  generacion_hw           VARCHAR(80) NULL,
  intervalo_horas         INT NULL,
  intervalo_meses         SMALLINT NULL,
  intervalo_condicion     ENUM('periodico','condicion','alerta_baja','mixto','n_a') NOT NULL DEFAULT 'periodico',
  intervalo_texto_legacy  VARCHAR(200) NULL,
  notas                   TEXT,
  CONSTRAINT fk_actdm_dm FOREIGN KEY (drive_module_modelo_id) REFERENCES modelos_componente(id) ON DELETE CASCADE,
  CONSTRAINT fk_actdm_ctrl FOREIGN KEY (controlador_asociado_id) REFERENCES modelos_componente(id),
  CONSTRAINT fk_actdm_tipo FOREIGN KEY (tipo_actividad_id) REFERENCES lu_tipo_actividad(id),
  INDEX idx_actdm_dm (drive_module_modelo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 8. EQUIVALENCIAS Y PUNTOS CONTROL
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS equivalencia_familia (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  familia_id        INT NOT NULL,
  tipo_equivalencia ENUM('lubricacion','mantenimiento','hardware','completa') NOT NULL,
  descripcion       VARCHAR(500) NOT NULL,
  fuente_doc        VARCHAR(100) NULL,
  notas             TEXT,
  CONSTRAINT fk_eqv_familia FOREIGN KEY (familia_id) REFERENCES lu_familia(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS punto_control_generico (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  categoria         ENUM('manipulador','controladora','drive_module','cabling','eje_externo','seguridad') NOT NULL,
  componente        VARCHAR(200) NOT NULL,
  descripcion_accion TEXT NOT NULL,
  intervalo_texto   VARCHAR(100) NULL,
  condicion         VARCHAR(200) NULL,
  generacion_aplica VARCHAR(100) NULL,
  notas             TEXT,
  orden             INT NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 9. MODELO x NIVEL (tabla normalizada sincronizada con CSV existente)
-- ------------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS modelo_nivel_aplicable (
  modelo_componente_id    INT NOT NULL,
  nivel_id                INT NOT NULL,
  PRIMARY KEY (modelo_componente_id, nivel_id),
  CONSTRAINT fk_mna_modelo FOREIGN KEY (modelo_componente_id) REFERENCES modelos_componente(id) ON DELETE CASCADE,
  CONSTRAINT fk_mna_nivel  FOREIGN KEY (nivel_id) REFERENCES lu_nivel_mantenimiento(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------------------------
-- 10. VISTAS DE CONVENIENCIA
-- ------------------------------------------------------------------------------

CREATE OR REPLACE VIEW v_eje_compatibilidad AS
SELECT
  mc.id                AS eje_modelo_id,
  mc.nombre            AS eje_nombre,
  f.codigo             AS familia_eje,
  GROUP_CONCAT(DISTINCT fp.codigo ORDER BY fp.codigo SEPARATOR ', ') AS familias_permitidas,
  GROUP_CONCAT(DISTINCT fe.codigo ORDER BY fe.codigo SEPARATOR ', ') AS familias_excluidas,
  GROUP_CONCAT(DISTINCT mcc.nombre ORDER BY mcc.nombre SEPARATOR ', ') AS controladores_requeridos
FROM modelos_componente mc
LEFT JOIN lu_familia f ON f.id = mc.familia_id
LEFT JOIN compatibilidad_eje_permitida cep ON cep.eje_modelo_id = mc.id
LEFT JOIN lu_familia fp ON fp.id = cep.familia_id
LEFT JOIN compatibilidad_eje_excluye cex ON cex.eje_modelo_id = mc.id
LEFT JOIN lu_familia fe ON fe.id = cex.familia_id
LEFT JOIN compatibilidad_eje_controlador cec ON cec.eje_modelo_id = mc.id
LEFT JOIN modelos_componente mcc ON mcc.id = cec.controlador_modelo_id
WHERE mc.tipo = 'external_axis'
GROUP BY mc.id, mc.nombre, f.codigo;

CREATE OR REPLACE VIEW v_lubricacion AS
SELECT
  l.id,
  mc.nombre                    AS modelo_nombre,
  mc.familia                   AS familia_legacy,
  f.codigo                     AS familia,
  l.eje,
  a.nombre                     AS aceite_nombre,
  a.codigo_canonico            AS aceite_codigo,
  a.categoria                  AS aceite_categoria,
  l.cantidad_valor,
  l.cantidad_unidad,
  l.web_config,
  l.notas
FROM lubricacion l
JOIN modelos_componente mc ON mc.id = l.modelo_componente_id
LEFT JOIN lu_familia f ON f.id = mc.familia_id
LEFT JOIN aceites a ON a.id = l.aceite_id;

-- ==============================================================================
SET FOREIGN_KEY_CHECKS = 1;
