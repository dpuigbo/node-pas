/*M!999999\- enable the sandbox mode */ 

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `_trazabilidad_compatibilidad_modelo_controlador` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `modelo_componente_id` int(11) NOT NULL,
  `controlador_modelo_id` int(11) NOT NULL,
  `fuente_doc` varchar(100) DEFAULT NULL,
  `pagina_manual` smallint(6) DEFAULT NULL,
  `notas` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_modelo_controlador` (`modelo_componente_id`,`controlador_modelo_id`),
  KEY `idx_modelo` (`modelo_componente_id`),
  KEY `idx_controlador` (`controlador_modelo_id`),
  CONSTRAINT `fk_cmc_controlador` FOREIGN KEY (`controlador_modelo_id`) REFERENCES `modelos_componente` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cmc_modelo` FOREIGN KEY (`modelo_componente_id`) REFERENCES `modelos_componente` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `_trazabilidad_modelo_montaje` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `modelo_componente_id` int(11) NOT NULL,
  `montaje_id` int(11) NOT NULL,
  `notas` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_modelo_montaje` (`modelo_componente_id`,`montaje_id`),
  KEY `montaje_id` (`montaje_id`),
  CONSTRAINT `_trazabilidad_modelo_montaje_ibfk_1` FOREIGN KEY (`modelo_componente_id`) REFERENCES `modelos_componente` (`id`) ON DELETE CASCADE,
  CONSTRAINT `_trazabilidad_modelo_montaje_ibfk_2` FOREIGN KEY (`montaje_id`) REFERENCES `lu_montaje` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `_trazabilidad_modelo_proteccion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `modelo_componente_id` int(11) NOT NULL,
  `proteccion_id` int(11) NOT NULL,
  `notas` varchar(500) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_modelo_proteccion` (`modelo_componente_id`,`proteccion_id`),
  KEY `proteccion_id` (`proteccion_id`),
  CONSTRAINT `_trazabilidad_modelo_proteccion_ibfk_1` FOREIGN KEY (`modelo_componente_id`) REFERENCES `modelos_componente` (`id`) ON DELETE CASCADE,
  CONSTRAINT `_trazabilidad_modelo_proteccion_ibfk_2` FOREIGN KEY (`proteccion_id`) REFERENCES `lu_proteccion` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `actividad_consumible` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `actividad_preventiva_id` int(11) NOT NULL,
  `consumible_id` int(11) NOT NULL,
  `cantidad` decimal(10,3) DEFAULT NULL,
  `unidad` varchar(20) DEFAULT NULL,
  `notas` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_act_cons` (`actividad_preventiva_id`,`consumible_id`),
  KEY `idx_actcons_act` (`actividad_preventiva_id`),
  KEY `idx_actcons_cons` (`consumible_id`),
  CONSTRAINT `fk_actcons_act` FOREIGN KEY (`actividad_preventiva_id`) REFERENCES `actividad_preventiva` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_actcons_cons` FOREIGN KEY (`consumible_id`) REFERENCES `consumible_catalogo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Consumibles requeridos por cada actividad preventiva';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `actividad_preventiva` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo_componente_aplicable` enum('mechanical_unit','controller','drive_unit','external_axis','todos') NOT NULL,
  `tipo_actividad_id` int(11) NOT NULL,
  `componente` varchar(500) NOT NULL,
  `ejes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '[''1'',''2'',''3''] o NULL si aplica al robot completo' CHECK (json_valid(`ejes`)),
  `intervalo_horas` int(11) DEFAULT NULL,
  `intervalo_meses` smallint(6) DEFAULT NULL,
  `intervalo_condicion` enum('periodico','condicion','alerta_baja','mixto','n_a') NOT NULL DEFAULT 'periodico',
  `nivel_id` int(11) DEFAULT NULL COMMENT 'FK lu_nivel_mantenimiento',
  `obligatoria` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'false = extra opcional dentro del nivel (baterias, correas, etc)',
  `familia_id` int(11) DEFAULT NULL COMMENT 'Si aplica a toda una familia',
  `modelos_aplicables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array IDs modelos específicos: [5981, 5983, ...]' CHECK (json_valid(`modelos_aplicables`)),
  `montajes_aplicables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`montajes_aplicables`)),
  `protecciones_aplicables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`protecciones_aplicables`)),
  `controladores_aplicables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`controladores_aplicables`)),
  `documento_fuente` varchar(80) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `observaciones` varchar(500) DEFAULT NULL COMMENT 'Nota corta para visualización',
  `revisado` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_revisado` date DEFAULT NULL,
  `orden` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_familia` (`familia_id`),
  KEY `idx_nivel` (`nivel_id`),
  KEY `idx_tipo` (`tipo_actividad_id`),
  KEY `idx_componente` (`tipo_componente_aplicable`),
  KEY `idx_obligatoria` (`obligatoria`),
  CONSTRAINT `actividad_preventiva_ibfk_1` FOREIGN KEY (`tipo_actividad_id`) REFERENCES `lu_tipo_actividad` (`id`),
  CONSTRAINT `actividad_preventiva_ibfk_2` FOREIGN KEY (`nivel_id`) REFERENCES `lu_nivel_mantenimiento` (`id`),
  CONSTRAINT `actividad_preventiva_ibfk_3` FOREIGN KEY (`familia_id`) REFERENCES `lu_familia` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Actividades de mantenimiento preventivo unificadas v2.9';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(191) NOT NULL,
  `sede` varchar(191) DEFAULT NULL,
  `tarifa_hora_trabajo` decimal(10,2) DEFAULT NULL,
  `tarifa_hora_viaje` decimal(10,2) DEFAULT NULL,
  `dietas` decimal(10,2) DEFAULT NULL,
  `peajes` decimal(10,2) DEFAULT NULL,
  `km` decimal(10,2) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `direccion` varchar(500) DEFAULT NULL,
  `ciudad` varchar(200) DEFAULT NULL,
  `codigo_postal` varchar(20) DEFAULT NULL,
  `provincia` varchar(200) DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `email` varchar(200) DEFAULT NULL,
  `persona_contacto` varchar(200) DEFAULT NULL,
  `gestion_accesos` decimal(10,2) DEFAULT NULL,
  `horas_trayecto` decimal(8,2) DEFAULT NULL,
  `dias_viaje` decimal(8,2) DEFAULT NULL,
  `precio_hotel` decimal(10,2) DEFAULT NULL,
  `precio_km` decimal(10,2) DEFAULT NULL,
  `logo` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `componentes_informe` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `informe_id` int(11) NOT NULL,
  `componente_sistema_id` int(11) NOT NULL,
  `version_template_id` int(11) NOT NULL,
  `tipo_componente` enum('controller','mechanical_unit','drive_unit') NOT NULL,
  `etiqueta` varchar(191) NOT NULL,
  `orden` int(11) NOT NULL DEFAULT 0,
  `schema_congelado` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`schema_congelado`)),
  `datos` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`datos`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `componentes_informe_informe_id_componente_sistema_id_key` (`informe_id`,`componente_sistema_id`),
  KEY `componentes_informe_componente_sistema_id_fkey` (`componente_sistema_id`),
  KEY `componentes_informe_version_template_id_fkey` (`version_template_id`),
  CONSTRAINT `componentes_informe_componente_sistema_id_fkey` FOREIGN KEY (`componente_sistema_id`) REFERENCES `componentes_sistema` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `componentes_informe_informe_id_fkey` FOREIGN KEY (`informe_id`) REFERENCES `informes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `componentes_informe_version_template_id_fkey` FOREIGN KEY (`version_template_id`) REFERENCES `versiones_template` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `componentes_sistema` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sistema_id` int(11) NOT NULL,
  `modelo_componente_id` int(11) NOT NULL,
  `tipo` enum('controller','mechanical_unit','drive_unit','external_axis') NOT NULL,
  `etiqueta` varchar(191) NOT NULL,
  `numero_serie` varchar(191) DEFAULT NULL,
  `num_ejes` int(11) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `orden` int(11) NOT NULL DEFAULT 0,
  `componente_padre_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `componentes_sistema_sistema_id_fkey` (`sistema_id`),
  KEY `componentes_sistema_modelo_componente_id_fkey` (`modelo_componente_id`),
  KEY `idx_comp_padre` (`componente_padre_id`),
  CONSTRAINT `componentes_sistema_modelo_componente_id_fkey` FOREIGN KEY (`modelo_componente_id`) REFERENCES `modelos_componente` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `componentes_sistema_sistema_id_fkey` FOREIGN KEY (`sistema_id`) REFERENCES `sistemas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_comp_padre` FOREIGN KEY (`componente_padre_id`) REFERENCES `componentes_sistema` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion_app` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `clave` varchar(191) NOT NULL,
  `valor` text NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `configuracion_app_clave_key` (`clave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `consumible_catalogo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo_interno` varchar(20) DEFAULT NULL,
  `tipo` enum('aceite','grasa','bateria','filtro','ventilador','rodamiento','sello','cable','ball_screw','tope_mecanico','tarjeta','desiccant','limpieza','otro') NOT NULL,
  `subtipo` varchar(80) DEFAULT NULL,
  `nombre` varchar(200) NOT NULL,
  `codigo_fabricante` varchar(80) DEFAULT NULL,
  `fabricante` varchar(100) DEFAULT NULL,
  `unidad` varchar(20) DEFAULT NULL,
  `cantidad_unidad` decimal(10,3) DEFAULT NULL COMMENT 'Cantidad por unidad de compra. Ej: 5.000 si el bidón es de 5L',
  `equivalencias` text DEFAULT NULL,
  `apariciones` int(11) DEFAULT 0 COMMENT 'Cuantas veces aparece en lubricacion/mantenimiento del catalogo',
  `coste` decimal(10,2) DEFAULT NULL,
  `multiplicador_venta` decimal(3,2) NOT NULL DEFAULT 2.40 COMMENT 'Margen sobre coste para calcular precio. Default 2.40 (rango 2.10-2.60)',
  `precio` decimal(10,2) DEFAULT NULL,
  `moneda` char(3) NOT NULL DEFAULT 'EUR' COMMENT 'Código ISO 4217. EUR, HUF, MAD, USD',
  `fecha_precio` date DEFAULT NULL COMMENT 'Fecha en que se actualizó coste/precio',
  `fabricante_robot` varchar(100) DEFAULT NULL,
  `ref_original` varchar(100) DEFAULT NULL,
  `ref_proveedor` varchar(100) DEFAULT NULL,
  `proveedor` varchar(100) DEFAULT NULL COMMENT 'Distribuidor donde se compra. Distinto del fabricante (ej: Würth, Brammer)',
  `notas` text DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_consumible_nombre` (`nombre`),
  UNIQUE KEY `uq_consumible_codigo_interno` (`codigo_interno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `consumible_precio_historico` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `consumible_id` int(11) NOT NULL,
  `fecha_precio` date NOT NULL,
  `proveedor` varchar(100) DEFAULT NULL,
  `ref_proveedor` varchar(100) DEFAULT NULL,
  `unidad` varchar(20) DEFAULT NULL,
  `cantidad_unidad` decimal(10,3) DEFAULT NULL,
  `coste` decimal(10,2) NOT NULL,
  `multiplicador_venta` decimal(3,2) NOT NULL DEFAULT 2.40,
  `precio` decimal(10,2) DEFAULT NULL,
  `moneda` char(3) NOT NULL DEFAULT 'EUR',
  `notas` text DEFAULT NULL,
  `oferta_proveedor` varchar(50) DEFAULT NULL COMMENT 'Referencia oferta proveedor (ej: 6615)',
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `idx_cph_consumible_fecha` (`consumible_id`,`fecha_precio` DESC),
  KEY `idx_cph_proveedor_fecha` (`proveedor`,`fecha_precio` DESC),
  CONSTRAINT `fk_cph_consumible` FOREIGN KEY (`consumible_id`) REFERENCES `consumible_catalogo` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `document_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` varchar(50) NOT NULL,
  `nombre` varchar(200) NOT NULL,
  `schema` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`schema`)),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `tipo` (`tipo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `fabricantes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(191) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `orden` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `fabricantes_nombre_key` (`nombre`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `informes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `intervencion_id` int(11) NOT NULL,
  `sistema_id` int(11) NOT NULL,
  `estado` enum('inactivo','activo','finalizado') NOT NULL DEFAULT 'inactivo',
  `fecha_realizacion` datetime(3) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `creado_por_id` int(11) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `datos_documento` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT '{}' CHECK (json_valid(`datos_documento`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `informes_intervencion_id_sistema_id_key` (`intervencion_id`,`sistema_id`),
  KEY `informes_sistema_id_fkey` (`sistema_id`),
  KEY `informes_creado_por_id_fkey` (`creado_por_id`),
  CONSTRAINT `informes_creado_por_id_fkey` FOREIGN KEY (`creado_por_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `informes_intervencion_id_fkey` FOREIGN KEY (`intervencion_id`) REFERENCES `intervenciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `informes_sistema_id_fkey` FOREIGN KEY (`sistema_id`) REFERENCES `sistemas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `intervencion_sistema` (
  `intervencion_id` int(11) NOT NULL,
  `sistema_id` int(11) NOT NULL,
  `nivel_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`intervencion_id`,`sistema_id`),
  KEY `intervencion_sistema_sistema_id_fkey` (`sistema_id`),
  KEY `fk_is_nivel` (`nivel_id`),
  CONSTRAINT `fk_is_nivel` FOREIGN KEY (`nivel_id`) REFERENCES `lu_nivel_mantenimiento` (`id`),
  CONSTRAINT `intervencion_sistema_intervencion_id_fkey` FOREIGN KEY (`intervencion_id`) REFERENCES `intervenciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `intervencion_sistema_sistema_id_fkey` FOREIGN KEY (`sistema_id`) REFERENCES `sistemas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `intervenciones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `oferta_id` int(11) DEFAULT NULL,
  `tipo` enum('preventiva','correctiva') NOT NULL,
  `estado` enum('borrador','en_curso','completada','facturada') NOT NULL DEFAULT 'borrador',
  `referencia` varchar(191) DEFAULT NULL,
  `titulo` varchar(191) NOT NULL,
  `fecha_inicio` datetime(3) DEFAULT NULL,
  `fecha_fin` datetime(3) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `tarifa_hora_trabajo` decimal(10,2) DEFAULT NULL,
  `tarifa_hora_viaje` decimal(10,2) DEFAULT NULL,
  `dietas` decimal(10,2) DEFAULT NULL,
  `gestion_accesos` decimal(10,2) DEFAULT NULL,
  `horas_trayecto` decimal(8,2) DEFAULT NULL,
  `dias_viaje` decimal(8,2) DEFAULT NULL,
  `km` decimal(10,2) DEFAULT NULL,
  `peajes` decimal(10,2) DEFAULT NULL,
  `precio_hotel` decimal(10,2) DEFAULT NULL,
  `precio_km` decimal(10,2) DEFAULT NULL,
  `gestion_accesos_nueva` tinyint(1) NOT NULL DEFAULT 0,
  `numero_tecnicos` int(11) NOT NULL DEFAULT 1,
  `viajes_ida_vuelta` int(11) NOT NULL DEFAULT 1,
  `incluye_consumibles` tinyint(1) NOT NULL DEFAULT 1,
  `horas_dia` decimal(8,2) DEFAULT NULL,
  `dietas_extra` decimal(10,2) DEFAULT NULL,
  `dias_trabajo` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `intervenciones_cliente_id_fkey` (`cliente_id`),
  KEY `oferta_id` (`oferta_id`),
  CONSTRAINT `intervenciones_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `intervenciones_ibfk_1` FOREIGN KEY (`oferta_id`) REFERENCES `ofertas` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lu_familia` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fabricante_id` int(11) NOT NULL,
  `codigo` varchar(80) NOT NULL,
  `tipo` enum('mechanical_unit','external_axis','controller','drive_unit') NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `activa` tinyint(1) NOT NULL DEFAULT 1,
  `tipo_cinematica` varchar(30) DEFAULT 'articulated_6axis',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_fam_fab_cod` (`fabricante_id`,`codigo`,`tipo`),
  CONSTRAINT `fk_familia_fab` FOREIGN KEY (`fabricante_id`) REFERENCES `fabricantes` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lu_generacion_controlador` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `drive_system` varchar(50) DEFAULT NULL,
  `anio_desde` smallint(6) DEFAULT NULL,
  `anio_hasta` smallint(6) DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `orden` int(11) NOT NULL DEFAULT 0,
  `notas` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lu_montaje` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) NOT NULL,
  `descripcion` varchar(100) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lu_nivel_mantenimiento` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(20) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `ambito` enum('manipulador','controlador','drive_unit','eje_externo') NOT NULL DEFAULT 'manipulador',
  `orden` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lu_proteccion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(40) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(500) DEFAULT NULL,
  `afecta_lubricacion` tinyint(1) DEFAULT 0,
  `activa` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lu_tipo_actividad` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(50) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `categoria` enum('inspeccion','lubricacion','reemplazo','overhaul','analisis','bateria','correa','filtro','desiccant','limpieza','otro') NOT NULL DEFAULT 'otro',
  `requiere_parada` tinyint(1) NOT NULL DEFAULT 1,
  `orden` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `codigo` (`codigo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `lubricacion` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `modelo_componente_id` int(11) NOT NULL,
  `eje` varchar(30) NOT NULL,
  `consumible_id` int(11) DEFAULT NULL,
  `cantidad_valor` decimal(10,3) DEFAULT NULL,
  `cantidad_unidad` enum('ml','l','g','kg','pcs','n_a') DEFAULT NULL,
  `web_config` varchar(100) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `documento_fuente` varchar(80) DEFAULT NULL COMMENT 'Manual ABB origen ej: 3HAC042927',
  `pagina_manual` smallint(6) DEFAULT NULL COMMENT 'Página del manual donde se verificó',
  `revisado` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 si verificado contra manual, 0 si pendiente',
  `fecha_revisado` date DEFAULT NULL,
  `lifetime` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 = lubricación de por vida (no se cambia en mantenimiento normal)',
  `montajes_aplicables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`montajes_aplicables`)),
  `protecciones_aplicables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`protecciones_aplicables`)),
  `controladores_aplicables` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`controladores_aplicables`)),
  `intervalo_horas` int(11) DEFAULT NULL COMMENT 'Horas de operación entre cambios (del manual). Si el manual lo documenta en meses, se convierte: 1 mes = 730 h aprox',
  `nivel_id` int(11) DEFAULT NULL,
  `actividad_documentada` varchar(50) DEFAULT NULL COMMENT 'Tipo de actividad documentada: oil_change, grease_refill, grease_change, no_preventive, lifetime_lubricated',
  PRIMARY KEY (`id`),
  KEY `idx_lub_modelo` (`modelo_componente_id`),
  KEY `idx_lub_nivel` (`nivel_id`),
  KEY `idx_lub_consumible` (`consumible_id`),
  CONSTRAINT `fk_lub_consumible` FOREIGN KEY (`consumible_id`) REFERENCES `consumible_catalogo` (`id`),
  CONSTRAINT `fk_lub_modelo` FOREIGN KEY (`modelo_componente_id`) REFERENCES `modelos_componente` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_lubricacion_nivel` FOREIGN KEY (`nivel_id`) REFERENCES `lu_nivel_mantenimiento` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_insert_lubricacion_check_unique` BEFORE INSERT ON `lubricacion` FOR EACH ROW BEGIN
    IF NEW.montajes_aplicables IS NOT NULL 
       AND NEW.protecciones_aplicables IS NOT NULL 
       AND NEW.controladores_aplicables IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM lubricacion l
            WHERE l.modelo_componente_id = NEW.modelo_componente_id
              AND l.eje = NEW.eje
              AND l.montajes_aplicables IS NOT NULL
              AND l.protecciones_aplicables IS NOT NULL
              AND l.controladores_aplicables IS NOT NULL
              AND JSON_OVERLAPS(l.montajes_aplicables, NEW.montajes_aplicables)
              AND JSON_OVERLAPS(l.protecciones_aplicables, NEW.protecciones_aplicables)
              AND JSON_OVERLAPS(l.controladores_aplicables, NEW.controladores_aplicables)
              AND (
                  (l.consumible_id IS NULL AND NEW.consumible_id IS NULL)
                  OR (l.consumible_id = NEW.consumible_id)
              )
              AND (
                  (l.cantidad_valor IS NULL AND NEW.cantidad_valor IS NULL)
                  OR (l.cantidad_valor = NEW.cantidad_valor)
              )
        ) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Conflicto integridad lubricacion: ya existe fila para mismo modelo/eje/consumible/cantidad con overlap en montajes/protecciones/controladores';
        END IF;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_general_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'NO_AUTO_VALUE_ON_ZERO' */ ;
DELIMITER ;;
/*!50003 CREATE*/ /*!50017 DEFINER=`root`@`localhost`*/ /*!50003 TRIGGER `before_update_lubricacion_check_unique` BEFORE UPDATE ON `lubricacion` FOR EACH ROW BEGIN
    IF NEW.montajes_aplicables IS NOT NULL 
       AND NEW.protecciones_aplicables IS NOT NULL 
       AND NEW.controladores_aplicables IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM lubricacion l
            WHERE l.id != NEW.id
              AND l.modelo_componente_id = NEW.modelo_componente_id
              AND l.eje = NEW.eje
              AND l.montajes_aplicables IS NOT NULL
              AND l.protecciones_aplicables IS NOT NULL
              AND l.controladores_aplicables IS NOT NULL
              AND JSON_OVERLAPS(l.montajes_aplicables, NEW.montajes_aplicables)
              AND JSON_OVERLAPS(l.protecciones_aplicables, NEW.protecciones_aplicables)
              AND JSON_OVERLAPS(l.controladores_aplicables, NEW.controladores_aplicables)
              AND (
                  (l.consumible_id IS NULL AND NEW.consumible_id IS NULL)
                  OR (l.consumible_id = NEW.consumible_id)
              )
              AND (
                  (l.cantidad_valor IS NULL AND NEW.cantidad_valor IS NULL)
                  OR (l.cantidad_valor = NEW.cantidad_valor)
              )
        ) THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Conflicto integridad lubricacion (UPDATE): ya existe fila para mismo modelo/eje/consumible/cantidad con overlap';
        END IF;
    END IF;
END */;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `mantenimiento_horas_modelo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `modelo_componente_id` int(11) NOT NULL,
  `controlador_modelo_id` int(11) DEFAULT NULL COMMENT 'NULL si las horas no dependen del controlador',
  `nivel_id` int(11) NOT NULL,
  `horas` decimal(5,2) NOT NULL COMMENT 'Horas de trabajo del técnico para esta combinación',
  `revisado` tinyint(1) NOT NULL DEFAULT 0,
  `fecha_revisado` date DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `created_at` datetime(3) DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mhm` (`modelo_componente_id`,`controlador_modelo_id`,`nivel_id`),
  KEY `idx_mhm_modelo` (`modelo_componente_id`),
  KEY `idx_mhm_ctrl` (`controlador_modelo_id`),
  KEY `idx_mhm_nivel` (`nivel_id`),
  CONSTRAINT `mantenimiento_horas_modelo_ibfk_1` FOREIGN KEY (`modelo_componente_id`) REFERENCES `modelos_componente` (`id`) ON DELETE CASCADE,
  CONSTRAINT `mantenimiento_horas_modelo_ibfk_2` FOREIGN KEY (`controlador_modelo_id`) REFERENCES `modelos_componente` (`id`),
  CONSTRAINT `mantenimiento_horas_modelo_ibfk_3` FOREIGN KEY (`nivel_id`) REFERENCES `lu_nivel_mantenimiento` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Horas de trabajo de técnico por modelo+controlador+nivel para ofertas y planificación';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `maquinas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `planta_id` int(11) NOT NULL,
  `nombre` varchar(191) NOT NULL,
  `descripcion` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `maquinas_cliente_id_planta_id_nombre_key` (`cliente_id`,`planta_id`,`nombre`),
  KEY `maquinas_planta_id_fkey` (`planta_id`),
  CONSTRAINT `maquinas_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `maquinas_planta_id_fkey` FOREIGN KEY (`planta_id`) REFERENCES `plantas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `modelos_componente` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fabricante_id` int(11) NOT NULL,
  `tipo` enum('controller','mechanical_unit','drive_unit','external_axis') NOT NULL,
  `familia_id` int(11) DEFAULT NULL,
  `generacion_controlador_id` int(11) DEFAULT NULL,
  `nombre` varchar(191) NOT NULL,
  `type_variant` varchar(50) DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `aceites_config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`aceites_config`)),
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  `niveles_legacy_eliminar` varchar(100) DEFAULT NULL,
  `max_robots_multimove` tinyint(4) DEFAULT NULL,
  `max_ejes_externos` tinyint(4) DEFAULT NULL,
  `soporta_multimove` tinyint(1) DEFAULT NULL,
  `tipo_bateria_medida` enum('smb','eib') DEFAULT NULL COMMENT 'Solo aplica a mechanical_unit',
  `activa` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Si el modelo está activo y disponible para crear sistemas',
  `nivel_n1` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'N1 inspección - siempre aplicable',
  `nivel_n2_inf` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'N2 inferior - cambio aceite ejes 1-4',
  `nivel_n2_sup` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'N2 superior - cambio aceite ejes 5-6',
  `nivel_n3` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'N3 - cambio total (n2_inf AND n2_sup)',
  `montajes_disponibles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array IDs lu_montaje' CHECK (json_valid(`montajes_disponibles`)),
  `protecciones_disponibles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array IDs lu_proteccion' CHECK (json_valid(`protecciones_disponibles`)),
  `controladores_compatibles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array IDs modelos_componente (controllers)' CHECK (json_valid(`controladores_compatibles`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `modelos_componente_fab_tipo_nombre` (`fabricante_id`,`tipo`,`nombre`),
  KEY `idx_fabricante_id` (`fabricante_id`),
  KEY `fk_modcomp_familia` (`familia_id`),
  KEY `fk_modcomp_gen` (`generacion_controlador_id`),
  CONSTRAINT `fk_modcomp_familia` FOREIGN KEY (`familia_id`) REFERENCES `lu_familia` (`id`),
  CONSTRAINT `fk_modcomp_gen` FOREIGN KEY (`generacion_controlador_id`) REFERENCES `lu_generacion_controlador` (`id`),
  CONSTRAINT `modelos_componente_fabricante_id_fkey` FOREIGN KEY (`fabricante_id`) REFERENCES `fabricantes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `oferta_bloque_calendario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `oferta_id` int(11) NOT NULL,
  `fecha` date NOT NULL,
  `hora_inicio` varchar(8) NOT NULL COMMENT 'HH:MM en franjas de 30 min',
  `hora_fin` varchar(8) NOT NULL COMMENT 'HH:MM en franjas de 30 min',
  `tipo` enum('trabajo','desplazamiento','comida') NOT NULL,
  `notas` varchar(500) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  `oferta_componente_id` int(11) DEFAULT NULL COMMENT 'Vincula con oferta_componente cuando el bloque cubre mantenimiento de un componente concreto',
  `origen_tipo` enum('componente','desplazamiento','manual','comida') NOT NULL DEFAULT 'manual',
  PRIMARY KEY (`id`),
  KEY `idx_obc_oferta` (`oferta_id`),
  KEY `idx_obc_fecha` (`oferta_id`,`fecha`),
  KEY `idx_obc_componente` (`oferta_componente_id`),
  CONSTRAINT `fk_obc_componente` FOREIGN KEY (`oferta_componente_id`) REFERENCES `oferta_componente` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_obc_oferta` FOREIGN KEY (`oferta_id`) REFERENCES `ofertas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `oferta_componente` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `oferta_id` int(11) NOT NULL,
  `componente_sistema_id` int(11) NOT NULL,
  `nivel_id` int(11) DEFAULT NULL,
  `con_baterias` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'mech_unit: SMB/EIB; controller/drive: pilas',
  `con_aceite` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'external_axis: cambia aceite si tiene',
  `horas` decimal(8,2) DEFAULT NULL,
  `coste_consumibles` decimal(10,2) DEFAULT NULL,
  `precio_consumibles` decimal(10,2) DEFAULT NULL,
  `coste_limpieza` decimal(10,2) DEFAULT NULL,
  `notas` varchar(500) DEFAULT NULL,
  `created_at` datetime(3) DEFAULT current_timestamp(3),
  `updated_at` datetime(3) DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_oc` (`oferta_id`,`componente_sistema_id`),
  KEY `idx_oc_oferta` (`oferta_id`),
  KEY `idx_oc_comp` (`componente_sistema_id`),
  KEY `fk_oc_nivel` (`nivel_id`),
  CONSTRAINT `fk_oc_comp` FOREIGN KEY (`componente_sistema_id`) REFERENCES `componentes_sistema` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_oc_nivel` FOREIGN KEY (`nivel_id`) REFERENCES `lu_nivel_mantenimiento` (`id`),
  CONSTRAINT `fk_oc_oferta` FOREIGN KEY (`oferta_id`) REFERENCES `ofertas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `oferta_sistema` (
  `oferta_id` int(11) NOT NULL,
  `sistema_id` int(11) NOT NULL,
  `nivel_id` int(11) DEFAULT NULL,
  `horas` decimal(8,2) DEFAULT NULL,
  `coste_consumibles` decimal(10,2) DEFAULT NULL,
  `precio_consumibles` decimal(10,2) DEFAULT NULL,
  PRIMARY KEY (`oferta_id`,`sistema_id`),
  KEY `sistema_id` (`sistema_id`),
  KEY `fk_os_nivel` (`nivel_id`),
  CONSTRAINT `fk_os_nivel` FOREIGN KEY (`nivel_id`) REFERENCES `lu_nivel_mantenimiento` (`id`),
  CONSTRAINT `oferta_sistema_ibfk_1` FOREIGN KEY (`oferta_id`) REFERENCES `ofertas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `oferta_sistema_ibfk_2` FOREIGN KEY (`sistema_id`) REFERENCES `sistemas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `ofertas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `titulo` varchar(300) NOT NULL,
  `referencia` varchar(100) DEFAULT NULL,
  `tipo` enum('preventiva','correctiva') NOT NULL,
  `estado` varchar(50) NOT NULL DEFAULT 'borrador',
  `fecha_oferta` datetime NOT NULL DEFAULT current_timestamp(),
  `validez_dias` int(11) NOT NULL DEFAULT 30,
  `notas` text DEFAULT NULL,
  `total_horas` decimal(8,2) DEFAULT NULL,
  `total_coste` decimal(10,2) DEFAULT NULL,
  `total_precio` decimal(10,2) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `fecha_inicio` datetime DEFAULT NULL,
  `fecha_fin` datetime DEFAULT NULL,
  `hora_inicio_jornada` varchar(191) DEFAULT NULL,
  `hora_fin_jornada` varchar(191) DEFAULT NULL,
  `dias_trabajo` varchar(191) DEFAULT NULL,
  `desglose_recargo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`desglose_recargo`)),
  `total_recargo` decimal(10,2) DEFAULT NULL,
  `tipo_oferta` enum('mantenimiento','solo_limpieza') NOT NULL DEFAULT 'mantenimiento' COMMENT 'Mantenimiento incluye aceites/baterias + limpieza; solo_limpieza solo lo segundo',
  PRIMARY KEY (`id`),
  KEY `cliente_id` (`cliente_id`),
  CONSTRAINT `ofertas_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos_compra` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `intervencion_id` int(11) NOT NULL,
  `estado` varchar(50) NOT NULL DEFAULT 'pendiente',
  `notas` text DEFAULT NULL,
  `lineas` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`lineas`)),
  `total_coste` decimal(10,2) DEFAULT NULL,
  `total_precio` decimal(10,2) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `intervencion_id` (`intervencion_id`),
  CONSTRAINT `pedidos_compra_ibfk_1` FOREIGN KEY (`intervencion_id`) REFERENCES `intervenciones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `plantas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `nombre` varchar(191) NOT NULL,
  `direccion` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `plantas_cliente_id_nombre_key` (`cliente_id`,`nombre`),
  CONSTRAINT `plantas_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `sistemas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cliente_id` int(11) NOT NULL,
  `planta_id` int(11) DEFAULT NULL,
  `maquina_id` int(11) DEFAULT NULL,
  `fabricante_id` int(11) NOT NULL,
  `nombre` varchar(191) NOT NULL,
  `descripcion` varchar(191) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sistemas_cliente_id_fabricante_id_nombre_key` (`cliente_id`,`fabricante_id`,`nombre`),
  KEY `sistemas_planta_id_fkey` (`planta_id`),
  KEY `sistemas_maquina_id_fkey` (`maquina_id`),
  KEY `sistemas_fabricante_id_fkey` (`fabricante_id`),
  CONSTRAINT `sistemas_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sistemas_fabricante_id_fkey` FOREIGN KEY (`fabricante_id`) REFERENCES `fabricantes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sistemas_maquina_id_fkey` FOREIGN KEY (`maquina_id`) REFERENCES `maquinas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sistemas_planta_id_fkey` FOREIGN KEY (`planta_id`) REFERENCES `plantas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `microsoft_id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `nombre` varchar(191) NOT NULL,
  `avatar` varchar(191) DEFAULT NULL,
  `rol` enum('admin','tecnico') NOT NULL DEFAULT 'tecnico',
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `usuarios_microsoft_id_key` (`microsoft_id`),
  UNIQUE KEY `usuarios_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_actividad_preventiva` AS SELECT
 1 AS `id`,
  1 AS `tipo_componente_aplicable`,
  1 AS `tipo_actividad_id`,
  1 AS `componente`,
  1 AS `ejes`,
  1 AS `intervalo_horas`,
  1 AS `intervalo_meses`,
  1 AS `intervalo_condicion`,
  1 AS `nivel_id`,
  1 AS `obligatoria`,
  1 AS `familia_id`,
  1 AS `modelos_aplicables`,
  1 AS `montajes_aplicables`,
  1 AS `protecciones_aplicables`,
  1 AS `controladores_aplicables`,
  1 AS `documento_fuente`,
  1 AS `notas`,
  1 AS `observaciones`,
  1 AS `revisado`,
  1 AS `fecha_revisado`,
  1 AS `orden`,
  1 AS `created_at`,
  1 AS `consumibles` */;
