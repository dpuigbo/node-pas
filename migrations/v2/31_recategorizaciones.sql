-- ==============================================================================
-- 31_recategorizaciones.sql — Recategorizar actividades mal asignadas
-- ==============================================================================
-- a) Crear tipos bateria_smb y bateria_cmos en lu_tipo_actividad
-- b) Reasignar baterias (categoria reemplazo → bateria via nuevos tipos)
-- c) Reasignar 4 cables/arnes (ids 142, 261, 264, 267) a tipo reemplazo
-- d) Cambiar categoria de lu_tipo_actividad id=19 'gearboxes' a lubricacion
-- e) Cambiar categoria de lu_tipo_actividad id=20 'limpieza' a limpieza
-- (id 17 mantenimiento_diario, id 18 mantenimiento_recom, id 22
--  mantenimiento_general, id 12 antioxidante: se mantienen en 'otro')
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- a) Crear tipos de bateria
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO lu_tipo_actividad (codigo, nombre, categoria) VALUES
  ('bateria_smb',  'Cambio batería SMB',           'bateria'),
  ('bateria_cmos', 'Cambio batería CMOS / RTC',    'bateria');

-- Lookup IDs (variables, evita hardcoding por id)
SET @bat_smb_id      := (SELECT id FROM lu_tipo_actividad WHERE codigo = 'bateria_smb'  LIMIT 1);
SET @bat_cmos_id     := (SELECT id FROM lu_tipo_actividad WHERE codigo = 'bateria_cmos' LIMIT 1);
SET @reemplazo_id    := (SELECT id FROM lu_tipo_actividad WHERE codigo = 'reemplazo'    LIMIT 1);

-- Fail-fast: si no se encuentra alguno de los IDs, abortar
SELECT IF(
  @bat_smb_id IS NOT NULL AND @bat_cmos_id IS NOT NULL AND @reemplazo_id IS NOT NULL,
  'OK',
  (SELECT 1/0 AS abort_falta_alguno_de_bat_smb_bat_cmos_o_reemplazo)
) AS check_tipos_existen;

-- ------------------------------------------------------------------------------
-- b) Reasignar baterías. 3 fases con prioridad:
--    1. CMOS / RTC / memory back-up / litio reloj  → bateria_cmos
--    2. SMB / sistema medida (que no fueran CMOS)   → bateria_smb
--    3. Resto en categoria reemplazo con palabra batería/pila  → bateria_smb
-- ------------------------------------------------------------------------------

-- Fase 1: CMOS
UPDATE actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
SET ap.tipo_actividad_id = @bat_cmos_id
WHERE lta.categoria = 'reemplazo'
  AND (
    ap.componente LIKE '%CMOS%'
    OR ap.componente LIKE '%RTC%'
    OR ap.componente LIKE '%memory back%'
    OR ap.componente LIKE '%litio%reloj%'
    OR ap.componente LIKE '%pila%reloj%'
  );

-- Fase 2: SMB / sistema de medida
UPDATE actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
SET ap.tipo_actividad_id = @bat_smb_id
WHERE lta.categoria = 'reemplazo'
  AND (
    ap.componente LIKE '%SMB%'
    OR ap.componente LIKE '%sistema%medida%'
  );

-- Fase 3: resto con palabra batería/pila (default SMB)
UPDATE actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
SET ap.tipo_actividad_id = @bat_smb_id
WHERE lta.categoria = 'reemplazo'
  AND (ap.componente LIKE '%bater%' OR ap.componente LIKE '%pila%')
  AND ap.componente NOT LIKE '%filtro%'
  AND ap.componente NOT LIKE '%correa%'
  AND ap.componente NOT LIKE '%belt%';

-- ------------------------------------------------------------------------------
-- c) Reasignar 4 cables/arneses ids específicos a tipo reemplazo
-- ------------------------------------------------------------------------------
UPDATE actividad_preventiva
SET tipo_actividad_id = @reemplazo_id
WHERE id IN (142, 261, 264, 267)
  AND tipo_actividad_id != @reemplazo_id;

-- ------------------------------------------------------------------------------
-- d) lu_tipo_actividad id=19 'gearboxes' → categoria='lubricacion'
-- ------------------------------------------------------------------------------
UPDATE lu_tipo_actividad
SET categoria = 'lubricacion'
WHERE id = 19 AND categoria != 'lubricacion';

-- ------------------------------------------------------------------------------
-- e) lu_tipo_actividad id=20 'limpieza' → categoria='limpieza'
-- ------------------------------------------------------------------------------
UPDATE lu_tipo_actividad
SET categoria = 'limpieza'
WHERE id = 20 AND categoria != 'limpieza';

-- ==============================================================================
-- Verificación
-- ==============================================================================

SELECT '=== Distribución actividad_preventiva por categoría tras recategorizar ===' AS info;
SELECT lta.categoria, COUNT(*) AS total
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
GROUP BY lta.categoria
ORDER BY total DESC;

SELECT '=== Tipos de batería creados/usados ===' AS info;
SELECT
  lta.codigo, lta.nombre, lta.categoria,
  COUNT(ap.id) AS actividades_asignadas
FROM lu_tipo_actividad lta
LEFT JOIN actividad_preventiva ap ON ap.tipo_actividad_id = lta.id
WHERE lta.codigo IN ('bateria_smb', 'bateria_cmos')
GROUP BY lta.id, lta.codigo, lta.nombre, lta.categoria;

SELECT '=== ids 142, 261, 264, 267 ahora son tipo reemplazo? ===' AS info;
SELECT ap.id, lta.codigo, lta.categoria, ap.componente
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
WHERE ap.id IN (142, 261, 264, 267);

SELECT '=== id=19 gearboxes y id=20 limpieza tras update ===' AS info;
SELECT id, codigo, nombre, categoria
FROM lu_tipo_actividad
WHERE id IN (19, 20);
