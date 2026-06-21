-- A: telefono del usuario (perfil del logueado).
-- Alimenta telTecnico en la tabla Intervencion del informe (antes salia vacio).
-- Aplicar en prod via dbq.php cuando se haga el deploy del lote.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefono VARCHAR(191) NULL;
