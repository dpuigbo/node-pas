-- ==============================================================================
-- PAS ROBOTICS MANAGE - Matriz robot↔controlador (verificada Daniel)
-- ==============================================================================
-- Reemplaza el campo string `controladoras` (legacy) por una relacion M:N a
-- granularidad de variante especifica de cabinet.
--
-- Cabinets en BD (no se subdividen PMC Small/Large):
--   IRC5 Single
--   IRC5 Compact
--   IRC5 Panel Mounted (PMC)        ← uno solo, generico
--   IRC5P (Paint)
--   OmniCore E10 / C30 / C90XT / V250XT / V400XT
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. Tabla compatibilidad_robot_controlador
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

TRUNCATE TABLE compatibilidad_robot_controlador;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- A) Robots IRB LEGACY (S4 / S4C / S4C+)
-- ============================================================================

-- IRB 1400 → S4, S4C, S4C+, IRC5 Single, IRC5 PMC
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id, notas)
SELECT f.id, mc.id, 'Legacy + retrofit IRC5'
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 1400' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('S4','S4C','S4C+','IRC5 Single','IRC5 Panel Mounted (PMC)');

-- IRB 2400 → S4, S4C, S4C+, IRC5 Single, IRC5 PMC
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 2400' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('S4','S4C','S4C+','IRC5 Single','IRC5 Panel Mounted (PMC)');

-- IRB 3400 → S4
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id, notas)
SELECT f.id, mc.id, 'Legacy only'
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 3400' AND f.tipo = 'mechanical_unit'
  AND mc.nombre = 'S4';

-- IRB 4400 → S4, S4C, S4C+, IRC5 Single, IRC5 PMC
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 4400' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('S4','S4C','S4C+','IRC5 Single','IRC5 Panel Mounted (PMC)');

-- IRB 6400 → S4, S4C
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

-- IRB 6400R → S4C, S4C+, IRC5 Single, IRC5 PMC
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id, notas)
SELECT f.id, mc.id, 'R = retrofit a IRC5'
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 6400R' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('S4C','S4C+','IRC5 Single','IRC5 Panel Mounted (PMC)');

-- IRB 6400S → S4, S4C, S4C+
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id, notas)
SELECT f.id, mc.id, 'Shelf legacy'
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 6400S' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('S4','S4C','S4C+');

-- IRB 640 → S4C, S4C+, IRC5 Single, IRC5 PMC
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 640' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('S4C','S4C+','IRC5 Single','IRC5 Panel Mounted (PMC)');

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
-- B) IRC5 GAMA PEQUEÑA (Single + Compact + PMC, no IRC5P)
-- ============================================================================
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN (
    'IRB 120','IRB 120FGL','IRB 140','IRB 1200','IRB 1200FGL','IRB 1410',
    'IRB 1600','IRB 1600ID','IRB 260','IRB 360','IRB 365','IRB 910SC'
  )
  AND mc.nombre IN ('IRC5 Single','IRC5 Compact','IRC5 Panel Mounted (PMC)');

-- ============================================================================
-- C) IRC5 GAMA MEDIA (Single + PMC, no Compact, no IRC5P)
-- ============================================================================
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN (
    'IRB 1510ID','IRB 1520ID','IRB 1660ID','IRB 2400','IRB 2400W','IRB 2600',
    'IRB 2600ID','IRB 4400','IRB 4400S','IRB 4600','IRB 4600CLA','IRB 460'
  )
  AND mc.nombre IN ('IRC5 Single','IRC5 Panel Mounted (PMC)');

-- ============================================================================
-- D) IRC5 GAMA GRANDE
-- ============================================================================

-- Solo IRC5 Single (no PMC): IRB 5400, 5500, 6600ID, 6620LX, 6650ID, 8700
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN (
    'IRB 5400','IRB 5500','IRB 6600ID','IRB 6620LX','IRB 6650ID','IRB 8700'
  )
  AND mc.nombre = 'IRC5 Single';

-- Single + PMC: IRB 660, 6600, 6620, 6640, 6640ID, 6650, 6650S,
--               6660, 6700, 6700Inv, 760, 7600
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
  AND mc.nombre IN ('IRC5 Single','IRC5 Panel Mounted (PMC)');

-- ============================================================================
-- E) ROBOTS OmniCore-only
-- ============================================================================

-- OmniCore pequeños (E10/C30/C90XT)
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN ('IRB 1010','IRB 1090','IRB 1100','IRB 910INV','IRB 920','IRB 930',
                   'CRB 1100','CRB 1300')
  AND mc.nombre IN ('OmniCore E10','OmniCore C30','OmniCore C90XT');

-- OmniCore V250XT/V400XT only: IRB 5510, 5710, 5720, 6710-6790, 7710, 7720
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

-- IRB 6700 + IRB 6700Inv → +OmniCore V250XT, V400XT (IRC5 ya en D)
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN ('IRB 6700','IRB 6700Inv')
  AND mc.nombre IN ('OmniCore V250XT','OmniCore V400XT');

