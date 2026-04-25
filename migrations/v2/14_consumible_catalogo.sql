-- ==============================================================================
-- PAS ROBOTICS MANAGE - Catalogo unificado de consumibles
-- ==============================================================================
-- Crea tabla consumible_catalogo basada en CONSUMIBLES_CATALOGO.md y la pobla
-- con los ~70 consumibles que aparecen en BD ABB v7.
--
-- Este catalogo es la futura fuente de verdad para consumibles.
-- Las tablas legacy (aceites, consumibles) se mantienen por compatibilidad.
-- ==============================================================================

-- 1. Schema
CREATE TABLE IF NOT EXISTS consumible_catalogo (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  tipo          ENUM('aceite','grasa','bateria','filtro','ventilador','rodamiento',
                     'sello','cable','ball_screw','tope_mecanico','tarjeta','desiccant','otro') NOT NULL,
  subtipo       VARCHAR(80),
  nombre        VARCHAR(200) NOT NULL,
  codigo_abb    VARCHAR(80),
  fabricante    VARCHAR(100),
  unidad        VARCHAR(20),
  equivalencias TEXT,
  apariciones   INT DEFAULT 0 COMMENT 'Cuantas veces aparece en lubricacion/mantenimiento del catalogo',
  notas         TEXT,
  activo        TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY uq_consumible_nombre (nombre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Seed con catalogo del MD

-- ===== 2.1 ACEITES de engranajes / reductoras =====
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, codigo_abb, fabricante, unidad, equivalencias, apariciones, notas) VALUES
  ('aceite', 'engranaje', 'Kyodo Yushi TMO 150', NULL, 'Kyodo Yushi', 'L', NULL, 305, 'Aceite mas comun en BD'),
  ('aceite', 'engranaje', 'Mobilgear 600 XP 320', NULL, 'Mobil', 'L', 'Variantes: /XMP 320, /XMP, Mobil Mobilgear 600 XP320', 185, NULL),
  ('aceite', 'engranaje', 'Optimol Optigear BM 100', NULL, 'Optimol', 'L', 'Variantes: BM100, i 3000ml, New wrist', 30, NULL),
  ('aceite', 'engranaje', 'Shell Omala S4 WE 150', NULL, 'Shell', 'L', '= Shell Tivela S150', 4, NULL),
  ('aceite', 'engranaje', 'Shell Tivela S150', NULL, 'Shell', 'L', '= Shell Omala S4 WE150', 3, NULL),
  ('aceite', 'engranaje', 'Optimol Optigear RMO150', NULL, 'Optimol', 'L', '= Castrol Optigear RO150', 3, NULL),
  ('aceite', 'engranaje', 'Mobil DTE FM 220', NULL, 'Mobil', 'L', NULL, 3, NULL),
  ('aceite', 'engranaje', 'Mobil Glygoyl 460', NULL, 'Mobil', 'L', NULL, 2, 'Unico en BD');

-- Aceites ABB con codigo propio
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, codigo_abb, fabricante, unidad, equivalencias, apariciones, notas) VALUES
  ('aceite', 'abb_codigo', 'Aceite ABB 1171 2016-604', '1171 2016-604', 'ABB', 'L', '= BP Energol GR-XP 320', 6, NULL);

-- ===== 2.2 GRASAS =====

-- 2.2.1 Grasa harmonic
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, codigo_abb, fabricante, unidad, apariciones, notas) VALUES
  ('grasa', 'harmonic', 'Harmonic grease 4B No.2', NULL, NULL, 'kg', 53, 'Grasa especifica reductoras armonicas. Variantes mayusculas/espacios.'),
  ('grasa', 'harmonic', 'Harmonic Grease Flexolub-1A', NULL, NULL, 'kg', 4, NULL);

