-- ==============================================================================
-- PAS ROBOTICS MANAGE - Fix data v2 post-reclasificacion
-- ==============================================================================
-- Llena las brechas tras reclasificar A250XT/A400XT a drive_unit:
--   1. Carga 5 actividades de drive_module (las del OmniCore Drive Module
--      generico) replicadas para A250XT y A400XT
--   2. Carga 1 actividad de "Limpieza" para A250XT y A400XT (la que estaban
--      como cabinet en el script 03)
--   3. Mejora match de lubricacion con LIKE flexible (ahora 22 → ~600+)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- A. Actividades drive_module para A250XT (id=6527) y A400XT (id=6528)
-- ------------------------------------------------------------------------------
-- Las 5 actividades del OmniCore Drive Module generico, asociadas a su
-- controladora natural (V250XT para A250XT, V400XT para A400XT)

-- Helper: tipo_actividad ids
SET @ta_inspeccion = (SELECT id FROM lu_tipo_actividad WHERE codigo = 'inspeccion' LIMIT 1);
SET @ta_limpieza = (SELECT id FROM lu_tipo_actividad WHERE nombre = 'Limpieza' OR codigo = 'limpieza' LIMIT 1);
SET @ta_reemplazo = (SELECT id FROM lu_tipo_actividad WHERE codigo = 'reemplazo' LIMIT 1);

-- Si 'Limpieza' no existe como tipo_actividad lo creamos
INSERT IGNORE INTO lu_tipo_actividad (codigo, nombre, categoria, requiere_parada, orden)
VALUES ('limpieza', 'Limpieza', 'otro', 0, 80);
SET @ta_limpieza = (SELECT id FROM lu_tipo_actividad WHERE codigo = 'limpieza' LIMIT 1);

-- A250XT (6527) → V250XT (36)
INSERT INTO actividad_drive_module
  (drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id, documento, componente, generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion, intervalo_texto_legacy, notas)
VALUES
  (6527, 36, @ta_inspeccion, 'Comparte con PM del cabinet asociado', 'Cabinet drive module (sealing, conectores, fans, filter)', 'Compatible C30/C90XT/V250XT', NULL, 12, 'periodico', 'c/12 meses *', 'OmniCore Drive Module - inspeccion subconjunto del cabinet asociado'),
  (6527, 36, @ta_inspeccion, 'Comparte con PM del cabinet asociado', 'System fans drive module', 'Compatible C30/C90XT/V250XT', NULL, 6, 'periodico', 'c/6 meses *', '-'),
  (6527, 36, @ta_limpieza, 'Comparte con PM del cabinet asociado', 'Air filter drive module (si aplica segun cabinet)', 'Compatible C30/C90XT/V250XT', NULL, NULL, 'condicion', 'Cuando sea necesario', 'Solo aplica si el drive module esta en cabinet con air filter (V250XT)'),
  (6527, 36, @ta_reemplazo, 'Comparte con PM del cabinet asociado', 'Air filter drive module (si aplica)', 'Compatible C30/C90XT/V250XT', NULL, 24, 'periodico', 'c/24 meses', '-'),
  (6527, 36, @ta_limpieza, 'Comparte con PM del cabinet asociado', 'Cabinet drive module interior', 'Compatible C30/C90XT/V250XT', NULL, NULL, 'condicion', 'Cuando sea necesario', 'Aspirador ESD-protected. Sin aire comprimido.'),
  -- Actividad propia A250XT (era cabinet 'Limpieza' en script 03)
  (6527, 36, @ta_limpieza, '3HAC090255-001', 'Control cabinet (interior)', 'A250XT (2024+, Rev.E)', NULL, NULL, 'condicion', 'Cuando sea necesario', 'CABINET AUXILIAR DE INTEGRACION (drive module). Limpieza con aspirador ESD-protected. Sin aire comprimido. Dimensiones: 650x466x963 mm. Peso: 33 kg. IP54.');

-- A400XT (6528) → V400XT (37)
INSERT INTO actividad_drive_module
  (drive_module_modelo_id, controlador_asociado_id, tipo_actividad_id, documento, componente, generacion_hw, intervalo_horas, intervalo_meses, intervalo_condicion, intervalo_texto_legacy, notas)
