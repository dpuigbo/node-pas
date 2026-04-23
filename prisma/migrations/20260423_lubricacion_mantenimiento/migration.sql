-- CreateTable: lubricacion_reductora
CREATE TABLE `lubricacion_reductora` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fabricante_id` INTEGER NOT NULL,
    `variante_trm` VARCHAR(300) NOT NULL,
    `eje` VARCHAR(20) NOT NULL,
    `tipo_lubricante` VARCHAR(200) NOT NULL,
    `cantidad` VARCHAR(50) NOT NULL,
    `web_config` VARCHAR(100) NULL,

    INDEX `lubricacion_reductora_fabricante_id_idx`(`fabricante_id`),
    INDEX `lubricacion_reductora_variante_trm_idx`(`variante_trm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: actividades_mantenimiento
CREATE TABLE `actividades_mantenimiento` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `fabricante_id` INTEGER NOT NULL,
    `familia_robot` VARCHAR(100) NOT NULL,
    `documento` VARCHAR(100) NULL,
    `tipo_actividad` VARCHAR(100) NOT NULL,
    `componente` VARCHAR(300) NOT NULL,
    `intervalo_estandar` VARCHAR(300) NULL,
    `intervalo_foundry` VARCHAR(300) NULL,
    `notas` TEXT NULL,

    INDEX `actividades_mantenimiento_fabricante_id_idx`(`fabricante_id`),
    INDEX `actividades_mantenimiento_familia_robot_idx`(`familia_robot`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddUniqueIndex on modelos_componente (fabricanteId, tipo, nombre)
CREATE UNIQUE INDEX `modelos_componente_fab_tipo_nombre` ON `modelos_componente`(`fabricante_id`, `tipo`, `nombre`);

-- AddForeignKey
ALTER TABLE `lubricacion_reductora` ADD CONSTRAINT `lubricacion_reductora_fabricante_id_fkey` FOREIGN KEY (`fabricante_id`) REFERENCES `fabricantes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividades_mantenimiento` ADD CONSTRAINT `actividades_mantenimiento_fabricante_id_fkey` FOREIGN KEY (`fabricante_id`) REFERENCES `fabricantes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