-- 2.2.2 Grasa estandar industrial
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, codigo_abb, fabricante, unidad, equivalencias, apariciones, notas) VALUES
  ('grasa', 'industrial', 'Grasa FM222', NULL, NULL, 'kg', NULL, 4, NULL),
  ('grasa', 'industrial', 'Grasa liquida ABB 1171 4016-611', '1171 4016-611', 'ABB', 'kg', '= BP Energrease LS-EP00', 3, NULL),
  ('grasa', 'industrial', 'THK AFA Grease', NULL, 'THK', 'kg', NULL, 3, 'Para ball screw spline'),
  ('grasa', 'industrial', 'ESSO Beacon EP 2', '1171 4013-301', 'Esso', 'kg', '= ABB 1171 4013-301', 1, NULL),
  ('grasa', 'industrial', 'Castrol Spheerol SX2', NULL, 'Castrol', 'kg', '= Shell 1352 CA EP2', 1, NULL),
  ('grasa', 'industrial', 'Shell GADUS S2 V220AC 2', NULL, 'Shell', 'kg', NULL, 1, NULL),
  ('grasa', 'industrial', 'Kluber Isoflex NBU 15', NULL, 'Kluber', 'kg', NULL, 1, NULL),
  ('grasa', 'industrial', 'Kluberplex BEM 34-132', NULL, 'Kluber', 'kg', NULL, 1, NULL);

-- 2.2.3 Grasas Optimol PD / Tribol / Molywithe (puntos pivote, equilibrado)
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, codigo_abb, fabricante, unidad, equivalencias, apariciones, notas) VALUES
  ('grasa', 'pd_pivote', 'Grasa Optimol Longtime PD 0', '3HAA 1001-294', 'Optimol', 'kg', '= ABB 3HAA 1001-294. Alternativa Teijin Seiki Molywithe', 2, NULL),
  ('grasa', 'pd_pivote', 'Grasa Teijin Seiki Molywithe', NULL, 'Teijin Seiki', 'kg', NULL, 2, NULL),
  ('grasa', 'pd_pivote', 'Tribol GR 100-0 PD', NULL, 'Tribol', 'kg', NULL, 1, NULL);

-- 2.2.4 Grasa food-grade
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, codigo_abb, fabricante, unidad, apariciones, notas) VALUES
  ('grasa', 'food_grade', 'LUBRIPLATE SYNXTREME FG-0', NULL, 'Lubriplate', 'kg', 17, 'NSF H1 contacto alimentario'),
  ('grasa', 'food_grade', 'SHC Cibus 220', NULL, 'Mobil', 'kg', 24, 'Variantes: Mobil SHC, (food grade)');

-- 2.2.5 Grasa foundry
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, codigo_abb, fabricante, unidad, apariciones, notas) VALUES
  ('grasa', 'foundry', 'Shell Retinax MS', NULL, 'Shell', 'kg', 1, 'Alternativa a ESSO Beacon EP 2 en variantes Foundry');

-- ===== 2.3 BATERIAS =====
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, codigo_abb, fabricante, unidad, notas) VALUES
  ('bateria', 'smb_nicd', 'Bateria SMB NiCd', '4944 026-4', 'ABB', 'ud', 'Robots legacy S4/S4C. ~3 anios de vida.'),
  ('bateria', 'smb_litio', 'Bateria SMB Litio 3-cell', '3HAB 9999-1', 'ABB', 'ud', 'Alternativa NiCd, hasta 5 anios.'),
  ('bateria', 'smb_litio', 'Bateria SMB Litio 6-cell', '3HAB 9999-2', 'ABB', 'ud', 'Alternativa NiCd, hasta 5 anios.'),
  ('bateria', 'smb_2pole', 'Bateria SMB 2-pole', 'DSQC633A', 'ABB', 'ud', 'Variante 2-polos.'),
  ('bateria', 'smb_3pole', 'Bateria SMB 3-pole', 'RMU101/102', 'ABB', 'ud', 'Variante 3-polos IRC5.'),
  ('bateria', 'smb_nicd', 'Bateria NiCd 7.2V', NULL, NULL, 'ud', 'Version especifica.'),
  ('bateria', 'cmos_rtc', 'Pila Litio CR2032', 'CR2032', NULL, 'ud', 'RTC/CMOS computer module IRC5 y OmniCore.'),
  ('bateria', 'memory_backup', 'Bateria memory back-up', NULL, NULL, 'ud', 'Auxiliar respaldo memoria.');

