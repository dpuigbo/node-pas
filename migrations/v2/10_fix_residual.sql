-- ==============================================================================
-- PAS ROBOTICS MANAGE - Fix residual: tipo faltante + dedup
-- ==============================================================================
-- 1. Anade tipo 'Lubricación / Inspección' (orden invertido del existente)
-- 2. Migra la 1 fila pendiente de IRB 5350
-- 3. Elimina duplicados creados por script 08 (filas con notas "Variante legacy"
--    cuando ya existe la version base)
-- ==============================================================================

-- 1. Tipo faltante
INSERT IGNORE INTO lu_tipo_actividad (codigo, nombre, categoria, requiere_parada, orden) VALUES
  ('lubricacion_inspeccion_v2', 'Lubricación / Inspección', 'lubricacion', 0, 26);

-- 2. Migrar la fila restante (re-aplicar script 02 logic, INSERT IGNORE
--    no aplica porque no hay UNIQUE; usamos NOT EXISTS)
INSERT INTO actividad_preventiva (
  familia_id, tipo_actividad_id, documento, componente,
  intervalo_horas, intervalo_meses, intervalo_condicion, intervalo_texto_legacy,
  intervalo_foundry_horas, intervalo_foundry_meses, notas
)
SELECT
  f.id, ta.id, am.documento, am.componente,
  CASE
    WHEN am.intervalo_estandar REGEXP 'c?/?[0-9.]+[ ]*h' THEN
      CAST(REPLACE(REGEXP_REPLACE(SUBSTRING_INDEX(am.intervalo_estandar, 'h', 1), '[^0-9]', ''), '.', '') AS UNSIGNED)
    ELSE NULL
  END,
  CASE
    WHEN am.intervalo_estandar LIKE '%mes%' THEN
      CAST(REGEXP_REPLACE(SUBSTRING_INDEX(am.intervalo_estandar, 'mes', 1), '[^0-9]', '') AS UNSIGNED)
    WHEN am.intervalo_estandar LIKE '%año%' THEN
      CAST(REGEXP_REPLACE(SUBSTRING_INDEX(am.intervalo_estandar, 'año', 1), '[^0-9]', '') AS UNSIGNED) * 12
    ELSE NULL
  END,
  CASE
    WHEN am.intervalo_estandar LIKE '%lerta%' THEN 'alerta_baja'
    WHEN am.intervalo_estandar LIKE '%condici%' THEN 'condicion'
    WHEN am.intervalo_estandar = '-' OR am.intervalo_estandar IS NULL THEN 'n_a'
    WHEN am.intervalo_estandar LIKE '%1er%' OR am.intervalo_estandar LIKE '%,%' THEN 'mixto'
    ELSE 'periodico'
  END,
  am.intervalo_estandar, NULL, NULL, am.notas
FROM actividades_mantenimiento am
JOIN lu_familia f ON f.codigo = am.familia_robot AND f.fabricante_id = am.fabricante_id
JOIN lu_tipo_actividad ta ON ta.nombre = am.tipo_actividad
WHERE am.familia_robot = 'IRB 5350'
  AND am.tipo_actividad = 'Lubricación / Inspección'
  AND NOT EXISTS (
    SELECT 1 FROM actividad_preventiva ap
    WHERE ap.familia_id = f.id
      AND ap.componente = am.componente
  );

-- 3. Eliminar duplicados creados por script 08 (notas con "Variante legacy"
--    cuando ya existe la version base)
DELETE ap1 FROM actividad_preventiva ap1
JOIN actividad_preventiva ap2
  ON ap2.familia_id = ap1.familia_id
 AND ap2.componente = ap1.componente
 AND ap2.id < ap1.id
WHERE ap1.notas LIKE '%Variante legacy:%';

-- ==============================================================================
-- Verificacion
-- ==============================================================================
SELECT
  (SELECT COUNT(*) FROM actividad_preventiva) AS total_preventiva,
  (SELECT COUNT(*) FROM actividades_mantenimiento) AS total_legacy,
  (SELECT COUNT(*) FROM actividad_preventiva WHERE intervalo_foundry_horas IS NOT NULL OR intervalo_foundry_meses IS NOT NULL) AS con_foundry;

-- Familias legacy aun sin migrar
SELECT am.familia_robot, am.componente, am.tipo_actividad
FROM actividades_mantenimiento am
LEFT JOIN actividad_preventiva ap
  ON ap.componente = am.componente
 AND ap.familia_id = (SELECT id FROM lu_familia WHERE codigo = am.familia_robot AND fabricante_id = am.fabricante_id LIMIT 1)
WHERE ap.id IS NULL
LIMIT 10;
