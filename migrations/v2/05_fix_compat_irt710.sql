-- ==============================================================================
-- PAS ROBOTICS MANAGE - Fix compatibilidad IRT 710
-- ==============================================================================
-- El script 03 buscaba familia 'IRT 710 OmniCore' pero en la BD se llama
-- 'IRT 710'. Este script añade las reglas correctas para los modelos
-- IRT 710 (track OmniCore para robots grandes).
--
-- Whitelist robot: IRB 460, 660, 760, 4400, 4600, 6620, 6650S, 6700,
--                  7600 + variantes Foundry
-- ==============================================================================

-- IRT 710 permite IRB 460, 660, 760, 4400, 4600, 6620, 6650S, 6700, 7600
-- (familias OmniCore grandes para tracks)
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710' AND fe.tipo = 'external_axis'
JOIN lu_familia fp ON fp.tipo = 'mechanical_unit'
WHERE fp.codigo IN (
  'IRB 460',
  'IRB 660',
  'IRB 760',
  'IRB 4400',
  'IRB 4600',
  'IRB 6620',
  'IRB 6650S',
  'IRB 6700',
  'IRB 7600'
);

-- Verificacion
SELECT mc.id, mc.nombre, mc.familia,
  (SELECT COUNT(*) FROM compatibilidad_eje_permitida WHERE eje_modelo_id = mc.id) AS familias_permitidas
FROM modelos_componente mc
WHERE mc.familia = 'IRT 710' AND mc.tipo = 'external_axis';

SELECT
  (SELECT COUNT(*) FROM compatibilidad_eje_permitida) AS total_permitida,
  (SELECT COUNT(*) FROM compatibilidad_eje_excluye) AS total_excluye,
  (SELECT COUNT(*) FROM compatibilidad_eje_controlador) AS total_controlador;
