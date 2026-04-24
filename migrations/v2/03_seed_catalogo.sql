-- ==============================================================================
-- PAS ROBOTICS MANAGE - Seed 03: Catálogo ABB del Excel v7
-- ==============================================================================
-- Puebla tablas nuevas con datos verificados de la BD Excel v7:
--   - actividad_cabinet (171 filas, 13 modelos de controller/cabinet auxiliar)
--   - actividad_drive_module (15 filas)
--   - equivalencia_familia (76 filas)
--   - punto_control_generico (38 filas)
--   - compatibilidad_eje_permitida / excluye / controlador (288 filas de ejes)
--
-- PRERREQUISITO: 01 + 02 ejecutados.
--
-- NOTA IMPORTANTE: el modelo IRC5 Single existe (id=28 en tu BD real).
--                  El modelo "IRC5 Drive Unit" y "OmniCore Drive Module" NO EXISTEN
--                  en tu modelos_componente (0 filas tipo='drive_unit').
--                  La sección A.0 los crea ANTES de poblar sus actividades.
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- A.0 CREAR MODELOS DE DRIVE MODULE (no existen en tu BD real)
-- ------------------------------------------------------------------------------
-- Primero necesitamos registrar la familia en lu_familia
INSERT IGNORE INTO lu_familia (fabricante_id, codigo, tipo, descripcion) VALUES
  (1, 'IRC5 Drive Unit',       'drive_unit', 'Drive unit auxiliar IRC5 (para MultiMove o eje externo).'),
  (1, 'OmniCore Drive Module', 'drive_unit', 'Drive module auxiliar OmniCore.');

-- Ahora insertamos los modelos concretos
INSERT INTO modelos_componente (fabricante_id, tipo, familia, nombre, notas, niveles)
SELECT 1, 'drive_unit', 'IRC5 Drive Unit', 'IRC5 Drive Unit',
  'Drive unit auxiliar IRC5. Mismo hardware que IRC5 Single pero SIN computer module. Se conecta a una IRC5 Single existente para MultiMove o eje externo.',
  '1,2_inferior,2_superior,3'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM modelos_componente WHERE nombre = 'IRC5 Drive Unit' AND tipo = 'drive_unit');

INSERT INTO modelos_componente (fabricante_id, tipo, familia, nombre, notas, niveles)
SELECT 1, 'drive_unit', 'OmniCore Drive Module', 'OmniCore Drive Module',
  'Drive module auxiliar OmniCore. Se conecta a una controladora OmniCore (C30/C90XT/V250XT/V400XT) para MultiMove.',
  '1,2_inferior,2_superior,3'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM modelos_componente WHERE nombre = 'OmniCore Drive Module' AND tipo = 'drive_unit');

-- Vincular a su familia_id
UPDATE modelos_componente mc
JOIN lu_familia f ON f.fabricante_id = mc.fabricante_id AND f.codigo = mc.familia AND f.tipo = mc.tipo
SET mc.familia_id = f.id
WHERE mc.tipo = 'drive_unit' AND mc.familia_id IS NULL;


-- ------------------------------------------------------------------------------

-- A. ACTIVIDADES DE MANTENIMIENTO DE CABINETS (171 filas)

-- ------------------------------------------------------------------------------

-- IMPORTANTE: el match por nombre del Excel → nombre en modelos_componente.

-- Ejemplo: 'IRC5 Single' en Excel coincide con id=28 en tu BD real.


INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC021313-001',''), 'Control cabinet completo (sellado, cables, conectores, intercambiador calor)', 'controlador',
       NULLIF('M2004 (1a gen)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('ASTERISCO: intervalo depende del entorno - ambiente mas limpio alarga, ambiente sucio acorta. Incluye inspeccion de fan + heat exchanger + drive system fans (4 pcs). Cabinet cerrado con sealing joints que deben estar airtight.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC021313-001',''), 'Heat exchanger fan', 'controlador',
       NULLIF('M2004 (1a gen)',''), NULL, 6, 'periodico',
       NULLIF('c/6 meses *',''), NULLIF('Fan ubicado en cubierta superior cabinet. Verificar funcionamiento tras cualquier limpieza. Reemplazar si defectuoso segun procedimiento de Replacement of heat exchange unit and fan.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC021313-001',''), 'Moist dust filter', 'controlador',
       NULLIF('M2004 (1a gen)',''), NULL, NULL, 'periodico',
       NULLIF('Segun necesidad (no intervalo fijo)',''), NULLIF('Cabinet IRC5 Single M2004 incluye filtro de polvo humedo para prevenir contaminacion. Limpiar con aspiradora ESD-protected. Nunca usar aire comprimido ni limpiador de alta presion. Cabinet cerrado mientras no se trabaja dentro.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC021313-001',''), 'Moist dust filter', 'controlador',
       NULLIF('M2004 (1a gen)',''), NULL, 24, 'periodico',
       NULLIF('c/24 meses *',''), NULLIF('Reemplazar filtro de polvo humedo. Si entorno muy limpio puede alargarse, si muy sucio acortarse.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo','á','a')) OR
  ta.nombre = 'Reemplazo'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC021313-001',''), 'Heat exchanger fan', 'controlador',
       NULLIF('M2004 (1a gen)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('Limpieza del cabinet y del intercambiador de calor. Usar aspirador ESD-protected. Sin aire comprimido. Verificar funcionamiento de fans tras limpieza.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC021313-001',''), 'FlexPendant', 'controlador',
       NULLIF('M2004 (1a gen)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Visual check antes de cada uso. Si carcasa o cable danado: reemplazar. Inspeccion profunda c/12m. Limpiar con trapo suave - evitar disolventes fuertes (acetona).','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC021313-001',''), 'Earth Fault Breaker (si instalado)', 'controlador',
       NULLIF('M2004 (1a gen)',''), NULL, 6, 'periodico',
       NULLIF('c/6 meses',''), NULLIF('Contact ABB for more information (procedimiento especifico no detallado en PM base IRC5 M2004).','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047136-001',''), 'Complete controller modules', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('Inspeccion completa del cabinet: sealing joints, cable glands airtight, conectores y cableado seguros, heat exchanger + fans, drive system fans (4 pcs).','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047136-001',''), 'Moist dust filter', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Filtro de polvo humedo - misma filosofia que M2004 pero revisado para 2a gen.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047136-001',''), 'Moist dust filter', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 24, 'periodico',
       NULLIF('c/24 meses *',''), NULLIF('Intervalo identico a M2004. Reemplazo programado del filtro.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo','á','a')) OR
  ta.nombre = 'Reemplazo'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047136-001',''), 'Heat exchanger fan', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 6, 'periodico',
       NULLIF('c/6 meses *',''), NULLIF('Inspeccion visual y funcional del fan. Verificar que nada lo cubra ni bloquee la entrada/salida de aire.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047136-001',''), 'Heat exchanger fan', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('Limpieza del cabinet interno con aspirador ESD. Nunca aire comprimido ni alta presion.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047136-001',''), 'FlexPendant', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Igual que M2004. Inspeccion visual antes cada uso, inspeccion profunda c/12m.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047136-001',''), 'Earth fault breaker F4 (si se usa)', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 6, 'periodico',
       NULLIF('c/6 meses',''), NULLIF('NUEVO en 2a gen vs M2004: procedimiento detallado en PM (no solo referencia a ABB). Function test of earth fault breaker F4.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047136-001',''), 'Emergency stop (operating panel + FlexPendant)', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NUEVO en 2a gen: tests detallados en PM. Probar boton emergencia del panel y del FlexPendant por separado.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047136-001',''), 'Mode switch', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NUEVO en 2a gen. Test del selector de modo (automatico/manual).','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047136-001',''), 'Enabling device (3-posiciones)', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NUEVO en 2a gen. Test del dispositivo de habilitacion de tres posiciones del FlexPendant.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047136-001',''), 'Contactores motor K42, K43', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NUEVO en 2a gen. Test de los contactores de motor.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047136-001',''), 'Contactor freno K44', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NUEVO en 2a gen. Test del contactor de freno.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047136-001',''), 'Auto stop / General stop / Superior stop / Limit switch (si se usan)', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NUEVO en 2a gen. Tests de todas las paradas opcionales que esten configuradas. Saltar las no instaladas.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047136-001',''), 'Fusible automatico F1', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NUEVO en 2a gen. Test del fusible automatico F1.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047136-001',''), 'Control de velocidad reducida', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, NULL, 'periodico',
       NULLIF('Durante commissioning',''), NULLIF('NUEVO en 2a gen. Test unico durante puesta en servicio, no periodico. Tambien realizar tras cambio de cualquier componente relacionado.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC027707-001',''), 'Complete controller modules', 'controlador',
       NULLIF('M2004 (1a gen)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('PMC = Panel Mounted Controller (sin cabinet - montaje en panel del cliente). Schedule MUY reducido vs Single: solo inspeccion general + FlexPendant. NO tiene filtro de polvo porque no hay cabinet cerrado. Inspeccion incluye: sealing joints airtight, conectores, cableado, drive system fans.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'IRC5 Panel Mounted (PMC)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC027707-001',''), 'Fan unit (drive system)', 'controlador',
       NULLIF('M2004 (1a gen)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('Fan unit del drive system: verificar que nada lo cubra o bloquee. Inspeccionar que drive system fans estan limpios.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'IRC5 Panel Mounted (PMC)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC027707-001',''), 'FlexPendant', 'controlador',
       NULLIF('M2004 (1a gen)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Igual que todos los IRC5. Visual antes uso + inspeccion c/12m.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'IRC5 Panel Mounted (PMC)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047137-001',''), 'Complete controller modules', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('Schedule PMC 2a gen anade function tests vs M2004 (igual evolucion que Single). Inspeccion: sealing, conectores, drive system fans limpios, fan unit sin bloqueo.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'IRC5 Panel Mounted (PMC)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047137-001',''), 'FlexPendant', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Igual que todos los IRC5.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'IRC5 Panel Mounted (PMC)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047137-001',''), 'Emergency stop (operating panel + FlexPendant)', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NUEVO en 2a gen PMC: antes era solo inspeccion. Probar ambos botones por separado.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Panel Mounted (PMC)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047137-001',''), 'Mode switch', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NUEVO en 2a gen PMC.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Panel Mounted (PMC)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047137-001',''), 'Enabling device (3-posiciones)', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NUEVO en 2a gen PMC.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Panel Mounted (PMC)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047137-001',''), 'Contactores motor K42, K43 + Contactor freno K44', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NUEVO en 2a gen PMC.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Panel Mounted (PMC)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047137-001',''), 'Auto stop / General stop / Superior stop / Limit switch (si se usan)', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NUEVO en 2a gen PMC. Solo los instalados.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Panel Mounted (PMC)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047137-001',''), 'Control de velocidad reducida', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, NULL, 'periodico',
       NULLIF('Durante commissioning',''), NULLIF('NUEVO en 2a gen PMC.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Panel Mounted (PMC)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC035738-001',''), 'Complete controller', 'controlador',
       NULLIF('M2004 (1a gen)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('IRC5 Compact = cabinet integrado reducido, 1 robot solo. Schedule simple: inspeccion general + ventiladores + FlexPendant. Incluye: conectores, cableado, orificios ventilacion en superficie cabinet limpios. NO tiene filtro de polvo porque el cabinet es ventilado (no sellado).','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'IRC5 Compact' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC035738-001',''), 'System fans', 'controlador',
       NULLIF('M2004 (1a gen)',''), NULL, 6, 'periodico',
       NULLIF('c/6 meses *',''), NULLIF('Ventiladores del sistema en superficie del cabinet. Verificar limpieza y funcionamiento (encender brevemente tras limpieza).','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'IRC5 Compact' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC035738-001',''), 'FlexPendant', 'controlador',
       NULLIF('M2004 (1a gen)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Igual que todos IRC5.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'IRC5 Compact' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047138-005',''), 'Controlador completo', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('Schedule Compact 2a gen anade function tests (igual evolucion que Single y PMC). Inspeccion general: conectores, cables, orificios ventilacion limpios.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'IRC5 Compact' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047138-005',''), 'Ventiladores del sistema', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 6, 'periodico',
       NULLIF('c/6 meses *',''), NULLIF('Verificar orificios de ventilacion en superficie del armario + funcionamiento de ventiladores. ESD protection obligatoria antes manipulacion.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'IRC5 Compact' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047138-005',''), 'FlexPendant', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Igual que todos IRC5.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'IRC5 Compact' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047138-005',''), 'Parada de emergencia (panel + FlexPendant)', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NUEVO en 2a gen Compact.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Compact' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047138-005',''), 'Selector de modo', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NUEVO en 2a gen Compact.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Compact' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047138-005',''), 'Dispositivo de habilitacion (3-posiciones)', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NUEVO en 2a gen Compact.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Compact' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047138-005',''), 'Contactores motor K42, K43 + Contactor freno K44', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NUEVO en 2a gen Compact.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Compact' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047138-005',''), 'Parada automatica / Parada general (si se usan)', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NUEVO en 2a gen Compact. Solo los instalados.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Compact' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047138-005',''), 'Control de velocidad reducida', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, NULL, 'periodico',
       NULLIF('Durante puesta en servicio',''), NULLIF('NUEVO en 2a gen Compact.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5 Compact' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HNA009834-001',''), 'Control cabinet completo + Pendant + Indicator lamps + Cooler (si instalado)', 'controlador',
       NULLIF('Unica (Rev.51)',''), NULL, NULL, 'condicion',
       NULLIF('Diario',''), NULLIF('ESTRUCTURA DIFERENTE vs IRC5 estandar - schedule basado en HORAS DE OPERACION (no meses). Mantenimiento general diario: limpieza cabinet (evitar acetona/disolventes fuertes), verificar no obstruccion de emision de calor (sin objetos encima, sin plastico cubriendolo, puertas cerradas), check pendant visual, bombillas indicadoras defectuosas reemplazar. Si tiene cooler: vaciar contenedor de agua drenaje.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Mantenimiento general','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Mantenimiento general','á','a')) OR
  ta.nombre = 'Mantenimiento general'
)
WHERE mc.nombre = 'IRC5P (Paint)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HNA009834-001',''), 'Filtro', 'controlador',
       NULLIF('Unica (Rev.51)',''), 3000, NULL, 'periodico',
       NULLIF('c/3.000 horas operativas / c/12 meses en clean room',''), NULLIF('INTERVALO POR HORAS (no meses). Mas frecuente que IRC5 estandar por ambiente con particulas de pintura. Si clean room: pasar a c/12m (ambiente controlado).','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza/Reemplazo','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza/Reemplazo','á','a')) OR
  ta.nombre = 'Limpieza/Reemplazo'
)
WHERE mc.nombre = 'IRC5P (Paint)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HNA009834-001',''), 'Bateria del measuring system', 'controlador',
       NULLIF('Unica (Rev.51)',''), 7000, NULL, 'periodico',
       NULLIF('c/7.000 horas operativas',''), NULLIF('UNICO EN CATEGORIA CABINETS: IRC5P tiene bateria del measuring system EN LA CONTROLADORA (no en el manipulador como robots estandar). Intervalo depende de horas operativas Y temperatura. Procedimiento especifico en PM (Replacement of measuring system battery, Checking the Measuring System Battery).','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo','á','a')) OR
  ta.nombre = 'Reemplazo'
)
WHERE mc.nombre = 'IRC5P (Paint)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HNA009834-001',''), 'Fan units en control cabinet (Door fan + Computer fan + Rear housing fan)', 'controlador',
       NULLIF('Unica (Rev.51)',''), 50000, NULL, 'periodico',
       NULLIF('c/50.000 horas operativas',''), NULLIF('Reemplazo programado 3 fans: Door Fan Unit, Computer Fan Unit, Rear Housing Fan Unit. Intervalo en horas (~5.7 anos a 24/7 o mucho mas con uso normal).','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo','á','a')) OR
  ta.nombre = 'Reemplazo'
)
WHERE mc.nombre = 'IRC5P (Paint)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HNA009834-001',''), 'Cooler (si instalado)', 'controlador',
       NULLIF('Unica (Rev.51)',''), 3000, NULL, 'periodico',
       NULLIF('c/3.000 horas operativas',''), NULLIF('Solo si cooler opcional instalado. Verificar funcionamiento y vaciar drain water container segun sea necesario.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'IRC5P (Paint)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HNA009834-001',''), 'Safety functions', 'controlador',
       NULLIF('Unica (Rev.51)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('Check completo de funciones de seguridad. Solo intervalo en meses (no horas) del schedule IRC5P.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'IRC5P (Paint)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC021313-001',''), 'Bateria interna computer module (RTC/CMOS tipo CR2032)', 'controlador',
       NULLIF('M2004 (1a gen)',''), NULL, 60, 'periodico',
       NULLIF('c/60 meses (5 anos)',''), NULLIF('BATERIA INTERNA DEL COMPUTER MODULE (RTC/CMOS). NO aparece en el schedule oficial del PM ABB (ABB la clasifica como "run-to-failure" = reemplazar cuando se pierde configuracion tras apagado). AGREGADO COMO PREVENTIVO PROGRAMADO por criterio de planta: intervalo c/60 meses (5 anos) evita perdida de configuracion y revisiones de emergencia. Tipo pila: CR2032 litio 3V (estandar industria). Ubicacion: main computer board. DSQC usado segun ano: DSQC639 (M2004 primeros anos) / DSQC1000 / DSQC1024 (2a gen Release 17.1+). Verificar art. numero exacto de pila/board contra parts catalog del cliente.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo (preventivo programado)','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo (preventivo programado)','á','a')) OR
  ta.nombre = 'Reemplazo (preventivo programado)'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047136-001',''), 'Bateria interna computer module (RTC/CMOS tipo CR2032)', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 60, 'periodico',
       NULLIF('c/60 meses (5 anos)',''), NULLIF('BATERIA INTERNA DEL COMPUTER MODULE (RTC/CMOS). NO aparece en el schedule oficial del PM ABB (ABB la clasifica como "run-to-failure" = reemplazar cuando se pierde configuracion tras apagado). AGREGADO COMO PREVENTIVO PROGRAMADO por criterio de planta: intervalo c/60 meses (5 anos) evita perdida de configuracion y revisiones de emergencia. Tipo pila: CR2032 litio 3V (estandar industria). Ubicacion: main computer board. DSQC usado segun ano: DSQC639 (M2004 primeros anos) / DSQC1000 / DSQC1024 (2a gen Release 17.1+). Verificar art. numero exacto de pila/board contra parts catalog del cliente.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo (preventivo programado)','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo (preventivo programado)','á','a')) OR
  ta.nombre = 'Reemplazo (preventivo programado)'
)
WHERE mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC027707-001',''), 'Bateria interna computer module (RTC/CMOS tipo CR2032)', 'controlador',
       NULLIF('M2004 (1a gen)',''), NULL, 60, 'periodico',
       NULLIF('c/60 meses (5 anos)',''), NULLIF('BATERIA INTERNA DEL COMPUTER MODULE (RTC/CMOS). NO aparece en el schedule oficial del PM ABB (ABB la clasifica como "run-to-failure" = reemplazar cuando se pierde configuracion tras apagado). AGREGADO COMO PREVENTIVO PROGRAMADO por criterio de planta: intervalo c/60 meses (5 anos) evita perdida de configuracion y revisiones de emergencia. Tipo pila: CR2032 litio 3V (estandar industria). Ubicacion: main computer board. DSQC usado segun ano: DSQC639 (M2004 primeros anos) / DSQC1000 / DSQC1024 (2a gen Release 17.1+). Verificar art. numero exacto de pila/board contra parts catalog del cliente.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo (preventivo programado)','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo (preventivo programado)','á','a')) OR
  ta.nombre = 'Reemplazo (preventivo programado)'
)
WHERE mc.nombre = 'IRC5 Panel Mounted (PMC)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047137-001',''), 'Bateria interna computer module (RTC/CMOS tipo CR2032)', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 60, 'periodico',
       NULLIF('c/60 meses (5 anos)',''), NULLIF('BATERIA INTERNA DEL COMPUTER MODULE (RTC/CMOS). NO aparece en el schedule oficial del PM ABB (ABB la clasifica como "run-to-failure" = reemplazar cuando se pierde configuracion tras apagado). AGREGADO COMO PREVENTIVO PROGRAMADO por criterio de planta: intervalo c/60 meses (5 anos) evita perdida de configuracion y revisiones de emergencia. Tipo pila: CR2032 litio 3V (estandar industria). Ubicacion: main computer board. DSQC usado segun ano: DSQC639 (M2004 primeros anos) / DSQC1000 / DSQC1024 (2a gen Release 17.1+). Verificar art. numero exacto de pila/board contra parts catalog del cliente.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo (preventivo programado)','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo (preventivo programado)','á','a')) OR
  ta.nombre = 'Reemplazo (preventivo programado)'
)
WHERE mc.nombre = 'IRC5 Panel Mounted (PMC)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC035738-001',''), 'Bateria interna computer module (RTC/CMOS tipo CR2032)', 'controlador',
       NULLIF('M2004 (1a gen)',''), NULL, 60, 'periodico',
       NULLIF('c/60 meses (5 anos)',''), NULLIF('BATERIA INTERNA DEL COMPUTER MODULE (RTC/CMOS). NO aparece en el schedule oficial del PM ABB (ABB la clasifica como "run-to-failure" = reemplazar cuando se pierde configuracion tras apagado). AGREGADO COMO PREVENTIVO PROGRAMADO por criterio de planta: intervalo c/60 meses (5 anos) evita perdida de configuracion y revisiones de emergencia. Tipo pila: CR2032 litio 3V (estandar industria). Ubicacion: main computer board. DSQC usado segun ano: DSQC639 (M2004 primeros anos) / DSQC1000 / DSQC1024 (2a gen Release 17.1+). Verificar art. numero exacto de pila/board contra parts catalog del cliente.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo (preventivo programado)','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo (preventivo programado)','á','a')) OR
  ta.nombre = 'Reemplazo (preventivo programado)'
)
WHERE mc.nombre = 'IRC5 Compact' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC047138-005',''), 'Bateria interna computer module (RTC/CMOS tipo CR2032)', 'controlador',
       NULLIF('2a gen (2018+)',''), NULL, 60, 'periodico',
       NULLIF('c/60 meses (5 anos)',''), NULLIF('BATERIA INTERNA DEL COMPUTER MODULE (RTC/CMOS). NO aparece en el schedule oficial del PM ABB (ABB la clasifica como "run-to-failure" = reemplazar cuando se pierde configuracion tras apagado). AGREGADO COMO PREVENTIVO PROGRAMADO por criterio de planta: intervalo c/60 meses (5 anos) evita perdida de configuracion y revisiones de emergencia. Tipo pila: CR2032 litio 3V (estandar industria). Ubicacion: main computer board. DSQC usado segun ano: DSQC639 (M2004 primeros anos) / DSQC1000 / DSQC1024 (2a gen Release 17.1+). Verificar art. numero exacto de pila/board contra parts catalog del cliente.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo (preventivo programado)','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo (preventivo programado)','á','a')) OR
  ta.nombre = 'Reemplazo (preventivo programado)'
)
WHERE mc.nombre = 'IRC5 Compact' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HNA009834-001',''), 'Bateria interna computer module (RTC/CMOS tipo CR2032) - ADICIONAL a bateria measuring system', 'controlador',
       NULLIF('Unica (Rev.51)',''), NULL, 60, 'periodico',
       NULLIF('c/60 meses (5 anos)',''), NULLIF('BATERIA INTERNA DEL COMPUTER MODULE IRC5P (RTC/CMOS). DIFERENTE de la bateria del measuring system del cabinet (c/7.000h - esa ya esta en schedule). NO aparece en schedule oficial ABB, anadida como preventivo programado c/60 meses por criterio de planta. CR2032 litio 3V en main computer board. Verificar DSQC y art. numero contra parts catalog.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo (preventivo programado)','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo (preventivo programado)','á','a')) OR
  ta.nombre = 'Reemplazo (preventivo programado)'
)
WHERE mc.nombre = 'IRC5P (Paint)' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC060860-001',''), 'Controlador completo (sealing joints, cable glands, conectores, cables, fans, ventilation holes)', 'controlador',
       NULLIF('C30 (2019+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('OmniCore C30 = cabinet compact para robots medianos (IRB 1300/1600/2600/4600/6700, CRBs medios). Sellado IP pero con ventilador activo. Incluye air filter element. Inspeccion completa cubre: sealing joints airtight, conectores seguros, fans ventilacion limpios. Tras inspeccion encender brevemente para verificar funcionamiento fans.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'OmniCore C30' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC060860-001',''), 'System fans', 'controlador',
       NULLIF('C30 (2019+)',''), NULL, 6, 'periodico',
       NULLIF('c/6 meses *',''), NULLIF('Ventiladores del sistema. * Intervalo variable segun ambiente.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'OmniCore C30' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC060860-001',''), 'Air filter element (vertical mounting kit)', 'controlador',
       NULLIF('C30 (2019+)',''), NULL, 24, 'periodico',
       NULLIF('c/24 meses',''), NULLIF('Filtro de aire del cabinet. Solo aplica si instalado el vertical mounting kit. Reemplazo programado c/24m.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo','á','a')) OR
  ta.nombre = 'Reemplazo'
)
WHERE mc.nombre = 'OmniCore C30' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC060860-001',''), 'Control cabinet', 'controlador',
       NULLIF('C30 (2019+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Limpieza del cabinet con aspirador ESD-protected. Nunca aire comprimido ni alta presion. No usar acetona ni disolventes fuertes.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore C30' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC060860-001',''), 'FlexPendant', 'controlador',
       NULLIF('C30 (2019+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Limpieza del FlexPendant cuando necesario.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore C30' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC060860-001',''), 'Emergency stop (FlexPendant)', 'controlador',
       NULLIF('C30 (2019+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C30' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC060860-001',''), 'Manual / Auto / Manual full speed mode (FlexPendant)', 'controlador',
       NULLIF('C30 (2019+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('Test de los 3 modos con FlexPendant.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C30' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC060860-001',''), 'Enabling device (3-posiciones)', 'controlador',
       NULLIF('C30 (2019+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C30' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC060860-001',''), 'Safety switches', 'controlador',
       NULLIF('C30 (2019+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C30' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC060860-001',''), 'Automatic stop (si se usa)', 'controlador',
       NULLIF('C30 (2019+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('Solo si esta configurado.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C30' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC060860-001',''), 'General stop (si se usa)', 'controlador',
       NULLIF('C30 (2019+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('Solo si esta configurado.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C30' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC060860-001',''), 'External emergency stop (si se usa)', 'controlador',
       NULLIF('C30 (2019+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('Solo si esta configurado.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C30' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC060860-001',''), 'ESTOP_STATUS output (si se usa)', 'controlador',
       NULLIF('C30 (2019+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('Solo si esta configurado.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C30' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC060860-001',''), 'Reduced speed control', 'controlador',
       NULLIF('C30 (2019+)',''), NULL, NULL, 'periodico',
       NULLIF('Durante commissioning',''), NULLIF('Test durante puesta en servicio. Repetir tras cambio de componente relacionado.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C30' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC060860-001',''), 'Function tests tras reemplazo de componente', 'controlador',
       NULLIF('C30 (2019+)',''), NULL, NULL, 'periodico',
       NULLIF('Despues de cada reemplazo',''), NULLIF('Tras reemplazar cualquier componente del controlador, ejecutar TODOS los function tests relevantes.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C30' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC060860-001',''), 'Bateria interna computer module (RTC/CMOS tipo CR2032)', 'controlador',
       NULLIF('C30 (2019+)',''), NULL, 60, 'periodico',
       NULLIF('c/60 meses (5 anos)',''), NULLIF('BATERIA INTERNA COMPUTER MODULE (RTC/CMOS). No aparece en schedule oficial ABB (run-to-failure en PM). Agregado preventivo programado c/60m para evitar perdida de config. CR2032 litio 3V. Verificar DSQC y art. numero en parts catalog especifico.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo (preventivo programado)','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo (preventivo programado)','á','a')) OR
  ta.nombre = 'Reemplazo (preventivo programado)'
)
WHERE mc.nombre = 'OmniCore C30' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073706-001',''), 'Controlador completo (sealing joints, cable glands, conectores, cables, fans, ventilation holes)', 'controlador',
       NULLIF('C90XT (2020+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('OmniCore C90XT = cabinet grande extendido para robots pesados (IRB 6700, IRB 8700, IRB 7600) y aplicaciones complejas. Mayor disipacion termica, espacio customer, opcional IP54. Con air filter.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'OmniCore C90XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073706-001',''), 'System fans', 'controlador',
       NULLIF('C90XT (2020+)',''), NULL, 6, 'periodico',
       NULLIF('c/6 meses *',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'OmniCore C90XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073706-001',''), 'Air filter', 'controlador',
       NULLIF('C90XT (2020+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Limpieza del filtro de aire del cabinet. Usar agua 30-40C con detergente o aire comprimido. Secar antes de reinstalar.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore C90XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073706-001',''), 'Air filter', 'controlador',
       NULLIF('C90XT (2020+)',''), NULL, 24, 'periodico',
       NULLIF('c/24 meses',''), NULLIF('Reemplazo programado del air filter c/24m.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo','á','a')) OR
  ta.nombre = 'Reemplazo'
)
WHERE mc.nombre = 'OmniCore C90XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073706-001',''), 'Control cabinet', 'controlador',
       NULLIF('C90XT (2020+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Aspirador ESD-protected. Sin aire comprimido ni alta presion.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore C90XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073706-001',''), 'FlexPendant', 'controlador',
       NULLIF('C90XT (2020+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore C90XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073706-001',''), 'Emergency stop (FlexPendant)', 'controlador',
       NULLIF('C90XT (2020+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C90XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073706-001',''), 'Manual / Auto / Manual full speed mode (FlexPendant)', 'controlador',
       NULLIF('C90XT (2020+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C90XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073706-001',''), 'Enabling device (3-posiciones)', 'controlador',
       NULLIF('C90XT (2020+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C90XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073706-001',''), 'Safety switches', 'controlador',
       NULLIF('C90XT (2020+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C90XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073706-001',''), 'Automatic stop (si se usa)', 'controlador',
       NULLIF('C90XT (2020+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C90XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073706-001',''), 'General stop (si se usa)', 'controlador',
       NULLIF('C90XT (2020+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C90XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073706-001',''), 'External emergency stop (si se usa)', 'controlador',
       NULLIF('C90XT (2020+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C90XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073706-001',''), 'ESTOP_STATUS output (si se usa)', 'controlador',
       NULLIF('C90XT (2020+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C90XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073706-001',''), 'Reduced speed control', 'controlador',
       NULLIF('C90XT (2020+)',''), NULL, NULL, 'periodico',
       NULLIF('Durante commissioning',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C90XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073706-001',''), 'Function tests tras reemplazo de componente', 'controlador',
       NULLIF('C90XT (2020+)',''), NULL, NULL, 'periodico',
       NULLIF('Despues de cada reemplazo',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore C90XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073706-001',''), 'Bateria interna computer module (RTC/CMOS tipo CR2032)', 'controlador',
       NULLIF('C90XT (2020+)',''), NULL, 60, 'periodico',
       NULLIF('c/60 meses (5 anos)',''), NULLIF('BATERIA INTERNA COMPUTER MODULE (RTC/CMOS). No aparece en schedule oficial ABB (run-to-failure en PM). Agregado preventivo programado c/60m para evitar perdida de config. CR2032 litio 3V. Verificar DSQC y art. numero en parts catalog especifico.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo (preventivo programado)','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo (preventivo programado)','á','a')) OR
  ta.nombre = 'Reemplazo (preventivo programado)'
)
WHERE mc.nombre = 'OmniCore C90XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC079399-001',''), 'Controlador completo (sealing joints, cable glands, conectores, cables, fans, ventilation holes)', 'controlador',
       NULLIF('E10 (2021+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('OmniCore E10 = cabinet ultra-compacto para robots pequenos (IRB 1010, CRB series colaborativos, small-payload <4kg). Montaje en escritorio o panel. SIN air filter (ventilacion pasiva/reducida). Schedule mas simple que C30/C90XT/V250XT.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'OmniCore E10' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC079399-001',''), 'System fans', 'controlador',
       NULLIF('E10 (2021+)',''), NULL, 6, 'periodico',
       NULLIF('c/6 meses *',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'OmniCore E10' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC079399-001',''), 'Control cabinet', 'controlador',
       NULLIF('E10 (2021+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore E10' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC079399-001',''), 'FlexPendant', 'controlador',
       NULLIF('E10 (2021+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore E10' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC079399-001',''), 'Emergency stop (FlexPendant)', 'controlador',
       NULLIF('E10 (2021+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore E10' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC079399-001',''), 'Manual / Auto / Manual full speed mode (FlexPendant)', 'controlador',
       NULLIF('E10 (2021+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore E10' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC079399-001',''), 'Enabling device (3-posiciones)', 'controlador',
       NULLIF('E10 (2021+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore E10' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC079399-001',''), 'Safety switches', 'controlador',
       NULLIF('E10 (2021+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore E10' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC079399-001',''), 'Automatic stop (si se usa)', 'controlador',
       NULLIF('E10 (2021+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore E10' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC079399-001',''), 'General stop (si se usa)', 'controlador',
       NULLIF('E10 (2021+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore E10' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC079399-001',''), 'External emergency stop (si se usa)', 'controlador',
       NULLIF('E10 (2021+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore E10' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC079399-001',''), 'ESTOP_STATUS output (si se usa)', 'controlador',
       NULLIF('E10 (2021+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore E10' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC079399-001',''), 'Reduced speed control', 'controlador',
       NULLIF('E10 (2021+)',''), NULL, NULL, 'periodico',
       NULLIF('Durante commissioning',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore E10' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC079399-001',''), 'Bateria interna computer module (RTC/CMOS tipo CR2032)', 'controlador',
       NULLIF('E10 (2021+)',''), NULL, 60, 'periodico',
       NULLIF('c/60 meses (5 anos)',''), NULLIF('BATERIA INTERNA COMPUTER MODULE (RTC/CMOS). No aparece en schedule oficial ABB (run-to-failure en PM). Agregado preventivo programado c/60m para evitar perdida de config. CR2032 litio 3V. Verificar DSQC y art. numero en parts catalog especifico.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo (preventivo programado)','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo (preventivo programado)','á','a')) OR
  ta.nombre = 'Reemplazo (preventivo programado)'
)
WHERE mc.nombre = 'OmniCore E10' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073447-001',''), 'Controlador completo (conectores, cables, fans, ventilation holes)', 'controlador',
       NULLIF('V250XT general (2020+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('OmniCore V250XT = variante eXtended Throughput. NOTA: este es el PM "general" - existen tambien PMs especificos Type A (3HAC084692-001) y Type B (3HAC087112-001) con schedules ampliados. La inspeccion no incluye sealing joints/cable glands en este PM general (si en Type B).','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'OmniCore V250XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073447-001',''), 'System fans', 'controlador',
       NULLIF('V250XT general (2020+)',''), NULL, 6, 'periodico',
       NULLIF('c/6 meses *',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'OmniCore V250XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073447-001',''), 'Air filter', 'controlador',
       NULLIF('V250XT general (2020+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Agua 30-40C con detergente o aire comprimido. Secar antes de reinstalar.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore V250XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073447-001',''), 'Air filter (opcion 3005-2 Moist dust filter)', 'controlador',
       NULLIF('V250XT general (2020+)',''), NULL, 24, 'periodico',
       NULLIF('c/24 meses',''), NULLIF('Reemplazo programado del air filter c/24m. Solo si esta instalada la opcion 3005-2 Moist dust filter.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo','á','a')) OR
  ta.nombre = 'Reemplazo'
)
WHERE mc.nombre = 'OmniCore V250XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073447-001',''), 'Control cabinet', 'controlador',
       NULLIF('V250XT general (2020+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore V250XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073447-001',''), 'FlexPendant', 'controlador',
       NULLIF('V250XT general (2020+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore V250XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073447-001',''), 'Emergency stop (FlexPendant)', 'controlador',
       NULLIF('V250XT general (2020+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073447-001',''), 'Manual / Auto / Manual full speed mode (FlexPendant)', 'controlador',
       NULLIF('V250XT general (2020+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073447-001',''), 'Enabling device (3-posiciones)', 'controlador',
       NULLIF('V250XT general (2020+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073447-001',''), 'Automatic stop (si se usa)', 'controlador',
       NULLIF('V250XT general (2020+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('NOTA: el V250XT general NO incluye Safety switches function test (si C30/C90XT/E10/TypeA/TypeB).','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073447-001',''), 'General stop (si se usa)', 'controlador',
       NULLIF('V250XT general (2020+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073447-001',''), 'External emergency stop (si se usa)', 'controlador',
       NULLIF('V250XT general (2020+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073447-001',''), 'ESTOP_STATUS output (si se usa)', 'controlador',
       NULLIF('V250XT general (2020+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073447-001',''), 'Reduced speed control', 'controlador',
       NULLIF('V250XT general (2020+)',''), NULL, NULL, 'periodico',
       NULLIF('Durante commissioning',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC073447-001',''), 'Bateria interna computer module (RTC/CMOS tipo CR2032)', 'controlador',
       NULLIF('V250XT general (2020+)',''), NULL, 60, 'periodico',
       NULLIF('c/60 meses (5 anos)',''), NULLIF('BATERIA INTERNA COMPUTER MODULE (RTC/CMOS). No aparece en schedule oficial ABB (run-to-failure en PM). Agregado preventivo programado c/60m para evitar perdida de config. CR2032 litio 3V. Verificar DSQC y art. numero en parts catalog especifico.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo (preventivo programado)','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo (preventivo programado)','á','a')) OR
  ta.nombre = 'Reemplazo (preventivo programado)'
)
WHERE mc.nombre = 'OmniCore V250XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC084692-001',''), 'Controlador completo (conectores, cables, fans, ventilation holes)', 'controlador',
       NULLIF('V250XT Type A (2022+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('OmniCore V250XT Type A = variante especifica del V250XT (2022+). Schedule similar al V250XT general. Inspeccion no incluye sealing joints/cable glands (como el general).','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'OmniCore V250XT Type A' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC084692-001',''), 'System fans', 'controlador',
       NULLIF('V250XT Type A (2022+)',''), NULL, 6, 'periodico',
       NULLIF('c/6 meses *',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'OmniCore V250XT Type A' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC084692-001',''), 'Air filter', 'controlador',
       NULLIF('V250XT Type A (2022+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore V250XT Type A' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC084692-001',''), 'Air filter', 'controlador',
       NULLIF('V250XT Type A (2022+)',''), NULL, 24, 'periodico',
       NULLIF('c/24 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo','á','a')) OR
  ta.nombre = 'Reemplazo'
)
WHERE mc.nombre = 'OmniCore V250XT Type A' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC084692-001',''), 'Control cabinet', 'controlador',
       NULLIF('V250XT Type A (2022+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore V250XT Type A' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC084692-001',''), 'FlexPendant', 'controlador',
       NULLIF('V250XT Type A (2022+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore V250XT Type A' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC084692-001',''), 'Emergency stop (FlexPendant)', 'controlador',
       NULLIF('V250XT Type A (2022+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT Type A' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC084692-001',''), 'Manual / Auto / Manual full speed mode (FlexPendant)', 'controlador',
       NULLIF('V250XT Type A (2022+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT Type A' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC084692-001',''), 'Enabling device (3-posiciones)', 'controlador',
       NULLIF('V250XT Type A (2022+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT Type A' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC084692-001',''), 'Automatic stop (si se usa)', 'controlador',
       NULLIF('V250XT Type A (2022+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT Type A' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC084692-001',''), 'General stop (si se usa)', 'controlador',
       NULLIF('V250XT Type A (2022+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT Type A' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC084692-001',''), 'External emergency stop (si se usa)', 'controlador',
       NULLIF('V250XT Type A (2022+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT Type A' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC084692-001',''), 'ESTOP_STATUS output (si se usa)', 'controlador',
       NULLIF('V250XT Type A (2022+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT Type A' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC084692-001',''), 'Reduced speed control', 'controlador',
       NULLIF('V250XT Type A (2022+)',''), NULL, NULL, 'periodico',
       NULLIF('Durante commissioning',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT Type A' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC084692-001',''), 'Bateria interna computer module (RTC/CMOS tipo CR2032)', 'controlador',
       NULLIF('V250XT Type A (2022+)',''), NULL, 60, 'periodico',
       NULLIF('c/60 meses (5 anos)',''), NULLIF('BATERIA INTERNA COMPUTER MODULE (RTC/CMOS). No aparece en schedule oficial ABB (run-to-failure en PM). Agregado preventivo programado c/60m para evitar perdida de config. CR2032 litio 3V. Verificar DSQC y art. numero en parts catalog especifico.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo (preventivo programado)','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo (preventivo programado)','á','a')) OR
  ta.nombre = 'Reemplazo (preventivo programado)'
)
WHERE mc.nombre = 'OmniCore V250XT Type A' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC087112-001',''), 'Controlador completo (sealing joints, cable glands, conectores, cables, fans, ventilation holes)', 'controlador',
       NULLIF('V250XT Type B (2023+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('OmniCore V250XT Type B = variante mas reciente (2023+) CON MAYOR SCHEDULE: anade limpieza de heat exchanger air channels y segundo air filter. Incluye sealing joints/cable glands en inspeccion (a diferencia del V250XT general y Type A).','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'OmniCore V250XT Type B' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC087112-001',''), 'System fans', 'controlador',
       NULLIF('V250XT Type B (2023+)',''), NULL, 6, 'periodico',
       NULLIF('c/6 meses *',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'OmniCore V250XT Type B' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC087112-001',''), 'Air filter (external fans + opcion Max 52deg)', 'controlador',
       NULLIF('V250XT Type B (2023+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Agua 30-40C con detergente o aire comprimido. La opcion 3004-2 Max 52deg tiene el air filter en la puerta frontal.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore V250XT Type B' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC087112-001',''), 'Air channels / Heat exchanger', 'controlador',
       NULLIF('V250XT Type B (2023+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('EXCLUSIVO Type B: limpieza de canales de aire del heat exchanger. No presente en otros OmniCore.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore V250XT Type B' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC087112-001',''), 'Air filter', 'controlador',
       NULLIF('V250XT Type B (2023+)',''), NULL, 24, 'periodico',
       NULLIF('c/24 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo','á','a')) OR
  ta.nombre = 'Reemplazo'
)
WHERE mc.nombre = 'OmniCore V250XT Type B' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC087112-001',''), 'Air filter Heat exchanger (segundo filtro)', 'controlador',
       NULLIF('V250XT Type B (2023+)',''), NULL, 24, 'periodico',
       NULLIF('c/24 meses',''), NULLIF('EXCLUSIVO Type B: SEGUNDO air filter adicional, del heat exchanger. Reemplazo independiente del air filter principal.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo','á','a')) OR
  ta.nombre = 'Reemplazo'
)
WHERE mc.nombre = 'OmniCore V250XT Type B' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC087112-001',''), 'Control cabinet', 'controlador',
       NULLIF('V250XT Type B (2023+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore V250XT Type B' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC087112-001',''), 'FlexPendant', 'controlador',
       NULLIF('V250XT Type B (2023+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore V250XT Type B' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC087112-001',''), 'Emergency stop (FlexPendant)', 'controlador',
       NULLIF('V250XT Type B (2023+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT Type B' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC087112-001',''), 'Manual / Auto / Manual full speed mode (FlexPendant)', 'controlador',
       NULLIF('V250XT Type B (2023+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT Type B' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC087112-001',''), 'Enabling device (3-posiciones)', 'controlador',
       NULLIF('V250XT Type B (2023+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT Type B' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC087112-001',''), 'Automatic stop (si se usa)', 'controlador',
       NULLIF('V250XT Type B (2023+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT Type B' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC087112-001',''), 'General stop (si se usa)', 'controlador',
       NULLIF('V250XT Type B (2023+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT Type B' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC087112-001',''), 'External emergency stop (si se usa)', 'controlador',
       NULLIF('V250XT Type B (2023+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT Type B' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC087112-001',''), 'ESTOP_STATUS output (si se usa)', 'controlador',
       NULLIF('V250XT Type B (2023+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT Type B' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC087112-001',''), 'Reduced speed control', 'controlador',
       NULLIF('V250XT Type B (2023+)',''), NULL, NULL, 'periodico',
       NULLIF('Durante commissioning',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V250XT Type B' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC087112-001',''), 'Bateria interna computer module (RTC/CMOS tipo CR2032)', 'controlador',
       NULLIF('V250XT Type B (2023+)',''), NULL, 60, 'periodico',
       NULLIF('c/60 meses (5 anos)',''), NULLIF('BATERIA INTERNA COMPUTER MODULE (RTC/CMOS). No aparece en schedule oficial ABB (run-to-failure en PM). Agregado preventivo programado c/60m para evitar perdida de config. CR2032 litio 3V. Verificar DSQC y art. numero en parts catalog especifico.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo (preventivo programado)','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo (preventivo programado)','á','a')) OR
  ta.nombre = 'Reemplazo (preventivo programado)'
)
WHERE mc.nombre = 'OmniCore V250XT Type B' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC081697-001',''), 'Controlador completo (sealing joints, cable glands, conectores, cables, fans, ventilation holes)', 'controlador',
       NULLIF('V400XT (2023+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('OmniCore V400XT = cabinet flagship de mayor capacidad de la linea V (V250XT menor, V400XT mayor). Schedule IDENTICO al V250XT Type B (2 filtros + heat exchanger + air channels). Incluye sealing joints/cable glands en inspeccion. * Intervalo depende del ambiente.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'OmniCore V400XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC081697-001',''), 'System fans', 'controlador',
       NULLIF('V400XT (2023+)',''), NULL, 6, 'periodico',
       NULLIF('c/6 meses *',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Inspeccion','á','a')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mc.nombre = 'OmniCore V400XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC081697-001',''), 'Air filter (external fans + opcion 3004-2 Max 52deg en puerta)', 'controlador',
       NULLIF('V400XT (2023+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Agua 30-40C con detergente o aire comprimido. Secar antes de reinstalar. Si instalada opcion 3004-2 Max 52deg, el air filter esta en la puerta frontal.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore V400XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC081697-001',''), 'Air channels / Heat exchanger', 'controlador',
       NULLIF('V400XT (2023+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Limpieza de canales de aire del heat exchanger. Comparte con V250XT Type B (no presente en V250XT general ni Type A ni en C30/C90XT).','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore V400XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC081697-001',''), 'Air filter (principal)', 'controlador',
       NULLIF('V400XT (2023+)',''), NULL, 24, 'periodico',
       NULLIF('c/24 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo','á','a')) OR
  ta.nombre = 'Reemplazo'
)
WHERE mc.nombre = 'OmniCore V400XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC081697-001',''), 'Air filter Heat exchanger (segundo filtro)', 'controlador',
       NULLIF('V400XT (2023+)',''), NULL, 24, 'periodico',
       NULLIF('c/24 meses',''), NULLIF('SEGUNDO air filter del heat exchanger. Reemplazo independiente del air filter principal. Comparte con V250XT Type B.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo','á','a')) OR
  ta.nombre = 'Reemplazo'
)
WHERE mc.nombre = 'OmniCore V400XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC081697-001',''), 'Control cabinet', 'controlador',
       NULLIF('V400XT (2023+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Aspirador ESD-protected. Sin aire comprimido ni alta presion.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore V400XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC081697-001',''), 'FlexPendant', 'controlador',
       NULLIF('V400XT (2023+)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore V400XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC081697-001',''), 'Emergency stop (FlexPendant)', 'controlador',
       NULLIF('V400XT (2023+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V400XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC081697-001',''), 'Manual / Auto / Manual full speed mode (FlexPendant)', 'controlador',
       NULLIF('V400XT (2023+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V400XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC081697-001',''), 'Enabling device (3-posiciones)', 'controlador',
       NULLIF('V400XT (2023+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V400XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC081697-001',''), 'Automatic stop (si se usa)', 'controlador',
       NULLIF('V400XT (2023+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V400XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC081697-001',''), 'General stop (si se usa)', 'controlador',
       NULLIF('V400XT (2023+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V400XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC081697-001',''), 'External emergency stop (si se usa)', 'controlador',
       NULLIF('V400XT (2023+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V400XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC081697-001',''), 'ESTOP_STATUS output (si se usa)', 'controlador',
       NULLIF('V400XT (2023+)',''), NULL, 12, 'periodico',
       NULLIF('c/12 meses',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V400XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC081697-001',''), 'Reduced speed control', 'controlador',
       NULLIF('V400XT (2023+)',''), NULL, NULL, 'periodico',
       NULLIF('Durante commissioning',''), NULLIF('-','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Prueba funcional','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Prueba funcional','á','a')) OR
  ta.nombre = 'Prueba funcional'
)
WHERE mc.nombre = 'OmniCore V400XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC081697-001',''), 'Bateria interna computer module (RTC/CMOS tipo CR2032)', 'controlador',
       NULLIF('V400XT (2023+)',''), NULL, 60, 'periodico',
       NULLIF('c/60 meses (5 anos)',''), NULLIF('BATERIA INTERNA COMPUTER MODULE (RTC/CMOS). No aparece en schedule oficial ABB (run-to-failure en PM). Agregado preventivo programado c/60m para evitar perdida de config. CR2032 litio 3V. Verificar DSQC y art. numero en parts catalog especifico.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo (preventivo programado)','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Reemplazo (preventivo programado)','á','a')) OR
  ta.nombre = 'Reemplazo (preventivo programado)'
)
WHERE mc.nombre = 'OmniCore V400XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC090253-001',''), 'Control cabinet (interior)', 'cabinet_auxiliar',
       NULLIF('A250XT (2024+, Rev.E)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('CABINET AUXILIAR DE INTEGRACION - NO ES CONTROLADORA. No tiene computer module, drive module ni FlexPendant propio. Se usa como cabinet adicional para alojar application equipment del integrador (I/O remoto, fieldbus gateways, process hardware, transformadores, etc) junto a una controladora OmniCore (C30/C90XT/V250XT/V400XT). Schedule ULTRA-SIMPLE: UNICA actividad programada segun PM oficial es limpieza del cabinet. Procedimiento: usar aspirador ESD-protected. Nunca aire comprimido ni alta presion. No abrir puerta durante limpieza exterior. Dimensiones: 650x466x963 mm. Peso: 33 kg (sin mounting kits). IP54 (si cerrado correctamente). Apilable hasta 2 unidades maximo. Opcional: ruedas (option 3011-1) - NO permitidas en cabinet superior si apilado. Temperatura operacion: +5C a +45C. Altitud max: 2.000 m.','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore A250XT' AND mc.tipo = 'controller'
LIMIT 1;

INSERT INTO actividad_cabinet
  (cabinet_modelo_id, tipo_actividad_id, documento, componente, tipo_cabinet,
   generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mc.id, ta.id, NULLIF('3HAC090255-001',''), 'Control cabinet (interior)', 'cabinet_auxiliar',
       NULLIF('A400XT (2024+, Rev.E)',''), NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('CABINET AUXILIAR DE INTEGRACION - NO ES CONTROLADORA. No tiene computer module, drive module ni FlexPendant propio. Se usa como cabinet adicional para alojar application equipment del integrador (I/O remoto, fieldbus gateways, process hardware, transformadores, etc) junto a una controladora OmniCore (C30/C90XT/V250XT/V400XT). Schedule ULTRA-SIMPLE: UNICA actividad programada segun PM oficial es limpieza del cabinet. Procedimiento: usar aspirador ESD-protected. Nunca aire comprimido ni alta presion. No abrir puerta durante limpieza exterior. Dimensiones: 650x466x1138 mm (mismo footprint que A250XT pero mas alto: 1138 vs 963 mm). Peso: 38 kg (sin mounting kits; vs 33 kg del A250XT). IP54 (si cerrado correctamente - puerta y cable grommets sellados; conectores no usados con tapas). Apilable hasta 2 unidades maximo (los cabinets apilados deben fijarse al suelo; asegurar que la puerta abierta del superior no causa desequilibrio; tornillos M stack: par 14 Nm). Opcional: ruedas (option 3011-1','')
FROM modelos_componente mc
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  LOWER(REPLACE(ta.nombre,'á','a')) = LOWER(REPLACE('Limpieza','á','a')) OR
  ta.nombre = 'Limpieza'
)
WHERE mc.nombre = 'OmniCore A400XT' AND mc.tipo = 'controller'
LIMIT 1;


-- ------------------------------------------------------------------------------
-- B. ACTIVIDADES DE DRIVE MODULE (15 filas)
-- ------------------------------------------------------------------------------

INSERT INTO actividad_drive_module
  (drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
   documento, componente, generacion_hw,
   intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mcdm.id, mcctrl.id, ta.id,
       NULLIF('3HAC021313-001',''), 'Cabinet completo drive module (sellado, cables, conectores, heat exchanger, drive system fans)', NULLIF('M2004 (1a gen)',''),
       NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('IRC5 Drive Unit = unidad de potencia independiente que se conecta a una IRC5 Single existente para MultiMove o eje externo. MISMO HARDWARE que Single pero SIN computer module. Schedule subconjunto del Single: inspeccion general + heat exchanger + fans + filtro polvo. NO aplica: FlexPendant, mode switch, enabling device, K42/K43, K44, stops, earth fault breaker (todo eso esta en el computer module de la Single asociada).','')
FROM modelos_componente mcdm
JOIN modelos_componente mcctrl ON mcctrl.nombre = 'IRC5 Single' AND mcctrl.tipo = 'controller'
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mcdm.nombre = 'IRC5 Drive Unit' AND mcdm.tipo = 'drive_unit'
LIMIT 1;

INSERT INTO actividad_drive_module
  (drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
   documento, componente, generacion_hw,
   intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mcdm.id, mcctrl.id, ta.id,
       NULLIF('3HAC021313-001',''), 'Heat exchanger fan', NULLIF('M2004 (1a gen)',''),
       NULL, 6, 'periodico',
       NULLIF('c/6 meses *',''), NULLIF('Igual que IRC5 Single M2004. Drive module tiene su propio heat exchanger + fan.','')
FROM modelos_componente mcdm
JOIN modelos_componente mcctrl ON mcctrl.nombre = 'IRC5 Single' AND mcctrl.tipo = 'controller'
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mcdm.nombre = 'IRC5 Drive Unit' AND mcdm.tipo = 'drive_unit'
LIMIT 1;

INSERT INTO actividad_drive_module
  (drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
   documento, componente, generacion_hw,
   intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mcdm.id, mcctrl.id, ta.id,
       NULLIF('3HAC021313-001',''), 'Moist dust filter', NULLIF('M2004 (1a gen)',''),
       NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Filtro de polvo humedo propio del drive module cabinet.','')
FROM modelos_componente mcdm
JOIN modelos_componente mcctrl ON mcctrl.nombre = 'IRC5 Single' AND mcctrl.tipo = 'controller'
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  ta.nombre = 'Limpieza'
)
WHERE mcdm.nombre = 'IRC5 Drive Unit' AND mcdm.tipo = 'drive_unit'
LIMIT 1;

INSERT INTO actividad_drive_module
  (drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
   documento, componente, generacion_hw,
   intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mcdm.id, mcctrl.id, ta.id,
       NULLIF('3HAC021313-001',''), 'Moist dust filter', NULLIF('M2004 (1a gen)',''),
       NULL, 24, 'periodico',
       NULLIF('c/24 meses *',''), NULLIF('Reemplazo programado del filtro de polvo.','')
FROM modelos_componente mcdm
JOIN modelos_componente mcctrl ON mcctrl.nombre = 'IRC5 Single' AND mcctrl.tipo = 'controller'
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo','ó','o')) OR
  ta.nombre = 'Reemplazo'
)
WHERE mcdm.nombre = 'IRC5 Drive Unit' AND mcdm.tipo = 'drive_unit'
LIMIT 1;

INSERT INTO actividad_drive_module
  (drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
   documento, componente, generacion_hw,
   intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mcdm.id, mcctrl.id, ta.id,
       NULLIF('3HAC021313-001',''), 'Heat exchanger fan + drive system fans', NULLIF('M2004 (1a gen)',''),
       NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('Limpieza interior cabinet y drive system fans (4 pcs propios). ESD-protected aspirator only.','')
FROM modelos_componente mcdm
JOIN modelos_componente mcctrl ON mcctrl.nombre = 'IRC5 Single' AND mcctrl.tipo = 'controller'
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  ta.nombre = 'Limpieza'
)
WHERE mcdm.nombre = 'IRC5 Drive Unit' AND mcdm.tipo = 'drive_unit'
LIMIT 1;

INSERT INTO actividad_drive_module
  (drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
   documento, componente, generacion_hw,
   intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mcdm.id, mcctrl.id, ta.id,
       NULLIF('3HAC047136-001',''), 'Cabinet completo drive module', NULLIF('2a gen (2018+)',''),
       NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('IRC5 Drive Unit 2a gen - mismo hardware drive module que Single 2a gen pero sin computer module. Schedule: subconjunto del Single 2a gen SIN function tests (esos pertenecen al computer module de la controladora asociada). Si la drive unit esta conectada a una Single en MultiMove, los function tests del Single ya cubren todo.','')
FROM modelos_componente mcdm
JOIN modelos_componente mcctrl ON mcctrl.nombre = 'IRC5 Single' AND mcctrl.tipo = 'controller'
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mcdm.nombre = 'IRC5 Drive Unit' AND mcdm.tipo = 'drive_unit'
LIMIT 1;

INSERT INTO actividad_drive_module
  (drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
   documento, componente, generacion_hw,
   intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mcdm.id, mcctrl.id, ta.id,
       NULLIF('3HAC047136-001',''), 'Heat exchanger fan', NULLIF('2a gen (2018+)',''),
       NULL, 6, 'periodico',
       NULLIF('c/6 meses *',''), NULLIF('-','')
FROM modelos_componente mcdm
JOIN modelos_componente mcctrl ON mcctrl.nombre = 'IRC5 Single' AND mcctrl.tipo = 'controller'
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mcdm.nombre = 'IRC5 Drive Unit' AND mcdm.tipo = 'drive_unit'
LIMIT 1;

INSERT INTO actividad_drive_module
  (drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
   documento, componente, generacion_hw,
   intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mcdm.id, mcctrl.id, ta.id,
       NULLIF('3HAC047136-001',''), 'Moist dust filter', NULLIF('2a gen (2018+)',''),
       NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('-','')
FROM modelos_componente mcdm
JOIN modelos_componente mcctrl ON mcctrl.nombre = 'IRC5 Single' AND mcctrl.tipo = 'controller'
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  ta.nombre = 'Limpieza'
)
WHERE mcdm.nombre = 'IRC5 Drive Unit' AND mcdm.tipo = 'drive_unit'
LIMIT 1;

INSERT INTO actividad_drive_module
  (drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
   documento, componente, generacion_hw,
   intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mcdm.id, mcctrl.id, ta.id,
       NULLIF('3HAC047136-001',''), 'Moist dust filter', NULLIF('2a gen (2018+)',''),
       NULL, 24, 'periodico',
       NULLIF('c/24 meses *',''), NULLIF('-','')
FROM modelos_componente mcdm
JOIN modelos_componente mcctrl ON mcctrl.nombre = 'IRC5 Single' AND mcctrl.tipo = 'controller'
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo','ó','o')) OR
  ta.nombre = 'Reemplazo'
)
WHERE mcdm.nombre = 'IRC5 Drive Unit' AND mcdm.tipo = 'drive_unit'
LIMIT 1;

INSERT INTO actividad_drive_module
  (drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
   documento, componente, generacion_hw,
   intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mcdm.id, mcctrl.id, ta.id,
       NULLIF('3HAC047136-001',''), 'Heat exchanger fan + drive system fans', NULLIF('2a gen (2018+)',''),
       NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('Drive system fans (4 pcs). ESD-protected aspirator only. Sin aire comprimido.','')
FROM modelos_componente mcdm
JOIN modelos_componente mcctrl ON mcctrl.nombre = 'IRC5 Single' AND mcctrl.tipo = 'controller'
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  ta.nombre = 'Limpieza'
)
WHERE mcdm.nombre = 'IRC5 Drive Unit' AND mcdm.tipo = 'drive_unit'
LIMIT 1;

INSERT INTO actividad_drive_module
  (drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
   documento, componente, generacion_hw,
   intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mcdm.id, mcctrl.id, ta.id,
       NULLIF('Comparte con PM del cabinet asociado',''), 'Cabinet drive module (sealing, conectores, fans, filter)', NULLIF('Compatible C30/C90XT/V250XT',''),
       NULL, 12, 'periodico',
       NULLIF('c/12 meses *',''), NULLIF('OmniCore Drive Module = unidad de potencia adicional para MultiMove en OmniCore. Comparte hardware y mantenimiento con el drive section del cabinet asociado (C30/C90XT/V250XT). Schedule subconjunto: inspeccion + fans + filter (segun cabinet) SIN function tests (estos estan en el computer module del cabinet principal). Art. doc: comparte PM con el cabinet asociado - no tiene PM propio.','')
FROM modelos_componente mcdm
JOIN modelos_componente mcctrl ON mcctrl.nombre = 'OmniCore C30' AND mcctrl.tipo = 'controller'
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mcdm.nombre = 'OmniCore Drive Module' AND mcdm.tipo = 'drive_unit'
LIMIT 1;

INSERT INTO actividad_drive_module
  (drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
   documento, componente, generacion_hw,
   intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mcdm.id, mcctrl.id, ta.id,
       NULLIF('Comparte con PM del cabinet asociado',''), 'System fans drive module', NULLIF('Compatible C30/C90XT/V250XT',''),
       NULL, 6, 'periodico',
       NULLIF('c/6 meses *',''), NULLIF('-','')
FROM modelos_componente mcdm
JOIN modelos_componente mcctrl ON mcctrl.nombre = 'OmniCore C30' AND mcctrl.tipo = 'controller'
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Inspeccion','ó','o')) OR
  ta.nombre = 'Inspeccion'
)
WHERE mcdm.nombre = 'OmniCore Drive Module' AND mcdm.tipo = 'drive_unit'
LIMIT 1;

INSERT INTO actividad_drive_module
  (drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
   documento, componente, generacion_hw,
   intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mcdm.id, mcctrl.id, ta.id,
       NULLIF('Comparte con PM del cabinet asociado',''), 'Air filter drive module (si aplica segun cabinet)', NULLIF('Compatible C30/C90XT/V250XT',''),
       NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Solo aplica si el drive module esta en cabinet con air filter (C30 con vertical mounting kit, C90XT, V250XT). E10 no aplica (sin filter).','')
FROM modelos_componente mcdm
JOIN modelos_componente mcctrl ON mcctrl.nombre = 'OmniCore C30' AND mcctrl.tipo = 'controller'
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  ta.nombre = 'Limpieza'
)
WHERE mcdm.nombre = 'OmniCore Drive Module' AND mcdm.tipo = 'drive_unit'
LIMIT 1;

INSERT INTO actividad_drive_module
  (drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
   documento, componente, generacion_hw,
   intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mcdm.id, mcctrl.id, ta.id,
       NULLIF('Comparte con PM del cabinet asociado',''), 'Air filter drive module (si aplica)', NULLIF('Compatible C30/C90XT/V250XT',''),
       NULL, 24, 'periodico',
       NULLIF('c/24 meses',''), NULLIF('-','')
FROM modelos_componente mcdm
JOIN modelos_componente mcctrl ON mcctrl.nombre = 'OmniCore C30' AND mcctrl.tipo = 'controller'
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Reemplazo','ó','o')) OR
  ta.nombre = 'Reemplazo'
)
WHERE mcdm.nombre = 'OmniCore Drive Module' AND mcdm.tipo = 'drive_unit'
LIMIT 1;

INSERT INTO actividad_drive_module
  (drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id,
   documento, componente, generacion_hw,
   intervalo_horas, intervalo_meses, intervalo_condicion,
   intervalo_texto_legacy, notas)
SELECT mcdm.id, mcctrl.id, ta.id,
       NULLIF('Comparte con PM del cabinet asociado',''), 'Cabinet drive module interior', NULLIF('Compatible C30/C90XT/V250XT',''),
       NULL, NULL, 'condicion',
       NULLIF('Cuando sea necesario',''), NULLIF('Aspirador ESD-protected. Sin aire comprimido.','')
FROM modelos_componente mcdm
JOIN modelos_componente mcctrl ON mcctrl.nombre = 'OmniCore C30' AND mcctrl.tipo = 'controller'
JOIN lu_tipo_actividad ta ON (
  LOWER(REPLACE(ta.nombre,'ó','o')) = LOWER(REPLACE('Limpieza','ó','o')) OR
  ta.nombre = 'Limpieza'
)
WHERE mcdm.nombre = 'OmniCore Drive Module' AND mcdm.tipo = 'drive_unit'
LIMIT 1;


-- ------------------------------------------------------------------------------
-- C. EQUIVALENCIAS ENTRE FAMILIAS/VARIANTES (76 filas)
-- ------------------------------------------------------------------------------

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'lubricacion', 'Type A = Type B en lubricación', NULLIF('TRM 3HAC042927',''), NULLIF('TRM solo distingue ''Type C'' vs ''Other than Type C''. A y B son ''Other''.','')
FROM lu_familia f WHERE f.codigo = 'IRB 2600' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'lubricacion', 'Type A = Type B en lubricación Y mantenimiento', NULLIF('TRM 3HAC042927 + PM 3HAC033453',''), NULLIF('Type A/B = revisiones de manipulador (motor/eje 3 nuevo). NO afecta gearboxes. PM no distingue A de B.','')
FROM lu_familia f WHERE f.codigo = 'IRB 4600' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'lubricacion', 'Type C = Type D en lubricación', NULLIF('PM 3HAC033453',''), NULLIF('Type D = Type C + motor alternativo. Mismas reductoras. PM dice ''Type C and Type D'' siempre juntos.','')
FROM lu_familia f WHERE f.codigo = 'IRB 4600' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'lubricacion', 'Type C/D ≠ Type A/B en lubricación', NULLIF('TRM 3HAC042927 + PM 3HAC033453',''), NULLIF('Type C/D: proveedor alternativo reductoras ejes 1 y 3. Aceite, volúmenes y procedimientos diferentes.','')
FROM lu_familia f WHERE f.codigo = 'IRB 4600' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'lubricacion', 'Type A ≠ Type B en lubricación', NULLIF('TRM 3HAC042927',''), NULLIF('Volúmenes aceite diferentes. Type B: eje 2 ~6L vs ~4.5L.','')
FROM lu_familia f WHERE f.codigo = 'IRB 6600/6650' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Type B: aceite ≠ eje 6', NULLIF('TRM 3HAC042927',''), NULLIF('Type B eje 6: Mobilgear 600 XP 320. Type A: TMO 150','')
FROM lu_familia f WHERE f.codigo = 'IRB 6600ID/6650ID' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Type C ≠ Type A/B', NULLIF('TRM 3HAC042927',''), NULLIF('Type C: aceite Mobilgear 600 XP 320 (ml). A/B: grasa Harmonic 4B (g)','')
FROM lu_familia f WHERE f.codigo = 'IRB 140' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'lubricacion', 'Type A = Type B en lubricación (pendiente manual)', NULLIF('TRM 3HAC042927',''), NULLIF('No hay sección separada en TRM. Pendiente PM.','')
FROM lu_familia f WHERE f.codigo = 'IRB 140' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Floor ≠ Suspended', NULLIF('TRM 3HAC042927',''), NULLIF('Eje 1: Floor=350ml vs Suspended=600ml (+71%)','')
FROM lu_familia f WHERE f.codigo = 'IRB 1510ID' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Floor ≠ Suspended en procedimiento inspección', NULLIF('PM 3HAC033453',''), NULLIF('PM tiene secciones separadas floor vs suspended para inspección aceite eje 1','')
FROM lu_familia f WHERE f.codigo = 'IRB 4600' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Gen1 (Type A = Type B) pendiente confirmar', NULLIF('PM 3HAC046983',''), NULLIF('PM cubre todos los Types. Reductoras con grasa. No distingue Type en mantenimiento.','')
FROM lu_familia f WHERE f.codigo = 'IRB 1200' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Sin Types', NULLIF('PM 3HAC074708',''), NULLIF('OmniCore. Sin distinción de Types. Mantenimiento simplificado.','')
FROM lu_familia f WHERE f.codigo = 'IRB 1200 Gen2' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'IRC5/OmniCore: misma unidad para /60 y /L10', NULLIF('PM 3HAC022032',''), NULLIF('PM cubre ambas. Procedimiento ejes 5-6 diferente para /L10.','')
FROM lu_familia f WHERE f.codigo = 'IRB 4400' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'mantenimiento', 'M98 ≠ M99 ≠ M2004 en mantenimiento', NULLIF('3HAC2932 / 3HAC9003 / 3HAC022032',''), NULLIF('M98: incluye presión gas resorte. M99: cambio unidad equilibrado. M2004: intervalos actualizados.','')
FROM lu_familia f WHERE f.codigo = 'IRB 4400' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Type A = Type B (sin distinción en PM)', NULLIF('PM 3HAC022032',''), NULLIF('PM no menciona Type A/B. Cubre /60 y /L10 sin distinción de Type.','')
FROM lu_familia f WHERE f.codigo = 'IRB 4400' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Sin Types en PM. Un solo schedule para todas las variantes.', NULLIF('PM 3HAC030005',''), NULLIF('PM cubre 1/800, 1/1130, 1/1600, 3/1130, 6/1600, 8/1130. Sin distinción Type.','')
FROM lu_familia f WHERE f.codigo = 'IRB 360' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Batería 2-pole: 24 meses (≠ otros robots: alerta baja)', NULLIF('PM 3HAC030005',''), NULLIF('Intervalo batería 2-pole es 24 meses, no solo alerta baja como en otros robots.','')
FROM lu_familia f WHERE f.codigo = 'IRB 360' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Type A = diferente mecánica, NO fusionar', NULLIF('PM 3HAC075721',''), NULLIF('Type A tiene peso diferente (22-24kg vs 19-21kg). Overhaul 20.000h (920/Type A) vs 15.000h (920T).','')
FROM lu_familia f WHERE f.codigo = 'IRB 920' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Sin Types en PM. Motor Type A vs B solo para inspección sello.', NULLIF('PM 3HAC044266',''), NULLIF('Type A/B se refiere a revisión de MOTOR, no manipulador. Lubricación idéntica para todos.','')
FROM lu_familia f WHERE f.codigo = 'IRB 6700' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'IRB 6700 ≠ IRB 6700Inv en procedimientos', NULLIF('PM 3HAC044266 + 3HAC058254',''), NULLIF('IRB 6700Inv tiene PM separado. Mismos intervalos pero procedimientos invertidos.','')
FROM lu_familia f WHERE f.codigo = 'IRB 6700' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'IRB 6640 vs 6640ID: eje 6 primer cambio ≠', NULLIF('PM 3HAC026876',''), NULLIF('6640: 1er cambio eje 6 a 6.000h. 6640ID: 1er cambio a 24.000h.','')
FROM lu_familia f WHERE f.codigo = 'IRB 6640' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'mantenimiento', 'Type A = revisión mecánica. Mantenimiento idéntico.', NULLIF('PM 3HAC026660',''), NULLIF('PM cubre Type A y sin-Type. IRB 1600ID y IRB 1660ID comparten schedule aceite ejes 5-6.','')
FROM lu_familia f WHERE f.codigo = 'IRB 1600' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Type C ≠ Type A/B confirmado en PM', NULLIF('PM 3HAC027400',''), NULLIF('PM es solo para Type C. Type C: nuevo brazo superior y muñeca. Aceite Mobilgear 600 XP 320 para ejes 5-6.','')
FROM lu_familia f WHERE f.codigo = 'IRB 140' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Type A/B: ejes 1-3 aceite, ejes 4-6 Optigear BM 100', NULLIF('3HAC023297 (foldouts)',''), NULLIF('Type A/B (S4C+/IRC5): ax1:1.2L, ax2:1.0L, ax3:0.4L aceite + muñeca 0.35L Optigear BM 100','')
FROM lu_familia f WHERE f.codigo = 'IRB 140' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'lubricacion', 'IRB 6400 ≠ IRB 6400R en lubricación', NULLIF('PM M98 + PM 6400R M99',''), NULLIF('IRB 6400: GRASA ejes 1,2,3,6 + aceite ejes 4,5. IRB 6400R: ACEITE ejes 1-5 + grasa eje 6. Totalmente diferente.','')
FROM lu_familia f WHERE f.codigo = 'IRB 6400' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'IRB 6400: intervalos 4.000h/2años. IRB 6400R: 12.000h', NULLIF('PM M98 vs PM 6400R',''), NULLIF('Intervalos completamente diferentes entre 6400 y 6400R','')
FROM lu_familia f WHERE f.codigo = 'IRB 6400' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Standard (Spinea) = Type C (Nabtesco)', NULLIF('PARCIAL — mismos intervalos cambio aceite, pero aceites NO intercambiables (gearboxes de proveedores distintos). Type C solo en 2600-20/1.65 y 2600-12/1.65. Type C NO disponible en suspendido.',''), NULLIF('3HAC035504','')
FROM lu_familia f WHERE f.codigo = 'IRB 2600' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Type A = Type B = Type C (motor types)', NULLIF('SÍ fusionable en mantenimiento — diferencias solo en tipo de motor (pinion). No afecta schedule lubricación gearbox.',''), NULLIF('3HAC035504','')
FROM lu_familia f WHERE f.codigo = 'IRB 2600' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'IRB 2600 ≠ IRB 2600ID (eje 5)', NULLIF('IRB 2600ID eje 5: NO change needed (lubricated for life). IRB 2600 Standard eje 5-6: cambio c/6k→24k→24k. Mantener separados.',''), NULLIF('3HAC035504','')
FROM lu_familia f WHERE f.codigo = 'IRB 2600 vs IRB 2600ID' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'M98 = M2000 = M2004', NULLIF('SÍ fusionable — schedule idéntico en todas las generaciones: ejes 1-4 lubricated for life, ejes 5-6 grasa c/4.000h, batería NiCd 3 años. Diferencia menor: aceite eje1-4 M98 usa art.1171 2016-604, M2000/M2004 usa Mobil Gear 600 XP 320 (equivalentes). Mantener separados en BD por generación para trazabilidad.',''), NULLIF('3HAC021111-001 + 3HAC 2914-1','')
FROM lu_familia f WHERE f.codigo = 'IRB 1400' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Gen.1 ≠ Gen.2/3 (ejes 1-3 y ejes 4-5 secundarios)', NULLIF('NO fusionable. Gen.1: S/N M2000 76-20000-26999, M2000A 76-30000-33999, M2004 76-50000-50999. Aceite ejes 1-3: Optimol Optigear RMO150 (mineral). Gen.2: S/N M2000 76-27000+, M2000A 76-34000+, M2004 76-51000+. Aceite ejes 2-3 y primarios: Shell Tivela S150 → migrar a TMO150. Gen.3: entregados post Oct-2008, todos TMO150. TMO150 y Optigear RMO150 NO son miscibles — gearbox debe enjuagarse si se cambia tipo. Schedule ejes 1-3 y secundarios: Gen.1=c/12k, Gen.2/3=6k→24k→24k. Schedule ejes 4-5 primarios y eje 6: igual en todas las generaciones (6k→24k→24k).',''), NULLIF('3HAC022033-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 7600' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'M98 ≈ M2004', NULLIF('SÍ fusionable en schedule — idéntico: gearboxes 1-3 primer cambio 12.000h, barras c/500h, eje telescópico c/500h. Diferencia: M98 entrega NiCd 4944 026-4 (3 años) + opción litio; M2004 solo litio 3-cell (12-36 meses o alerta). Aceite Mobil DTE FM 220 idéntico en ambas generaciones. NOTA IMPORTANTE: el PM especifica solo el PRIMER cambio de aceite a 12.000h — no indica cambios posteriores.',''), NULLIF('3HAC 4760-1 + 3HAC022546-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 340' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Estructura Delta ≠ robots 6 ejes', NULLIF('Robot de brazo paralelo (FlexPicker). Ejes 1-3 son los gearboxes planetarios en la base. Eje 4 es eje telescópico central (solo en variantes r/SA/SAS). NO tiene compensador ni muñeca convencional. Variantes: Standard (3 ejes), r (4 ejes con rotación), SA (Stainless), SAS (SA+r).',''), NULLIF('3HAC 4760-1 + 3HAC022546-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 340' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Todas las variantes (-11/0.9, -10/1.15, -7/1.4, -12/1.4)', NULLIF('SÍ fusionable en schedule — mismo PM, mismos intervalos para todas las variantes. Diferencia menor en topes mecánicos eje 3: -10/1.15 usa bloque B (3HAC065671-001), resto usa bloque A (3HAC065651-001). Ejes 1-2: aceite (ver TRM). Ejes 3-6: harmonic drives con grasa. Robot OmniCore únicamente — no compatible IRC5.',''), NULLIF('3HAC070390-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 1300' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Todas las variantes (Standard y LID)', NULLIF('SÍ fusionable — mismo PM y schedule para las 7 variantes. Standard: -430/3.1, -360/3.3, -310/3.5, -400/2.85. LID: -390/3.1, -325/3.3, -280/3.5. Diferencia LID: dimensión B de 400mm vs 245mm (columna robot). No afecta schedule. DIFERENCIA CLAVE vs IRB 7600: schedule uniforme c/12.000h para todos los ejes (no hay distinción generaciones). Robot OmniCore únicamente.',''), NULLIF('3HAC089600-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 7710' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Misma arquitectura (doble gearbox eje 4), diferentes aceites eje 4 sec/eje 5', NULLIF('IRB 7710 eje 4 secundario: Mobilgear 600 XP 320 (7.250ml). IRB 7600 Gen.3 eje 4 secundario: Kyodo Yushi TMO150 (4L). IRB 7710 eje 5: Mobilgear 600 XP 320 (7.500ml) — sin distinción primario/secundario. IRB 7600 tiene eje 5 primario + secundario separados. NO intercambiar procedimientos de aceite entre IRB 7710 e IRB 7600.',''), NULLIF('3HAC089600-001 + 3HAC022033-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 7710 vs IRB 7600' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Actualización Rev.AH → Rev.AJ', NULLIF('Rev.AJ (Nov-2025): IRB 1300 eliminado del TRM (datos ahora en PM). IRB 6660 ejes 4-5-6 actualizados (eje4: ~8.1L, eje5: ~6.7L, eje6: ~0.45L). IRB 6730S y IRB 6760 añadidos. IRB 7600, 7710, 7720, 8700 sin cambios. Robots ya cargados en BD desde Rev.AH no requieren corrección de volúmenes.',''), NULLIF('3HAC042927-001 Rev.AJ','')
FROM lu_familia f WHERE f.codigo = 'TRM Lubricación' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Todas las variantes Standard y LID (-270/3.1, -210/3.5, -150/4.0, -220/3.1LID, -180/3.5LID, -130/4.0LID)', NULLIF('SÍ fusionable en schedule — mismo PM e intervalos para las 6 variantes. Diferencia SOLO en volúmenes aceite eje 5 y eje 6: -270/3.1,-210/3.5,-220/3.1LID,-180/3.5LID: eje5=3.200ml, eje6=600ml. -150/4.0,-130/4.0LID: eje5=2.360ml, eje6=370ml. INTERVALO DIFERENCIAL vs resto de familia 6730: ejes 1-3 c/5.000h (no 12.000h), ejes 4-6 c/10.000h. Robot OmniCore únicamente.',''), NULLIF('3HAC092897-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 6730S' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Intervalos aceite distintos — NO intercambiar schedules', NULLIF('IRB 6730S: ejes 1-3 c/5.000h, ejes 4-6 c/10.000h. IRB 6730: verificar en su PM (pendiente). Estructura gearbox similar (sin doble gearbox), pero la "S" implica intervalos de mantenimiento más exigentes. Confirmar al procesar PM IRB 6730.',''), NULLIF('3HAC092897-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 6730S vs IRB 6730' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Ambas variantes (-200/3.2 y -150/3.5)', NULLIF('SÍ fusionable — mismo schedule y volúmenes de aceite para ambas variantes. Schedule idéntico al IRB 6730S (c/5.000h ejes 1-3, c/10.000h ejes 4-6). Volúmenes mayores en ejes 1-3 vs 6730S (ej1: 5.900 vs 4.000ml). Mismos kits disp. equilibrado y misma grasa (GR100-0PD 31ml). Robot OmniCore únicamente, aplicación típica press tending.',''), NULLIF('3HAC095124-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 6760' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Todas las variantes (-270/2.7, -240/2.9, -210/3.1, -220/2.9LID, -190/3.1LID)', NULLIF('SÍ fusionable — mismo schedule y volúmenes para las 5 variantes. Schedule IDÉNTICO al IRB 6730S y IRB 6760 (c/5.000h ejes 1-3, c/10.000h ejes 4-6). ÚNICA diferencia vs IRB 6730S: kit cradle disp. equilibrado (6730=3HAC087164-001 vs 6730S=3HAC088299-001). Volúmenes aceite ejes 1-2 menores que 6730S (3.800ml vs 4.000ml).',''), NULLIF('3HAC085699-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 6730' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Familia OmniCore con schedule unificado c/5.000h + c/10.000h', NULLIF('Los tres robots comparten: mismos intervalos, mismos amortiguadores (ejes 2,3,5), misma grasa disp. equilibrado (GR100-0PD 31ml), misma batería (3HAC044075-001). Diferencias: kit cradle (6730≠6730S=6760), volúmenes aceite ejes 1-3 distintos. NO intercambiar kits cradle entre IRB 6730 y los otros dos.',''), NULLIF('3HAC085699-001 + 3HAC092897-001 + 3HAC095124-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 6730 / IRB 6730S / IRB 6760' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', 'Todas las variantes (3 Standard + 4 LID)', NULLIF('SÍ fusionable — mismo schedule y volúmenes para las 7 variantes. Schedule idéntico a IRB 6730/6730S/6760 (c/5.000h ejes 1-3, c/10.000h ejes 4-6). DIFERENCIAS vs familia 6730: (1) Amortiguador eje 3 = 3HAC12320-1 (no 3HAC11750-1). (2) Grasa disp. equilibrado = 50ml (no 31ml). (3) Eje 4 aceite = 7.600ml (no 7.500ml). Kit cradle igual a IRB 6730 (3HAC087164-001).',''), NULLIF('3HAC085697-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 6720' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '6 variantes — 2 grupos de volúmenes aceite', NULLIF('Schedule idéntico para las 6 variantes (c/5.000h ejes 1-3, c/10.000h ejes 4-6). Volúmenes ejes 1-4 idénticos en todos. DIFERENCIA en ejes 5 y 6: -350/3.2 y -270/3.2LID: eje5=4.600ml, eje6=400ml. Resto: eje5=3.200ml, eje6=600ml. Kit cradle 3HAC088299-001 (=IRB 6730S/6760, NO el 3HAC087164-001 de IRB 6730/6720). Amortiguador eje3=3HAC11750-1 (no 3HAC12320-1 del IRB 6720). Grasa equilibrado: 31ml (no 50ml del IRB 6720).',''), NULLIF('3HAC092901-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 6750S' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '6 variantes — 2 grupos de volúmenes (diferencia en ejes 5 y 6)', NULLIF('Schedule idéntico para las 6 variantes. Ejes 1-4 iguales en todos: eje1=3.800ml, eje2=4.300ml (eje2>eje1), eje3=2.600ml, eje4=8.400ml. Diferencia ejes 5-6: -310/2.8,-260/3.0,-270/2.8LID,-230/3.0LID: eje5=4.600ml, eje6=400ml; -240/3.2,-220/3.2LID: eje5=3.200ml, eje6=600ml. Kit cradle 3HAC088299-001 (=IRB 6730S/6750S/6760). Amortiguador eje3=3HAC11750-1. Grasa equilibrado=31ml.',''), NULLIF('3HAC085701-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 6740' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '3 variantes (-12/0.85, -12/1.05, -22/1.05) — schedule y volúmenes únicos', NULLIF('SÍ fusionable — mismo schedule y volúmenes para las 3 variantes. SCARA 4 ejes: estructura radicalmente diferente a robots articulados. Solo 2 gearboxes con aceite (ejes 1-2). Ejes 3-4: ball screw spline con grasa THK AFA. Primer cambio aceite a 6.000h (no a 5.000h como familia 67xx). Overhaul y vida de gearboxes: 20.000h (no 40.000h). Art. lubricante: 3HAC032140-009 (no -001 de la familia 67xx). PM solo documenta 3 variantes; BD registraba 6 — verificar con RobotStudio.',''), NULLIF('3HAC086009-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 930' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '2 versiones (3 ejes suelo / 4 ejes trolley) — BD tenía 6 variantes', NULLIF('Robot door opener para cabina pintura, zona ATEX, controlador IRC5P. Versión 3 ejes: sin trolley. Versión 4 ejes: con eje trolley en raíl. Ejes 1-2 usan TMO150; ejes 3 y trolley usan XP320 — NO mezclar entre sí. Schedule diferente al resto de la BD (c/6.000h primer cambio, c/24.000h siguientes). BD registraba 6 variantes — PM solo documenta 2 versiones base. Verificar si las 6 variantes corresponden a combinaciones de opciones de estos 2 tipos base.',''), NULLIF('3HNA019729-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 5350' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '4 variantes — 2 grupos aceite (diferencia ejes 3, 5 y 6)', NULLIF('Sin disp. equilibrado. Amort. ejes 2 y 3 = 3HAC12320-1 (mismo art.). E1 suelo=3.900ml / invertido=4.350ml. Grupos por alcance: /2.3 vs /2.7.',''), NULLIF('3HAC075184-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 5710' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '4 variantes — 2 grupos aceite (diferencia solo ejes 5 y 6)', NULLIF('Sin disp. equilibrado. Amort. ejes 2 y 3 = 3HAC12320-1. Eje2=3.800ml (mayor que IRB5710 eje2=2.500ml). Grupos: /3.0 vs /2.6 (diferencia ejes 5-6).',''), NULLIF('3HAC079195-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 5720' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '8 variantes — 2 grupos aceite (diferencia ejes 5 y 6)', NULLIF('Intervalo cambio aceite c/12.000h (no c/5.000h/c/10.000h). Eje 4 con gearbox primario (TMO150) Y secundario (XP320) — no confundir. Kits equilibrado y amortiguadores completamente diferentes a IRB 57xx/67xx. Grasa equilibrado: GR100-2PD 85ml + Shell Gadus S2 varilla pistón.',''), NULLIF('3HAC089605-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 7720' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '4 variantes — 2 grupos (diferencia en ejes 3,5,6)', NULLIF('SIN dispositivo equilibrado. Amortiguadores ejes 2 y 3: mismo art. 3HAC12320-1. Eje 1 varía según montaje (floor vs Inverted). Grupo A (-110/2.3,-90/2.3LID): eje3=1.600ml, eje5=1.890ml, eje6=370ml. Grupo B (-90/2.7,-70/2.7LID): eje3=1.700ml, eje5=1.170ml, eje6=220ml.',''), NULLIF('3HAC075184-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 5710' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '4 variantes — 2 grupos (diferencia en ejes 5,6)', NULLIF('SIN dispositivo equilibrado. Mismos amortiguadores que IRB 5710. Eje 2 mayor que IRB 5710 (3.800ml vs 2.500ml). Grupo A (-125/3.0,-90/3.0LID): eje5=1.890ml, eje6=370ml. Grupo B (-180/2.6,-155/2.6LID): eje5=2.360ml, eje6=380ml.',''), NULLIF('3HAC079195-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 5720' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '8 variantes — 2 grupos (diferencia en ejes 5,6); intervalos c/12.000h y c/20.000h', NULLIF('Intervalos de aceite DIFERENTES: ejes 1-4 c/12.000h, ejes 5-6 c/20.000h. Eje 4 tiene DOS gearboxes: primario TMO150 1.680ml + secundario XP320 9.400ml. Dispositivo equilibrado tipo PISTÓN — grasa GR100-2PD 85ml (no GR100-0PD). Lubricar también pistón c/20.000h con Shell Gadus S2. Amortiguadores únicos: 3HAC12991-1, 3HAC022338-001, 3HAC085025-001.',''), NULLIF('3HAC089605-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 7720' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '1 variante — IRC5+OmniCore', NULLIF('Muñeca ID especial: eje 5-6 = gearbox integrado Optigear BM100. Eje 4 y 5 individuales: NO requieren cambio aceite, solo insp. nivel (c/48m). E1 suelo=350ml / suspendida=600ml. Amort. art. en catálogo externo.',''), NULLIF('3HAC043435-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 1520ID' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '2 variantes (std + food grade) — IRC5 únicamente', NULLIF('ÚNICO robot con GRASA en todos los ejes (sin aceite). Overhaul 30.000h (único con 30.000h vs 40.000h resto). Correas dentadas ejes 3 y 5. Artículos amort. en catálogo externo.',''), NULLIF('3HAC035728-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 120' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '4 variantes — volúmenes idénticos en todas', NULLIF('Amort. eje2=3HAC046884-001 (≠ IRB 5710/5720 donde eje2=3HAC12320-1). Equilibrado: GR100-0PD 50ml (1 rodamiento). Kits: cradle=3HAC087164-001, link ear=3HAC087168-001.',''), NULLIF('3HAC085695-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 6710' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '4 variantes (2 Inv + 2 LID) — IRC5+OmniCore', NULLIF('Cambio aceite c/12.000h (no c/5k/c/10k). Dampers c/24m. Velcro straps c/6m. Equilibrado: Shell Gadus S2 (no GR100-0PD). Volúmenes TRM aproximados (~). Art. dampers y batería en catálogo externo.',''), NULLIF('3HAC058254-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 6700Inv' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '2 variantes — IRC5+OmniCore — volúmenes idénticos en ambas', NULLIF('Cambio aceite c/12.000h. Eje4 con gearbox primario (TMO150) + secundario (XP320). E5=16.500ml (mayor volumen BD). 3 tipos lubricación c/20.000h: GR100-2PD + Mobillux EP2 (x2). Dampers: 3HAC12991-1 (7 uds) + 3HAC050601-001 (2 uds).',''), NULLIF('3HAC052853-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 8700' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '1 variante — OmniCore — mini robot 3C', NULLIF('SIN cambio de aceite (no está en TRM). SIN amortiguadores en schedule. Overhaul 20.000h (menor que familia). Correas dentadas ejes 3 y 5 con tensiones específicas. Cable harness life 20.000h (igual en uso normal y extremo).',''), NULLIF('3HAC081964-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 1010' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '1 variante — OmniCore — robot educativo', NULLIF('ROBOT EDUCATIVO (solo training). SIN cambio de aceite (no en TRM). ÚNICO robot con overhaul y gearbox life de 10.000h. Correas dentadas en los 6 ejes. Cable package en 2 segmentos.',''), NULLIF('3HAC088056-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 1090' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '3 variantes BD (PM confirma 2: /0.475 + /0.58; 3ª prob. CleanRoom/IP67)', NULLIF('SIN cambio de aceite (no en TRM). SIN amortiguadores. Overhaul 30.000h. Correas dentadas en los 6 ejes. Cable package en 2 segmentos. CleanRoom: inspección DIARIA. L/H/P reduce vida útil.',''), NULLIF('3HAC064992-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 1100' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '1 variante — IRC5+IRC5C+OmniCore — CLON de IRB 1520ID', NULLIF('Volúmenes aceite IDÉNTICOS a IRB 1520ID. Muñeca ID (eje 5-6 gearbox integrado Optigear BM100). Ejes 4 y 5 individuales NO cambio (insp. c/48m). Soporta 3 controladores (IRC5+IRC5C+OmniCore, más amplio que 1520ID).',''), NULLIF('3HAC087870-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 1510ID' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '3 variantes (/0.45, /0.55, /0.65) — IRC5 únicamente', NULLIF('ROBOT SCARA — idéntico a IRB 930 en filosofía. Sin amortiguadores, sin aceite. Ejes 1-2: Harmonic Grease 4B No.2 (42g c/u). Ejes 3-4: ball screw spline unit (no gearbox) con THK AFA. Batería 3HAC051036-001 (DIFERENTE a familia estándar). Intervalo c/100 km para ball screw — métrica única en BD. Overhaul 20.000h.',''), NULLIF('3HAC056430-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 910SC' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '4 variantes BD (PM confirma 2 base: /0.35 y /0.55 — resto son protecciones IP30/IP54/CleanRoom)', NULLIF('SCARA INVERTIDO (ceiling-mounted) — único en BD. Ball screw cantidad 2g (vs 910SC 4g). 5 correas dentadas (vs 3 del 910SC). Bellows exclusivo CleanRoom/IP54. Batería 3HAC044075-001 (≠ 910SC que usa 3HAC051036-001). Ejes 1-2 pre-lubricados fábrica — no re-engrasar. Overhaul programado c/20.000h. Aplicaciones L/H/P reducen vida útil.',''), NULLIF('3HAC068055-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 910INV' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '2 variantes - IRC5 - palletizer 4 ejes', NULLIF('Ejes 1-3 LUBRICATED FOR LIFE (maintenance-free). Solo eje 6 con cambio opcional. Sin amortiguadores, sin disp. equilibrado. Mechanical stop axis 1 cada 60 meses. Overhaul 40.000h.',''), NULLIF('3HAC026048-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 260' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '3 variantes (/800, /1100, /1300) - OmniCore - FLEXPICKER 5 ejes', NULLIF('Delta paralelo - sin aceite, sin amortiguadores, sin equilibrado. Componentes criticos: ball bearing cups (c/3800h) + slide bearings (c/3000h). 3 variantes con mismo peso (86kg), difieren en alcance.',''), NULLIF('3HAC079185-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 365' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '2 variantes (-15/1300, -10/1300) - IRC5+OmniCore - DELTA FOOD GRADE', NULLIF('Unico robot BD con SHC Cibus 220 (food grade). Cambio aceite ejes 1-3 c/20.000h, ejes 4-5 prestage + delta c/12.000h. Lubricacion telescopicos c/8.000h. Universal joints + telescopic shafts reemplazo c/36m.',''), NULLIF('3HAC066566-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 390' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '1 variante (-110/2.4) - IRC5+OmniCore - palletizer 4 ejes', NULLIF('TODOS ejes con TMO150 (diferente al IRB 260 que usa XP320 ejes 1-3). Cambio aceite c/6.000h -> c/20.000h. Inspeccion nivel c/6m. Overhaul 30.000h (unico palletizer con 30k, resto 40k). Con amortiguadores (4 tipos).',''), NULLIF('3HAC039842-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 460' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '2 variantes (-180/3.15, -250/3.15) - IRC5+OmniCore - palletizer 4 ejes + equilibrado', NULLIF('Palletizer con disp. equilibrado. Volumenes TRM identicos ambas variantes. Lower arm lower damper: 1 pc (vs 2 en IRB 460). Herramienta lub bearings: 3HAC5222-2 (diferente a IRB 760). Overhaul 40.000h.',''), NULLIF('3HAC025755-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 660' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '2 variantes (-450/3.2, -445/3.2) - IRC5+OmniCore - palletizer mayor', NULLIF('Volumenes casi identicos a IRB 660 excepto eje 6 (850ml vs 300ml). Variante -445/3.2 tiene tope mecanico eje 3 adicional. Lubricacion balancing: bearings + piston rod (vs 660 solo bearings). Herramienta lub: 3HAC039296-001 (diferente a 660).',''), NULLIF('3HAC039838-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 760' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '1 variante Tricept - M2000/M2004 - ROBOT PARALELO UNICO EN BD', NULLIF('ARQUITECTURA UNICA: 3 actuadores lineales + linear bearings (no ejes rotatorios). Lubricacion c/1.000h (linear bearings Kluber Isoflex NBU 15 + actuators Kluberplex BEM 34-132). Sistema sobrepresion con filtro (3HAC 17158-1) c/12m. Cable espiral c/48m. SIN gearbox oil, SIN amortiguadores, SIN equilibrado, SIN correas.',''), NULLIF('3HAC 022034-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 940' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '1 variante (-150/2.2) - M2004 - 880 kg', NULLIF('Cambio ejes 1,2,3,6 c/6k->c/24k; ejes 4,5 c/24k. Damper eje 5 especifico 3HAC024541-001 (diferente a familia 67xx). Variante Foundry Plus tiene mayor volumen eje 6 (0.4l vs 0.3l). Overhaul 40.000h.',''), NULLIF('3HAC027151-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 6620' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '1 variante (-150/1.9) - M2004 - 610 kg - Linear eXtended', NULLIF('UNICO robot BD con MOBIL GLYGOYL 460 (eje 1, ~7l). DEBE montarse con eje lineal adicional. Resto ejes iguales a IRB 6620. Schedule base asumido IRB 6620 - PM especifico 3HAC035737-001 no disponible (tenemos solo Product Specification IRA426 + TRM). 3 aceites diferentes en un mismo robot (Glygoyl 460 + TMO150 + XP320) - NO MEZCLAR.',''), NULLIF('3HAC025861-001 (Product Spec) + TRM','')
FROM lu_familia f WHERE f.codigo = 'IRB 6620LX' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '1 variante BD (modelos PM: /1.95-30, /2.5-10, (F) Foundry) - S4 M94A', NULLIF('LEGACY 1994. Controladora S4 M94A (pre-IRC5 y pre-M2000). Art. doc: 3HAB 0009-37 Rev.2. GEARBOXES 1-3 con GRASA LIQUIDA lubricated for life (unico en BD junto con IRB 6400S antiguo). Ejes 4-6 con aceite. Sistema balancing con N2 (nitrogeno) - unico legacy en BD. Baterias Ni-Cd recargables. Datos extraidos via OCR (PM escaneado sin capa de texto).',''), NULLIF('3HAB 0009-37 (M94A Rev.2)','')
FROM lu_familia f WHERE f.codigo = 'IRB 3400' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '2 variantes - M2000 - SHELF/Suspended (variante de suspension)', NULLIF('LEGACY M2000. Variante S = Shelf (montaje suspendido/estanteria). Doc: 3HAC 10222-1. Ejes 1, 2, 3, 6 con GRASA (no aceite); ejes 4, 5 con aceite. Intervalos eje 1 y 6 VARIABLES segun press-tending cycle time o moment of inertia. Balancing unit eje 2 con piston rod (similar IRB 660/760 pero legacy). Comparte filosofia de mantenimiento con IRB 3400 (grasa en gearboxes pesados). Base cable life: 4 millones de ciclos.',''), NULLIF('3HAC 10222-1 (M2000)','')
FROM lu_familia f WHERE f.codigo = 'IRB 6400S' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;

INSERT INTO equivalencia_familia (familia_id, tipo_equivalencia, descripcion, fuente_doc, notas)
SELECT f.id, 'completa', '2 variantes (-235/2.65, -205/2.80) FoundryPrime - IRC5+OmniCore', NULLIF('UNICO robot BD con ANALISIS DE AGUA en aceite (ejes 1,2,3,6). Protection FoundryPrime con stainless steel fasteners, desiccant bag (3HAC080620-001), nickel coating, sistema de sobrepresion con airtightness c/6m. O-ring G1/2 (3HAC061327-059) obligatorio reemplazo tras cambio aceite. Dampers y art. bateria compartidos con IRB 6700/6700Inv.',''), NULLIF('3HAC063331-001','')
FROM lu_familia f WHERE f.codigo = 'IRB 6790' AND f.tipo IN ('mechanical_unit','external_axis') LIMIT 1;


-- ------------------------------------------------------------------------------
-- D. PUNTOS DE CONTROL GENÉRICOS (38 filas)
-- ------------------------------------------------------------------------------

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('manipulador', 'Ejes 1-N (todos)', 'Verificación holgura (backlash) con MOTORS ON — comprobar juego en cada eje', NULLIF('Cada inspección',''),
        NULLIF('Todos los ejes',''), NULLIF('Todas',''), NULLIF('Anotar si se detecta holgura anormal. Puede indicar desgaste de reductora.',''), 1);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('manipulador', 'Tarjeta lib. frenos', 'Test funcional de tarjeta de liberación de frenos — probar cada botón de eje', NULLIF('Cada inspección',''),
        NULLIF('Con tarjeta frenos',''), NULLIF('Todas',''), NULLIF('Verificar también estado de junta de goma de la tarjeta.',''), 2);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('manipulador', 'Marcas sincronización', 'Verificar presencia, alineación y estado de marcas de sincronización en cada eje', NULLIF('Cada inspección',''),
        NULLIF('Todos los ejes',''), NULLIF('Todas',''), NULLIF('Sin daños, todas visibles. Limpiar superficie de calibración si necesario.',''), 3);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('manipulador', 'Offsets calibración', 'Leer offsets de calibración desde TPU/FlexPendant y comparar con etiqueta del robot', NULLIF('Cada inspección',''),
        NULLIF('Todos los ejes',''), NULLIF('Todas',''), NULLIF('Actualizar etiqueta si los valores difieren. Documentar valores en informe.',''), 4);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('manipulador', 'Fijación base robot', 'Comprobar tornillos de fijación de base — sin juego entre base y suelo/pedestal', NULLIF('Cada inspección',''),
        NULLIF('Todos',''), NULLIF('Todas',''), NULLIF('Especialmente importante en instalaciones invertidas o en pared.',''), 5);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('manipulador', 'Estado pintura', 'Inspeccionar óxido o falta de pintura en estructura del robot', NULLIF('Cada inspección',''),
        NULLIF('Todos',''), NULLIF('Todas',''), NULLIF('En entornos agresivos (humedad, salpicaduras) revisar con más frecuencia.',''), 6);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('manipulador', 'Topes mecánicos', 'Inspeccionar topes mecánicos de ejes — sin daños, fisuras ni marcas de impacto >1mm', NULLIF('Cada inspección',''),
        NULLIF('Todos los ejes',''), NULLIF('Todas',''), NULLIF('Sustituir si deformados. Especial atención a eje 1.',''), 7);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('manipulador', 'Etiquetas información', 'Inspeccionar adhesivos informativos del robot — sustituir si dañados o ilegibles', NULLIF('Cada inspección',''),
        NULLIF('Todos',''), NULLIF('Todas',''), NULLIF('',''), 8);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Baterías litio (CMOS)', 'Verificar voltaje baterías de litio del ordenador de la controladora', NULLIF('Cada inspección',''),
        NULLIF('Verificar voltaje',''), NULLIF('S4 / S4C / S4C+',''), NULLIF('Anotar voltaje en informe. Sustituir si voltaje bajo. Tipo: litio (legacy).',''), 9);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Filtros ventilación', 'Inspeccionar y sustituir filtros de ventilación si es necesario', NULLIF('Cada inspección',''),
        NULLIF('Visual + funcional',''), NULLIF('S4 / S4C / S4C+',''), NULLIF('Sustituir si obstruidos. Afecta refrigeración de tarjetas.',''), 10);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Ventiladores', 'Inspeccionar estado y funcionamiento de todos los ventiladores internos', NULLIF('Cada inspección',''),
        NULLIF('Visual + funcional',''), NULLIF('S4 / S4C / S4C+',''), NULLIF('Verificar que giran correctamente y sin ruido anormal.',''), 11);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Puesta a tierra', 'Medir resistencia (Ω) entre chasis controladora y entrada de protección de tierra (PE)', NULLIF('Cada inspección',''),
        NULLIF('Medición Ω',''), NULLIF('S4 / S4C / S4C+',''), NULLIF('Valor debe ser mínimo. Documentar medición en informe.',''), 12);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Copia de seguridad', 'Realizar backup del sistema robot (programas + configuración)', NULLIF('Cada inspección',''),
        NULLIF('Todos los sistemas',''), NULLIF('S4 / S4C / S4C+',''), NULLIF('Para S4C: disquete o USB si disponible. Documentar fecha de backup.',''), 13);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Cableado interno', 'Inspeccionar cableado interno: daños, aplastamiento, calor, radio doblado excesivo', NULLIF('Cada inspección',''),
        NULLIF('Visual',''), NULLIF('S4 / S4C / S4C+',''), NULLIF('',''), 14);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Estanqueidad puerta', 'Verificar que junta de puerta está en buen estado y sella correctamente', NULLIF('Cada inspección',''),
        NULLIF('Visual',''), NULLIF('S4 / S4C / S4C+',''), NULLIF('',''), 15);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Olor eléctrico', 'Abrir puerta y detectar posibles olores eléctricos anómalos', NULLIF('Cada inspección',''),
        NULLIF('Sensorial',''), NULLIF('S4 / S4C / S4C+',''), NULLIF('Olor a quemado puede indicar componente dañado.',''), 16);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'TPU (teach pendant)', 'Verificar funcionamiento: E-stop, interruptor hombre muerto, joystick, teclado, cable', NULLIF('Cada inspección',''),
        NULLIF('Funcional',''), NULLIF('S4 / S4C / S4C+',''), NULLIF('',''), 17);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Selector de modo', 'Verificar funcionamiento de todos los modos del selector (con/sin llave)', NULLIF('Cada inspección',''),
        NULLIF('Funcional',''), NULLIF('S4 / S4C / S4C+',''), NULLIF('',''), 18);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Pila CMOS', 'Verificar nivel de tensión de pila CMOS — comprobar registros de evento', NULLIF('Cada inspección',''),
        NULLIF('Verificar voltaje',''), NULLIF('IRC5',''), NULLIF('Anotar fecha último cambio. Sustituir si voltaje bajo o alerta en event log.',''), 19);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Ultra Cap (condensador)', 'Verificar funcionalidad del Ultra Cap apagando el controlador', NULLIF('Cada inspección',''),
        NULLIF('Funcional',''), NULLIF('IRC5',''), NULLIF('El Ultra Cap permite guardado seguro de posición al apagar. Documentar fecha último cambio.',''), 20);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Filtros ventilación', 'Inspeccionar y sustituir filtros de ventilación (incluido filtro polvo húmedo si existe)', NULLIF('Cada inspección',''),
        NULLIF('Visual + sustitución',''), NULLIF('IRC5',''), NULLIF('En aplicaciones con polvo/suciedad (ej. soldadura) revisar con mayor frecuencia.',''), 21);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Ventiladores', 'Inspeccionar estado y funcionamiento de todos los ventiladores internos', NULLIF('Cada inspección',''),
        NULLIF('Visual + funcional',''), NULLIF('IRC5',''), NULLIF('',''), 22);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Puesta a tierra', 'Medir resistencia (Ω) entre chasis controladora y entrada PE', NULLIF('Cada inspección',''),
        NULLIF('Medición Ω',''), NULLIF('IRC5',''), NULLIF('Documentar valor medido en informe.',''), 23);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Copia de seguridad', 'Realizar backup interno (HDD robot) y backup externo en USB para cliente', NULLIF('Cada inspección',''),
        NULLIF('Todos los sistemas',''), NULLIF('IRC5',''), NULLIF('Incluir WebConfig si aplica. Verificar disponibilidad de keys/licencias/Add-ins.',''), 24);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Versión RobotWare', 'Anotar versión actual del sistema operativo RobotWare', NULLIF('Cada inspección',''),
        NULLIF('Solo información',''), NULLIF('IRC5',''), NULLIF('Documentar en informe. Útil para trazabilidad y soporte técnico.',''), 25);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Resetear programador serv.', 'Ajustar fecha/hora y resetear intervalo de servicio en rutina Service Info', NULLIF('Cada inspección',''),
        NULLIF('Post-mantenimiento',''), NULLIF('IRC5',''), NULLIF('Guardar datos de evaluación del robot via función Jobs en RobotStudio si posible.',''), 26);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Estanqueidad puerta', 'Verificar junta de puerta y bloqueo de puerta (opción)', NULLIF('Cada inspección',''),
        NULLIF('Visual',''), NULLIF('IRC5',''), NULLIF('',''), 27);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Olor eléctrico', 'Abrir puerta y detectar posibles olores eléctricos anómalos', NULLIF('Cada inspección',''),
        NULLIF('Sensorial',''), NULLIF('IRC5',''), NULLIF('',''), 28);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Cableado interno', 'Inspeccionar cableado: daños, aplastamiento, calor, radio doblado', NULLIF('Cada inspección',''),
        NULLIF('Visual',''), NULLIF('IRC5',''), NULLIF('',''), 29);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'FlexPendant (FPU)', 'Verificar: pantalla táctil, E-stop, hombre muerto, joystick, teclado, USB, carcasa y cable', NULLIF('Cada inspección',''),
        NULLIF('Funcional',''), NULLIF('IRC5',''), NULLIF('',''), 30);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Relés sistema', 'Inspeccionar relés de MOTORS ON y otros contactores', NULLIF('Cada inspección',''),
        NULLIF('Visual + funcional',''), NULLIF('IRC5',''), NULLIF('',''), 31);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Connected Services (opt.)', 'Verificar estado LED, cableado y antena de Connected Services si está instalado', NULLIF('Cada inspección',''),
        NULLIF('Opcional',''), NULLIF('IRC5',''), NULLIF('Comprobar que backup se realiza correctamente en portal My Robot / Connected Services.',''), 32);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'SafeMove (opt.)', 'Verificar relés de seguridad Categoría 0 y conector X23 si SafeMove está instalado', NULLIF('Cada inspección',''),
        NULLIF('Opcional',''), NULLIF('IRC5',''), NULLIF('Verificar que documento de configuración de seguridad ABB firmado está presente.',''), 33);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Separación ventilación', 'Verificar que existe al menos 100mm de separación en parte trasera del controlador', NULLIF('Cada inspección',''),
        NULLIF('Visual',''), NULLIF('IRC5',''), NULLIF('Cumplimiento criterios de instalación ABB.',''), 34);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Filtros ventilación', 'Inspeccionar y sustituir filtros de ventilación si necesario', NULLIF('Cada inspección',''),
        NULLIF('Visual + sustitución',''), NULLIF('OmniCore',''), NULLIF('Pendiente completar con PM OmniCore específico.',''), 35);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Copia de seguridad', 'Realizar backup del sistema robot', NULLIF('Cada inspección',''),
        NULLIF('Todos los sistemas',''), NULLIF('OmniCore',''), NULLIF('Pendiente completar con PM OmniCore específico.',''), 36);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'FlexPendant (FPU)', 'Verificar estado y funcionamiento completo de la FPU', NULLIF('Cada inspección',''),
        NULLIF('Funcional',''), NULLIF('OmniCore',''), NULLIF('Pendiente completar con PM OmniCore específico.',''), 37);

INSERT INTO punto_control_generico (categoria, componente, descripcion_accion, intervalo_texto, condicion, generacion_aplica, notas, orden)
VALUES ('controladora', 'Puesta a tierra', 'Medir resistencia (Ω) entre chasis y PE', NULLIF('Cada inspección',''),
        NULLIF('Medición Ω',''), NULLIF('OmniCore',''), NULLIF('Pendiente completar con PM OmniCore específico.',''), 38);


-- ------------------------------------------------------------------------------
-- E. COMPATIBILIDAD DE EJES EXTERNOS
-- ------------------------------------------------------------------------------
-- Reglas (ver 05_RESUMEN_CAMBIOS.md §4 para algoritmo completo):
--   IRBP A/B/C/D/K/L/R   → excluyen IRB 120
--   IRBT 2005           → IRB 1520/1600/2600/4600
--   IRBT 4002           → IRB 1400/2400/4400
--   IRBT 4004           → IRB 4400/4450S/4600
--   IRBT 6002           → IRB 6400/640/6400R/1400/2400/4400
--   IRBT 6004           → IRB 6620/6650S/6700
--   IRBT 7004           → IRB 6620/6650S/6700/7600
--   IRT 510             → IRB 1520/1600/2600/4600 (OmniCore)
--   IRT 710 OmniCore    → 17 familias OmniCore grandes
--   IRP A/B/C/D/K/L/R   → controlador V250XT o V400XT

-- IRBP A excluye IRB 120
INSERT IGNORE INTO compatibilidad_eje_excluye (eje_modelo_id, familia_id)
SELECT mc.id, fx.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBP A' AND fe.tipo='external_axis'
JOIN lu_familia fx ON fx.codigo = 'IRB 120' AND fx.tipo = 'mechanical_unit';

-- IRBP B excluye IRB 120
INSERT IGNORE INTO compatibilidad_eje_excluye (eje_modelo_id, familia_id)
SELECT mc.id, fx.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBP B' AND fe.tipo='external_axis'
JOIN lu_familia fx ON fx.codigo = 'IRB 120' AND fx.tipo = 'mechanical_unit';

-- IRBP C excluye IRB 120
INSERT IGNORE INTO compatibilidad_eje_excluye (eje_modelo_id, familia_id)
SELECT mc.id, fx.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBP C' AND fe.tipo='external_axis'
JOIN lu_familia fx ON fx.codigo = 'IRB 120' AND fx.tipo = 'mechanical_unit';

-- IRBP D excluye IRB 120
INSERT IGNORE INTO compatibilidad_eje_excluye (eje_modelo_id, familia_id)
SELECT mc.id, fx.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBP D' AND fe.tipo='external_axis'
JOIN lu_familia fx ON fx.codigo = 'IRB 120' AND fx.tipo = 'mechanical_unit';

-- IRBP K excluye IRB 120
INSERT IGNORE INTO compatibilidad_eje_excluye (eje_modelo_id, familia_id)
SELECT mc.id, fx.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBP K' AND fe.tipo='external_axis'
JOIN lu_familia fx ON fx.codigo = 'IRB 120' AND fx.tipo = 'mechanical_unit';

-- IRBP L excluye IRB 120
INSERT IGNORE INTO compatibilidad_eje_excluye (eje_modelo_id, familia_id)
SELECT mc.id, fx.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBP L' AND fe.tipo='external_axis'
JOIN lu_familia fx ON fx.codigo = 'IRB 120' AND fx.tipo = 'mechanical_unit';

-- IRBP R excluye IRB 120
INSERT IGNORE INTO compatibilidad_eje_excluye (eje_modelo_id, familia_id)
SELECT mc.id, fx.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBP R' AND fe.tipo='external_axis'
JOIN lu_familia fx ON fx.codigo = 'IRB 120' AND fx.tipo = 'mechanical_unit';

-- IRBT 2005 permite IRB 1520
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 2005' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 1520' AND fp.tipo = 'mechanical_unit';

-- IRBT 2005 permite IRB 1600
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 2005' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 1600' AND fp.tipo = 'mechanical_unit';

-- IRBT 2005 permite IRB 2600
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 2005' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 2600' AND fp.tipo = 'mechanical_unit';

-- IRBT 2005 permite IRB 4600
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 2005' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 4600' AND fp.tipo = 'mechanical_unit';

-- IRBT 4002 permite IRB 1400
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 4002' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 1400' AND fp.tipo = 'mechanical_unit';

-- IRBT 4002 permite IRB 2400
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 4002' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 2400' AND fp.tipo = 'mechanical_unit';

-- IRBT 4002 permite IRB 4400
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 4002' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 4400' AND fp.tipo = 'mechanical_unit';

-- IRBT 4004 permite IRB 4400
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 4004' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 4400' AND fp.tipo = 'mechanical_unit';

-- IRBT 4004 permite IRB 4450S
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 4004' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 4450S' AND fp.tipo = 'mechanical_unit';

-- IRBT 4004 permite IRB 4600
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 4004' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 4600' AND fp.tipo = 'mechanical_unit';

-- IRBT 6002 permite IRB 6400
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 6002' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 6400' AND fp.tipo = 'mechanical_unit';

-- IRBT 6002 permite IRB 640
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 6002' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 640' AND fp.tipo = 'mechanical_unit';

-- IRBT 6002 permite IRB 6400R
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 6002' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 6400R' AND fp.tipo = 'mechanical_unit';

-- IRBT 6002 permite IRB 1400
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 6002' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 1400' AND fp.tipo = 'mechanical_unit';

-- IRBT 6002 permite IRB 2400
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 6002' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 2400' AND fp.tipo = 'mechanical_unit';

-- IRBT 6002 permite IRB 4400
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 6002' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 4400' AND fp.tipo = 'mechanical_unit';

-- IRBT 6004 permite IRB 6620
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 6004' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 6620' AND fp.tipo = 'mechanical_unit';

-- IRBT 6004 permite IRB 6650S
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 6004' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 6650S' AND fp.tipo = 'mechanical_unit';

-- IRBT 6004 permite IRB 6700
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 6004' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 6700' AND fp.tipo = 'mechanical_unit';

-- IRBT 7004 permite IRB 6620
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 7004' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 6620' AND fp.tipo = 'mechanical_unit';

-- IRBT 7004 permite IRB 6650S
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 7004' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 6650S' AND fp.tipo = 'mechanical_unit';

-- IRBT 7004 permite IRB 6700
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 7004' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 6700' AND fp.tipo = 'mechanical_unit';

-- IRBT 7004 permite IRB 7600
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 7004' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 7600' AND fp.tipo = 'mechanical_unit';

-- IRT 510 permite IRB 1520
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 510' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 1520' AND fp.tipo = 'mechanical_unit';

-- IRT 510 permite IRB 1600
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 510' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 1600' AND fp.tipo = 'mechanical_unit';

-- IRT 510 permite IRB 2600
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 510' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 2600' AND fp.tipo = 'mechanical_unit';

-- IRT 510 permite IRB 4600
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 510' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 4600' AND fp.tipo = 'mechanical_unit';

-- IRT 710 OmniCore permite IRB 460
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710 OmniCore' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 460' AND fp.tipo = 'mechanical_unit';

-- IRT 710 OmniCore permite IRB 660
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710 OmniCore' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 660' AND fp.tipo = 'mechanical_unit';

-- IRT 710 OmniCore permite IRB 760
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710 OmniCore' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 760' AND fp.tipo = 'mechanical_unit';

-- IRT 710 OmniCore permite IRB 4400
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710 OmniCore' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 4400' AND fp.tipo = 'mechanical_unit';

-- IRT 710 OmniCore permite IRB 4600
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710 OmniCore' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 4600' AND fp.tipo = 'mechanical_unit';

-- IRT 710 OmniCore permite IRB 5710
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710 OmniCore' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 5710' AND fp.tipo = 'mechanical_unit';

-- IRT 710 OmniCore permite IRB 5720
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710 OmniCore' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 5720' AND fp.tipo = 'mechanical_unit';

-- IRT 710 OmniCore permite IRB 6650S
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710 OmniCore' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 6650S' AND fp.tipo = 'mechanical_unit';

-- IRT 710 OmniCore permite IRB 6660
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710 OmniCore' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 6660' AND fp.tipo = 'mechanical_unit';

-- IRT 710 OmniCore permite IRB 6700
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710 OmniCore' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 6700' AND fp.tipo = 'mechanical_unit';

-- IRT 710 OmniCore permite IRB 6710
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710 OmniCore' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 6710' AND fp.tipo = 'mechanical_unit';

-- IRT 710 OmniCore permite IRB 6720
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710 OmniCore' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 6720' AND fp.tipo = 'mechanical_unit';

-- IRT 710 OmniCore permite IRB 6730
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710 OmniCore' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 6730' AND fp.tipo = 'mechanical_unit';

-- IRT 710 OmniCore permite IRB 6740
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710 OmniCore' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 6740' AND fp.tipo = 'mechanical_unit';

-- IRT 710 OmniCore permite IRB 7600
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710 OmniCore' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 7600' AND fp.tipo = 'mechanical_unit';

-- IRT 710 OmniCore permite IRB 7710
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710 OmniCore' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 7710' AND fp.tipo = 'mechanical_unit';

-- IRT 710 OmniCore permite IRB 7720
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 710 OmniCore' AND fe.tipo='external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 7720' AND fp.tipo = 'mechanical_unit';

-- IRP A requiere controlador OmniCore V250XT
INSERT IGNORE INTO compatibilidad_eje_controlador (eje_modelo_id, controlador_modelo_id)
SELECT mc.id, mcc.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRP A' AND fe.tipo='external_axis'
JOIN modelos_componente mcc ON mcc.tipo = 'controller' AND mcc.nombre LIKE '%V250XT%';

-- IRP A requiere controlador OmniCore V400XT
INSERT IGNORE INTO compatibilidad_eje_controlador (eje_modelo_id, controlador_modelo_id)
SELECT mc.id, mcc.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRP A' AND fe.tipo='external_axis'
JOIN modelos_componente mcc ON mcc.tipo = 'controller' AND mcc.nombre LIKE '%V400XT%';

-- IRP B requiere controlador OmniCore V250XT
INSERT IGNORE INTO compatibilidad_eje_controlador (eje_modelo_id, controlador_modelo_id)
SELECT mc.id, mcc.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRP B' AND fe.tipo='external_axis'
JOIN modelos_componente mcc ON mcc.tipo = 'controller' AND mcc.nombre LIKE '%V250XT%';

-- IRP B requiere controlador OmniCore V400XT
INSERT IGNORE INTO compatibilidad_eje_controlador (eje_modelo_id, controlador_modelo_id)
SELECT mc.id, mcc.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRP B' AND fe.tipo='external_axis'
JOIN modelos_componente mcc ON mcc.tipo = 'controller' AND mcc.nombre LIKE '%V400XT%';

-- IRP C requiere controlador OmniCore V250XT
INSERT IGNORE INTO compatibilidad_eje_controlador (eje_modelo_id, controlador_modelo_id)
SELECT mc.id, mcc.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRP C' AND fe.tipo='external_axis'
JOIN modelos_componente mcc ON mcc.tipo = 'controller' AND mcc.nombre LIKE '%V250XT%';

-- IRP C requiere controlador OmniCore V400XT
INSERT IGNORE INTO compatibilidad_eje_controlador (eje_modelo_id, controlador_modelo_id)
SELECT mc.id, mcc.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRP C' AND fe.tipo='external_axis'
JOIN modelos_componente mcc ON mcc.tipo = 'controller' AND mcc.nombre LIKE '%V400XT%';

-- IRP D requiere controlador OmniCore V250XT
INSERT IGNORE INTO compatibilidad_eje_controlador (eje_modelo_id, controlador_modelo_id)
SELECT mc.id, mcc.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRP D' AND fe.tipo='external_axis'
JOIN modelos_componente mcc ON mcc.tipo = 'controller' AND mcc.nombre LIKE '%V250XT%';

-- IRP D requiere controlador OmniCore V400XT
INSERT IGNORE INTO compatibilidad_eje_controlador (eje_modelo_id, controlador_modelo_id)
SELECT mc.id, mcc.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRP D' AND fe.tipo='external_axis'
JOIN modelos_componente mcc ON mcc.tipo = 'controller' AND mcc.nombre LIKE '%V400XT%';

-- IRP K requiere controlador OmniCore V250XT
INSERT IGNORE INTO compatibilidad_eje_controlador (eje_modelo_id, controlador_modelo_id)
SELECT mc.id, mcc.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRP K' AND fe.tipo='external_axis'
JOIN modelos_componente mcc ON mcc.tipo = 'controller' AND mcc.nombre LIKE '%V250XT%';

-- IRP K requiere controlador OmniCore V400XT
INSERT IGNORE INTO compatibilidad_eje_controlador (eje_modelo_id, controlador_modelo_id)
SELECT mc.id, mcc.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRP K' AND fe.tipo='external_axis'
JOIN modelos_componente mcc ON mcc.tipo = 'controller' AND mcc.nombre LIKE '%V400XT%';

-- IRP L requiere controlador OmniCore V250XT
INSERT IGNORE INTO compatibilidad_eje_controlador (eje_modelo_id, controlador_modelo_id)
SELECT mc.id, mcc.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRP L' AND fe.tipo='external_axis'
JOIN modelos_componente mcc ON mcc.tipo = 'controller' AND mcc.nombre LIKE '%V250XT%';

-- IRP L requiere controlador OmniCore V400XT
INSERT IGNORE INTO compatibilidad_eje_controlador (eje_modelo_id, controlador_modelo_id)
SELECT mc.id, mcc.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRP L' AND fe.tipo='external_axis'
JOIN modelos_componente mcc ON mcc.tipo = 'controller' AND mcc.nombre LIKE '%V400XT%';

-- IRP R requiere controlador OmniCore V250XT
INSERT IGNORE INTO compatibilidad_eje_controlador (eje_modelo_id, controlador_modelo_id)
SELECT mc.id, mcc.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRP R' AND fe.tipo='external_axis'
JOIN modelos_componente mcc ON mcc.tipo = 'controller' AND mcc.nombre LIKE '%V250XT%';

-- IRP R requiere controlador OmniCore V400XT
INSERT IGNORE INTO compatibilidad_eje_controlador (eje_modelo_id, controlador_modelo_id)
SELECT mc.id, mcc.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRP R' AND fe.tipo='external_axis'
JOIN modelos_componente mcc ON mcc.tipo = 'controller' AND mcc.nombre LIKE '%V400XT%';


-- ==============================================================================
SET FOREIGN_KEY_CHECKS = 1;

-- VERIFICACIÓN
-- ==============================================================================
-- SELECT COUNT(*) FROM actividad_cabinet;               -- esperado ~171
-- SELECT COUNT(*) FROM actividad_drive_module;          -- esperado 15
-- SELECT COUNT(*) FROM equivalencia_familia;            -- esperado 76
-- SELECT COUNT(*) FROM punto_control_generico;          -- esperado 38
-- SELECT COUNT(*) FROM compatibilidad_eje_permitida;    -- esperado ~530
-- SELECT COUNT(*) FROM compatibilidad_eje_excluye;      -- esperado 115
-- SELECT COUNT(*) FROM compatibilidad_eje_controlador;  -- esperado ~90
-- ==============================================================================
