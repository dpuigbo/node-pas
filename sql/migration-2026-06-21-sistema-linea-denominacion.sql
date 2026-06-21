-- ============================================================
-- Migration: Sistema -> linea + denominacion (etiquetas del cliente)
-- Date: 2026-06-21
-- Aditiva e idempotente. Aplicar en produccion via dbq.php antes de desplegar.
-- ============================================================

ALTER TABLE `sistemas` ADD COLUMN IF NOT EXISTS `linea` VARCHAR(191) NULL;
ALTER TABLE `sistemas` ADD COLUMN IF NOT EXISTS `denominacion` VARCHAR(191) NULL;
