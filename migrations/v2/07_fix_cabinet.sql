-- ==============================================================================
-- PAS ROBOTICS MANAGE - OBSOLETO (no ejecutar en pipeline reset)
-- ==============================================================================
-- Este script fue necesario en la primera iteracion porque:
--   1. El script 03 hacia INSERTs cabinet con JOIN a lu_tipo_actividad
--   2. Los tipos 'Limpieza/Reemplazo', 'Mantenimiento general',
--      'Prueba funcional', 'Reemplazo (preventivo programado)' NO estaban
--      en lu_tipo_actividad
--   3. Los INSERTs hacian JOIN fallido y no insertaban
--
-- Tras actualizar 02_migration.sql para incluir TODOS los tipos faltantes,
-- el script 03 carga las 171 actividades limpiamente. Este 07 es redundante.
--
-- Pipeline reset:
--   00 → 02 → 03 → 11 → 05 → 06 → 08 → 09 → 10
-- ==============================================================================

SELECT 'Script 07 marcado como obsoleto, no hace nada' AS info;
