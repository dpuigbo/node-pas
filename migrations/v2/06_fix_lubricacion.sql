-- ==============================================================================
-- PAS ROBOTICS MANAGE - Fix lubricacion v2 (con UNIQUE constraint)
-- ==============================================================================
-- Iteracion anterior produjo duplicados (8 lubricaciones por mismo modelo+eje)
-- porque varias filas legacy de la misma familia se asignaban todas.
-- Solucion:
--   1. Vaciar lubricacion (estaba mal poblada)
--   2. Crear UNIQUE constraint (modelo_componente_id, eje) -> max 1 lub por eje
--   3. Re-ejecutar match permisivo: INSERT IGNORE coge la 1a fila que matchee,
--      el resto se descarta. Perdemos info de variantes especificas pero queda
--      una lubricacion por (modelo, eje).
--
-- IMPORTANTE: en lubricacion_reductora SOLO hay robots IRB (mechanical_unit).
-- Los ejes externos (IRBT, IRBP, IRP, IRT 104, MID, MTD, MU) no tienen
-- catalogo de lubricacion - eso es correcto, no es un hueco.
-- ==============================================================================

-- 1. Limpiar
TRUNCATE TABLE lubricacion;

-- 2. UNIQUE constraint (modelo, eje) — solo si no existe
-- MariaDB no soporta IF NOT EXISTS para indices; manejamos error con dynamic SQL
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.statistics
   WHERE table_schema = DATABASE()
     AND table_name = 'lubricacion'
     AND index_name = 'uq_lub_modelo_eje') = 0,
  'ALTER TABLE lubricacion ADD UNIQUE KEY uq_lub_modelo_eje (modelo_componente_id, eje)',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Match permisivo (INSERT IGNORE evita duplicados via UNIQUE)
-- Orden de prioridad: nombre exacto, nombre dentro de variante_trm, familia.
-- INSERT IGNORE coge el primero y descarta el resto.

-- Pase 1: match exacto mc.nombre = variante_trm
INSERT IGNORE INTO lubricacion (
  modelo_componente_id, eje, aceite_id,
  cantidad_valor, cantidad_unidad,
  cantidad_texto_legacy, variante_trm_legacy, tipo_lubricante_legacy,
  web_config
)
SELECT
  mc.id, lr.eje, a.id,
  CAST(NULLIF(REPLACE(REPLACE(REGEXP_REPLACE(lr.cantidad, '[^0-9,.]', ''), ',', '.'), ' ', ''), '') AS DECIMAL(10,3)),
  CASE
    WHEN lr.cantidad LIKE '%ml%' THEN 'ml'
    WHEN lr.cantidad LIKE '%kg%' THEN 'kg'
    WHEN lr.cantidad LIKE '%l%' AND lr.cantidad NOT LIKE '%ml%' THEN 'l'
    WHEN lr.cantidad LIKE '%g%' AND lr.cantidad NOT LIKE '%kg%' THEN 'g'
    WHEN lr.cantidad = 'N/A' OR lr.cantidad IS NULL THEN 'n_a'
    ELSE NULL
  END,
  lr.cantidad, lr.variante_trm, lr.tipo_lubricante, lr.web_config
FROM lubricacion_reductora lr
JOIN modelos_componente mc
  ON mc.fabricante_id = lr.fabricante_id
 AND mc.tipo IN ('mechanical_unit', 'external_axis')
 AND mc.nombre = lr.variante_trm
LEFT JOIN aceite_alias aa ON aa.alias = lr.tipo_lubricante
LEFT JOIN aceites a ON a.id = aa.aceite_id;

