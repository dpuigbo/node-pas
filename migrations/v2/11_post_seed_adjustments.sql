-- ==============================================================================
-- PAS ROBOTICS MANAGE - Post-seed adjustments (decisiones de modelado)
-- ==============================================================================
-- El seed v7 (script 03) crea:
--   - A250XT y A400XT como tipo='controller' (cabinet auxiliar)
--   - OmniCore Drive Module como drive_unit generico
--   - Sus actividades en actividad_cabinet (A250XT/A400XT) y
--     actividad_drive_module (OmniCore Drive Module)
--
-- Nuestra decision:
--   - A250XT/A400XT son drive_unit (no controller)
--   - OmniCore Drive Module generico se elimina (A250XT/A400XT lo reemplazan)
--
-- Este script:
--   1. Migra actividades de cabinet de A250XT/A400XT a drive_module
--   2. Reasigna las 5 actividades genericas del OmniCore Drive Module a
--      A250XT (5) y A400XT (5)
--   3. Cambia tipo de A250XT/A400XT a drive_unit
--   4. Re-vincula familia_id
--   5. Elimina OmniCore Drive Module generico
--
-- IMPORTANTE: ejecutar DESPUES del 03 y ANTES del 04, 05, 06, 07, 08, 09, 10
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Asegurar familia 'OmniCore' tipo 'drive_unit' existe
INSERT IGNORE INTO lu_familia (fabricante_id, codigo, tipo, descripcion)
VALUES (1, 'OmniCore', 'drive_unit', 'Drive units OmniCore (cabinet auxiliar A250XT/A400XT)');

-- 2. Migrar actividades cabinet de A250XT (6527) a drive_module
--    con controlador asociado V250XT (36)
INSERT INTO actividad_drive_module (
  drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
  documento, componente, generacion_hw,
  intervalo_horas, intervalo_meses, intervalo_condicion, intervalo_texto_legacy,
  notas
)
SELECT
  ac.cabinet_modelo_id, 36, ac.tipo_actividad_id,
  ac.documento, ac.componente, ac.generacion_hw,
  ac.intervalo_horas, ac.intervalo_meses, ac.intervalo_condicion, ac.intervalo_texto_legacy,
  ac.notas
FROM actividad_cabinet ac
WHERE ac.cabinet_modelo_id = 6527;

-- A400XT (6528) → V400XT (37)
INSERT INTO actividad_drive_module (
  drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
  documento, componente, generacion_hw,
  intervalo_horas, intervalo_meses, intervalo_condicion, intervalo_texto_legacy,
  notas
)
SELECT
  ac.cabinet_modelo_id, 37, ac.tipo_actividad_id,
  ac.documento, ac.componente, ac.generacion_hw,
  ac.intervalo_horas, ac.intervalo_meses, ac.intervalo_condicion, ac.intervalo_texto_legacy,
  ac.notas
FROM actividad_cabinet ac
WHERE ac.cabinet_modelo_id = 6528;

-- 3. Eliminar las actividades originales de cabinet
DELETE FROM actividad_cabinet WHERE cabinet_modelo_id IN (6527, 6528);

-- 4. Reasignar actividades genericas del OmniCore Drive Module a A250XT y A400XT
-- A250XT (6527) recibe copia con controlador V250XT (36)
INSERT INTO actividad_drive_module (
  drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
  documento, componente, generacion_hw,
  intervalo_horas, intervalo_meses, intervalo_condicion, intervalo_texto_legacy,
  notas
)
SELECT
  6527, 36, dm.tipo_actividad_id,
  dm.documento, dm.componente, dm.generacion_hw,
  dm.intervalo_horas, dm.intervalo_meses, dm.intervalo_condicion, dm.intervalo_texto_legacy,
  dm.notas
FROM actividad_drive_module dm
JOIN modelos_componente mc ON mc.id = dm.drive_module_modelo_id
WHERE mc.nombre = 'OmniCore Drive Module' AND mc.tipo = 'drive_unit';

-- A400XT (6528) recibe copia con controlador V400XT (37)
INSERT INTO actividad_drive_module (
  drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
  documento, componente, generacion_hw,
  intervalo_horas, intervalo_meses, intervalo_condicion, intervalo_texto_legacy,
  notas
)
SELECT
  6528, 37, dm.tipo_actividad_id,
  dm.documento, dm.componente, dm.generacion_hw,
  dm.intervalo_horas, dm.intervalo_meses, dm.intervalo_condicion, dm.intervalo_texto_legacy,
  dm.notas
FROM actividad_drive_module dm
JOIN modelos_componente mc ON mc.id = dm.drive_module_modelo_id
WHERE mc.nombre = 'OmniCore Drive Module' AND mc.tipo = 'drive_unit';

-- 5. Eliminar OmniCore Drive Module generico (con sus actividades)
DELETE dm FROM actividad_drive_module dm
JOIN modelos_componente mc ON mc.id = dm.drive_module_modelo_id
WHERE mc.nombre = 'OmniCore Drive Module' AND mc.tipo = 'drive_unit';

DELETE FROM modelos_componente WHERE nombre = 'OmniCore Drive Module' AND tipo = 'drive_unit';

-- 6. Eliminar la entrada lu_familia generica de OmniCore Drive Module
DELETE FROM lu_familia WHERE codigo = 'OmniCore Drive Module' AND tipo = 'drive_unit';

-- 7. Cambiar tipo de A250XT y A400XT a drive_unit
UPDATE modelos_componente
SET tipo = 'drive_unit', familia_id = NULL
WHERE id IN (6527, 6528);

-- 8. Re-vincular familia_id
UPDATE modelos_componente mc
JOIN lu_familia f ON f.fabricante_id = mc.fabricante_id
  AND f.codigo = mc.familia
  AND f.tipo = mc.tipo
SET mc.familia_id = f.id
WHERE mc.id IN (6527, 6528);

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- Verificacion
-- ==============================================================================
SELECT id, nombre, tipo, familia, familia_id
FROM modelos_componente
WHERE id IN (6523, 6525, 6526, 6527, 6528) OR tipo = 'drive_unit'
ORDER BY tipo, id;

SELECT
  (SELECT COUNT(*) FROM modelos_componente WHERE tipo = 'drive_unit') AS total_drive_units,
  (SELECT COUNT(*) FROM modelos_componente WHERE tipo = 'controller') AS total_controllers,
  (SELECT COUNT(*) FROM actividad_cabinet) AS act_cabinet,
  (SELECT COUNT(*) FROM actividad_drive_module) AS act_drive_module,
  (SELECT COUNT(*) FROM actividad_drive_module WHERE drive_module_modelo_id = 6523) AS dm_irc5,
  (SELECT COUNT(*) FROM actividad_drive_module WHERE drive_module_modelo_id = 6527) AS dm_a250xt,
  (SELECT COUNT(*) FROM actividad_drive_module WHERE drive_module_modelo_id = 6528) AS dm_a400xt;
