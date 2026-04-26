-- ==============================================================================
-- PAS ROBOTICS MANAGE - oferta_sistema.nivel_id nullable
-- ==============================================================================
-- Permite crear ofertas con sistemas sin nivel asignado. El operario decide
-- el nivel mas tarde (en Tab 1 oferta-componente o Tab 0 sistemas).
--
-- El nivel real de cada componente del sistema vive en oferta_componente,
-- que ya es nullable. oferta_sistema.nivel solo era un default global.
-- ==============================================================================

SET @sql = (SELECT IF(
  (SELECT IS_NULLABLE FROM information_schema.columns
   WHERE table_schema = DATABASE()
     AND table_name = 'oferta_sistema'
     AND column_name = 'nivel_id') = 'NO',
  'ALTER TABLE oferta_sistema MODIFY COLUMN nivel_id INT NULL',
  'SELECT 1'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Verificacion
SELECT
  (SELECT IS_NULLABLE FROM information_schema.columns
   WHERE table_schema=DATABASE() AND table_name='oferta_sistema' AND column_name='nivel_id') AS nivel_id_nullable;
