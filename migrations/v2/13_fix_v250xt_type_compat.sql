-- ==============================================================================
-- PAS ROBOTICS MANAGE - Fix compatibilidad V250XT Type A / Type B
-- ==============================================================================
-- V250XT (id 36) tiene 58 ejes externos en compatibilidad_controlador.
-- V250XT Type A (6525) y Type B (6526) solo tienen 1 cada uno (IRT 710).
-- Como Type A/B son variantes del mismo cabinet V250XT, deben tener las
-- mismas compatibilidades.
--
-- Replica todas las compatibilidades de V250XT (36) a Type A (6525) y Type B (6526).
-- ==============================================================================

-- Replicar compatibilidad de V250XT (36) a V250XT Type A (6525)
INSERT IGNORE INTO compatibilidad_controlador (controlador_id, componente_id)
SELECT 6525, cc.componente_id
FROM compatibilidad_controlador cc
WHERE cc.controlador_id = 36;

-- Replicar compatibilidad de V250XT (36) a V250XT Type B (6526)
INSERT IGNORE INTO compatibilidad_controlador (controlador_id, componente_id)
SELECT 6526, cc.componente_id
FROM compatibilidad_controlador cc
WHERE cc.controlador_id = 36;

-- Tambien replicar reglas tri-via (compatibilidad_eje_controlador)
-- Si V250XT (36) requiere algun eje, Type A/B tambien
INSERT IGNORE INTO compatibilidad_eje_controlador (eje_modelo_id, controlador_modelo_id)
SELECT cec.eje_modelo_id, 6525
FROM compatibilidad_eje_controlador cec
WHERE cec.controlador_modelo_id = 36;

INSERT IGNORE INTO compatibilidad_eje_controlador (eje_modelo_id, controlador_modelo_id)
SELECT cec.eje_modelo_id, 6526
FROM compatibilidad_eje_controlador cec
WHERE cec.controlador_modelo_id = 36;

-- Verificacion
SELECT mc.id, mc.nombre,
  (SELECT COUNT(*) FROM compatibilidad_controlador cc
    JOIN modelos_componente mc2 ON mc2.id = cc.componente_id
    WHERE cc.controlador_id = mc.id AND mc2.tipo = 'external_axis') AS ejes_compatibles,
  (SELECT COUNT(*) FROM compatibilidad_controlador cc
    JOIN modelos_componente mc2 ON mc2.id = cc.componente_id
    WHERE cc.controlador_id = mc.id AND mc2.tipo = 'mechanical_unit') AS robots_compatibles
FROM modelos_componente mc
WHERE mc.id IN (36, 37, 6525, 6526);
