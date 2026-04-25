-- ==============================================================================
-- PAS ROBOTICS MANAGE - Matriz robot↔controlador (verificada Daniel)
-- ==============================================================================
-- Reemplaza el campo string `controladoras` (legacy) por una relacion M:N a
-- granularidad de variante especifica de cabinet, no de generacion.
--
-- Pasos:
--   1. Asegurar variantes de cabinet en modelos_componente (PMC Small, PMC Large)
--   2. Crear tabla compatibilidad_robot_controlador
--   3. Poblar matriz completa: legacy / IRC5 / OmniCore / hibridos / paint / CRB
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. Variantes de cabinet faltantes
-- ------------------------------------------------------------------------------
-- IRC5 PMC Small / Large no existen como modelos separados en BD ABB.
-- El generico 'IRC5 Panel Mounted (PMC)' (id=30) se mantiene para auditoria
-- pero las reglas nuevas apuntan a los especificos.

-- Asegurar familia 'IRC5' tipo 'controller' existe
INSERT IGNORE INTO lu_familia (fabricante_id, codigo, tipo, descripcion)
VALUES (1, 'IRC5', 'controller', 'Generacion IRC5');

-- Crear PMC Small si no existe
INSERT INTO modelos_componente (fabricante_id, tipo, familia, nombre, notas, niveles)
SELECT 1, 'controller', 'IRC5', 'IRC5 PMC Small',
  'Panel mounted cabinet IRC5 para robots pequenios (hasta IRB 1600). Drive system reducido. Sin MultiMove.',
  '1,2_inferior,2_superior,3'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM modelos_componente WHERE nombre = 'IRC5 PMC Small' AND tipo = 'controller');

-- Crear PMC Large si no existe
INSERT INTO modelos_componente (fabricante_id, tipo, familia, nombre, notas, niveles)
SELECT 1, 'controller', 'IRC5', 'IRC5 PMC Large',
  'Panel mounted cabinet IRC5 para robots medianos/grandes (IRB 2400 a IRB 7600). Drive system completo. MultiMove hasta 4 robots.',
  '1,2_inferior,2_superior,3'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM modelos_componente WHERE nombre = 'IRC5 PMC Large' AND tipo = 'controller');

-- Vincular familia_id en los nuevos modelos
UPDATE modelos_componente mc
JOIN lu_familia f ON f.fabricante_id = mc.fabricante_id AND f.codigo = mc.familia AND f.tipo = mc.tipo
SET mc.familia_id = f.id
WHERE mc.tipo = 'controller' AND mc.familia_id IS NULL;

-- Capacidades multimove de los nuevos PMC
UPDATE modelos_componente SET
  soporta_multimove = 0, max_robots_multimove = 1, max_ejes_externos = 6
WHERE tipo = 'controller' AND nombre = 'IRC5 PMC Small';

UPDATE modelos_componente SET
  soporta_multimove = 1, max_robots_multimove = 4, max_ejes_externos = 6
WHERE tipo = 'controller' AND nombre = 'IRC5 PMC Large';

-- ------------------------------------------------------------------------------
-- 2. Tabla compatibilidad_robot_controlador
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS compatibilidad_robot_controlador (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  robot_familia_id      INT NOT NULL,
  controlador_modelo_id INT NOT NULL,
  notas                 VARCHAR(255),
  fuente_doc            VARCHAR(100),
  CONSTRAINT fk_crc_familia FOREIGN KEY (robot_familia_id) REFERENCES lu_familia(id),
  CONSTRAINT fk_crc_ctrl FOREIGN KEY (controlador_modelo_id) REFERENCES modelos_componente(id),
  UNIQUE KEY uq_robot_ctrl (robot_familia_id, controlador_modelo_id),
  INDEX idx_crc_familia (robot_familia_id),
  INDEX idx_crc_ctrl (controlador_modelo_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Empezar limpio (idempotente; vacia para reaplicar)
TRUNCATE TABLE compatibilidad_robot_controlador;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------------------------
-- 3. Helper: insertar pareja por nombres
-- ------------------------------------------------------------------------------
-- Patron: para cada (familia_robot, controlador) insertar via JOIN.
-- Reglas se agrupan por categoria para auditoria.

-- ============================================================================
-- A) Robots IRB LEGACY (S4 / S4C / S4C+)
-- ============================================================================
-- IRB 1400  → S4, S4C, S4C+, IRC5 Single, IRC5 PMC Large
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id, notas)
SELECT f.id, mc.id, 'Legacy + retrofit IRC5'
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 1400' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('S4','S4C','S4C+','IRC5 Single','IRC5 PMC Large');

