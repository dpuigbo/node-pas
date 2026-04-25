-- ==============================================================================
-- PAS ROBOTICS MANAGE - Anade motivo a compatibilidad_eje_excluye
-- ==============================================================================
-- Permite documentar por que una familia robot esta excluida de un eje
-- (ej: 'IRB 120 demasiado pequeño para soportar IRBP A').
-- ==============================================================================

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'compatibilidad_eje_excluye'
     AND column_name = 'motivo') = 0,
  'ALTER TABLE compatibilidad_eje_excluye ADD COLUMN motivo VARCHAR(255) NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Poblar motivo para las exclusiones IRB 120 (todos los IRBP excluyen IRB 120)
UPDATE compatibilidad_eje_excluye cee
JOIN modelos_componente mc ON mc.id = cee.eje_modelo_id
JOIN lu_familia lf ON lf.id = mc.familia_id
SET cee.motivo = 'IRB 120 demasiado pequeño para mover este positioner'
WHERE lf.codigo IN ('IRBP A','IRBP B','IRBP C','IRBP D','IRBP K','IRBP L','IRBP R')
  AND cee.motivo IS NULL;

SELECT
  (SELECT COUNT(*) FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'compatibilidad_eje_excluye'
     AND column_name = 'motivo') AS columna_motivo,
  (SELECT COUNT(*) FROM compatibilidad_eje_excluye WHERE motivo IS NOT NULL) AS con_motivo;
