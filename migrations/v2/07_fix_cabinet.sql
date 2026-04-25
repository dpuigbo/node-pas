-- =============================================================================
-- PAS ROBOTICS MANAGE - Re-cargar actividades cabinet (script 03 truncado)
-- =============================================================================
-- El script 03 solo cargo 35-69 de 171 actividades cabinet por:
--   1. Tipos de actividad faltantes en lu_tipo_actividad ('Limpieza/Reemplazo',
--      'Mantenimiento general', 'Prueba funcional',
--      'Reemplazo (preventivo programado)')
--   2. La JOIN con lu_tipo_actividad fallaba silenciosamente
--
-- Este script:
--   1. Anade los tipos de actividad faltantes
--   2. Vacia actividad_cabinet
--   3. Re-carga las 171 actividades
-- =============================================================================

-- 1. Tipos de actividad faltantes
INSERT IGNORE INTO lu_tipo_actividad (codigo, nombre, categoria, requiere_parada, orden) VALUES
  ('limpieza_reemplazo', 'Limpieza/Reemplazo', 'reemplazo', 1, 35),
  ('mantenimiento_general', 'Mantenimiento general', 'otro', 0, 75),
  ('prueba_funcional', 'Prueba funcional', 'inspeccion', 0, 13),
  ('reemplazo_preventivo', 'Reemplazo (preventivo programado)', 'reemplazo', 1, 32);

-- 2. Vaciar tabla
TRUNCATE TABLE actividad_cabinet;

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

-- Verificacion
SELECT mc.nombre, COUNT(ac.id) AS actividades
FROM modelos_componente mc
LEFT JOIN actividad_cabinet ac ON ac.cabinet_modelo_id = mc.id
WHERE mc.tipo = 'controller'
GROUP BY mc.id, mc.nombre
ORDER BY actividades DESC;

SELECT (SELECT COUNT(*) FROM actividad_cabinet) AS total_cabinet;
