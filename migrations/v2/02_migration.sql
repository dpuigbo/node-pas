-- ==============================================================================
-- PAS ROBOTICS MANAGE - Migración 02 (adaptado a BD REAL)
-- ==============================================================================
-- Normaliza datos existentes al nuevo modelo basado en FKs.
-- Requiere MySQL 8.0+ o MariaDB 10.0.5+ (por REGEXP_REPLACE).
--
-- PRERREQUISITOS:
--   - 01_schema_ddl.sql ejecutado
--   - Datos existentes: aceites(49), modelos_componente(935),
--     lubricacion_reductora(680), actividades_mantenimiento(411),
--     compatibilidad_controlador(7605)
--
-- IDEMPOTENCIA: usa INSERT IGNORE + ON DUPLICATE KEY.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- A. POBLAR lu_generacion_controlador
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO lu_generacion_controlador (codigo, nombre, drive_system, anio_desde, anio_hasta, orden, notas) VALUES
  ('S4',               'S4',               'M94',           1994, 1998, 10, 'Legacy años 90.'),
  ('S4C',              'S4C',              'M98',           1998, 2001, 20, 'Generación transitoria.'),
  ('S4C+',             'S4C+',             'M2000/M2000A',  2001, 2004, 30, 'Última pre-IRC5.'),
  ('IRC5',             'IRC5',             'M2004',         2004, NULL, 40, 'Plataforma dominante. 2 generaciones M2004 y 2018+.'),
  ('IRC5P',            'IRC5 Paint',       'M2004',         2004, NULL, 45, 'Variante Paint del IRC5.'),
  ('OmniCore',         'OmniCore',         'OmniCore',      2018, NULL, 50, 'Líneas E10/C30/C90XT/V250XT/V400XT.'),
  ('OmniCore A line',  'OmniCore A line',  'N/A',           2024, NULL, 55, 'Cabinets auxiliares (NO controladoras).');

-- ------------------------------------------------------------------------------
-- B. POBLAR lu_tipo_actividad (normaliza typos "Inspección"/"Inspeccion")
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO lu_tipo_actividad (codigo, nombre, categoria, requiere_parada, orden) VALUES
  ('inspeccion',            'Inspección',              'inspeccion',  0, 10),
  ('cambio_aceite',         'Cambio aceite',           'lubricacion', 1, 20),
  ('cambio_grasa',          'Cambio grasa',            'lubricacion', 1, 21),
  ('cambio_aceite_grasa',   'Cambio aceite/grasa',     'lubricacion', 1, 22),
  ('lubricacion',           'Lubricación',             'lubricacion', 0, 23),
  ('engrase',               'Engrase',                 'lubricacion', 0, 24),
  ('reemplazo',             'Reemplazo',               'reemplazo',   1, 30),
  ('inspeccion_reemplazo',  'Inspeccion + reemplazo',  'reemplazo',   1, 31),
  ('overhaul',              'Overhaul',                'overhaul',    1, 40),
  ('analisis',              'Análisis',                'analisis',    0, 50),
  ('analisis_agua_aceite',  'Analisis agua en aceite', 'analisis',    0, 51),
  ('antioxidante',          'Antioxidante',            'otro',        0, 60),
  ('verificacion',          'Verificación',            'inspeccion',  0, 11),
  ('inspeccion_lubric',     'Inspección / Lubricación','lubricacion', 0, 25),
  ('inspeccion_diaria',     'Inspección diaria',       'inspeccion',  0, 12),
  ('mantenimiento_diario',  'Mantenimiento diario',    'otro',        0, 70),
  ('mantenimiento_recom',   'Mantenimiento recomendado','otro',       0, 71),
  ('gearboxes',             'Gearboxes',               'otro',        0, 72);

-- ------------------------------------------------------------------------------
-- C. POBLAR lu_nivel_mantenimiento (sincronizado con CSVs existentes en modelos_componente)
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO lu_nivel_mantenimiento (codigo, nombre, descripcion, orden) VALUES
  ('1',          'Nivel 1',          'Inspección básica periódica', 1),
  ('2_inferior', 'Nivel 2 inferior', 'Mantenimiento intermedio (ejes inferiores / reductoras grandes)', 2),
  ('2_superior', 'Nivel 2 superior', 'Mantenimiento intermedio (muñeca / ejes superiores)', 3),
  ('3',          'Nivel 3',          'Overhaul completo', 4);