SET character_set_client = @saved_cs_client;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8mb4;
/*!50001 CREATE VIEW `v_lubricacion` AS SELECT
 1 AS `id`,
  1 AS `modelo_componente_id`,
  1 AS `modelo_nombre`,
  1 AS `familia_id`,
  1 AS `familia_codigo`,
  1 AS `eje`,
  1 AS `consumible_id`,
  1 AS `consumible_nombre`,
  1 AS `consumible_tipo`,
  1 AS `consumible_subtipo`,
  1 AS `codigo_fabricante`,
  1 AS `consumible_fabricante`,
  1 AS `cantidad_valor`,
  1 AS `cantidad_unidad`,
  1 AS `intervalo_horas`,
  1 AS `lifetime`,
  1 AS `actividad_documentada`,
  1 AS `nivel_id`,
  1 AS `nivel_codigo`,
  1 AS `nivel_nombre`,
  1 AS `montajes_aplicables`,
  1 AS `protecciones_aplicables`,
  1 AS `controladores_aplicables`,
  1 AS `documento_fuente`,
  1 AS `pagina_manual`,
  1 AS `revisado`,
  1 AS `fecha_revisado`,
  1 AS `web_config`,
  1 AS `notas` */;
SET character_set_client = @saved_cs_client;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `versiones_template` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `modelo_componente_id` int(11) NOT NULL,
  `version` int(11) NOT NULL,
  `estado` enum('borrador','activo','obsoleto') NOT NULL DEFAULT 'borrador',
  `schema` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`schema`)),
  `notas` text DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `versiones_template_modelo_componente_id_version_key` (`modelo_componente_id`,`version`),
  CONSTRAINT `versiones_template_modelo_componente_id_fkey` FOREIGN KEY (`modelo_componente_id`) REFERENCES `modelos_componente` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!50001 DROP VIEW IF EXISTS `v_actividad_preventiva`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `v_actividad_preventiva` AS select `ap`.`id` AS `id`,`ap`.`tipo_componente_aplicable` AS `tipo_componente_aplicable`,`ap`.`tipo_actividad_id` AS `tipo_actividad_id`,`ap`.`componente` AS `componente`,`ap`.`ejes` AS `ejes`,`ap`.`intervalo_horas` AS `intervalo_horas`,`ap`.`intervalo_meses` AS `intervalo_meses`,`ap`.`intervalo_condicion` AS `intervalo_condicion`,`ap`.`nivel_id` AS `nivel_id`,`ap`.`obligatoria` AS `obligatoria`,`ap`.`familia_id` AS `familia_id`,`ap`.`modelos_aplicables` AS `modelos_aplicables`,`ap`.`montajes_aplicables` AS `montajes_aplicables`,`ap`.`protecciones_aplicables` AS `protecciones_aplicables`,`ap`.`controladores_aplicables` AS `controladores_aplicables`,`ap`.`documento_fuente` AS `documento_fuente`,`ap`.`notas` AS `notas`,`ap`.`observaciones` AS `observaciones`,`ap`.`revisado` AS `revisado`,`ap`.`fecha_revisado` AS `fecha_revisado`,`ap`.`orden` AS `orden`,`ap`.`created_at` AS `created_at`,(select json_arrayagg(json_object('consumible_id',`ac`.`consumible_id`,'codigo_interno',`cc`.`codigo_interno`,'nombre',`cc`.`nombre`,'cantidad',`ac`.`cantidad`,'unidad',`ac`.`unidad`,'notas',`ac`.`notas`)) from (`actividad_consumible` `ac` join `consumible_catalogo` `cc` on(`cc`.`id` = `ac`.`consumible_id`)) where `ac`.`actividad_preventiva_id` = `ap`.`id`) AS `consumibles` from `actividad_preventiva` `ap` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `v_lubricacion`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = latin1 */;
