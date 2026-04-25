-- ==============================================================================
-- PAS ROBOTICS MANAGE - Compatibilidad drive_units con sus controladoras
-- ==============================================================================
-- En multimove, cada robot adicional necesita una drive_unit.
-- Este script registra que drive_units son compatibles con cada controladora:
--   IRC5 Drive Unit (6523)  → todos los IRC5 (Single, PMC, Compact, IRC5P)
--   A250XT (6527)            → V250XT, V250XT Type A, V250XT Type B
--   A400XT (6528)            → V400XT
-- ==============================================================================

-- IRC5 Drive Unit ↔ IRC5 Single, PMC, Compact, IRC5P (Paint)
INSERT IGNORE INTO compatibilidad_controlador (controlador_id, componente_id)
SELECT mc_ctrl.id, 6523
FROM modelos_componente mc_ctrl
WHERE mc_ctrl.tipo = 'controller'
  AND mc_ctrl.nombre IN (
    'IRC5 Single',
    'IRC5 Panel Mounted (PMC)',
    'IRC5 Compact',
    'IRC5P (Paint)'
  );

-- A250XT ↔ V250XT (todas las variantes)
INSERT IGNORE INTO compatibilidad_controlador (controlador_id, componente_id)
SELECT mc_ctrl.id, 6527
FROM modelos_componente mc_ctrl
WHERE mc_ctrl.tipo = 'controller'
  AND mc_ctrl.nombre IN (
    'OmniCore V250XT',
    'OmniCore V250XT Type A',
    'OmniCore V250XT Type B'
  );

-- A400XT ↔ V400XT
INSERT IGNORE INTO compatibilidad_controlador (controlador_id, componente_id)
SELECT mc_ctrl.id, 6528
FROM modelos_componente mc_ctrl
WHERE mc_ctrl.tipo = 'controller'
  AND mc_ctrl.nombre = 'OmniCore V400XT';

-- Verificacion
SELECT mc_ctrl.nombre AS controlador, mc_du.nombre AS drive_unit
FROM compatibilidad_controlador cc
JOIN modelos_componente mc_ctrl ON mc_ctrl.id = cc.controlador_id
JOIN modelos_componente mc_du ON mc_du.id = cc.componente_id
WHERE mc_du.tipo = 'drive_unit'
ORDER BY mc_ctrl.nombre, mc_du.nombre;