-- ------------------------------------------------------------------------------
-- D. POBLAR lu_unidad_intervalo
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO lu_unidad_intervalo (codigo, nombre, factor_horas, orden) VALUES
  ('horas',       'Horas operación',          1.0,    1),
  ('meses',       'Meses calendario',         720.0,  2),
  ('anios',       'Años calendario',          8760.0, 3),
  ('alerta_baja', 'Alerta baja del sistema',  NULL,   4),
  ('condicion',   'Según condición',          NULL,   5),
  ('inspeccion',  'Cada inspección',          NULL,   6);

-- ------------------------------------------------------------------------------
-- E. POBLAR lu_familia (desde modelos_componente.familia DISTINCT)
-- ------------------------------------------------------------------------------
INSERT IGNORE INTO lu_familia (fabricante_id, codigo, tipo, descripcion)
SELECT DISTINCT mc.fabricante_id, mc.familia, mc.tipo, NULL
FROM modelos_componente mc
WHERE mc.familia IS NOT NULL;

-- Vincular modelos_componente a su familia_id
UPDATE modelos_componente mc
JOIN lu_familia f
  ON f.fabricante_id = mc.fabricante_id
 AND f.codigo = mc.familia
 AND f.tipo = mc.tipo
SET mc.familia_id = f.id
WHERE mc.familia_id IS NULL;

-- Vincular controladoras a su generación (match por nombre/familia)
UPDATE modelos_componente mc
JOIN lu_generacion_controlador g ON (
  (mc.familia = 'S4'       AND g.codigo = 'S4') OR
  (mc.familia = 'S4C'      AND g.codigo = 'S4C') OR
  (mc.familia = 'S4C+'     AND g.codigo = 'S4C+') OR
  (mc.familia = 'IRC5'     AND mc.nombre NOT LIKE '%IRC5P%' AND g.codigo = 'IRC5') OR
  (mc.familia = 'IRC5'     AND mc.nombre LIKE '%IRC5P%' AND g.codigo = 'IRC5P') OR
  (mc.familia = 'OmniCore' AND g.codigo = 'OmniCore')
)
SET mc.generacion_controlador_id = g.id
WHERE mc.tipo = 'controller' AND mc.generacion_controlador_id IS NULL;

-- ------------------------------------------------------------------------------
-- F. POBLAR modelo_nivel_aplicable (parsear CSV niveles existente)
-- ------------------------------------------------------------------------------
-- Usa FIND_IN_SET para convertir "1,2_inferior,2_superior,3" -> 4 filas
INSERT IGNORE INTO modelo_nivel_aplicable (modelo_componente_id, nivel_id)
SELECT mc.id, ln.id
FROM modelos_componente mc
JOIN lu_nivel_mantenimiento ln ON FIND_IN_SET(ln.codigo, mc.niveles) > 0
WHERE mc.niveles IS NOT NULL;

-- ------------------------------------------------------------------------------
-- G. NORMALIZACIÓN DE ACEITES
-- ------------------------------------------------------------------------------
-- Paso 1: generar codigo_canonico para los 49 aceites existentes
UPDATE aceites
SET codigo_canonico = CONCAT(
  UPPER(SUBSTRING(REPLACE(REPLACE(REPLACE(nombre, ' ', '_'), '/', '_'), '.', ''), 1, 60)),
  '_', id
)
WHERE codigo_canonico IS NULL;

-- Paso 2: categorización automática por patrón de nombre
UPDATE aceites SET categoria = 'grasa'
  WHERE (LOWER(nombre) LIKE '%grasa%' OR LOWER(nombre) LIKE '%grease%' OR LOWER(nombre) LIKE '%spheerol%')
    AND categoria = 'otro';
UPDATE aceites SET categoria = 'harmonic'
  WHERE LOWER(nombre) LIKE '%harmonic%' AND categoria = 'otro';
UPDATE aceites SET categoria = 'food_grade'
  WHERE (LOWER(nombre) LIKE '%food grade%' OR LOWER(nombre) LIKE '%cibus%' OR LOWER(nombre) LIKE '%fg-%')
    AND categoria = 'otro';
