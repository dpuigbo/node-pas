-- ==============================================================================
-- PAS ROBOTICS MANAGE - Compatibilidad ejes externos del Excel v7 (definitivo)
-- ==============================================================================
-- Fuente: pestaña "Unidades Mecánicas" del Excel ABB v7, columnas:
--   - compatibilidad        → whitelist familias robot
--   - excluye               → blacklist familias robot
--   - controlador_requerido → whitelist controladores
--
-- 22 familias con reglas (resto: compatible con cualquier robot por defecto):
--
-- WHITELIST FAMILIAS ROBOT (compatibilidad):
--   IRBT 2005       → IRB 1520, 1600, 2600, 4600
--   IRBT 4002       → IRB 1400, 2400, 4400
--   IRBT 4004       → IRB 4400, 4450S, 4600
--   IRBT 6002       → IRB 6400, 640, 6400R, 1400, 2400, 4400
--   IRBT 6004       → IRB 6620, 6650S, 6700
--   IRBT 7004       → IRB 6620, 6650S, 6700, 7600
--   IRT 510         → IRB 1520, 1600, 2600, 4600
--   IRT 710         → IRB 460, 660, 760, 4400, 4600, 5710, 5720, 6650S,
--                     6660, 6700, 6710, 6720, 6730, 6740, 7600, 7710, 7720
--
-- BLACKLIST FAMILIAS ROBOT (excluye):
--   IRBP A,B,C,D,K,L,R  → IRB 120
--
-- WHITELIST CONTROLADORES (controlador_requerido):
--   IRP A,B,C,D,K,L,R   → OmniCore V250XT, V400XT
--
-- IMPORTANTE: Vacia las 3 tablas tri-via primero para garantizar consistencia
-- exacta con v7. Reaplica todas las reglas. Idempotente.
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE compatibilidad_eje_permitida;
TRUNCATE TABLE compatibilidad_eje_excluye;
TRUNCATE TABLE compatibilidad_eje_controlador;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- WHITELIST: compatibilidad_eje_permitida
-- ==============================================================================

-- Helper macro: asigna whitelist a TODOS los modelos external_axis cuya familia
-- coincida, con cada familia robot listada
-- Patron: para cada (familia_eje, familia_robot):
--   INSERT permitida (eje, familia_robot) para todos los ejes de esa familia

-- IRBT 2005 → IRB 1520, 1600, 2600, 4600
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 2005' AND fe.tipo = 'external_axis'
JOIN lu_familia fp ON fp.tipo = 'mechanical_unit' AND fp.fabricante_id = mc.fabricante_id
WHERE fp.codigo IN ('IRB 1520', 'IRB 1600', 'IRB 2600', 'IRB 4600');

-- IRBT 4002 → IRB 1400, 2400, 4400
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 4002' AND fe.tipo = 'external_axis'
JOIN lu_familia fp ON fp.tipo = 'mechanical_unit' AND fp.fabricante_id = mc.fabricante_id
WHERE fp.codigo IN ('IRB 1400', 'IRB 2400', 'IRB 4400');

-- IRBT 4004 → IRB 4400, 4450S, 4600
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 4004' AND fe.tipo = 'external_axis'
JOIN lu_familia fp ON fp.tipo = 'mechanical_unit' AND fp.fabricante_id = mc.fabricante_id
WHERE fp.codigo IN ('IRB 4400', 'IRB 4450S', 'IRB 4600');

-- IRBT 6002 → IRB 6400, 640, 6400R, 1400, 2400, 4400
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 6002' AND fe.tipo = 'external_axis'
JOIN lu_familia fp ON fp.tipo = 'mechanical_unit' AND fp.fabricante_id = mc.fabricante_id
WHERE fp.codigo IN ('IRB 6400', 'IRB 640', 'IRB 6400R', 'IRB 1400', 'IRB 2400', 'IRB 4400');

-- IRBT 6004 → IRB 6620, 6650S, 6700
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 6004' AND fe.tipo = 'external_axis'
JOIN lu_familia fp ON fp.tipo = 'mechanical_unit' AND fp.fabricante_id = mc.fabricante_id
WHERE fp.codigo IN ('IRB 6620', 'IRB 6650S', 'IRB 6700');

-- IRBT 7004 → IRB 6620, 6650S, 6700, 7600
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 7004' AND fe.tipo = 'external_axis'
JOIN lu_familia fp ON fp.tipo = 'mechanical_unit' AND fp.fabricante_id = mc.fabricante_id
WHERE fp.codigo IN ('IRB 6620', 'IRB 6650S', 'IRB 6700', 'IRB 7600');