-- ===== 2.4 FILTROS =====
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, codigo_abb, fabricante, unidad, notas) VALUES
  ('filtro', 'aire_cabinet', 'Air filter principal cabinet', NULL, 'ABB', 'ud', 'Cabinet IRC5/OmniCore.'),
  ('filtro', 'aire_cabinet', 'Air filter Heat exchanger', NULL, 'ABB', 'ud', 'Filtro secundario tras intercambiador.'),
  ('filtro', 'aire_cabinet', 'Moist dust filter', '3005-2', 'ABB', 'ud', 'Cabinets en entornos humedos.'),
  ('filtro', 'aire_cabinet', 'Air filter external fans', '3004-2', 'ABB', 'ud', 'Cabinets ventilacion reforzada Max 52C.'),
  ('filtro', 'aire_cabinet', 'Air filter drive module', NULL, 'ABB', 'ud', 'Cabinets de drive module.'),
  ('filtro', 'manipulador', 'Filtro sistema sobrepresion', NULL, 'ABB', 'ud', 'Variantes Foundry / Clean Room.'),
  ('filtro', 'manipulador', 'Cooling filter SMB', NULL, 'ABB', 'ud', NULL),
  ('desiccant', 'manipulador', 'Desiccant bag', NULL, 'ABB', 'ud', 'Robots pintura/clean room. Absorbedor humedad.');

-- ===== 2.5 VENTILADORES =====
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, codigo_abb, fabricante, unidad, notas) VALUES
  ('ventilador', 'cabinet', 'Heat exchanger fan', NULL, 'ABB', 'ud', 'Cubierta superior cabinet.'),
  ('ventilador', 'cabinet', 'Door fan', NULL, 'ABB', 'ud', 'Puerta cabinet.'),
  ('ventilador', 'cabinet', 'Computer module fan', NULL, 'ABB', 'ud', NULL),
  ('ventilador', 'cabinet', 'Rear housing fan', NULL, 'ABB', 'ud', 'Carcasa trasera cabinet.'),
  ('ventilador', 'drive', 'Drive system fans', NULL, 'ABB', 'ud', '4 unidades en IRC5.'),
  ('ventilador', 'cabinet', 'External fans', '3004-2', 'ABB', 'ud', 'Opcion ventilacion reforzada.');

-- ===== 2.6 RODAMIENTOS =====
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, fabricante, unidad, notas) VALUES
  ('rodamiento', 'eje_principal', 'Large diameter bearing eje 1', 'ABB', 'ud', 'Reemplazo overhaul 40k-80k h.'),
  ('rodamiento', 'muneca', 'Rodamiento muneca', 'ABB', 'ud', NULL),
  ('rodamiento', 'eje_4_5', 'Ball bearing cups ejes 4-5', 'ABB', 'ud', NULL),
  ('rodamiento', 'lineal', 'Slide bearings ejes telescopicos', 'ABB', 'ud', NULL),
  ('rodamiento', 'lineal', 'Linear bearings (2 uds)', 'ABB', 'ud', NULL),
  ('rodamiento', 'equilibrado', 'Spherical bearings dispositivo equilibrado', 'ABB', 'ud', NULL),
  ('rodamiento', 'eje_4_telescopico', 'Eje telescopico + cojinetes (eje 4)', 'ABB', 'ud', NULL),
  ('rodamiento', 'equilibrado', 'Balancing unit axis 2 (bearings + piston rod)', 'ABB', 'ud', NULL),
  ('rodamiento', 'junta_universal', 'Universal joint', 'ABB', 'ud', NULL);

-- ===== 2.7 SELLOS, JUNTAS, O-RINGS =====
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, fabricante, unidad, notas) VALUES
  ('sello', 'eje', 'Sello eje 1', 'ABB', 'ud', NULL),
  ('sello', 'eje', 'Sello eje 4', 'ABB', 'ud', NULL),
  ('sello', 'eje', 'Junta eje-6 (Hygienic)', 'ABB', 'ud', 'Variantes Hygienic.'),
  ('sello', 'smb', 'Gasket SMB/BU', 'ABB', 'ud', 'Junta caja SMB.'),
  ('sello', 'cabinet', 'Sealing joints cabinet', 'ABB', 'ud', 'Juntas estanqueidad cabinet.');

