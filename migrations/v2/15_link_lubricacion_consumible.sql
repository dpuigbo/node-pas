-- ==============================================================================
-- PAS ROBOTICS MANAGE - Linkar lubricacion a consumible_catalogo
-- ==============================================================================
-- Migra el linking de lubricacion.aceite_id (legacy) a
-- lubricacion.consumible_id (catalogo unificado).
--
-- Estrategia:
--   1. Añadir consumible_id a lubricacion (FK a consumible_catalogo)
--   2. Para cada aceite legacy, buscar match en consumible_catalogo:
--      - Match exacto por nombre
--      - Match por aceite_alias.alias en consumible_catalogo
--      - Match en equivalencias de consumible_catalogo
--   3. Para aceites sin match, INSERT nuevo en consumible_catalogo
--   4. Poblar lubricacion.consumible_id desde aceites legacy
-- ==============================================================================

-- 1. Añadir columna consumible_id a lubricacion (si no existe)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'lubricacion'
     AND column_name = 'consumible_id') = 0,
  'ALTER TABLE lubricacion
     ADD COLUMN consumible_id INT NULL AFTER aceite_id,
     ADD CONSTRAINT fk_lub_consumible FOREIGN KEY (consumible_id) REFERENCES consumible_catalogo(id),
     ADD INDEX idx_lub_consumible (consumible_id)',
  'SELECT 1'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Crear consumible_catalogo entries para aceites legacy sin match
-- Match exacto por nombre primero
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, fabricante, unidad, notas)
SELECT
  CASE
    WHEN LOWER(a.nombre) LIKE '%grasa%' OR LOWER(a.nombre) LIKE '%grease%' OR LOWER(a.nombre) LIKE '%spheerol%' THEN 'grasa'
    WHEN LOWER(a.nombre) LIKE '%harmonic%' THEN 'grasa'
    ELSE 'aceite'
  END AS tipo,
  CASE
    WHEN LOWER(a.nombre) LIKE '%harmonic%' THEN 'harmonic'
    WHEN LOWER(a.nombre) LIKE '%food grade%' OR LOWER(a.nombre) LIKE '%cibus%' OR LOWER(a.nombre) LIKE '%fg-%' THEN 'food_grade'
    WHEN LOWER(a.nombre) LIKE '%foundry%' OR LOWER(a.nombre) LIKE '%retinax%' THEN 'foundry'
    WHEN LOWER(a.nombre) LIKE '%abb%' THEN 'abb_codigo'
    WHEN LOWER(a.nombre) LIKE '%grasa%' OR LOWER(a.nombre) LIKE '%grease%' THEN 'industrial'
    ELSE 'engranaje'
  END AS subtipo,
  a.nombre,
  a.fabricante,
  a.unidad,
  CONCAT('Migrado desde aceite legacy id=', a.id)
FROM aceites a
WHERE NOT EXISTS (
  SELECT 1 FROM consumible_catalogo cc WHERE cc.nombre = a.nombre
);

-- 3. Poblar lubricacion.consumible_id desde aceites legacy
-- 3a. Match exacto aceite.nombre = consumible_catalogo.nombre
UPDATE lubricacion l
JOIN aceites a ON a.id = l.aceite_id
JOIN consumible_catalogo cc ON cc.nombre = a.nombre
SET l.consumible_id = cc.id
WHERE l.consumible_id IS NULL;

-- 3b. Match via aceite_alias → consumible_catalogo equivalencias
UPDATE lubricacion l
JOIN aceites a ON a.id = l.aceite_id
JOIN aceite_alias aa ON aa.aceite_id = a.id
JOIN consumible_catalogo cc ON
  cc.nombre = aa.alias
  OR cc.equivalencias LIKE CONCAT('%', aa.alias, '%')
SET l.consumible_id = cc.id
WHERE l.consumible_id IS NULL;

-- ==============================================================================
-- Verificacion
-- ==============================================================================
SELECT
  (SELECT COUNT(*) FROM lubricacion) AS total_lub,
  (SELECT COUNT(*) FROM lubricacion WHERE consumible_id IS NOT NULL) AS con_consumible,
  (SELECT COUNT(*) FROM lubricacion WHERE consumible_id IS NULL AND aceite_id IS NOT NULL) AS sin_consumible_pero_con_aceite,
  (SELECT COUNT(*) FROM consumible_catalogo) AS catalogo_total;

-- Lubricaciones que no encontraron match
SELECT a.nombre AS aceite_legacy, COUNT(*) AS lubs_huerfanas
FROM lubricacion l
JOIN aceites a ON a.id = l.aceite_id
WHERE l.consumible_id IS NULL
GROUP BY a.nombre
ORDER BY lubs_huerfanas DESC LIMIT 10;