-- IRB 2400  → S4, S4C, S4C+, IRC5 Single, IRC5 PMC Large
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 2400' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('S4','S4C','S4C+','IRC5 Single','IRC5 PMC Large');

-- IRB 3400  → S4
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id, notas)
SELECT f.id, mc.id, 'Legacy only'
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 3400' AND f.tipo = 'mechanical_unit'
  AND mc.nombre = 'S4';

-- IRB 4400  → S4, S4C, S4C+, IRC5 Single, IRC5 PMC Large
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 4400' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('S4','S4C','S4C+','IRC5 Single','IRC5 PMC Large');

-- IRB 6400  → S4, S4C
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id, notas)
SELECT f.id, mc.id, 'Legacy only'
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 6400' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('S4','S4C');

-- IRB 6400PE → S4C, S4C+
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 6400PE' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('S4C','S4C+');

-- IRB 6400R → S4C, S4C+, IRC5 Single, IRC5 PMC Large (R = retrofit)
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id, notas)
SELECT f.id, mc.id, 'R = retrofit a IRC5'
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 6400R' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('S4C','S4C+','IRC5 Single','IRC5 PMC Large');

-- IRB 6400S → S4, S4C, S4C+
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id, notas)
SELECT f.id, mc.id, 'Shelf legacy'
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 6400S' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('S4','S4C','S4C+');

-- IRB 640  → S4C, S4C+, IRC5 Single, IRC5 PMC Large
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 640' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('S4C','S4C+','IRC5 Single','IRC5 PMC Large');

-- IRB 840A → S4C
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id, notas)
SELECT f.id, mc.id, 'Legacy palletizer'
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 840A' AND f.tipo = 'mechanical_unit'
  AND mc.nombre = 'S4C';

-- IRB 940 → S4C+
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id, notas)
SELECT f.id, mc.id, 'Legacy'
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 940' AND f.tipo = 'mechanical_unit'
  AND mc.nombre = 'S4C+';

-- ============================================================================
-- B) IRC5 GAMA PEQUEÑA (Single + Compact + PMC Small, no PMC Large, no IRC5P)
-- ============================================================================
-- 12 familias: IRB 120, 120FGL, 140, 1200, 1200FGL, 1410, 1600, 1600ID,
--              260, 360, 365, 910SC
-- Nota: IRB 1600 ademas tiene OmniCore C30/C90XT (override mas abajo)
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN (
    'IRB 120','IRB 120FGL','IRB 140','IRB 1200','IRB 1200FGL','IRB 1410',
    'IRB 1600','IRB 1600ID','IRB 260','IRB 360','IRB 365','IRB 910SC'
  )
  AND mc.nombre IN ('IRC5 Single','IRC5 Compact','IRC5 PMC Small');

-- ============================================================================
-- C) IRC5 GAMA MEDIA (Single + PMC Large, no Compact, no IRC5P)
-- ============================================================================
-- 12 familias: IRB 1510ID, 1520ID, 1660ID, 2400, 2400W, 2600, 2600ID,
--              4400, 4400S, 4600, 4600CLA, 460
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN (
    'IRB 1510ID','IRB 1520ID','IRB 1660ID','IRB 2400','IRB 2400W','IRB 2600',
    'IRB 2600ID','IRB 4400','IRB 4400S','IRB 4600','IRB 4600CLA','IRB 460'
  )
  AND mc.nombre IN ('IRC5 Single','IRC5 PMC Large');

-- ============================================================================
-- D) IRC5 GAMA GRANDE
-- ============================================================================

-- Solo IRC5 Single (no PMC Large): IRB 5400, IRB 5500, IRB 6600ID,
--                                    IRB 6620LX, IRB 6650ID, IRB 8700
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN (
    'IRB 5400','IRB 5500','IRB 6600ID','IRB 6620LX','IRB 6650ID','IRB 8700'
  )
  AND mc.nombre = 'IRC5 Single';

-- Single + PMC Large: IRB 660, 6600, 6620, 6640, 6640ID, 6650, 6650S,
--                     6660, 6700, 6700Inv, 760, 7600
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id, fuente_doc)
SELECT f.id, mc.id,
  CASE WHEN f.codigo = 'IRB 6660' THEN '3HAC028207' ELSE NULL END
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN (
    'IRB 660','IRB 6600','IRB 6620','IRB 6640','IRB 6640ID','IRB 6650',
    'IRB 6650S','IRB 6660','IRB 6700','IRB 6700Inv','IRB 760','IRB 7600'
  )
  AND mc.nombre IN ('IRC5 Single','IRC5 PMC Large');