VALUES
  (6528, 37, @ta_inspeccion, 'Comparte con PM del cabinet asociado', 'Cabinet drive module (sealing, conectores, fans, filter)', 'Compatible V400XT', NULL, 12, 'periodico', 'c/12 meses *', 'OmniCore Drive Module - inspeccion subconjunto del cabinet asociado'),
  (6528, 37, @ta_inspeccion, 'Comparte con PM del cabinet asociado', 'System fans drive module', 'Compatible V400XT', NULL, 6, 'periodico', 'c/6 meses *', '-'),
  (6528, 37, @ta_limpieza, 'Comparte con PM del cabinet asociado', 'Air filter drive module', 'Compatible V400XT', NULL, NULL, 'condicion', 'Cuando sea necesario', 'V400XT con air filter incorporado'),
  (6528, 37, @ta_reemplazo, 'Comparte con PM del cabinet asociado', 'Air filter drive module', 'Compatible V400XT', NULL, 24, 'periodico', 'c/24 meses', '-'),
  (6528, 37, @ta_limpieza, 'Comparte con PM del cabinet asociado', 'Cabinet drive module interior', 'Compatible V400XT', NULL, NULL, 'condicion', 'Cuando sea necesario', 'Aspirador ESD-protected. Sin aire comprimido.'),
  -- Actividad propia A400XT
  (6528, 37, @ta_limpieza, '3HAC090255-001', 'Control cabinet (interior)', 'A400XT (2024+, Rev.E)', NULL, NULL, 'condicion', 'Cuando sea necesario', 'CABINET AUXILIAR DE INTEGRACION (drive module). Limpieza con aspirador ESD-protected. Sin aire comprimido. Dimensiones: 650x466x1138 mm. Peso: 38 kg. IP54.');

-- ------------------------------------------------------------------------------
-- B. Mejorar match de lubricacion (22 -> mas)
-- ------------------------------------------------------------------------------
-- Estrategia: para cada modelo SIN entrada en lubricacion, intentar match LIKE
-- en lubricacion_reductora donde variante_trm contenga el nombre del modelo
-- Solo modelos de tipo mechanical_unit y external_axis

INSERT IGNORE INTO lubricacion (
  modelo_componente_id, eje, aceite_id,
  cantidad_valor, cantidad_unidad,
  cantidad_texto_legacy, variante_trm_legacy, tipo_lubricante_legacy,
  web_config
)
SELECT
  mc.id,
  lr.eje,
  a.id,
  CAST(NULLIF(REPLACE(REPLACE(REGEXP_REPLACE(lr.cantidad, '[^0-9,.]', ''), ',', '.'), ' ', ''), '') AS DECIMAL(10,3)),
  CASE
    WHEN lr.cantidad LIKE '%ml%' THEN 'ml'
    WHEN lr.cantidad LIKE '%kg%' THEN 'kg'
    WHEN lr.cantidad LIKE '%l%' AND lr.cantidad NOT LIKE '%ml%' THEN 'l'
    WHEN lr.cantidad LIKE '%g%' AND lr.cantidad NOT LIKE '%kg%' THEN 'g'
    WHEN lr.cantidad = 'N/A' OR lr.cantidad IS NULL THEN 'n_a'
    ELSE NULL
  END,
  lr.cantidad,
  lr.variante_trm,
  lr.tipo_lubricante,
  lr.web_config
FROM lubricacion_reductora lr
JOIN modelos_componente mc
  ON mc.fabricante_id = lr.fabricante_id
 AND mc.tipo IN ('mechanical_unit', 'external_axis')
 AND lr.variante_trm LIKE CONCAT('%', mc.nombre, '%')
LEFT JOIN aceite_alias aa ON aa.alias = lr.tipo_lubricante
LEFT JOIN aceites a ON a.id = aa.aceite_id
LEFT JOIN lubricacion lub_existing
  ON lub_existing.modelo_componente_id = mc.id
 AND lub_existing.eje = lr.eje
WHERE lub_existing.id IS NULL;

-- Verificacion final
SELECT
  (SELECT COUNT(*) FROM actividad_drive_module WHERE drive_module_modelo_id = 6527) AS act_a250xt,
  (SELECT COUNT(*) FROM actividad_drive_module WHERE drive_module_modelo_id = 6528) AS act_a400xt,
  (SELECT COUNT(*) FROM actividad_drive_module WHERE drive_module_modelo_id = 6523) AS act_irc5_du,
  (SELECT COUNT(*) FROM actividad_drive_module) AS total_drive_module,
  (SELECT COUNT(*) FROM lubricacion) AS total_lubricaciones,
  (SELECT COUNT(*) FROM lubricacion_reductora) AS total_legacy;
