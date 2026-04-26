-- ==============================================================================
-- 33_seed_actividad_nivel_v2.sql
-- ==============================================================================
-- Re-ejecuta el seed de actividad_nivel del SQL 28 ampliado para incluir
-- actividades genéricas (familia_id IS NULL AND tipo_componente_aplicable
-- IS NOT NULL).
--
-- Reglas equivalentes a SQL 28 sección 7, pero con OR para el caso genérico:
--   - Particular: f.tipo = 'X'
--   - Genérica:   familia_id IS NULL AND tipo_componente_aplicable IN ('X', 'todos')
--
-- INSERT IGNORE con UNIQUE (actividad_id, nivel_id), por lo que es idempotente
-- y compatible con las filas que ya seedeó SQL 28.
-- ==============================================================================

-- a-1) Manipulador + lubricación → N3 (siempre que aplica a manipulador)
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id, TRUE
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
LEFT JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_nivel_mantenimiento lnm ON lnm.codigo = 'N3'
WHERE lta.categoria = 'lubricacion'
  AND (
    f.tipo = 'mechanical_unit'
    OR (ap.familia_id IS NULL AND ap.tipo_componente_aplicable IN ('mechanical_unit', 'todos'))
  );

-- a-2) Manipulador + lubricación con eje 1-4 → N2_INF
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id, TRUE
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
LEFT JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_nivel_mantenimiento lnm ON lnm.codigo = 'N2_INF'
WHERE lta.categoria = 'lubricacion'
  AND ap.ejes IS NOT NULL
  AND (
    FIND_IN_SET('1', ap.ejes) > 0
    OR FIND_IN_SET('2', ap.ejes) > 0
    OR FIND_IN_SET('3', ap.ejes) > 0
    OR FIND_IN_SET('4', ap.ejes) > 0
  )
  AND (
    f.tipo = 'mechanical_unit'
    OR (ap.familia_id IS NULL AND ap.tipo_componente_aplicable IN ('mechanical_unit', 'todos'))
  );

-- a-3) Manipulador + lubricación con eje 5-6 → N2_SUP
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id, TRUE
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
LEFT JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_nivel_mantenimiento lnm ON lnm.codigo = 'N2_SUP'
WHERE lta.categoria = 'lubricacion'
  AND ap.ejes IS NOT NULL
  AND (FIND_IN_SET('5', ap.ejes) > 0 OR FIND_IN_SET('6', ap.ejes) > 0)
  AND (
    f.tipo = 'mechanical_unit'
    OR (ap.familia_id IS NULL AND ap.tipo_componente_aplicable IN ('mechanical_unit', 'todos'))
  );

-- b) Manipulador + inspeccion/limpieza/analisis → N1, N2_INF, N2_SUP, N3 (todos)
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id, TRUE
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
LEFT JOIN lu_familia f ON f.id = ap.familia_id
CROSS JOIN lu_nivel_mantenimiento lnm
WHERE lta.categoria IN ('inspeccion', 'limpieza', 'analisis')
  AND lnm.codigo IN ('N1', 'N2_INF', 'N2_SUP', 'N3')
  AND (
    f.tipo = 'mechanical_unit'
    OR (ap.familia_id IS NULL AND ap.tipo_componente_aplicable IN ('mechanical_unit', 'todos'))
  );

-- c) Manipulador + extras (bateria/correa/filtro/desiccant/reemplazo/overhaul/otro)
--    → mismos niveles, obligatoria=false
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id, FALSE
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
LEFT JOIN lu_familia f ON f.id = ap.familia_id
CROSS JOIN lu_nivel_mantenimiento lnm
WHERE lta.categoria IN ('bateria', 'correa', 'filtro', 'desiccant', 'reemplazo', 'overhaul', 'otro')
  AND lnm.codigo IN ('N1', 'N2_INF', 'N2_SUP', 'N3')
  AND (
    f.tipo = 'mechanical_unit'
    OR (ap.familia_id IS NULL AND ap.tipo_componente_aplicable IN ('mechanical_unit', 'todos'))
  );

-- d) Controlador → N_CTRL (obligatoria salvo extras)
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id,
  CASE WHEN lta.categoria IN ('bateria','correa','filtro','desiccant','reemplazo','overhaul','otro')
       THEN FALSE ELSE TRUE END
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
LEFT JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_nivel_mantenimiento lnm ON lnm.codigo = 'N_CTRL'
WHERE
  f.tipo = 'controller'
  OR (ap.familia_id IS NULL AND ap.tipo_componente_aplicable IN ('controller', 'todos'));

