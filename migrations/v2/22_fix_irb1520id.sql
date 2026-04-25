-- ==============================================================================
-- PAS ROBOTICS MANAGE - Fix compat ejes para IRB 1520ID
-- ==============================================================================
-- El Excel v7 lista 'IRB 1520' como familia compatible con IRBT 2005 y IRT 510.
-- En la BD ABB esa familia se llama 'IRB 1520ID' (ID = Insulated Drive,
-- variante real de la familia). Anadimos las reglas faltantes con el codigo
-- correcto.
--
-- IRB 4450S del Excel no existe en BD (sin variantes 4450S registradas) →
-- no se puede crear regla y se acepta la perdida (1 regla menos).
-- ==============================================================================

-- IRBT 2005 + IRB 1520ID
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRBT 2005' AND fe.tipo = 'external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 1520ID' AND fp.tipo = 'mechanical_unit' AND fp.fabricante_id = mc.fabricante_id;

-- IRT 510 + IRB 1520ID
INSERT IGNORE INTO compatibilidad_eje_permitida (eje_modelo_id, familia_id)
SELECT mc.id, fp.id
FROM modelos_componente mc
JOIN lu_familia fe ON fe.id = mc.familia_id AND fe.codigo = 'IRT 510' AND fe.tipo = 'external_axis'
JOIN lu_familia fp ON fp.codigo = 'IRB 1520ID' AND fp.tipo = 'mechanical_unit' AND fp.fabricante_id = mc.fabricante_id;

-- Verificacion
SELECT
  (SELECT COUNT(*) FROM compatibilidad_eje_permitida) AS perm,
  (SELECT COUNT(*) FROM compatibilidad_eje_excluye) AS excl,
  (SELECT COUNT(*) FROM compatibilidad_eje_controlador) AS ctrl;

SELECT lf.codigo AS familia_eje,
  (SELECT COUNT(DISTINCT cep.familia_id) FROM compatibilidad_eje_permitida cep
    JOIN modelos_componente mc2 ON mc2.id = cep.eje_modelo_id
    WHERE mc2.familia_id = lf.id) AS familias_perm
FROM lu_familia lf
WHERE lf.codigo IN ('IRBT 2005', 'IRBT 4004', 'IRT 510')
ORDER BY lf.codigo;
