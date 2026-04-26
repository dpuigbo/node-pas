-- ==============================================================================
-- 34_parser_ejes_v2.sql — Parser de ejes ampliado v2
-- ==============================================================================
-- Cubre patrones que el SQL 30 no pillaba (todos basados en el listado real
-- de las 68 actividades pendientes):
--   - "Reductoras" en plural con espacio + "ejes 1-3" / "ejes 1, 2, 3" / "ejes 4-5"
--   - "Reductoras ejes 1, 2, 3, 6" (4 numeros con comas)
--   - "Reductoras ejes 2, 3, 6"
--   - "Reductoras ejes 1, 2, 3 y trolley" (IRB 5350: el "y trolley" se ignora)
--   - "Gearboxes ejes 1 y 6" / "Gearboxes ejes 2 y 3" / "Gearboxes ejes 4 y 5"
--   - "Ejes 1,2,3" / "Ejes 4,5" sin espacio entre coma (con o sin sufijo)
--   - "Ejes 1,2,3,6" sin espacios
--   - "Ejes 1, 2, 3 (gearboxes con GRASA)" con sufijo entre paréntesis
--   - "Muñeca (ejes 4-6)"
--
-- Aplica SOLO a filas con ejes IS NULL y categoria = 'lubricacion'.
-- Idempotente: re-ejecutar no afecta filas ya parseadas.
-- ==============================================================================

UPDATE actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
SET ap.ejes = CASE
  -- ============================================================
  -- Reductoras con coma — listas mas largas primero (mas especificas)
  -- ============================================================
  WHEN ap.componente REGEXP '[Rr]eductoras?[[:space:]]+ejes?[[:space:]]+1,[[:space:]]*2,[[:space:]]*3,[[:space:]]*6' THEN '1,2,3,6'
  WHEN ap.componente REGEXP '[Rr]eductoras?[[:space:]]+ejes?[[:space:]]+2,[[:space:]]*3,[[:space:]]*6'              THEN '2,3,6'
  WHEN ap.componente REGEXP '[Rr]eductoras?[[:space:]]+ejes?[[:space:]]+1,[[:space:]]*2,[[:space:]]*3'              THEN '1,2,3'
  WHEN ap.componente REGEXP '[Rr]eductoras?[[:space:]]+ejes?[[:space:]]+4,[[:space:]]*5,[[:space:]]*6'              THEN '4,5,6'
  WHEN ap.componente REGEXP '[Rr]eductoras?[[:space:]]+ejes?[[:space:]]+4,[[:space:]]*5'                            THEN '4,5'

  -- Reductoras con guion (rangos)
  WHEN ap.componente REGEXP '[Rr]eductoras?[[:space:]]+ejes?[[:space:]]*1[[:space:]]*-[[:space:]]*3'                THEN '1,2,3'
  WHEN ap.componente REGEXP '[Rr]eductoras?[[:space:]]+ejes?[[:space:]]*4[[:space:]]*-[[:space:]]*6'                THEN '4,5,6'
  WHEN ap.componente REGEXP '[Rr]eductoras?[[:space:]]+ejes?[[:space:]]*4[[:space:]]*-[[:space:]]*5'                THEN '4,5'
  WHEN ap.componente REGEXP '[Rr]eductoras?[[:space:]]+ejes?[[:space:]]*2[[:space:]]*-[[:space:]]*3'                THEN '2,3'

  -- Reductoras con "y" (literal)
  WHEN ap.componente REGEXP '[Rr]eductoras?[[:space:]]+ejes?[[:space:]]+2[[:space:]]+y[[:space:]]+3'                THEN '2,3'

  -- ============================================================
  -- Gearboxes
  -- ============================================================
  WHEN ap.componente REGEXP '[Gg]earboxes?[[:space:]]+ejes?[[:space:]]*1[[:space:]]*-[[:space:]]*3'                 THEN '1,2,3'
  WHEN ap.componente REGEXP '[Gg]earboxes?[[:space:]]+ejes?[[:space:]]*4[[:space:]]*-[[:space:]]*6'                 THEN '4,5,6'
  WHEN ap.componente REGEXP '[Gg]earboxes?[[:space:]]+ejes?[[:space:]]+1[[:space:]]+y[[:space:]]+6'                 THEN '1,6'
  WHEN ap.componente REGEXP '[Gg]earboxes?[[:space:]]+ejes?[[:space:]]+2[[:space:]]+y[[:space:]]+3'                 THEN '2,3'
  WHEN ap.componente REGEXP '[Gg]earboxes?[[:space:]]+ejes?[[:space:]]+4[[:space:]]+y[[:space:]]+5'                 THEN '4,5'

  -- ============================================================
  -- "Ejes" al inicio (sin Reductoras/Gearboxes delante)
  -- ============================================================
  -- Con coma+espacio "1, 2, 3" — listas largas primero
  WHEN ap.componente REGEXP '^[Ee]jes?[[:space:]]+1,[[:space:]]+2,[[:space:]]+3,[[:space:]]+6'                       THEN '1,2,3,6'
  WHEN ap.componente REGEXP '^[Ee]jes?[[:space:]]+1,[[:space:]]+2,[[:space:]]+3([^0-9]|$)'                           THEN '1,2,3'
  WHEN ap.componente REGEXP '^[Ee]jes?[[:space:]]+4,[[:space:]]+5,[[:space:]]+6'                                     THEN '4,5,6'
  WHEN ap.componente REGEXP '^[Ee]jes?[[:space:]]+4,[[:space:]]+5([^0-9]|$)'                                         THEN '4,5'

  -- Con coma sin espacio "1,2,3" — listas largas primero
  WHEN ap.componente REGEXP '^[Ee]jes?[[:space:]]+1,2,3,6'                                                            THEN '1,2,3,6'
  WHEN ap.componente REGEXP '^[Ee]jes?[[:space:]]+1,2,3([^0-9]|$)'                                                    THEN '1,2,3'
  WHEN ap.componente REGEXP '^[Ee]jes?[[:space:]]+4,5,6'                                                              THEN '4,5,6'
  WHEN ap.componente REGEXP '^[Ee]jes?[[:space:]]+4,5([^0-9]|$)'                                                      THEN '4,5'

  -- ============================================================
  -- Muñeca con ejes
  -- ============================================================
  WHEN ap.componente REGEXP '[Mm]u[ñn]eca.*[Ee]jes?[[:space:]]*4[[:space:]]*-[[:space:]]*6'                          THEN '4,5,6'

  ELSE ap.ejes
END
WHERE ap.ejes IS NULL
  AND lta.categoria = 'lubricacion';

-- ==============================================================================
-- Verificación
-- ==============================================================================

SELECT '=== Pendientes finales (ambiguos para revisión manual desde UI) ===' AS info;
SELECT
  ap.id,
  f.codigo AS familia,
  ap.componente
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
LEFT JOIN lu_familia f ON f.id = ap.familia_id
WHERE lta.categoria = 'lubricacion' AND ap.ejes IS NULL
ORDER BY f.codigo, ap.componente;

SELECT '=== Conteo final lubricación con/sin ejes ===' AS info;
SELECT
  COUNT(*) AS total_lubricacion,
  SUM(CASE WHEN ejes IS NOT NULL THEN 1 ELSE 0 END) AS con_ejes,
  SUM(CASE WHEN ejes IS NULL THEN 1 ELSE 0 END) AS sin_ejes
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
WHERE lta.categoria = 'lubricacion';
