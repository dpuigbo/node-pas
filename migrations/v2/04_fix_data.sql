-- ==============================================================================
-- PAS ROBOTICS MANAGE - OBSOLETO (no ejecutar en pipeline reset)
-- ==============================================================================
-- Este script se ejecuto manualmente en la primera iteracion antes del reset
-- total. Sus dos funciones se han movido a:
--   - Activities drive_module A250XT/A400XT  → 11_post_seed_adjustments.sql
--   - Mejora match lubricacion (LIKE)        → 06_fix_lubricacion.sql
--
-- Conservado solo como referencia historica. NO incluir en el pipeline:
--   00 → 02 → 03 → 11 → 05 → 06 → 07 → 08 → 09 → 10
-- ==============================================================================

SELECT 'Script 04 marcado como obsoleto, no hace nada' AS info;