-- ============================================================================
-- E) ROBOTS OmniCore-only
-- ============================================================================

-- OmniCore pequeños (E10/C30/C90XT): IRB 1010, 1090, 1100, 910INV, 920, 930
--                                      + cobots CRB 1100 / CRB 1300
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN ('IRB 1010','IRB 1090','IRB 1100','IRB 910INV','IRB 920','IRB 930',
                   'CRB 1100','CRB 1300')
  AND mc.nombre IN ('OmniCore E10','OmniCore C30','OmniCore C90XT');

-- OmniCore V250XT/V400XT only: IRB 5510, 5710, 5720, 6710, 6720, 6730, 6730S,
--                                6740, 6750S, 6760, 6790, 7710, 7720
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id, fuente_doc)
SELECT f.id, mc.id,
  CASE
    WHEN f.codigo = 'IRB 5710' THEN '3HAC079197'
    WHEN f.codigo = 'IRB 7710' THEN '3HAC089603'
    ELSE NULL
  END
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN (
    'IRB 5510','IRB 5710','IRB 5720',
    'IRB 6710','IRB 6720','IRB 6730','IRB 6730S','IRB 6740','IRB 6750S',
    'IRB 6760','IRB 6790','IRB 7710','IRB 7720'
  )
  AND mc.nombre IN ('OmniCore V250XT','OmniCore V400XT');

-- ============================================================================
-- F) ROBOTS HIBRIDOS (IRC5 + OmniCore)
-- ============================================================================
-- Reglas especificas, una a una

-- IRB 6700  → IRC5 Single, IRC5 PMC Large, OmniCore V250XT, OmniCore V400XT
-- (ya cubierto IRC5 en D, anadimos OmniCore)
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 6700' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('OmniCore V250XT','OmniCore V400XT');

-- IRB 6700Inv → idem
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 6700Inv' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('OmniCore V250XT','OmniCore V400XT');

-- IRB 1300 → IRC5 Single, IRC5 Compact, IRC5 PMC Small + OmniCore E10/C30/C90XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 1300' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('IRC5 Single','IRC5 Compact','IRC5 PMC Small',
                    'OmniCore E10','OmniCore C30','OmniCore C90XT');

-- IRB 1600 → +OmniCore C30, C90XT (gama pequeña ya cubrio IRC5)
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 1600' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('OmniCore C30','OmniCore C90XT');

-- IRB 1660ID → +OmniCore C30, C90XT (gama media ya cubrio IRC5)
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 1660ID' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('OmniCore C30','OmniCore C90XT');

-- IRB 2600 → +OmniCore C90XT, V250XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 2600' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('OmniCore C90XT','OmniCore V250XT');

-- IRB 2600ID → idem
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 2600ID' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('OmniCore C90XT','OmniCore V250XT');

-- IRB 4600 → +OmniCore V250XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 4600' AND f.tipo = 'mechanical_unit'
  AND mc.nombre = 'OmniCore V250XT';

-- IRB 460 → +OmniCore V250XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 460' AND f.tipo = 'mechanical_unit'
  AND mc.nombre = 'OmniCore V250XT';

-- IRB 660 → +OmniCore V250XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 660' AND f.tipo = 'mechanical_unit'
  AND mc.nombre = 'OmniCore V250XT';

-- IRB 760 → +OmniCore V250XT, V400XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 760' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('OmniCore V250XT','OmniCore V400XT');

-- IRB 6620 → +OmniCore V250XT, V400XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 6620' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('OmniCore V250XT','OmniCore V400XT');

-- IRB 6650S → +OmniCore V250XT, V400XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 6650S' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('OmniCore V250XT','OmniCore V400XT');

-- IRB 6660 → +OmniCore V250XT, V400XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 6660' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('OmniCore V250XT','OmniCore V400XT');

-- IRB 7600 → +OmniCore V400XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 7600' AND f.tipo = 'mechanical_unit'
  AND mc.nombre = 'OmniCore V400XT';

-- IRB 8700 → +OmniCore V400XT (D ya cubre IRC5 Single)
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 8700' AND f.tipo = 'mechanical_unit'
  AND mc.nombre = 'OmniCore V400XT';

-- IRB 390 → IRC5 Single, OmniCore C30, OmniCore C90XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 390' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('IRC5 Single','OmniCore C30','OmniCore C90XT');

-- IRB 5300 → IRC5 Single, OmniCore V250XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 5300' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('IRC5 Single','OmniCore V250XT');

