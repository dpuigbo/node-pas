-- ==============================================================================
-- PAS ROBOTICS MANAGE - Fix actividad_preventiva legacy con sufijos
-- ==============================================================================
-- 85 filas en actividades_mantenimiento no migraron porque su familia_robot
-- tiene sufijos que no estan en lu_familia:
--   "IRB 4600 FP" (Foundry Plus)
--   "IRB 6600/6650 Type A"
--   "IRB 340 (M2004)"
--   "IRB 1200 Gen2"
--   etc.
--
-- Estrategia: REGEXP word-boundary match para extraer familia base.
-- Sufijo se preserva en el campo notas y, si es FP, en intervalo_foundry_*.
--
-- Idempotente: NOT EXISTS check evita duplicados.
-- ==============================================================================

-- Migracion permisiva: para cada actividad legacy no migrada, busca familia
-- cuyo codigo aparezca al inicio de familia_robot con word-boundary.
INSERT INTO actividad_preventiva (
  familia_id, tipo_actividad_id, documento, componente,
  intervalo_horas, intervalo_meses, intervalo_condicion, intervalo_texto_legacy,
  intervalo_foundry_horas, intervalo_foundry_meses,
  notas
)
SELECT
  f.id, ta.id,
  am.documento, am.componente,
  -- Parseo estandar horas
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
    WHEN am.intervalo_estandar LIKE '%1er%' OR am.intervalo_estandar LIKE '%2do%' OR am.intervalo_estandar LIKE '%,%' THEN 'mixto'
    ELSE 'periodico'
  END,
  am.intervalo_estandar,
  CASE
    WHEN am.intervalo_foundry REGEXP 'c?/?[0-9.]+[ ]*h' THEN
      CAST(REPLACE(REGEXP_REPLACE(SUBSTRING_INDEX(am.intervalo_foundry, 'h', 1), '[^0-9]', ''), '.', '') AS UNSIGNED)
    ELSE NULL
  END,
  CASE
    WHEN am.intervalo_foundry LIKE '%mes%' THEN
      CAST(REGEXP_REPLACE(am.intervalo_foundry, '[^0-9]', '') AS UNSIGNED)
    ELSE NULL
  END,
  -- Notas: original + variante legacy
  TRIM(BOTH '\n' FROM CONCAT_WS(
    '\n',
    am.notas,
    CONCAT('Variante legacy: ', am.familia_robot)
  ))
FROM actividades_mantenimiento am
JOIN lu_familia f
  ON f.fabricante_id = am.fabricante_id
 AND f.tipo IN ('mechanical_unit', 'external_axis')
 AND am.familia_robot REGEXP CONCAT('^', f.codigo, '($|[^0-9A-Za-z])')
JOIN lu_tipo_actividad ta ON (
  ta.nombre = am.tipo_actividad OR
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE(am.tipo_actividad,'ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE(am.tipo_actividad,'á','a'))
)
WHERE NOT EXISTS (
  SELECT 1 FROM actividad_preventiva ap_check
  WHERE ap_check.familia_id = f.id
    AND ap_check.componente = am.componente
    AND ap_check.intervalo_texto_legacy = am.intervalo_estandar
);

-- ==============================================================================
-- Verificacion
-- ==============================================================================
SELECT
  (SELECT COUNT(*) FROM actividad_preventiva) AS total_preventiva,
  (SELECT COUNT(*) FROM actividades_mantenimiento) AS total_legacy;

-- Familias legacy aun sin migrar
SELECT am.familia_robot, COUNT(*) AS filas
FROM actividades_mantenimiento am
LEFT JOIN actividad_preventiva ap
  ON ap.intervalo_texto_legacy = am.intervalo_estandar
 AND ap.componente = am.componente
WHERE ap.id IS NULL
GROUP BY am.familia_robot
ORDER BY filas DESC LIMIT 10;
