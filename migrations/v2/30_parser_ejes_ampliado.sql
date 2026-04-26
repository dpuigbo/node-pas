-- ==============================================================================
-- 30_parser_ejes_ampliado.sql — Parser ampliado de ejes en actividad_preventiva
-- ==============================================================================
-- Aplica patrones adicionales SOLO a filas con ejes IS NULL y categoria
-- 'lubricacion'. Re-ejecutable. Reporta al final las que siguen sin parsear.
-- ==============================================================================

UPDATE actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
SET ap.ejes = CASE
  -- Listas con "y" / coma+y
  WHEN ap.componente REGEXP '[Ee]jes?[[:space:]]+1[[:space:]]+y[[:space:]]+2'                THEN '1,2'
  WHEN ap.componente REGEXP '[Ee]jes?[[:space:]]+3[[:space:]]+y[[:space:]]+4'                THEN '3,4'
  WHEN ap.componente REGEXP '[Ee]jes?[[:space:]]+5[[:space:]]+y[[:space:]]+6'                THEN '5,6'
  WHEN ap.componente REGEXP '[Ee]jes?[[:space:]]+1,[[:space:]]*2,[[:space:]]*3[[:space:]]+y[[:space:]]+4' THEN '1,2,3,4'
  WHEN ap.componente REGEXP '[Ee]jes?[[:space:]]+1,[[:space:]]*2[[:space:]]+y[[:space:]]+3'  THEN '1,2,3'
  WHEN ap.componente REGEXP '[Ee]jes?[[:space:]]+4,[[:space:]]*5[[:space:]]+y[[:space:]]+6'  THEN '4,5,6'
  WHEN ap.componente REGEXP '[Ee]jes?[[:space:]]+1,[[:space:]]*2,[[:space:]]*3,[[:space:]]*4' THEN '1,2,3,4'
  WHEN ap.componente REGEXP '[Ee]jes?[[:space:]]+5,[[:space:]]*6'                            THEN '5,6'

  -- Articulación / Joint (semantica equivalente a Eje en ABB)
  WHEN ap.componente REGEXP '[Aa]rticulaci[oó]n[[:space:]]+1([^0-9]|$)'                      THEN '1'
  WHEN ap.componente REGEXP '[Aa]rticulaci[oó]n[[:space:]]+2([^0-9]|$)'                      THEN '2'
  WHEN ap.componente REGEXP '[Aa]rticulaci[oó]n[[:space:]]+3([^0-9]|$)'                      THEN '3'
  WHEN ap.componente REGEXP '[Aa]rticulaci[oó]n[[:space:]]+4([^0-9]|$)'                      THEN '4'
  WHEN ap.componente REGEXP '[Aa]rticulaci[oó]n[[:space:]]+5([^0-9]|$)'                      THEN '5'
  WHEN ap.componente REGEXP '[Aa]rticulaci[oó]n[[:space:]]+6([^0-9]|$)'                      THEN '6'
  WHEN ap.componente REGEXP '[Jj]oint[[:space:]]+1([^0-9]|$)'                                THEN '1'
  WHEN ap.componente REGEXP '[Jj]oint[[:space:]]+2([^0-9]|$)'                                THEN '2'
  WHEN ap.componente REGEXP '[Jj]oint[[:space:]]+3([^0-9]|$)'                                THEN '3'
  WHEN ap.componente REGEXP '[Jj]oint[[:space:]]+4([^0-9]|$)'                                THEN '4'
  WHEN ap.componente REGEXP '[Jj]oint[[:space:]]+5([^0-9]|$)'                                THEN '5'
  WHEN ap.componente REGEXP '[Jj]oint[[:space:]]+6([^0-9]|$)'                                THEN '6'

  -- Axis / Axes (inglés)
  WHEN ap.componente REGEXP '[Aa]xes?[[:space:]]*1[[:space:]]*-[[:space:]]*4'                THEN '1,2,3,4'
  WHEN ap.componente REGEXP '[Aa]xes?[[:space:]]*5[[:space:]]*-[[:space:]]*6'                THEN '5,6'
  WHEN ap.componente REGEXP '[Aa]xis[[:space:]]+1([^0-9]|$)'                                 THEN '1'
  WHEN ap.componente REGEXP '[Aa]xis[[:space:]]+2([^0-9]|$)'                                 THEN '2'
  WHEN ap.componente REGEXP '[Aa]xis[[:space:]]+3([^0-9]|$)'                                 THEN '3'
  WHEN ap.componente REGEXP '[Aa]xis[[:space:]]+4([^0-9]|$)'                                 THEN '4'
  WHEN ap.componente REGEXP '[Aa]xis[[:space:]]+5([^0-9]|$)'                                 THEN '5'
  WHEN ap.componente REGEXP '[Aa]xis[[:space:]]+6([^0-9]|$)'                                 THEN '6'

  -- Brazo / Arm (mapeo geométrico ABB típico)
  WHEN ap.componente REGEXP '[Bb]razo[[:space:]]+inferior|[Ll]ower[[:space:]]+arm'           THEN '1,2,3,4'
  WHEN ap.componente REGEXP '[Bb]razo[[:space:]]+superior|[Uu]pper[[:space:]]+arm'           THEN '5,6'

  -- Reductor / Caja reductora / Engranaje del eje N
  WHEN ap.componente REGEXP '([Rr]eductor[a-z]*|[Cc]aja[[:space:]]+reductora|[Ee]ngranaje)[a-z[:space:]]*[Ee]je[[:space:]]+1' THEN '1'
  WHEN ap.componente REGEXP '([Rr]eductor[a-z]*|[Cc]aja[[:space:]]+reductora|[Ee]ngranaje)[a-z[:space:]]*[Ee]je[[:space:]]+2' THEN '2'
  WHEN ap.componente REGEXP '([Rr]eductor[a-z]*|[Cc]aja[[:space:]]+reductora|[Ee]ngranaje)[a-z[:space:]]*[Ee]je[[:space:]]+3' THEN '3'
  WHEN ap.componente REGEXP '([Rr]eductor[a-z]*|[Cc]aja[[:space:]]+reductora|[Ee]ngranaje)[a-z[:space:]]*[Ee]je[[:space:]]+4' THEN '4'
  WHEN ap.componente REGEXP '([Rr]eductor[a-z]*|[Cc]aja[[:space:]]+reductora|[Ee]ngranaje)[a-z[:space:]]*[Ee]je[[:space:]]+5' THEN '5'
  WHEN ap.componente REGEXP '([Rr]eductor[a-z]*|[Cc]aja[[:space:]]+reductora|[Ee]ngranaje)[a-z[:space:]]*[Ee]je[[:space:]]+6' THEN '6'

  -- Engrase / Lubricación general → todos los ejes
  WHEN ap.componente REGEXP '[Ee]ngrase[[:space:]]+general'                                  THEN '1,2,3,4,5,6'
  WHEN ap.componente REGEXP '[Ll]ubricaci[oó]n[[:space:]]+general'                           THEN '1,2,3,4,5,6'

  -- Dispositivo de equilibrado / balancing unit (típico eje 2)
  WHEN ap.componente REGEXP '[Rr]odamiento.*[Dd]isp\\.[[:space:]]+equilibrado'               THEN '2'
  WHEN ap.componente REGEXP '[Rr]odamiento.*equilibrado.*pist'                               THEN '2'
  WHEN ap.componente REGEXP '[Rr]odamiento.*equilibrado'                                     THEN '2'
  WHEN ap.componente REGEXP '[Bb]rackets?[[:space:]]+resorte[[:space:]]+equilibrado'         THEN '2'
  WHEN ap.componente REGEXP '[Bb]alancing[[:space:]]+unit'                                   THEN '2'

  -- Ball screw spline / Unidad husillo bolas (ejes 3-4 típico)
  WHEN ap.componente REGEXP '[Bb]all[[:space:]]+screw[[:space:]]+spline.*[Ee]jes?[[:space:]]*3[[:space:]]*[-][[:space:]]*4' THEN '3,4'
  WHEN ap.componente REGEXP '[Uu]nidad[[:space:]]+husillo[[:space:]]+bolas'                  THEN '3,4'

  ELSE ap.ejes  -- conservar valor actual (NULL pasa NULL)
END
WHERE ap.ejes IS NULL
  AND lta.categoria = 'lubricacion';

-- Reporte: actividades de lubricación que siguen sin ejes (revisar manualmente)
SELECT '=== Pendientes de revisión manual (ejes IS NULL) ===' AS info;
SELECT
  ap.id,
  f.codigo AS familia,
  ap.componente
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
LEFT JOIN lu_familia f ON f.id = ap.familia_id
WHERE lta.categoria = 'lubricacion' AND ap.ejes IS NULL
ORDER BY f.codigo, ap.componente;

-- Conteo final
SELECT
  COUNT(*) AS total_lubricacion,
  SUM(CASE WHEN ejes IS NOT NULL THEN 1 ELSE 0 END) AS con_ejes,
  SUM(CASE WHEN ejes IS NULL THEN 1 ELSE 0 END) AS sin_ejes
FROM actividad_preventiva ap
JOIN lu_tipo_actividad lta ON lta.id = ap.tipo_actividad_id
WHERE lta.categoria = 'lubricacion';
