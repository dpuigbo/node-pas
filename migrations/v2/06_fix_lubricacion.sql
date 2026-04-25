-- ==============================================================================
-- PAS ROBOTICS MANAGE - Fix lubricacion (match por familia)
-- ==============================================================================
-- El script 02 hacia match exacto mc.nombre = lr.variante_trm.
-- El script 04 hacia LIKE %nombre%, pero seguia siendo restrictivo porque
-- variante_trm puede contener multiples variantes:
--   "IRB 7720 -620/2.9,-530/3.1,-560/2.9LID,-480/3.1LID"
--
-- Estrategia: match por FAMILIA. La lubricacion suele aplicar a toda la
-- familia, no a una variante puntual. Para cada lubricacion_reductora
-- cuya variante_trm empieza por una familia, asignar a TODOS los modelos
-- de esa familia que aun no la tengan en lubricacion.
--
-- Idempotente con INSERT IGNORE.
-- ==============================================================================

INSERT IGNORE INTO lubricacion (
  modelo_componente_id, eje, aceite_id,
  cantidad_valor, cantidad_unidad,
  cantidad_texto_legacy, variante_trm_legacy, tipo_lubricante_legacy,
  web_config
)
SELECT
  mc.id,
  lr.eje,
  a.id,
  CAST(NULLIF(REPLACE(REPLACE(REGEXP_REPLACE(lr.cantidad, '[^0-9,.]', ''), ',', '.'), ' ', ''), '') AS DECIMAL(10,3)),
  CASE
    WHEN lr.cantidad LIKE '%ml%' THEN 'ml'
    WHEN lr.cantidad LIKE '%kg%' THEN 'kg'
    WHEN lr.cantidad LIKE '%l%' AND lr.cantidad NOT LIKE '%ml%' THEN 'l'
    WHEN lr.cantidad LIKE '%g%' AND lr.cantidad NOT LIKE '%kg%' THEN 'g'
    WHEN lr.cantidad = 'N/A' OR lr.cantidad IS NULL THEN 'n_a'
    ELSE NULL
  END,
  lr.cantidad,
  lr.variante_trm,
  lr.tipo_lubricante,
  lr.web_config
FROM lubricacion_reductora lr
JOIN modelos_componente mc
  ON mc.fabricante_id = lr.fabricante_id
 AND mc.tipo IN ('mechanical_unit', 'external_axis')
 AND mc.familia IS NOT NULL
 AND (
      -- Familia exacta al inicio + espacio: "IRB 7720 -620..."
      lr.variante_trm LIKE CONCAT(mc.familia, ' %')
      -- Familia exacta al inicio + guion: "IRB 6700-150"
   OR lr.variante_trm LIKE CONCAT(mc.familia, '-%')
      -- Variante exactamente igual a la familia
   OR lr.variante_trm = mc.familia
 )
LEFT JOIN aceite_alias aa ON aa.alias = lr.tipo_lubricante
LEFT JOIN aceites a ON a.id = aa.aceite_id
WHERE NOT EXISTS (
  SELECT 1 FROM lubricacion lub
  WHERE lub.modelo_componente_id = mc.id
    AND lub.eje = lr.eje
);

-- ==============================================================================
-- Verificacion
-- ==============================================================================
SELECT
  (SELECT COUNT(*) FROM lubricacion) AS total_lubricacion,
  (SELECT COUNT(*) FROM lubricacion_reductora) AS total_legacy,
  (SELECT COUNT(DISTINCT modelo_componente_id) FROM lubricacion) AS modelos_con_lub,
  (SELECT COUNT(*) FROM modelos_componente WHERE tipo IN ('mechanical_unit', 'external_axis')) AS total_mecanicos_ejes;

-- Top familias con/sin lubricacion (despues del fix)
SELECT mc.familia, COUNT(DISTINCT mc.id) AS modelos,
  COUNT(DISTINCT CASE WHEN l.id IS NOT NULL THEN mc.id END) AS con_lub,
  COUNT(DISTINCT CASE WHEN l.id IS NULL THEN mc.id END) AS sin_lub
FROM modelos_componente mc
LEFT JOIN lubricacion l ON l.modelo_componente_id = mc.id
WHERE mc.tipo IN ('mechanical_unit', 'external_axis')
  AND mc.familia IS NOT NULL
GROUP BY mc.familia
HAVING sin_lub > 0
ORDER BY sin_lub DESC LIMIT 20;