-- Pase 2: match nombre del modelo dentro de variante_trm
INSERT IGNORE INTO lubricacion (
  modelo_componente_id, eje, aceite_id,
  cantidad_valor, cantidad_unidad,
  cantidad_texto_legacy, variante_trm_legacy, tipo_lubricante_legacy,
  web_config
)
SELECT
  mc.id, lr.eje, a.id,
  CAST(NULLIF(REPLACE(REPLACE(REGEXP_REPLACE(lr.cantidad, '[^0-9,.]', ''), ',', '.'), ' ', ''), '') AS DECIMAL(10,3)),
  CASE
    WHEN lr.cantidad LIKE '%ml%' THEN 'ml'
    WHEN lr.cantidad LIKE '%kg%' THEN 'kg'
    WHEN lr.cantidad LIKE '%l%' AND lr.cantidad NOT LIKE '%ml%' THEN 'l'
    WHEN lr.cantidad LIKE '%g%' AND lr.cantidad NOT LIKE '%kg%' THEN 'g'
    WHEN lr.cantidad = 'N/A' OR lr.cantidad IS NULL THEN 'n_a'
    ELSE NULL
  END,
  lr.cantidad, lr.variante_trm, lr.tipo_lubricante, lr.web_config
FROM lubricacion_reductora lr
JOIN modelos_componente mc
  ON mc.fabricante_id = lr.fabricante_id
 AND mc.tipo IN ('mechanical_unit', 'external_axis')
 AND mc.nombre IS NOT NULL
 AND lr.variante_trm LIKE CONCAT('%', mc.nombre, '%')
LEFT JOIN aceite_alias aa ON aa.alias = lr.tipo_lubricante
LEFT JOIN aceites a ON a.id = aa.aceite_id;

-- Pase 3: match por familia (cada modelo recibe la 1a lub legacy de su familia)
INSERT IGNORE INTO lubricacion (
  modelo_componente_id, eje, aceite_id,
  cantidad_valor, cantidad_unidad,
  cantidad_texto_legacy, variante_trm_legacy, tipo_lubricante_legacy,
  web_config
)
SELECT
  mc.id, lr.eje, a.id,
  CAST(NULLIF(REPLACE(REPLACE(REGEXP_REPLACE(lr.cantidad, '[^0-9,.]', ''), ',', '.'), ' ', ''), '') AS DECIMAL(10,3)),
  CASE
    WHEN lr.cantidad LIKE '%ml%' THEN 'ml'
    WHEN lr.cantidad LIKE '%kg%' THEN 'kg'
    WHEN lr.cantidad LIKE '%l%' AND lr.cantidad NOT LIKE '%ml%' THEN 'l'
    WHEN lr.cantidad LIKE '%g%' AND lr.cantidad NOT LIKE '%kg%' THEN 'g'
    WHEN lr.cantidad = 'N/A' OR lr.cantidad IS NULL THEN 'n_a'
    ELSE NULL
  END,
  lr.cantidad, lr.variante_trm, lr.tipo_lubricante, lr.web_config
FROM lubricacion_reductora lr
JOIN modelos_componente mc
  ON mc.fabricante_id = lr.fabricante_id
 AND mc.tipo IN ('mechanical_unit', 'external_axis')
 AND mc.familia IS NOT NULL
 AND (
      lr.variante_trm LIKE CONCAT(mc.familia, ' %')
   OR lr.variante_trm LIKE CONCAT(mc.familia, '-%')
   OR lr.variante_trm = mc.familia
 )
LEFT JOIN aceite_alias aa ON aa.alias = lr.tipo_lubricante
LEFT JOIN aceites a ON a.id = aa.aceite_id;

-- ==============================================================================
-- Verificacion
-- ==============================================================================
SELECT
  (SELECT COUNT(*) FROM lubricacion) AS total_lub,
  (SELECT COUNT(DISTINCT modelo_componente_id) FROM lubricacion) AS modelos_con_lub,
  (SELECT COUNT(*) FROM modelos_componente WHERE tipo = 'mechanical_unit') AS robots_total,
  (SELECT MAX(c) FROM (SELECT modelo_componente_id, COUNT(*) AS c FROM lubricacion GROUP BY modelo_componente_id) t) AS max_ejes_por_modelo;

-- Top mecanicos sin lubricacion
SELECT mc.familia, COUNT(*) AS robots_sin_lub
FROM modelos_componente mc
LEFT JOIN lubricacion l ON l.modelo_componente_id = mc.id
WHERE mc.tipo = 'mechanical_unit'
  AND l.id IS NULL
GROUP BY mc.familia
ORDER BY robots_sin_lub DESC LIMIT 15;
