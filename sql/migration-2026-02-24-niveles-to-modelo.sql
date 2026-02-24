-- ============================================================
-- Migration: Move niveles from componentes_sistema to modelos_componente
-- Date: 2026-02-24
-- Description: Niveles belong to the model (catalog), not to individual component instances
-- Run in phpMyAdmin on the production database
-- ============================================================

-- Add niveles column to modelos_componente
ALTER TABLE modelos_componente ADD COLUMN IF NOT EXISTS niveles VARCHAR(100) NULL;

-- Drop niveles column from componentes_sistema (no longer needed)
ALTER TABLE componentes_sistema DROP COLUMN IF EXISTS niveles;
