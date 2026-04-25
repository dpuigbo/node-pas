-- ==============================================================================
-- PAS ROBOTICS MANAGE - Reset total de tablas catalogo v2
-- ==============================================================================
-- Vacia TODAS las tablas catalogo v2 para re-cargar limpio desde el seed v7.
--
-- PRESERVA:
--   - clientes, plantas, maquinas, sistemas, componentes_sistema
--   - modelos_componente (estructura), aunque resetea FKs familia_id/generacion
--   - aceites, consumibles, consumibles_nivel
--   - usuarios, configuracion_app, document_templates
--   - lubricacion_reductora, actividades_mantenimiento (datos legacy fuente)
--   - compatibilidad_controlador (7605 registros base)
--
-- VACIA:
--   - Todas las tablas creadas en 01_schema_ddl.sql (lookups + business v2)
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Tablas business v2
TRUNCATE TABLE compatibilidad_eje_permitida;
TRUNCATE TABLE compatibilidad_eje_excluye;
TRUNCATE TABLE compatibilidad_eje_controlador;
TRUNCATE TABLE lubricacion;
TRUNCATE TABLE actividad_preventiva;
TRUNCATE TABLE actividad_cabinet;
TRUNCATE TABLE actividad_drive_module;
TRUNCATE TABLE equivalencia_familia;
TRUNCATE TABLE punto_control_generico;
TRUNCATE TABLE modelo_nivel_aplicable;
TRUNCATE TABLE aceite_alias;

-- Lookups
TRUNCATE TABLE lu_familia;
TRUNCATE TABLE lu_generacion_controlador;
TRUNCATE TABLE lu_tipo_actividad;
TRUNCATE TABLE lu_unidad_intervalo;
TRUNCATE TABLE lu_nivel_mantenimiento;

-- Reset FKs en modelos_componente (las repuebla el script 02)
UPDATE modelos_componente
SET familia_id = NULL, generacion_controlador_id = NULL;

-- Reset campos enriquecidos en aceites (los repuebla el script 02)
UPDATE aceites
SET codigo_canonico = NULL,
    categoria = 'otro',
    notas_tecnicas = NULL;

-- Reset notas en compatibilidad_controlador
UPDATE compatibilidad_controlador SET notas = NULL;

SET FOREIGN_KEY_CHECKS = 1;

-- Verificacion (todas las tablas v2 deben estar a 0)
SELECT
  (SELECT COUNT(*) FROM lu_familia) AS familias,
  (SELECT COUNT(*) FROM lu_tipo_actividad) AS tipos,
  (SELECT COUNT(*) FROM lubricacion) AS lub,
  (SELECT COUNT(*) FROM actividad_preventiva) AS prev,
  (SELECT COUNT(*) FROM actividad_cabinet) AS cab,
  (SELECT COUNT(*) FROM actividad_drive_module) AS dm,
  (SELECT COUNT(*) FROM compatibilidad_eje_permitida) AS perm,
  (SELECT COUNT(*) FROM modelos_componente WHERE familia_id IS NULL) AS modelos_sin_fam;
