-- ==============================================================================
-- PAS ROBOTICS MANAGE - Seed 04: Demo Clientes/Plantas/Sistemas
-- ==============================================================================
-- Crea UN cliente demo completo con todos los campos (tarifas, dietas, etc.)
-- para probar el flujo end-to-end sin tocar tu cliente "xx" existente (id=3).
--
-- USA tu schema REAL: cliente → planta → sistema → componentes_sistema
--
-- Si NO quieres datos demo, no ejecutes este script.
--
-- ORDEN: ejecutar DESPUÉS de 01 + 02 + 03.
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- A. CLIENTE DEMO con todos los campos financieros
-- ------------------------------------------------------------------------------
-- Ejemplo: cliente industrial típico español con todas las tarifas pobladas
INSERT INTO clientes (
  nombre, sede, direccion, ciudad, codigo_postal, provincia, telefono, email, persona_contacto,
  tarifa_hora_trabajo, tarifa_hora_viaje, dietas, peajes, km,
  gestion_accesos, horas_trayecto, dias_viaje, precio_hotel, precio_km,
  activo
) VALUES (
  'ACME Metalúrgica S.A.', 'Planta Principal',
  'Polígono Industrial Les Comes, Nave 12', 'Igualada', '08700', 'Barcelona',
  '+34 938 031 234', 'mantenimiento@acme-metalurgica.es', 'Jordi Carbonell',
  75.00, 45.00, 50.00, 35.00, 120.00,
  'Requiere PRL y acceso con DNI. Solicitar 48h antes.',
  1.5, 0, 95.00, 0.50,
  1
);

-- ------------------------------------------------------------------------------
-- B. PLANTAS del cliente (nivel intermedio - ya existe en tu schema)
-- ------------------------------------------------------------------------------
INSERT INTO plantas (cliente_id, nombre, direccion)
SELECT c.id, 'Nave de Soldadura Robotizada',
  'Polígono Industrial Les Comes, Nave 12 - Zona A'
FROM clientes c WHERE c.nombre LIKE 'ACME%';

INSERT INTO plantas (cliente_id, nombre, direccion)
SELECT c.id, 'Nave de Paletizado',
  'Polígono Industrial Les Comes, Nave 12 - Zona B'
FROM clientes c WHERE c.nombre LIKE 'ACME%';

-- ------------------------------------------------------------------------------
-- C. MÁQUINAS (línea de producción dentro de una planta)
-- ------------------------------------------------------------------------------
INSERT INTO maquinas (cliente_id, nombre, descripcion)
SELECT c.id, 'Célula Soldadura MIG 1',
  'Soldadura MIG de bastidores. IRB 1520ID + IRBP K-300'
FROM clientes c WHERE c.nombre LIKE 'ACME%';

INSERT INTO maquinas (cliente_id, nombre, descripcion)
SELECT c.id, 'Célula Soldadura MIG 2',
  'Soldadura componentes grandes. IRB 2600 sobre track IRT 510 OmniCore'
FROM clientes c WHERE c.nombre LIKE 'ACME%';

INSERT INTO maquinas (cliente_id, nombre, descripcion)
SELECT c.id, 'Paletizado Línea B3',
  'IRB 660 paletizador con IRC5 Single'
FROM clientes c WHERE c.nombre LIKE 'ACME%';

-- ------------------------------------------------------------------------------
-- D. SISTEMAS ROBOTIZADOS (con planta_id según schema real)
-- ------------------------------------------------------------------------------

-- Sistema 1: Célula MIG 1 - planta 1
INSERT INTO sistemas (cliente_id, planta_id, maquina_id, fabricante_id, nombre, descripcion)
SELECT c.id, p.id, m.id, 1, 'MIG1-ACME',
  'IRC5 Compact + IRB 1520ID + IRBP K-300 D1000'
FROM clientes c
JOIN plantas p ON p.cliente_id = c.id AND p.nombre LIKE '%Soldadura%'
JOIN maquinas m ON m.cliente_id = c.id AND m.nombre = 'Célula Soldadura MIG 1'
WHERE c.nombre LIKE 'ACME%';

-- Componentes del Sistema 1
INSERT INTO componentes_sistema (sistema_id, modelo_componente_id, tipo, etiqueta, numero_serie, orden)
SELECT s.id, mc.id, 'controller', 'IRC5 Compact', 'IRC5C-21-3345', 0
FROM sistemas s, modelos_componente mc
WHERE s.nombre = 'MIG1-ACME' AND mc.nombre = 'IRC5 Compact' AND mc.tipo = 'controller';

INSERT INTO componentes_sistema (sistema_id, modelo_componente_id, tipo, etiqueta, numero_serie, num_ejes, orden)
SELECT s.id, mc.id, 'mechanical_unit', 'IRB 1520ID soldador', 'IRB1520ID-21-0087', 6, 1
FROM sistemas s, modelos_componente mc
WHERE s.nombre = 'MIG1-ACME' AND mc.familia LIKE 'IRB 1520%' AND mc.tipo = 'mechanical_unit'
LIMIT 1;