-- IRB 1300 → IRC5 Single + Compact + PMC + OmniCore E10/C30/C90XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 1300' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('IRC5 Single','IRC5 Compact','IRC5 Panel Mounted (PMC)',
                    'OmniCore E10','OmniCore C30','OmniCore C90XT');

-- IRB 1600 → +OmniCore C30, C90XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 1600' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('OmniCore C30','OmniCore C90XT');

-- IRB 1660ID → +OmniCore C30, C90XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 1660ID' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('OmniCore C30','OmniCore C90XT');

-- IRB 2600 + IRB 2600ID → +OmniCore C90XT, V250XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN ('IRB 2600','IRB 2600ID')
  AND mc.nombre IN ('OmniCore C90XT','OmniCore V250XT');

-- IRB 4600 / 460 / 660 → +OmniCore V250XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN ('IRB 4600','IRB 460','IRB 660')
  AND mc.nombre = 'OmniCore V250XT';

-- IRB 760 / 6620 / 6650S / 6660 → +OmniCore V250XT, V400XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN ('IRB 760','IRB 6620','IRB 6650S','IRB 6660')
  AND mc.nombre IN ('OmniCore V250XT','OmniCore V400XT');

-- IRB 7600 → +OmniCore V400XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 7600' AND f.tipo = 'mechanical_unit'
  AND mc.nombre = 'OmniCore V400XT';

-- IRB 8700 → +OmniCore V400XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 8700' AND f.tipo = 'mechanical_unit'
  AND mc.nombre = 'OmniCore V400XT';

-- IRB 390 → IRC5 Single + OmniCore C30, C90XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.codigo = 'IRB 390' AND f.tipo = 'mechanical_unit'
  AND mc.nombre IN ('IRC5 Single','OmniCore C30','OmniCore C90XT');

-- IRB 5300 / 5350 → IRC5 Single + OmniCore V250XT
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN ('IRB 5300','IRB 5350')
  AND mc.nombre IN ('IRC5 Single','OmniCore V250XT');

-- ============================================================================
-- G) PAINT (IRC5P)
-- ============================================================================
INSERT IGNORE INTO compatibilidad_robot_controlador (robot_familia_id, controlador_modelo_id)
SELECT f.id, mc.id
FROM lu_familia f
JOIN modelos_componente mc ON mc.tipo = 'controller'
WHERE f.tipo = 'mechanical_unit'
  AND f.codigo IN ('IRB 52','IRB 540','IRB 580','IRB 5400','IRB 5500')
  AND mc.nombre = 'IRC5P (Paint)';

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

-- Tests rapidos
SELECT 'IRB 6660 + IRC5 Compact (debe ser 0)' AS test,
  (SELECT COUNT(*) FROM compatibilidad_robot_controlador crc
    JOIN lu_familia f ON f.id = crc.robot_familia_id
    JOIN modelos_componente mc ON mc.id = crc.controlador_modelo_id
    WHERE f.codigo = 'IRB 6660' AND mc.nombre = 'IRC5 Compact') AS hits;

SELECT 'IRB 7710 + IRC5 Single (debe ser 0)' AS test,
  (SELECT COUNT(*) FROM compatibilidad_robot_controlador crc
    JOIN lu_familia f ON f.id = crc.robot_familia_id
    JOIN modelos_componente mc ON mc.id = crc.controlador_modelo_id
    WHERE f.codigo = 'IRB 7710' AND mc.nombre = 'IRC5 Single') AS hits;

SELECT 'IRB 1200 + IRC5 Compact (debe ser 1)' AS test,
  (SELECT COUNT(*) FROM compatibilidad_robot_controlador crc
    JOIN lu_familia f ON f.id = crc.robot_familia_id
    JOIN modelos_componente mc ON mc.id = crc.controlador_modelo_id
    WHERE f.codigo = 'IRB 1200' AND mc.nombre = 'IRC5 Compact') AS hits;

SELECT 'IRB 6700 + OmniCore V250XT (debe ser 1)' AS test,
  (SELECT COUNT(*) FROM compatibilidad_robot_controlador crc
    JOIN lu_familia f ON f.id = crc.robot_familia_id
    JOIN modelos_componente mc ON mc.id = crc.controlador_modelo_id
    WHERE f.codigo = 'IRB 6700' AND mc.nombre = 'OmniCore V250XT') AS hits;

SELECT 'IRB 8700 + OmniCore V250XT (debe ser 0)' AS test,
  (SELECT COUNT(*) FROM compatibilidad_robot_controlador crc
    JOIN lu_familia f ON f.id = crc.robot_familia_id
    JOIN modelos_componente mc ON mc.id = crc.controlador_modelo_id
    WHERE f.codigo = 'IRB 8700' AND mc.nombre = 'OmniCore V250XT') AS hits;
