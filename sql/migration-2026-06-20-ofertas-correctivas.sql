-- ============================================================
-- Migration: ofertas correctivas (alcance, factor trafico, dieta internacional,
--            tabla de operaciones correctivas)
-- Date: 2026-06-20
-- Aditiva e idempotente. Aplicar en la BD de produccion via dbq.php ANTES
-- de desplegar el codigo. Mismo esquema que genera `prisma migrate diff`.
-- ============================================================

-- CLIENTES: dieta internacional (la nacional ya existe como `dietas`)
ALTER TABLE `clientes` ADD COLUMN IF NOT EXISTS `dieta_internacional` DECIMAL(10, 2) NULL;

-- OFERTAS: alcance (nacional|internacional) + factor de trafico (%) sobre el desplazamiento
ALTER TABLE `ofertas` ADD COLUMN IF NOT EXISTS `alcance` VARCHAR(191) NOT NULL DEFAULT 'nacional';
ALTER TABLE `ofertas` ADD COLUMN IF NOT EXISTS `factor_trafico_pct` DECIMAL(5, 2) NULL DEFAULT 0;

-- OPERACIONES CORRECTIVAS: operaciones de reparacion por oferta + sistema
CREATE TABLE IF NOT EXISTS `oferta_operacion_correctiva` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `oferta_id` INTEGER NOT NULL,
    `sistema_id` INTEGER NOT NULL,
    `operacion` VARCHAR(500) NOT NULL,
    `horas_estimadas` DECIMAL(8, 2) NULL,
    `orden` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `oferta_operacion_correctiva_oferta_id_idx`(`oferta_id`),
    PRIMARY KEY (`id`),
    CONSTRAINT `oferta_operacion_correctiva_oferta_id_fkey` FOREIGN KEY (`oferta_id`) REFERENCES `ofertas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `oferta_operacion_correctiva_sistema_id_fkey` FOREIGN KEY (`sistema_id`) REFERENCES `sistemas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
