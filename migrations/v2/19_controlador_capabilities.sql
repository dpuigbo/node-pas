-- ==============================================================================
-- PAS ROBOTICS MANAGE - Capacidades multimove + ejes externos por controladora
-- ==============================================================================
-- Datos extraidos de la pestaña "Controladoras" del Excel ABB v7:
--   Generacion | Multimove | Max ejes externos
--   S4         | 1 robot (sin MM)   | 2
--   S4C        | 1 robot (sin MM)   | 4
--   S4C+       | 1 robot (sin MM)   | 6
--   IRC5       | hasta 4 (Single+3DU; Compact=1) | 6
--   OmniCore   | E10=1, C30=2, C90XT/V250XT/V400XT=4 | 6 (E10=2)
--
-- Anade columnas max_robots_multimove y max_ejes_externos a modelos_componente
-- (solo populated para tipo='controller'). Frontend consume estas en lugar
-- de la funcion hardcoded getControllerCapabilities().
-- ==============================================================================

-- 1. Añadir columnas
SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'modelos_componente'
     AND column_name = 'max_robots_multimove') = 0,
  'ALTER TABLE modelos_componente
     ADD COLUMN max_robots_multimove TINYINT NULL,
     ADD COLUMN max_ejes_externos TINYINT NULL,
     ADD COLUMN soporta_multimove TINYINT(1) NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2. Poblar segun reglas v7

-- S4
UPDATE modelos_componente SET
  soporta_multimove = 0, max_robots_multimove = 1, max_ejes_externos = 2
WHERE tipo = 'controller' AND nombre = 'S4';

-- S4C
UPDATE modelos_componente SET
  soporta_multimove = 0, max_robots_multimove = 1, max_ejes_externos = 4
WHERE tipo = 'controller' AND nombre = 'S4C';

-- S4C+
UPDATE modelos_componente SET
  soporta_multimove = 0, max_robots_multimove = 1, max_ejes_externos = 6
WHERE tipo = 'controller' AND nombre = 'S4C+';

-- IRC5 Single (multimove)
UPDATE modelos_componente SET
  soporta_multimove = 1, max_robots_multimove = 4, max_ejes_externos = 6
WHERE tipo = 'controller' AND nombre IN ('IRC5 Single', 'IRC5 Single M2004');

-- IRC5 Panel Mounted PMC (multimove)
UPDATE modelos_componente SET
  soporta_multimove = 1, max_robots_multimove = 4, max_ejes_externos = 6
WHERE tipo = 'controller' AND nombre IN ('IRC5 Panel Mounted (PMC)', 'IRC5 Panel Mounted M2004');

-- IRC5 Compact (sin multimove)
UPDATE modelos_componente SET
  soporta_multimove = 0, max_robots_multimove = 1, max_ejes_externos = 6
WHERE tipo = 'controller' AND nombre IN ('IRC5 Compact', 'IRC5 Compact M2004');

-- IRC5P Paint (sin multimove)
UPDATE modelos_componente SET
  soporta_multimove = 0, max_robots_multimove = 1, max_ejes_externos = 6
WHERE tipo = 'controller' AND nombre = 'IRC5P (Paint)';

-- OmniCore E10 (sin multimove, max 2 ejes)
UPDATE modelos_componente SET
  soporta_multimove = 0, max_robots_multimove = 1, max_ejes_externos = 2
WHERE tipo = 'controller' AND nombre = 'OmniCore E10';

-- OmniCore C30 (multimove hasta 2)
UPDATE modelos_componente SET
  soporta_multimove = 1, max_robots_multimove = 2, max_ejes_externos = 6
WHERE tipo = 'controller' AND nombre = 'OmniCore C30';

-- OmniCore C90XT (multimove hasta 4)
UPDATE modelos_componente SET
  soporta_multimove = 1, max_robots_multimove = 4, max_ejes_externos = 6
WHERE tipo = 'controller' AND nombre = 'OmniCore C90XT';

-- OmniCore V250XT (multimove hasta 4) — incluye Type A/B
UPDATE modelos_componente SET
  soporta_multimove = 1, max_robots_multimove = 4, max_ejes_externos = 6
WHERE tipo = 'controller' AND nombre IN (
  'OmniCore V250XT',
  'OmniCore V250XT Type A',
  'OmniCore V250XT Type B'
);

-- OmniCore V400XT (multimove hasta 4)
UPDATE modelos_componente SET
  soporta_multimove = 1, max_robots_multimove = 4, max_ejes_externos = 6
WHERE tipo = 'controller' AND nombre = 'OmniCore V400XT';

-- OmniCore A250XT/A400XT son drive_unit (cabinet auxiliar), no controller
-- → no aplica capacidad (sus drive units no controlan robots)

-- Verificacion
SELECT id, nombre, soporta_multimove, max_robots_multimove, max_ejes_externos
FROM modelos_componente
WHERE tipo = 'controller'
ORDER BY nombre;