-- e) Drive Unit → N_DU (obligatoria salvo extras)
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id,
  CASE WHEN lta.categoria IN ('bateria','correa','filtro','desiccant','reemplazo','overhaul','otro')
       THEN FALSE ELSE TRUE END
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
LEFT JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_nivel_mantenimiento lnm ON lnm.codigo = 'N_DU'
WHERE
  f.tipo = 'drive_unit'
  OR (ap.familia_id IS NULL AND ap.tipo_componente_aplicable IN ('drive_unit', 'todos'));

-- f-1) Eje externo + lubricación → N2_EJE
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id, TRUE
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
LEFT JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_nivel_mantenimiento lnm ON lnm.codigo = 'N2_EJE'
WHERE lta.categoria = 'lubricacion'
  AND (
    f.tipo = 'external_axis'
    OR (ap.familia_id IS NULL AND ap.tipo_componente_aplicable IN ('external_axis', 'todos'))
  );

-- f-2) Eje externo + inspeccion/limpieza/analisis → N1_EJE y N2_EJE
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id, TRUE
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
LEFT JOIN lu_familia f ON f.id = ap.familia_id
CROSS JOIN lu_nivel_mantenimiento lnm
WHERE lta.categoria IN ('inspeccion', 'limpieza', 'analisis')
  AND lnm.codigo IN ('N1_EJE', 'N2_EJE')
  AND (
    f.tipo = 'external_axis'
    OR (ap.familia_id IS NULL AND ap.tipo_componente_aplicable IN ('external_axis', 'todos'))
  );

-- f-3) Eje externo + extras → N1_EJE y N2_EJE obligatoria=false
INSERT IGNORE INTO actividad_nivel (actividad_id, nivel_id, obligatoria)
SELECT ap.id, lnm.id, FALSE
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
LEFT JOIN lu_familia f ON f.id = ap.familia_id
CROSS JOIN lu_nivel_mantenimiento lnm
WHERE lta.categoria IN ('bateria', 'correa', 'filtro', 'desiccant', 'reemplazo', 'overhaul', 'otro')
  AND lnm.codigo IN ('N1_EJE', 'N2_EJE')
  AND (
    f.tipo = 'external_axis'
    OR (ap.familia_id IS NULL AND ap.tipo_componente_aplicable IN ('external_axis', 'todos'))
  );

-- ==============================================================================
-- Verificación
-- ==============================================================================

SELECT '=== Total actividad_nivel tras seed v2 ===' AS info;
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN obligatoria = TRUE  THEN 1 ELSE 0 END) AS obligatorias,
  SUM(CASE WHEN obligatoria = FALSE THEN 1 ELSE 0 END) AS extras
FROM actividad_nivel;

SELECT '=== Cuántas actividades genéricas tienen al menos un nivel asignado ===' AS info;
SELECT
  COUNT(DISTINCT ap.id) AS genericas_con_nivel,
  (SELECT COUNT(*) FROM actividad_preventiva WHERE familia_id IS NULL) AS total_genericas
FROM actividad_preventiva ap
JOIN actividad_nivel an ON an.actividad_id = ap.id
WHERE ap.familia_id IS NULL;

SELECT '=== Cuántas actividades particulares (familia) tienen al menos un nivel ===' AS info;
SELECT
  COUNT(DISTINCT ap.id) AS particulares_con_nivel,
  (SELECT COUNT(*) FROM actividad_preventiva WHERE familia_id IS NOT NULL) AS total_particulares
FROM actividad_preventiva ap
JOIN actividad_nivel an ON an.actividad_id = ap.id
WHERE ap.familia_id IS NOT NULL;

SELECT '=== Distribución actividad_nivel por nivel ===' AS info;
SELECT lnm.codigo, COUNT(*) AS total, SUM(CASE WHEN an.obligatoria THEN 1 ELSE 0 END) AS obligatorias
FROM actividad_nivel an
JOIN lu_nivel_mantenimiento lnm ON lnm.id = an.nivel_id
GROUP BY lnm.codigo, lnm.orden
ORDER BY lnm.orden;
