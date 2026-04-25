-- ==============================================================================
-- PAS ROBOTICS MANAGE - Consolidar aceites/consumibles legacy en consumible_catalogo
-- ==============================================================================
-- Prepara la migracion completa al catalogo unificado:
--   1. Anade coste, precio, fabricante_robot a consumible_catalogo
--   2. Anade consumible_id a aceites y consumibles (mapping legacy → catalogo)
--   3. Crea entries en catalogo para consumibles legacy (baterias, general)
--      que aun no existan
--   4. Linka aceites/consumibles legacy → consumible_catalogo
--   5. Pasa coste/precio de legacy → catalogo
-- ==============================================================================

-- 1. Anade campos comerciales a consumible_catalogo
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'consumible_catalogo'
     AND column_name = 'coste') = 0,
  'ALTER TABLE consumible_catalogo
     ADD COLUMN coste DECIMAL(10,2) NULL AFTER apariciones,
     ADD COLUMN precio DECIMAL(10,2) NULL AFTER coste,
     ADD COLUMN fabricante_robot VARCHAR(100) NULL AFTER precio,
     ADD COLUMN ref_original VARCHAR(100) NULL AFTER fabricante_robot,
     ADD COLUMN ref_proveedor VARCHAR(100) NULL AFTER ref_original',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Anade consumible_id a aceites y consumibles (mapping)
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'aceites'
     AND column_name = 'consumible_id') = 0,
  'ALTER TABLE aceites
     ADD COLUMN consumible_id INT NULL,
     ADD CONSTRAINT fk_aceite_cons FOREIGN KEY (consumible_id) REFERENCES consumible_catalogo(id),
     ADD INDEX idx_aceite_cons (consumible_id)',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'consumibles'
     AND column_name = 'consumible_id') = 0,
  'ALTER TABLE consumibles
     ADD COLUMN consumible_id INT NULL,
     ADD CONSTRAINT fk_consu_cons FOREIGN KEY (consumible_id) REFERENCES consumible_catalogo(id),
     ADD INDEX idx_consu_cons (consumible_id)',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 3. Linkar aceites legacy → consumible_catalogo (match por nombre o alias)
UPDATE aceites a
JOIN consumible_catalogo cc ON cc.nombre = a.nombre
SET a.consumible_id = cc.id
WHERE a.consumible_id IS NULL;

UPDATE aceites a
JOIN aceite_alias aa ON aa.aceite_id = a.id
JOIN consumible_catalogo cc
  ON cc.nombre = aa.alias OR cc.equivalencias LIKE CONCAT('%', aa.alias, '%')
SET a.consumible_id = cc.id
WHERE a.consumible_id IS NULL;

-- 4. Pasar coste/precio/fabricante_robot de aceites legacy → catalogo
UPDATE consumible_catalogo cc
JOIN aceites a ON a.consumible_id = cc.id
SET
  cc.coste = COALESCE(cc.coste, a.coste),
  cc.precio = COALESCE(cc.precio, a.precio),
  cc.fabricante_robot = COALESCE(cc.fabricante_robot, a.fabricante_robot)
WHERE a.coste IS NOT NULL OR a.precio IS NOT NULL OR a.fabricante_robot IS NOT NULL;

-- 5. Crear entries en catalogo para consumibles legacy que NO esten ahi
INSERT IGNORE INTO consumible_catalogo (
  tipo, subtipo, nombre, fabricante, unidad,
  coste, precio, fabricante_robot, ref_original, ref_proveedor, notas
)
SELECT
  CASE
    WHEN c.tipo = 'bateria' THEN 'bateria'
    ELSE 'otro'
  END,
  CASE
    WHEN c.tipo = 'bateria' AND LOWER(c.nombre) LIKE '%nicd%' THEN 'smb_nicd'
    WHEN c.tipo = 'bateria' AND LOWER(c.nombre) LIKE '%litio%' THEN 'smb_litio'
    WHEN c.tipo = 'bateria' AND LOWER(c.nombre) LIKE '%cmos%' THEN 'cmos_rtc'
    WHEN c.tipo = 'bateria' THEN 'smb'
    ELSE c.tipo
  END,
  c.nombre,
  c.fabricante,
  NULL,
  c.coste,
  c.precio,
  c.fabricante_robot,
  c.ref_original,
  c.ref_proveedor,
  CONCAT('Migrado desde consumible legacy id=', c.id,
         IFNULL(CONCAT('. ', c.denominacion), ''))
FROM consumibles c
WHERE NOT EXISTS (
  SELECT 1 FROM consumible_catalogo cc WHERE cc.nombre = c.nombre
);

-- 6. Linkar consumibles legacy → catalogo
UPDATE consumibles c
JOIN consumible_catalogo cc ON cc.nombre = c.nombre
SET c.consumible_id = cc.id
WHERE c.consumible_id IS NULL;

-- ==============================================================================
-- Verificacion
-- ==============================================================================
SELECT
  (SELECT COUNT(*) FROM consumible_catalogo) AS catalogo,
  (SELECT COUNT(*) FROM consumible_catalogo WHERE coste IS NOT NULL OR precio IS NOT NULL) AS con_precio,
  (SELECT COUNT(*) FROM aceites) AS aceites_legacy,
  (SELECT COUNT(*) FROM aceites WHERE consumible_id IS NOT NULL) AS aceites_linkados,
  (SELECT COUNT(*) FROM aceites WHERE consumible_id IS NULL) AS aceites_huerfanos,
  (SELECT COUNT(*) FROM consumibles) AS consumibles_legacy,
  (SELECT COUNT(*) FROM consumibles WHERE consumible_id IS NOT NULL) AS consu_linkados,
  (SELECT COUNT(*) FROM consumibles WHERE consumible_id IS NULL) AS consu_huerfanos;

-- Aceites no linkados (huerfanos)
SELECT a.id, a.nombre FROM aceites a WHERE a.consumible_id IS NULL LIMIT 20;