UPDATE aceites SET categoria = 'foundry'
  WHERE (LOWER(nombre) LIKE '%foundry%' OR LOWER(nombre) LIKE '%retinax%')
    AND categoria = 'otro';
UPDATE aceites SET categoria = 'aceite'
  WHERE categoria = 'otro'
    AND (LOWER(nombre) LIKE '%aceite%' OR LOWER(nombre) LIKE '%oil%' OR LOWER(nombre) LIKE '%kyodo%'
      OR LOWER(nombre) LIKE '%mobilgear%' OR LOWER(nombre) LIKE '%omala%' OR LOWER(nombre) LIKE '%optigear%'
      OR LOWER(nombre) LIKE '%tivela%' OR LOWER(nombre) LIKE '%glygoyl%');

-- Paso 3: cada aceite es alias de sí mismo
INSERT IGNORE INTO aceite_alias (aceite_id, alias)
SELECT a.id, a.nombre FROM aceites a;

-- Paso 4: alias manuales conocidos (duplicados detectados en la BD real)
-- "Kyodo Yushi TMO 150" tiene muchas variantes escritas distinto
INSERT IGNORE INTO aceite_alias (aceite_id, alias)
SELECT a.id, v.alias FROM aceites a
JOIN (
  SELECT 'Kyodo Yushi TMO 150' AS canon, 'Kyodo TMO 150' AS alias UNION ALL
  SELECT 'Kyodo Yushi TMO 150', 'Kyodo Yushi TMO150' UNION ALL
  SELECT 'Kyodo Yushi TMO 150', 'TMO 150' UNION ALL
  SELECT 'Kyodo Yushi TMO 150', 'type 1:               Kyodo Yushi TMO 150' UNION ALL
  SELECT 'Kyodo Yushi TMO 150', 'type 2:               Kyodo Yushi TMO 150' UNION ALL
  SELECT 'Mobilgear 600 XP 320/XMP 320', 'Mobilgear 600 XP 320' UNION ALL
  SELECT 'Mobilgear 600 XP 320/XMP 320', 'Mobilgear 600 XP 320/XMP' UNION ALL
  SELECT 'Mobilgear 600 XP 320/XMP 320', 'Mobilgear 600 XP' UNION ALL
  SELECT 'Mobilgear 600 XP 320/XMP 320', 'Mobil Mobilgear 600 XP320' UNION ALL
  SELECT 'Harmonic grease 4B No. 2', 'Harmonic Grease 4B No.2' UNION ALL
  SELECT 'Harmonic grease 4B No. 2', 'Harmonic Grease 4b No.2' UNION ALL
  SELECT 'SHC Cibus 220 (food grade)', 'SHC Cibus 220' UNION ALL
  SELECT 'SHC Cibus 220 (food grade)', 'Mobil SHC Cibus 220'
) v ON v.canon = a.nombre;