INSERT INTO componentes_sistema (sistema_id, modelo_componente_id, tipo, etiqueta, numero_serie, orden)
SELECT s.id, mc.id, 'external_axis', 'Posicionador IRBP K-300 D1000', 'IRBPK300-21-1104', 2
FROM sistemas s, modelos_componente mc
WHERE s.nombre = 'MIG1-ACME' AND mc.nombre LIKE 'IRBP K300 D1000%' AND mc.familia = 'IRBP K'
LIMIT 1;

-- Sistema 2: Célula MIG 2 con OmniCore + track
INSERT INTO sistemas (cliente_id, planta_id, maquina_id, fabricante_id, nombre, descripcion)
SELECT c.id, p.id, m.id, 1, 'MIG2-ACME',
  'OmniCore C30 + IRB 2600 + track IRT 510 (instalación 2024)'
FROM clientes c
JOIN plantas p ON p.cliente_id = c.id AND p.nombre LIKE '%Soldadura%'
JOIN maquinas m ON m.cliente_id = c.id AND m.nombre = 'Célula Soldadura MIG 2'
WHERE c.nombre LIKE 'ACME%';

INSERT INTO componentes_sistema (sistema_id, modelo_componente_id, tipo, etiqueta, numero_serie, orden)
SELECT s.id, mc.id, 'controller', 'OmniCore C30', 'OC-C30-24-0455', 0
FROM sistemas s, modelos_componente mc
WHERE s.nombre = 'MIG2-ACME' AND mc.nombre = 'OmniCore C30' AND mc.tipo = 'controller';

INSERT INTO componentes_sistema (sistema_id, modelo_componente_id, tipo, etiqueta, numero_serie, num_ejes, orden)
SELECT s.id, mc.id, 'mechanical_unit', 'IRB 2600 soldador', 'IRB2600-24-0512', 6, 1
FROM sistemas s, modelos_componente mc
WHERE s.nombre = 'MIG2-ACME' AND mc.familia = 'IRB 2600' AND mc.tipo = 'mechanical_unit'
LIMIT 1;

INSERT INTO componentes_sistema (sistema_id, modelo_componente_id, tipo, etiqueta, numero_serie, orden)
SELECT s.id, mc.id, 'external_axis', 'Track IRT 510', 'IRT510-24-0033', 2
FROM sistemas s, modelos_componente mc
WHERE s.nombre = 'MIG2-ACME' AND mc.familia = 'IRT 510' AND mc.nombre LIKE 'IRT 510%'
LIMIT 1;

-- Sistema 3: Paletizado legacy IRC5
INSERT INTO sistemas (cliente_id, planta_id, maquina_id, fabricante_id, nombre, descripcion)
SELECT c.id, p.id, m.id, 1, 'PAL1-ACME',
  'IRB 660 paletizador con IRC5 Single - instalación 2015, en servicio'
FROM clientes c
JOIN plantas p ON p.cliente_id = c.id AND p.nombre LIKE '%Paletizado%'
JOIN maquinas m ON m.cliente_id = c.id AND m.nombre = 'Paletizado Línea B3'
WHERE c.nombre LIKE 'ACME%';

INSERT INTO componentes_sistema (sistema_id, modelo_componente_id, tipo, etiqueta, numero_serie, orden)
SELECT s.id, mc.id, 'controller', 'IRC5 Single', 'IRC5-15-2341', 0
FROM sistemas s, modelos_componente mc
WHERE s.nombre = 'PAL1-ACME' AND mc.nombre = 'IRC5 Single' AND mc.tipo = 'controller';

INSERT INTO componentes_sistema (sistema_id, modelo_componente_id, tipo, etiqueta, numero_serie, num_ejes, orden)
SELECT s.id, mc.id, 'mechanical_unit', 'IRB 660 paletizador', 'IRB660-14-089', 4, 1
FROM sistemas s, modelos_componente mc
WHERE s.nombre = 'PAL1-ACME' AND mc.familia = 'IRB 660' AND mc.tipo = 'mechanical_unit'
LIMIT 1;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- ROLLBACK SI NO QUIERES LOS DATOS DEMO
-- ==============================================================================
--
-- DELETE cs FROM componentes_sistema cs
-- JOIN sistemas s ON s.id = cs.sistema_id
-- JOIN clientes c ON c.id = s.cliente_id
-- WHERE c.nombre LIKE 'ACME%';
--
-- DELETE FROM sistemas WHERE cliente_id = (SELECT id FROM clientes WHERE nombre LIKE 'ACME%');
-- DELETE FROM maquinas WHERE cliente_id = (SELECT id FROM clientes WHERE nombre LIKE 'ACME%');
-- DELETE FROM plantas  WHERE cliente_id = (SELECT id FROM clientes WHERE nombre LIKE 'ACME%');
-- DELETE FROM clientes WHERE nombre LIKE 'ACME%';
-- ==============================================================================