-- ===== 2.8 CABLES Y ARNESES =====
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, codigo_abb, fabricante, unidad, notas) VALUES
  ('cable', 'package', 'Cable package upper', NULL, 'ABB', 'ud', NULL),
  ('cable', 'package', 'Cable package lower', NULL, 'ABB', 'ud', NULL),
  ('cable', 'package', 'Cable package upper+lower', NULL, 'ABB', 'ud', 'Combinado.'),
  ('cable', 'arnes', 'Arnes senial brazo superior', '042', 'ABB', 'ud', 'Opcion 042.'),
  ('cable', 'arnes', 'Cable espiral SMB distribution box', NULL, 'ABB', 'ud', NULL),
  ('cable', 'base', 'Cable base', NULL, 'ABB', 'ud', '~4 millones ciclos.');

-- ===== 2.9 BALL SCREWS / HUSILLOS =====
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, fabricante, unidad, notas) VALUES
  ('ball_screw', 'eje_3_4', 'Ball screw spline unit (ejes 3-4)', 'ABB', 'ud', NULL),
  ('ball_screw', 'general', 'Unidad husillo bolas', 'ABB', 'ud', NULL);

-- ===== 2.10 SEGURIDAD Y CALIBRACION =====
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, codigo_abb, fabricante, unidad, notas) VALUES
  ('tope_mecanico', 'eje_1', 'Mechanical stop eje 1 estandar', '2196 065-47', 'ABB', 'ud', NULL),
  ('tope_mecanico', 'eje_1_foundry', 'Mechanical stop eje 1 Foundry', '3HAA 2559-1', 'ABB', 'ud', NULL),
  ('tarjeta', 'frenos', 'Tarjeta liberacion frenos', NULL, 'ABB', 'ud', 'Test funcional cada inspeccion.');

-- ===== 2.11 FOUNDRY/CLEANROOM ESPECIFICOS =====
-- (Algunos ya cubiertos arriba, anadimos los exclusivos)
INSERT IGNORE INTO consumible_catalogo (tipo, subtipo, nombre, fabricante, unidad, notas) VALUES
  ('otro', 'pintura', 'Pintura especifica anti-corrosion', 'ABB', 'L', 'Foundry, ambientes salinos.');

-- ==============================================================================
-- Verificacion
-- ==============================================================================
SELECT
  (SELECT COUNT(*) FROM consumible_catalogo) AS total,
  (SELECT COUNT(*) FROM consumible_catalogo WHERE tipo = 'aceite') AS aceites,
  (SELECT COUNT(*) FROM consumible_catalogo WHERE tipo = 'grasa') AS grasas,
  (SELECT COUNT(*) FROM consumible_catalogo WHERE tipo = 'bateria') AS baterias,
  (SELECT COUNT(*) FROM consumible_catalogo WHERE tipo = 'filtro') AS filtros,
  (SELECT COUNT(*) FROM consumible_catalogo WHERE tipo = 'ventilador') AS ventiladores,
  (SELECT COUNT(*) FROM consumible_catalogo WHERE tipo = 'rodamiento') AS rodamientos,
  (SELECT COUNT(*) FROM consumible_catalogo WHERE tipo = 'sello') AS sellos,
  (SELECT COUNT(*) FROM consumible_catalogo WHERE tipo = 'cable') AS cables,
  (SELECT COUNT(*) FROM consumible_catalogo WHERE tipo = 'ball_screw') AS ball_screws,
  (SELECT COUNT(*) FROM consumible_catalogo WHERE tipo IN ('tope_mecanico', 'tarjeta')) AS seguridad;

SELECT tipo, subtipo, COUNT(*) AS items FROM consumible_catalogo GROUP BY tipo, subtipo ORDER BY tipo, subtipo;
