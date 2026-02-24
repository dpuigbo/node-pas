-- =============================================================================
-- PAS Robotics Manage - Migration 2026-02-24
-- Run this in phpMyAdmin on Hostinger
--
-- This covers ALL changes from recent commits:
-- - Redesign intervencion model + new informe states
-- - Pedido de compra, calendario dashboard, ofertas flow
-- =============================================================================

-- 1. Add 'nivel' column to intervencion_sistema (if not exists)
-- This allows specifying maintenance level per system in an intervention
ALTER TABLE intervencion_sistema
  ADD COLUMN IF NOT EXISTS nivel VARCHAR(20) NOT NULL DEFAULT '1';

-- 2. Change informes.estado enum from old values to new values
-- Old: borrador, en_curso, completada (or similar)
-- New: inactivo, activo, finalizado
-- First update existing rows, then alter the column
UPDATE informes SET estado = 'inactivo' WHERE estado = 'borrador';
UPDATE informes SET estado = 'activo' WHERE estado = 'en_curso';
UPDATE informes SET estado = 'finalizado' WHERE estado = 'completada';
ALTER TABLE informes MODIFY COLUMN estado ENUM('inactivo', 'activo', 'finalizado') NOT NULL DEFAULT 'inactivo';

-- 3. Add 'oferta_id' column to intervenciones (FK to ofertas, nullable)
ALTER TABLE intervenciones
  ADD COLUMN IF NOT EXISTS oferta_id INT NULL;

-- 4. Create 'pedidos_compra' table
CREATE TABLE IF NOT EXISTS pedidos_compra (
  id INT AUTO_INCREMENT PRIMARY KEY,
  intervencion_id INT NOT NULL UNIQUE,
  estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
  notas TEXT NULL,
  lineas JSON NOT NULL,
  total_coste DECIMAL(10,2) NULL,
  total_precio DECIMAL(10,2) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (intervencion_id) REFERENCES intervenciones(id) ON DELETE CASCADE
);

-- 5. Create 'ofertas' table
CREATE TABLE IF NOT EXISTS ofertas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  titulo VARCHAR(300) NOT NULL,
  referencia VARCHAR(100) NULL,
  tipo ENUM('preventiva', 'correctiva') NOT NULL,
  estado VARCHAR(50) NOT NULL DEFAULT 'borrador',
  fecha_oferta DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  validez_dias INT NOT NULL DEFAULT 30,
  notas TEXT NULL,
  total_horas DECIMAL(8,2) NULL,
  total_coste DECIMAL(10,2) NULL,
  total_precio DECIMAL(10,2) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- 6. Create 'oferta_sistema' junction table
CREATE TABLE IF NOT EXISTS oferta_sistema (
  oferta_id INT NOT NULL,
  sistema_id INT NOT NULL,
  nivel VARCHAR(20) NOT NULL DEFAULT '1',
  horas DECIMAL(8,2) NULL,
  coste_consumibles DECIMAL(10,2) NULL,
  precio_consumibles DECIMAL(10,2) NULL,
  PRIMARY KEY (oferta_id, sistema_id),
  FOREIGN KEY (oferta_id) REFERENCES ofertas(id) ON DELETE CASCADE,
  FOREIGN KEY (sistema_id) REFERENCES sistemas(id) ON DELETE CASCADE
);

-- 7. Add FK from intervenciones.oferta_id to ofertas (only after ofertas table exists)
-- Note: Run this AFTER step 5 creates the ofertas table
ALTER TABLE intervenciones
  ADD FOREIGN KEY (oferta_id) REFERENCES ofertas(id) ON DELETE SET NULL;

-- 8. Add 'tipo' and 'compatible_con' columns to consumibles (if not exists)
-- These were added for battery categorization
ALTER TABLE consumibles
  ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) NOT NULL DEFAULT 'general';
ALTER TABLE consumibles
  ADD COLUMN IF NOT EXISTS compatible_con VARCHAR(50) NULL;
