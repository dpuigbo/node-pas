-- ============================================================
-- Script de limpieza para la base de datos de PRODUCCIÓN
-- (Hostinger — u306143177_admin_db)
--
-- Ejecutar desde phpMyAdmin (pestaña SQL) o cliente mysql.
-- ¡HACER UN BACKUP/EXPORT COMPLETO ANTES DE EJECUTAR!
--
-- Detectado durante la auditoría del dump del 10-06-2026:
--   1. La vista v_lubricacion está ROTA: referencia la columna
--      cc.codigo_abb que fue renombrada a codigo_fabricante.
--   2. Hay 1 planta huérfana de prueba (id=1, nombre='x') que
--      apunta a un cliente_id=1 que ya no existe.
--   3. Falta la FK plantas -> clientes (no se puede crear hasta
--      eliminar la huérfana).
--   4. Hay 10 tablas _backup_* con snapshots de migraciones de
--      mayo 2026 (~1.200 filas) que ya no aportan nada.
--   5. Las vistas usan DEFINER del usuario de Hostinger, lo que
--      las hace no portables (fallan al importar en otra máquina).
-- ============================================================

-- ── 1. Eliminar planta huérfana de prueba ──
DELETE FROM plantas WHERE id = 1 AND nombre = 'x' AND cliente_id = 1;

-- ── 2. Añadir la FK que falta (plantas -> clientes) ──
ALTER TABLE plantas
  ADD CONSTRAINT plantas_cliente_id_fkey
  FOREIGN KEY (cliente_id) REFERENCES clientes (id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ── 3. Arreglar la vista v_lubricacion (columna renombrada) ──
CREATE OR REPLACE VIEW v_lubricacion AS
SELECT
  l.id AS id,
  mc.id AS modelo_componente_id,
  mc.nombre AS modelo_nombre,
  f.id AS familia_id,
  f.codigo AS familia_codigo,
  l.eje AS eje,
  l.consumible_id AS consumible_id,
  cc.nombre AS consumible_nombre,
  cc.tipo AS consumible_tipo,
  cc.subtipo AS consumible_subtipo,
  cc.codigo_fabricante AS codigo_fabricante,
  cc.fabricante AS consumible_fabricante,
  l.cantidad_valor AS cantidad_valor,
  l.cantidad_unidad AS cantidad_unidad,
  l.intervalo_horas AS intervalo_horas,
  l.lifetime AS lifetime,
  l.actividad_documentada AS actividad_documentada,
  l.nivel_id AS nivel_id,
  lnm.codigo AS nivel_codigo,
  lnm.nombre AS nivel_nombre,
  l.montajes_aplicables AS montajes_aplicables,
  l.protecciones_aplicables AS protecciones_aplicables,
  l.controladores_aplicables AS controladores_aplicables,
  l.documento_fuente AS documento_fuente,
  l.pagina_manual AS pagina_manual,
  l.revisado AS revisado,
  l.fecha_revisado AS fecha_revisado,
  l.web_config AS web_config,
  l.notas AS notas
FROM lubricacion l
JOIN modelos_componente mc ON mc.id = l.modelo_componente_id
LEFT JOIN lu_familia f ON f.id = mc.familia_id
LEFT JOIN consumible_catalogo cc ON cc.id = l.consumible_id
LEFT JOIN lu_nivel_mantenimiento lnm ON lnm.id = l.nivel_id;

-- ── 4. Recrear v_actividad_preventiva sin DEFINER (portabilidad) ──
CREATE OR REPLACE VIEW v_actividad_preventiva AS
SELECT
  ap.id AS id,
  ap.tipo_componente_aplicable AS tipo_componente_aplicable,
  ap.tipo_actividad_id AS tipo_actividad_id,
  ap.componente AS componente,
  ap.ejes AS ejes,
  ap.intervalo_horas AS intervalo_horas,
  ap.intervalo_meses AS intervalo_meses,
  ap.intervalo_condicion AS intervalo_condicion,
  ap.nivel_id AS nivel_id,
  ap.obligatoria AS obligatoria,
  ap.familia_id AS familia_id,
  ap.modelos_aplicables AS modelos_aplicables,
  ap.montajes_aplicables AS montajes_aplicables,
  ap.protecciones_aplicables AS protecciones_aplicables,
  ap.controladores_aplicables AS controladores_aplicables,
  ap.documento_fuente AS documento_fuente,
  ap.notas AS notas,
  ap.observaciones AS observaciones,
  ap.revisado AS revisado,
  ap.fecha_revisado AS fecha_revisado,
  ap.orden AS orden,
  ap.created_at AS created_at,
  (SELECT JSON_ARRAYAGG(JSON_OBJECT(
      'consumible_id', ac.consumible_id,
      'codigo_interno', cc.codigo_interno,
      'nombre', cc.nombre,
      'cantidad', ac.cantidad,
      'unidad', ac.unidad,
      'notas', ac.notas))
   FROM actividad_consumible ac
   JOIN consumible_catalogo cc ON cc.id = ac.consumible_id
   WHERE ac.actividad_preventiva_id = ap.id) AS consumibles
FROM actividad_preventiva ap;

-- ── 5. Eliminar tablas de backup obsoletas ──
-- (el export completo previo a ejecutar este script ya las conserva)
DROP TABLE IF EXISTS _backup_actividad_cabinet_2026_05_12;
DROP TABLE IF EXISTS _backup_actividad_drive_module_2026_05_12;
DROP TABLE IF EXISTS _backup_actividad_preventiva_completo_2026_05_08;
DROP TABLE IF EXISTS _backup_actividad_preventiva_paint_crb_2026_05_08;
DROP TABLE IF EXISTS _backup_compatibilidad_eje_permitida_irb_6650s_2026_05_08;
DROP TABLE IF EXISTS _backup_compatibilidad_robot_controlador_2026_05_08;
DROP TABLE IF EXISTS _backup_componentes_sistema_2026_05_08;
DROP TABLE IF EXISTS _backup_lubricacion_paint_crb_2026_05_08;
DROP TABLE IF EXISTS _backup_lu_familia_paint_crb_2026_05_08;
DROP TABLE IF EXISTS _backup_modelos_paint_crb_2026_05_08;