-- IRB 5350 → IRC5 Single, OmniCore V250XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 5350' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('IRC5 Single','OmniCore V250XT');

-- ============================================================================
-- G) ROBOTS PAINT (IRC5P)
-- ============================================================================
-- IRC5P solamente: IRB 52, IRB 540, IRB 580, IRB 5400, IRB 5500
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN ('IRB 52','IRB 540','IRB 580','IRB 5400','IRB 5500')
  AND mc.nombre = 'IRC5P (Paint)';

-- IRB 5510 (paint nuevo) ya cubierto en E (V250XT/V400XT)

-- ============================================================================
-- H) COBOTS CRB
-- ============================================================================

-- CRB 15000 (GoFa) → IRC5 Single + OmniCore E10/C30/C90XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'CRB 15000' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('IRC5 Single','OmniCore E10','OmniCore C30','OmniCore C90XT');

-- CRB 1810/1820/1910/1920 → IRC5 Single
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN ('CRB 1810','CRB 1820','CRB 1910','CRB 1920')
  AND mc.nombre = 'IRC5 Single';

-- ==============================================================================
-- Verificacion
-- ==============================================================================
SELECT
  (SELECT COUNT(*) FROM compatibilidad_robot_controlador) AS total_reglas,
  (SELECT COUNT(DISTINCT robot_familia_id) FROM compatibilidad_robot_controlador) AS familias_distintas,
  (SELECT COUNT(DISTINCT controlador_modelo_id) FROM compatibilidad_robot_controlador) AS controladores_distintos;

-- Por controlador, conteo de familias compatibles
SELECT mc.nombre AS controlador, COUNT(*) AS familias
FROM compatibilidad_robot_controlador crc
JOIN modelos_componente mc ON mc.id = crc.controlador_modelo_id
GROUP BY mc.id, mc.nombre
ORDER BY mc.nombre;

-- Tests rapidos: combinaciones criticas
SELECT 'IRB 6660 + IRC5 Compact (debe ser FALSE)' AS test,
  (SELECT COUNT(*) FROM compatibilidad_robot_controlador crc
    JOIN lu_familia f ON f.id = crc.robot_familia_id
    JOIN modelos_componente mc ON mc.id = crc.controlador_modelo_id
    WHERE f.codigo = 'IRB 6660' AND mc.nombre = 'IRC5 Compact') AS hits;

SELECT 'IRB 7710 + IRC5 Single (debe ser FALSE)' AS test,
  (SELECT COUNT(*) FROM compatibilidad_robot_controlador crc
    JOIN lu_familia f ON f.id = crc.robot_familia_id
    JOIN modelos_componente mc ON mc.id = crc.controlador_modelo_id
    WHERE f.codigo = 'IRB 7710' AND mc.nombre = 'IRC5 Single') AS hits;

SELECT 'IRB 5720 + OmniCore C30 (debe ser FALSE)' AS test,
  (SELECT COUNT(*) FROM compatibilidad_robot_controlador crc
    JOIN lu_familia f ON f.id = crc.robot_familia_id
    JOIN modelos_componente mc ON mc.id = crc.controlador_modelo_id
    WHERE f.codigo = 'IRB 5720' AND mc.nombre = 'OmniCore C30') AS hits;

SELECT 'IRB 1200 + IRC5 Compact (debe ser TRUE)' AS test,
  (SELECT COUNT(*) FROM compatibilidad_robot_controlador crc
    JOIN lu_familia f ON f.id = crc.robot_familia_id
    JOIN modelos_componente mc ON mc.id = crc.controlador_modelo_id
    WHERE f.codigo = 'IRB 1200' AND mc.nombre = 'IRC5 Compact') AS hits;

SELECT 'IRB 6700 + OmniCore V250XT (debe ser TRUE)' AS test,
  (SELECT COUNT(*) FROM compatibilidad_robot_controlador crc
    JOIN lu_familia f ON f.id = crc.robot_familia_id
    JOIN modelos_componente mc ON mc.id = crc.controlador_modelo_id
    WHERE f.codigo = 'IRB 6700' AND mc.nombre = 'OmniCore V250XT') AS hits;

SELECT 'IRB 8700 + OmniCore V250XT (debe ser FALSE — solo V400XT)' AS test,
  (SELECT COUNT(*) FROM compatibilidad_robot_controlador crc
    JOIN lu_familia f ON f.id = crc.robot_familia_id
    JOIN modelos_componente mc ON mc.id = crc.controlador_modelo_id
    WHERE f.codigo = 'IRB 8700' AND mc.nombre = 'OmniCore V250XT') AS hits;
