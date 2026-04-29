-- ==============================================================================
-- 34b_limpieza_aceites.sql — Limpieza de duplicados en tabla aceites
-- ==============================================================================
-- Objetivo: reducir 49 entradas a ~26 unificando duplicados.
-- Migra FKs de duplicados → canónico, y borra los duplicados.
-- Idempotente: re-ejecutable sin efecto si ya está limpio.
--
-- FKs afectadas (verificadas vía SHOW CREATE TABLE):
--   - lubricacion.aceite_id      → fk_lub_aceite (NULLABLE, RESTRICT)
--   - aceite_alias.aceite_id     → fk_alias_aceite (NOT NULL, ON DELETE CASCADE)
--
-- Decisiones cerradas:
--   - 23 duplicados eliminados (mapping detallado abajo)
--   - id 46, 47 (Reemplazo, no son aceites): migrar a aceite_id=NULL en lubricacion
--                                            y borrar aliases
--   - id 14 (ESSO Beacon EP 2): cambiar categoria de 'otro' a 'grasa'
--   - id 50 + 51 (placeholders SIN aceite): unificar en id 50, borrar 51
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Mapping de duplicados → canónicos (tabla temporal re-ejecutable)
-- ------------------------------------------------------------------------------
DROP TEMPORARY TABLE IF EXISTS _aceites_remap;
CREATE TEMPORARY TABLE _aceites_remap (
  aceite_id_borrar  INT NOT NULL,
  aceite_id_destino INT NULL,
  motivo            VARCHAR(120)
);

INSERT INTO _aceites_remap VALUES
  -- Kyodo TMO 150 (canónico 29)
  (58, 29, 'duplicado de Kyodo TMO 150'),
  (59, 29, 'duplicado de Kyodo TMO 150'),
  -- Mobilgear 600 XP 320 (canónico 37)
  (34, 37, 'duplicado Mobilgear 600 XP 320'),
  (36, 37, 'duplicado Mobilgear 600 XP 320'),
  (38, 37, 'duplicado Mobilgear 600 XP 320'),
  (39, 37, 'duplicado Mobilgear 600 XP 320'),
  -- Optimol Optigear BM 100 (canónico 40)
  (41, 40, 'duplicado Optimol BM 100'),
  (42, 40, 'duplicado Optimol BM 100'),
  (43, 40, 'duplicado Optimol BM 100'),
  (44, 40, 'duplicado Optimol BM 100'),
  -- Shell Omala S4 WE 150 (canónico 53)
  (54, 53, 'Shell Tivela S150 = Shell Omala S4 WE 150'),
  -- Aceite ABB 1171 2016-604 (canónico 12)
  (11, 12, 'duplicado ABB 1171 2016-604'),
  -- Optimol Longtime PD 0 (canónico 18)
  (19, 18, 'duplicado Optimol Longtime PD 0'),
  -- Grasa líquida ABB 1171 4016-611 (canónico 22)
  (21, 22, 'duplicado Grasa liquida ABB 1171 4016-611'),
  -- Harmonic Grease 4B No.2 (canónico 23)
  (24, 23, 'duplicado Harmonic 4B No.2'),
  (26, 23, 'duplicado Harmonic 4B No.2'),
  -- Mobil Glygoyl 460 (canónico 32)
  (33, 32, 'duplicado Mobil Glygoyl 460'),
  -- SHC Cibus 220 (canónico 48)
  (35, 48, 'duplicado SHC Cibus 220'),
  (49, 48, 'duplicado SHC Cibus 220'),
  -- THK AFA Grease (canónico 55)
  (56, 55, 'duplicado THK AFA Grease'),
  -- "Reemplazo c/Xm o Yh" (NO son aceites, migrar a NULL)
  (46, NULL, 'NO es aceite, era texto de intervalo'),
  (47, NULL, 'NO es aceite, era texto de intervalo'),
  -- SIN aceite/grasa (canónico 50)
  (51, 50, 'unificar SIN aceite/grasa en SIN aceite');