-- IRT 510 → IRB 1520, 1600, 2600, 4600
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 510' AND fe.tipo = 'external_axis'
JOIN lu_familia fp ON fp.tipo = 'mechanical_unit' AND fp.fabricante_id = mc.fabricante_id
WHERE fp.codigo IN ('IRB 1520', 'IRB 1600', 'IRB 2600', 'IRB 4600');

-- IRT 710 → IRB 460, 660, 760, 4400, 4600, 5710, 5720, 6650S, 6660, 6700,
--           6710, 6720, 6730, 6740, 7600, 7710, 7720
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710' AND fe.tipo = 'external_axis'
JOIN lu_familia fp ON fp.tipo = 'mechanical_unit' AND fp.fabricante_id = mc.fabricante_id
WHERE fp.codigo IN (
  'IRB 460', 'IRB 660', 'IRB 760', 'IRB 4400', 'IRB 4600',
  'IRB 5710', 'IRB 5720', 'IRB 6650S', 'IRB 6660', 'IRB 6700',
  'IRB 6710', 'IRB 6720', 'IRB 6730', 'IRB 6740', 'IRB 7600',
  'IRB 7710', 'IRB 7720'
);

-- ==============================================================================
-- BLACKLIST: compatibilidad_eje_excluye
-- ==============================================================================

-- IRBP A/B/C/D/K/L/R → excluyen IRB 120
INSERT IGNORE INTO compatibilidad_eje_excluye (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.tipo = 'external_axis'
  AND fe.codigo IN ('IRBP A', 'IRBP B', 'IRBP C', 'IRBP D', 'IRBP K', 'IRBP L', 'IRBP R')
JOIN lu_familia fp ON fp.codigo = 'IRB 120' AND fp.tipo = 'mechanical_unit' AND fp.fabricante_id = mc.fabricante_id;

-- ==============================================================================
-- WHITELIST CONTROLADORES: compatibilidad_eje_controlador
-- ==============================================================================

-- IRP A/B/C/D/K/L/R → V250XT (incluye Type A/B) o V400XT
INSERT IGNORE INTO compatibilidad_eje_controlador (eje_modelo_id, controlador_modelo_id)
SELECT mc.id, ctrl.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.tipo = 'external_axis'
  AND fe.codigo IN ('IRP A', 'IRP B', 'IRP C', 'IRP D', 'IRP K', 'IRP L', 'IRP R')
JOIN modelos_componente ctrl ON ctrl.tipo = 'controller' AND ctrl.fabricante_id = mc.fabricante_id
  AND ctrl.nombre IN ('OmniCore V250XT', 'OmniCore V250XT Type A', 'OmniCore V250XT Type B', 'OmniCore V400XT');

-- ==============================================================================
-- Verificacion
-- ==============================================================================
SELECT
  (SELECT COUNT(*) FROM compatibilidad_eje_permitida) AS perm,
  (SELECT COUNT(*) FROM compatibilidad_eje_excluye) AS excl,
  (SELECT COUNT(*) FROM compatibilidad_eje_controlador) AS ctrl;

-- Por familia eje + count familias robot permitidas
SELECT lf.codigo AS familia_eje,
  COUNT(DISTINCT mc.id) AS variantes,
  (SELECT COUNT(DISTINCT cep.familia_id) FROM compatibilidad_eje_permitida cep
    JOIN modelos_componente mc2 ON mc2.id = cep.eje_modelo_id
    WHERE mc2.familia_id = lf.id) AS familias_perm,
  (SELECT COUNT(DISTINCT cex.familia_id) FROM compatibilidad_eje_excluye cex
    JOIN modelos_componente mc2 ON mc2.id = cex.eje_modelo_id
    WHERE mc2.familia_id = lf.id) AS familias_excl,
  (SELECT COUNT(DISTINCT cec.controlador_modelo_id) FROM compatibilidad_eje_controlador cec
    JOIN modelos_componente mc2 ON mc2.id = cec.eje_modelo_id
    WHERE mc2.familia_id = lf.id) AS ctrl_req
FROM lu_familia lf
JOIN modelos_componente mc ON mc.familia_id = lf.id
WHERE lf.tipo = 'external_axis'
GROUP BY lf.id, lf.codigo
HAVING familias_perm > 0 OR familias_excl > 0 OR ctrl_req > 0
ORDER BY lf.codigo;