/*!50001 SET character_set_results     = latin1 */;
/*!50001 SET collation_connection      = latin1_swedish_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 */
/*!50001 VIEW `v_lubricacion` AS select `l`.`id` AS `id`,`mc`.`id` AS `modelo_componente_id`,`mc`.`nombre` AS `modelo_nombre`,`f`.`id` AS `familia_id`,`f`.`codigo` AS `familia_codigo`,`l`.`eje` AS `eje`,`l`.`consumible_id` AS `consumible_id`,`cc`.`nombre` AS `consumible_nombre`,`cc`.`tipo` AS `consumible_tipo`,`cc`.`subtipo` AS `consumible_subtipo`,`cc`.`codigo_fabricante` AS `codigo_fabricante`,`cc`.`fabricante` AS `consumible_fabricante`,`l`.`cantidad_valor` AS `cantidad_valor`,`l`.`cantidad_unidad` AS `cantidad_unidad`,`l`.`intervalo_horas` AS `intervalo_horas`,`l`.`lifetime` AS `lifetime`,`l`.`actividad_documentada` AS `actividad_documentada`,`l`.`nivel_id` AS `nivel_id`,`lnm`.`codigo` AS `nivel_codigo`,`lnm`.`nombre` AS `nivel_nombre`,`l`.`montajes_aplicables` AS `montajes_aplicables`,`l`.`protecciones_aplicables` AS `protecciones_aplicables`,`l`.`controladores_aplicables` AS `controladores_aplicables`,`l`.`documento_fuente` AS `documento_fuente`,`l`.`pagina_manual` AS `pagina_manual`,`l`.`revisado` AS `revisado`,`l`.`fecha_revisado` AS `fecha_revisado`,`l`.`web_config` AS `web_config`,`l`.`notas` AS `notas` from ((((`lubricacion` `l` join `modelos_componente` `mc` on(`mc`.`id` = `l`.`modelo_componente_id`)) left join `lu_familia` `f` on(`f`.`id` = `mc`.`familia_id`)) left join `consumible_catalogo` `cc` on(`cc`.`id` = `l`.`consumible_id`)) left join `lu_nivel_mantenimiento` `lnm` on(`lnm`.`id` = `l`.`nivel_id`)) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