-- ------------------------------------------------------------------------------
-- 2. Migración de FKs en lubricacion (los 46/47 van a NULL)
-- ------------------------------------------------------------------------------
UPDATE lubricacion l
JOIN _aceites_remap r ON r.aceite_id_borrar = l.aceite_id
SET l.aceite_id = r.aceite_id_destino;

SELECT 'lubricacion_huerfanas' AS check_, COUNT(*) AS filas
FROM lubricacion l
JOIN _aceites_remap r ON r.aceite_id_borrar = l.aceite_id;
-- Esperado: 0

-- ------------------------------------------------------------------------------
-- 3. Migración de aceite_alias (los 46/47 se BORRAN, NOT NULL no permite update)
-- ------------------------------------------------------------------------------
UPDATE aceite_alias a
JOIN _aceites_remap r ON r.aceite_id_borrar = a.aceite_id
SET a.aceite_id = r.aceite_id_destino
WHERE r.aceite_id_destino IS NOT NULL;

DELETE a
FROM aceite_alias a
JOIN _aceites_remap r ON r.aceite_id_borrar = a.aceite_id
WHERE r.aceite_id_destino IS NULL;

SELECT 'aliases_huerfanos' AS check_, COUNT(*) AS filas
FROM aceite_alias a
JOIN _aceites_remap r ON r.aceite_id_borrar = a.aceite_id;
-- Esperado: 0

-- ------------------------------------------------------------------------------
-- 4. Preservar nombres como aliases del canónico (búsqueda futura)
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO aceite_alias (aceite_id, alias)
SELECT r.aceite_id_destino, a.nombre
FROM _aceites_remap r
JOIN aceites a ON a.id = r.aceite_id_borrar
WHERE r.aceite_id_destino IS NOT NULL
  AND a.nombre IS NOT NULL
  AND TRIM(a.nombre) != '';

-- ------------------------------------------------------------------------------
-- 5. Borrar duplicados
-- ------------------------------------------------------------------------------
DELETE a
FROM aceites a
JOIN _aceites_remap r ON r.aceite_id_borrar = a.id;

-- ------------------------------------------------------------------------------
-- 6. Correcciones puntuales sobre canónicos
-- ------------------------------------------------------------------------------
UPDATE aceites SET categoria = 'grasa' WHERE id = 14;
UPDATE aceites
  SET nombre = 'SIN lubricación (no aplica)', categoria = 'otro'
  WHERE id = 50;
UPDATE aceites SET nombre = 'Shell Omala S4 WE 150 (= Shell Tivela S 150)'
  WHERE id = 53;
UPDATE aceites SET nombre = 'Optimol Optigear RMO 150 (= Castrol Optigear RO 150)'
  WHERE id = 45;

-- ------------------------------------------------------------------------------
-- 7. Verificaciones finales
-- ------------------------------------------------------------------------------
SELECT 'aceites_total_post_limpieza' AS check_, COUNT(*) AS total FROM aceites;
-- Esperado: 26

SELECT categoria, COUNT(*) AS total FROM aceites GROUP BY categoria ORDER BY total DESC;

SELECT id, nombre, categoria FROM aceites ORDER BY categoria, nombre;

-- Detección de duplicados residuales
SELECT
  LOWER(REPLACE(REPLACE(REPLACE(nombre, ' ', ''), '.', ''), ',', '')) AS clave,
  COUNT(*) AS total,
  GROUP_CONCAT(id) AS ids,
  GROUP_CONCAT(nombre SEPARATOR ' | ') AS nombres
FROM aceites
GROUP BY clave
HAVING total > 1;
-- Esperado: 0 filas

DROP TEMPORARY TABLE IF EXISTS _aceites_remap;

-- ==============================================================================
-- FIN 34b_limpieza_aceites
-- ==============================================================================
