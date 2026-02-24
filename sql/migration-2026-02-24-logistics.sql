-- ============================================================
-- Migration: Add logistics/tariff fields to clientes and intervenciones
-- Date: 2026-02-24
-- Description: Fields for offer calculation (travel, rates, intervention params)
-- Run in phpMyAdmin on the production database
-- ============================================================

-- ===== CLIENTES: new columns =====

-- Gestion accesos (tarifa)
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS gestion_accesos DECIMAL(10,2) NULL;

-- Logistica viaje
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS horas_trayecto DECIMAL(8,2) NULL;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS dias_viaje DECIMAL(8,2) NULL;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS precio_hotel DECIMAL(10,2) NULL;
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS precio_km DECIMAL(10,2) NULL;

-- ===== INTERVENCIONES: tariff snapshot columns (copied from client) =====

ALTER TABLE intervenciones ADD COLUMN IF NOT EXISTS tarifa_hora_trabajo DECIMAL(10,2) NULL;
ALTER TABLE intervenciones ADD COLUMN IF NOT EXISTS tarifa_hora_viaje DECIMAL(10,2) NULL;
ALTER TABLE intervenciones ADD COLUMN IF NOT EXISTS dietas DECIMAL(10,2) NULL;
ALTER TABLE intervenciones ADD COLUMN IF NOT EXISTS gestion_accesos DECIMAL(10,2) NULL;
ALTER TABLE intervenciones ADD COLUMN IF NOT EXISTS horas_trayecto DECIMAL(8,2) NULL;
ALTER TABLE intervenciones ADD COLUMN IF NOT EXISTS dias_viaje DECIMAL(8,2) NULL;
ALTER TABLE intervenciones ADD COLUMN IF NOT EXISTS km DECIMAL(10,2) NULL;
ALTER TABLE intervenciones ADD COLUMN IF NOT EXISTS peajes DECIMAL(10,2) NULL;
ALTER TABLE intervenciones ADD COLUMN IF NOT EXISTS precio_hotel DECIMAL(10,2) NULL;
ALTER TABLE intervenciones ADD COLUMN IF NOT EXISTS precio_km DECIMAL(10,2) NULL;

-- ===== INTERVENCIONES: intervention-specific fields =====

ALTER TABLE intervenciones ADD COLUMN IF NOT EXISTS gestion_accesos_nueva TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE intervenciones ADD COLUMN IF NOT EXISTS numero_tecnicos INT NOT NULL DEFAULT 1;
ALTER TABLE intervenciones ADD COLUMN IF NOT EXISTS viajes_ida_vuelta INT NOT NULL DEFAULT 1;
ALTER TABLE intervenciones ADD COLUMN IF NOT EXISTS incluye_consumibles TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE intervenciones ADD COLUMN IF NOT EXISTS horas_dia DECIMAL(8,2) NULL;
ALTER TABLE intervenciones ADD COLUMN IF NOT EXISTS dietas_extra DECIMAL(10,2) NULL;
ALTER TABLE intervenciones ADD COLUMN IF NOT EXISTS dias_trabajo VARCHAR(50) NULL;
