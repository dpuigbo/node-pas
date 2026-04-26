-- ==============================================================================
-- DIAGNOSTICO BLOQUE A — Solo lecturas (no modifica nada)
-- ==============================================================================
-- 12 queries para tomar decisiones antes de aplicar SQL 30 y 31.
-- Ejecutar y enviar output completo.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- A.2 — Mala categorizacion en actividad_preventiva
-- ------------------------------------------------------------------------------

SELECT '=== Q1: lubricacion sin pista de eje en componente ===' AS marker;
SELECT ap.id, f.codigo AS familia, lta.codigo AS tipo, ap.componente
FROM actividad_preventiva ap
JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
WHERE lta.categoria = 'lubricacion'
  AND ap.componente NOT REGEXP '[Ee]je|[Mm]uneca|[Ww]rist|[Aa]xis|[Aa]rticulac|[Jj]oint|[Bb]razo|arm|[Rr]eductor|[Mm]otor|[Ee]ngranaje|aceite|grasa|lubric'
ORDER BY f.codigo, ap.componente
LIMIT 100;

SELECT '=== Q1bis: lubricacion que menciona cables ===' AS marker;
SELECT ap.id, f.codigo AS familia, ap.componente
FROM actividad_preventiva ap
JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
WHERE lta.categoria = 'lubricacion'
  AND (ap.componente LIKE '%cable%' OR ap.componente LIKE '%arn%'
       OR ap.componente LIKE '%harness%' OR ap.componente LIKE '%wiring%'
       OR ap.componente LIKE '%paquete%cable%');

SELECT '=== Q2: palabras de lubricacion pero NO categoria lubricacion ===' AS marker;
SELECT ap.id, f.codigo AS familia, lta.codigo AS tipo, lta.categoria, ap.componente
FROM actividad_preventiva ap
JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
WHERE lta.categoria != 'lubricacion'
  AND (ap.componente LIKE '%aceite%' OR ap.componente LIKE '%grasa%' OR ap.componente LIKE '%lubric%')
ORDER BY ap.componente
LIMIT 100;

SELECT '=== Q3: reemplazo con palabras bateria/correa/filtro/desiccant ===' AS marker;
SELECT ap.id, f.codigo AS familia, lta.codigo AS tipo, lta.categoria, ap.componente
FROM actividad_preventiva ap
JOIN lu_familia f ON f.id = ap.familia_id
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
WHERE lta.categoria = 'reemplazo'
  AND (ap.componente LIKE '%bater%' OR ap.componente LIKE '%pila%' OR ap.componente LIKE '%correa%'
       OR ap.componente LIKE '%belt%' OR ap.componente LIKE '%filtro%' OR ap.componente LIKE '%filter%'
       OR ap.componente LIKE '%desiccant%' OR ap.componente LIKE '%humedad%')
ORDER BY ap.componente
LIMIT 100;

SELECT '=== Q4: distribucion actual por categoria ===' AS marker;
SELECT lta.categoria, COUNT(*) AS total
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
GROUP BY lta.categoria
ORDER BY total DESC;

SELECT '=== Q5: catalogo lu_tipo_actividad ===' AS marker;
SELECT id, codigo, nombre, categoria
FROM lu_tipo_actividad
ORDER BY categoria, nombre;

-- ------------------------------------------------------------------------------
-- A.3 + A.4 — Conteo punto_control_generico
-- ------------------------------------------------------------------------------

SELECT '=== C1: total por categoria en punto_control_generico ===' AS marker;
SELECT categoria, COUNT(*) AS total
FROM punto_control_generico
GROUP BY categoria
ORDER BY total DESC;

SELECT '=== C2: cuantos tienen consumible_id ===' AS marker;
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN consumible_id IS NOT NULL THEN 1 ELSE 0 END) AS con_consumible,
  SUM(CASE WHEN consumible_id IS NULL THEN 1 ELSE 0 END) AS sin_consumible
FROM punto_control_generico;

SELECT '=== C3: distribucion intervalo_texto (top 30) ===' AS marker;
SELECT intervalo_texto, COUNT(*) AS total
FROM punto_control_generico
WHERE intervalo_texto IS NOT NULL
GROUP BY intervalo_texto
ORDER BY total DESC
LIMIT 30;

SELECT '=== C4: muestra de 10 filas ===' AS marker;
SELECT id, categoria, componente,
  LEFT(descripcion_accion, 200) AS descripcion_accion_preview,
  intervalo_texto, condicion, consumible_id, orden
FROM punto_control_generico
ORDER BY id
LIMIT 10;

SELECT '=== C5: tamano descripcion_accion ===' AS marker;
SELECT
  COUNT(*) AS total,
  AVG(CHAR_LENGTH(descripcion_accion)) AS avg_len,
  MAX(CHAR_LENGTH(descripcion_accion)) AS max_len,
  MIN(CHAR_LENGTH(descripcion_accion)) AS min_len
FROM punto_control_generico
WHERE descripcion_accion IS NOT NULL;

-- ------------------------------------------------------------------------------
-- Verificacion estructural — por si hay sorpresas
-- ------------------------------------------------------------------------------

SELECT '=== Estructura: actividad_preventiva tiene campo orden? ===' AS marker;
SELECT COUNT(*) AS tiene_orden
FROM information_schema.columns
WHERE table_schema=DATABASE() AND table_name='actividad_preventiva' AND column_name='orden';

SELECT '=== Estructura: actividad_preventiva tiene tipo_componente_aplicable? ===' AS marker;
SELECT COUNT(*) AS tiene_tipo_componente
FROM information_schema.columns
WHERE table_schema=DATABASE() AND table_name='actividad_preventiva' AND column_name='tipo_componente_aplicable';

SELECT '=== Estructura: familia_id en actividad_preventiva es NULLABLE? ===' AS marker;
SELECT IS_NULLABLE
FROM information_schema.columns
WHERE table_schema=DATABASE() AND table_name='actividad_preventiva' AND column_name='familia_id';