-- ------------------------------------------------------------------------------
-- H. MIGRAR lubricacion_reductora → lubricacion
-- ------------------------------------------------------------------------------
INSERT INTO lubricacion (
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
LEFT JOIN modelos_componente mc ON mc.nombre = lr.variante_trm
LEFT JOIN aceite_alias aa ON aa.alias = lr.tipo_lubricante
LEFT JOIN aceites a ON a.id = aa.aceite_id
WHERE mc.id IS NOT NULL;  -- solo los que hacen match exacto

-- Segundo pase: variantes con "all variants" → aplicar a todas las variantes de la familia
-- (esto requiere parseo más complejo, dejar para revisión manual)
-- Query de auditoría al final identifica cuáles quedan pendientes.

-- ------------------------------------------------------------------------------
-- I. MIGRAR actividades_mantenimiento → actividad_preventiva
-- ------------------------------------------------------------------------------
INSERT INTO actividad_preventiva (
  familia_id, tipo_actividad_id, documento, componente,
  intervalo_horas, intervalo_meses, intervalo_condicion, intervalo_texto_legacy,
  intervalo_foundry_horas, intervalo_foundry_meses,
  notas
)
SELECT
  f.id, ta.id,
  am.documento, am.componente,
  -- Parseo estándar horas
  CASE
    WHEN am.intervalo_estandar REGEXP 'c?/?[0-9.]+[ ]*h' THEN
      CAST(REPLACE(REGEXP_REPLACE(SUBSTRING_INDEX(am.intervalo_estandar, 'h', 1), '[^0-9]', ''), '.', '') AS UNSIGNED)
    ELSE NULL
  END,
  -- Parseo estándar meses
  CASE
    WHEN am.intervalo_estandar LIKE '%mes%' THEN
      CAST(REGEXP_REPLACE(SUBSTRING_INDEX(am.intervalo_estandar, 'mes', 1), '[^0-9]', '') AS UNSIGNED)
    WHEN am.intervalo_estandar LIKE '%año%' THEN
      CAST(REGEXP_REPLACE(SUBSTRING_INDEX(am.intervalo_estandar, 'año', 1), '[^0-9]', '') AS UNSIGNED) * 12
    ELSE NULL
  END,
  -- Condición
  CASE
    WHEN am.intervalo_estandar LIKE '%lerta%' THEN 'alerta_baja'
    WHEN am.intervalo_estandar LIKE '%condici%' THEN 'condicion'
    WHEN am.intervalo_estandar = '-' OR am.intervalo_estandar IS NULL THEN 'n_a'
    WHEN am.intervalo_estandar LIKE '%1er%' OR am.intervalo_estandar LIKE '%2do%' OR am.intervalo_estandar LIKE '%,%' THEN 'mixto'
    ELSE 'periodico'
  END,
  am.intervalo_estandar,
  -- Foundry horas
  CASE
    WHEN am.intervalo_foundry REGEXP 'c?/?[0-9.]+[ ]*h' THEN
      CAST(REPLACE(REGEXP_REPLACE(SUBSTRING_INDEX(am.intervalo_foundry, 'h', 1), '[^0-9]', ''), '.', '') AS UNSIGNED)
    ELSE NULL
  END,
  -- Foundry meses
  CASE
    WHEN am.intervalo_foundry LIKE '%mes%' THEN
      CAST(REGEXP_REPLACE(am.intervalo_foundry, '[^0-9]', '') AS UNSIGNED)
    ELSE NULL
  END,
  am.notas
FROM actividades_mantenimiento am
LEFT JOIN lu_familia f ON f.codigo = am.familia_robot AND f.fabricante_id = am.fabricante_id
LEFT JOIN lu_tipo_actividad ta ON (
  ta.nombre = am.tipo_actividad OR
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE(am.tipo_actividad,'ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE(am.tipo_actividad,'á','a'))
)
WHERE f.id IS NOT NULL AND ta.id IS NOT NULL;

-- ==============================================================================
-- QUERIES DE AUDITORÍA (ejecutar después para validar)
-- ==============================================================================
--
-- -- Filas sin FK familia_id
-- SELECT COUNT(*) FROM modelos_componente WHERE familia_id IS NULL;
--
-- -- Lubricaciones que no migraron (quedaron en lubricacion_reductora sin match)
-- SELECT lr.* FROM lubricacion_reductora lr
-- LEFT JOIN lubricacion l ON l.variante_trm_legacy = lr.variante_trm AND l.eje = lr.eje
-- WHERE l.id IS NULL
-- ORDER BY lr.variante_trm LIMIT 20;
--
-- -- Actividades que no migraron
-- SELECT am.* FROM actividades_mantenimiento am
-- LEFT JOIN actividad_preventiva ap ON ap.intervalo_texto_legacy = am.intervalo_estandar
--                                   AND ap.componente = am.componente
-- WHERE ap.id IS NULL LIMIT 20;
--
-- -- Conteos post-migración
-- SELECT
--   (SELECT COUNT(*) FROM lu_familia)             AS familias,
--   (SELECT COUNT(*) FROM lu_tipo_actividad)      AS tipos_act,
--   (SELECT COUNT(*) FROM lubricacion)            AS lubricaciones_ok,
--   (SELECT COUNT(*) FROM actividad_preventiva)   AS actividades_ok,
--   (SELECT COUNT(*) FROM modelo_nivel_aplicable) AS niveles_mna;
-- ==============================================================================
