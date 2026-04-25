-- ==============================================================================
-- PAS ROBOTICS MANAGE - Fix actividades Foundry (FP) - merge a actividad base
-- ==============================================================================
-- Las actividades legacy con sufijo "FP" o componente "(FP)" son variantes
-- Foundry de actividades existentes. En lugar de duplicar, se mergean en la
-- actividad base poblando intervalo_foundry_horas/meses.
--
-- Casos:
--   1. familia_robot = "IRB XXX FP" → familia base "IRB XXX"
--   2. componente = "X (FP)" cuando familia_robot = base
--
-- El intervalo Foundry viene en am.intervalo_estandar (no en intervalo_foundry).
-- ==============================================================================

-- Caso 1: familia_robot con sufijo " FP" → mergear a actividad base con
--          mismo componente
UPDATE actividad_preventiva ap
JOIN actividades_mantenimiento am
  ON am.componente = ap.componente
JOIN lu_familia f
  ON f.id = ap.familia_id
 AND f.fabricante_id = am.fabricante_id
 AND am.familia_robot REGEXP CONCAT('^', f.codigo, ' FP')
SET
  ap.intervalo_foundry_horas = COALESCE(ap.intervalo_foundry_horas,
    CASE
      WHEN am.intervalo_estandar REGEXP 'c?/?[0-9.]+[ ]*h' THEN
        CAST(REPLACE(REGEXP_REPLACE(SUBSTRING_INDEX(am.intervalo_estandar, 'h', 1), '[^0-9]', ''), '.', '') AS UNSIGNED)
      ELSE NULL
    END),
  ap.intervalo_foundry_meses = COALESCE(ap.intervalo_foundry_meses,
    CASE
      WHEN am.intervalo_estandar LIKE '%mes%' THEN
        CAST(REGEXP_REPLACE(SUBSTRING_INDEX(am.intervalo_estandar, 'mes', 1), '[^0-9]', '') AS UNSIGNED)
      WHEN am.intervalo_estandar LIKE '%año%' THEN
        CAST(REGEXP_REPLACE(SUBSTRING_INDEX(am.intervalo_estandar, 'año', 1), '[^0-9]', '') AS UNSIGNED) * 12
      ELSE NULL
    END),
  ap.notas = TRIM(BOTH '\n' FROM CONCAT_WS('\n',
    ap.notas,
    CONCAT('Foundry Plus: ', IFNULL(am.intervalo_estandar, 'condicion'))
  ));

-- Caso 2: componente con sufijo "(FP)" → mergear a actividad base con
--          componente sin "(FP)"
UPDATE actividad_preventiva ap
JOIN actividades_mantenimiento am
  ON am.componente LIKE CONCAT(ap.componente, ' (FP)')
JOIN lu_familia f
  ON f.id = ap.familia_id
 AND f.fabricante_id = am.fabricante_id
 AND f.codigo = am.familia_robot
SET
  ap.intervalo_foundry_horas = COALESCE(ap.intervalo_foundry_horas,
    CASE
      WHEN am.intervalo_estandar REGEXP 'c?/?[0-9.]+[ ]*h' THEN
        CAST(REPLACE(REGEXP_REPLACE(SUBSTRING_INDEX(am.intervalo_estandar, 'h', 1), '[^0-9]', ''), '.', '') AS UNSIGNED)
      ELSE NULL
    END),
  ap.intervalo_foundry_meses = COALESCE(ap.intervalo_foundry_meses,
    CASE
      WHEN am.intervalo_estandar LIKE '%mes%' THEN
        CAST(REGEXP_REPLACE(SUBSTRING_INDEX(am.intervalo_estandar, 'mes', 1), '[^0-9]', '') AS UNSIGNED)
      ELSE NULL
    END),
  ap.notas = TRIM(BOTH '\n' FROM CONCAT_WS('\n',
    ap.notas,
    CONCAT('Foundry Plus (componente FP): ', IFNULL(am.intervalo_estandar, 'condicion'))
  ));

-- ==============================================================================
-- Verificacion
-- ==============================================================================
SELECT
  (SELECT COUNT(*) FROM actividad_preventiva) AS total_preventiva,
  (SELECT COUNT(*) FROM actividad_preventiva WHERE intervalo_foundry_horas IS NOT NULL OR intervalo_foundry_meses IS NOT NULL) AS con_foundry,
  (SELECT COUNT(*) FROM actividades_mantenimiento) AS total_legacy;

-- Familias legacy aun sin migrar (real, ignora NULL)
SELECT am.familia_robot, COUNT(*) AS filas
FROM actividades_mantenimiento am
LEFT JOIN actividad_preventiva ap
  ON ap.componente = am.componente
 AND (ap.intervalo_texto_legacy = am.intervalo_estandar
      OR (ap.intervalo_texto_legacy IS NULL AND am.intervalo_estandar IS NULL))
WHERE ap.id IS NULL
GROUP BY am.familia_robot
ORDER BY filas DESC LIMIT 10;
