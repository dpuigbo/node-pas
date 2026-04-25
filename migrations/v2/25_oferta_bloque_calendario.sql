-- ==============================================================================
-- PAS ROBOTICS MANAGE - Calendario de planificacion de ofertas
-- ==============================================================================
-- Tabla nueva: oferta_bloque_calendario
--
-- Cada bloque representa una franja de tiempo en un dia concreto:
--   - tipo='trabajo'         → horas de mantenimiento; aplica recargo por franja horaria
--   - tipo='desplazamiento'  → horas de viaje; aplica recargo por franja horaria
--   - tipo='comida'          → tiempo de comida (no facturable, no entra en recargo)
--
-- Las dietas y noches de hotel NO se almacenan como bloques: se cuentan
-- automaticamente a partir de los dias ocupados / noches fuera en la
-- planificacion final.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS oferta_bloque_calendario (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  oferta_id    INT NOT NULL,
  fecha        DATE NOT NULL,
  hora_inicio  VARCHAR(8) NOT NULL COMMENT 'HH:MM en franjas de 30 min',
  hora_fin     VARCHAR(8) NOT NULL COMMENT 'HH:MM en franjas de 30 min',
  tipo         ENUM('trabajo','desplazamiento','comida') NOT NULL,
  notas        VARCHAR(500),
  created_at   DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
  updated_at   DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_obc_oferta FOREIGN KEY (oferta_id) REFERENCES ofertas(id) ON DELETE CASCADE,
  INDEX idx_obc_oferta (oferta_id),
  INDEX idx_obc_fecha (oferta_id, fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Verificacion
SELECT
  (SELECT COUNT(*) FROM information_schema.tables
   WHERE table_schema=DATABASE() AND table_name='oferta_bloque_calendario') AS tabla_creada;
