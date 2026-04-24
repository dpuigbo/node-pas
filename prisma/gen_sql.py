import json, os

data_dir = os.path.join(os.path.dirname(__file__), 'data')
out_file = os.path.join(os.path.dirname(__file__), 'seed.sql')

def load(name):
    with open(os.path.join(data_dir, name), encoding='utf-8') as f:
        return json.load(f)

def esc(s):
    if s is None:
        return 'NULL'
    val = str(s).replace("\\", "\\\\").replace("'", "\\'")
    return "'" + val + "'"

controllers = load('controllers.json')
models = load('models.json')
aceites = load('aceites.json')
lubricacion = load('lubricacion.json')
mantenimiento = load('mantenimiento.json')

lines = []
lines.append('-- PAS Robotics - Seed SQL')
lines.append('-- Generated from ABB_BD_Mantenimiento_v4.xlsx')
lines.append('SET FOREIGN_KEY_CHECKS = 0;')
lines.append('')

# 1. CLEANUP
lines.append('-- ===== CLEANUP TEST DATA =====')
for table in ['pedidos_compra', 'oferta_sistema', 'ofertas', 'componentes_informe',
              'informes', 'intervencion_sistema', 'intervenciones',
              'componentes_sistema', 'sistemas', 'maquinas', 'clientes',
              'consumibles_nivel', 'consumibles', 'aceites']:
    lines.append('DELETE FROM `%s`;' % table)

lines.append('')
lines.append('-- Delete compatibility links')
lines.append('DELETE FROM `compatibilidad_controlador`;')
lines.append('')
lines.append('-- Delete models WITHOUT templates (keep models that have versiones)')
lines.append('DELETE FROM `modelos_componente` WHERE id NOT IN (SELECT DISTINCT modelo_componente_id FROM `versiones_template`);')
lines.append('')

# 2. CONTROLLERS
lines.append('-- ===== CONTROLLERS (13) =====')
for c in controllers:
    lines.append(
        "INSERT IGNORE INTO `modelos_componente` (fabricante_id, tipo, familia, nombre, notas, niveles) "
        "VALUES ((SELECT id FROM fabricantes WHERE nombre='ABB'), 'controller', %s, %s, %s, '1');"
        % (esc(c['familia']), esc(c['nombre']), esc(c['notas']))
    )
lines.append('')

# 3. MODELS (920) - batch insert
lines.append('-- ===== MODELS (920) =====')
batch = []
for m in models:
    niveles = '1,2_inferior,2_superior,3' if m['tipo'] == 'mechanical_unit' else '1'
    vals = "((SELECT id FROM fabricantes WHERE nombre='ABB'), %s, %s, %s, %s, %s)" % (
        esc(m['tipo']), esc(m['familia']), esc(m['nombre']), esc(m['notas']), esc(niveles)
    )
    batch.append(vals)
    if len(batch) >= 50:
        lines.append('INSERT IGNORE INTO `modelos_componente` (fabricante_id, tipo, familia, nombre, notas, niveles) VALUES')
        lines.append(',\n'.join(batch) + ';')
        lines.append('')
        batch = []
if batch:
    lines.append('INSERT IGNORE INTO `modelos_componente` (fabricante_id, tipo, familia, nombre, notas, niveles) VALUES')
    lines.append(',\n'.join(batch) + ';')
    lines.append('')

# 4. COMPATIBILITY LINKS
lines.append('-- ===== COMPATIBILITY LINKS =====')
for m in models:
    if not m['controladorasFamilias']:
        continue
    for cf in m['controladorasFamilias']:
        lines.append(
            "INSERT IGNORE INTO `compatibilidad_controlador` (controlador_id, componente_id) "
            "SELECT ctrl.id, comp.id FROM `modelos_componente` ctrl "
            "JOIN `modelos_componente` comp ON comp.nombre = %s AND comp.tipo = %s "
            "AND comp.fabricante_id = (SELECT id FROM fabricantes WHERE nombre='ABB') "
            "WHERE ctrl.familia = %s AND ctrl.tipo = 'controller' "
            "AND ctrl.fabricante_id = (SELECT id FROM fabricantes WHERE nombre='ABB');"
            % (esc(m['nombre']), esc(m['tipo']), esc(cf))
        )
lines.append('')

# 5. ACEITES
lines.append('-- ===== ACEITES (49) =====')
batch = []
for a in aceites:
    batch.append("(%s, %s, 'ml', 1)" % (esc(a['nombre']), esc(a['fabricanteRobot'])))
    if len(batch) >= 25:
        lines.append('INSERT INTO `aceites` (nombre, fabricante_robot, unidad, activo) VALUES')
        lines.append(',\n'.join(batch) + ';')
        batch = []
if batch:
    lines.append('INSERT INTO `aceites` (nombre, fabricante_robot, unidad, activo) VALUES')
    lines.append(',\n'.join(batch) + ';')
lines.append('')

# 6. LUBRICACION
lines.append('-- ===== LUBRICACION REDUCTORAS (680) =====')
lines.append('DELETE FROM `lubricacion_reductora`;')
batch = []
for l in lubricacion:
    vals = "((SELECT id FROM fabricantes WHERE nombre='ABB'), %s, %s, %s, %s, %s)" % (
        esc(l['varianteTrm']), esc(l['eje']), esc(l['tipoLubricante']),
        esc(l['cantidad']), esc(l['webConfig'])
    )
    batch.append(vals)
    if len(batch) >= 50:
        lines.append('INSERT INTO `lubricacion_reductora` (fabricante_id, variante_trm, eje, tipo_lubricante, cantidad, web_config) VALUES')
        lines.append(',\n'.join(batch) + ';')
        batch = []
if batch:
    lines.append('INSERT INTO `lubricacion_reductora` (fabricante_id, variante_trm, eje, tipo_lubricante, cantidad, web_config) VALUES')
    lines.append(',\n'.join(batch) + ';')
lines.append('')

# 7. MANTENIMIENTO
lines.append('-- ===== ACTIVIDADES MANTENIMIENTO (411) =====')
lines.append('DELETE FROM `actividades_mantenimiento`;')
batch = []
for m in mantenimiento:
    vals = "((SELECT id FROM fabricantes WHERE nombre='ABB'), %s, %s, %s, %s, %s, %s, %s)" % (
        esc(m['familiaRobot']), esc(m['documento']), esc(m['tipoActividad']),
        esc(m['componente']), esc(m['intervaloEstandar']),
        esc(m['intervaloFoundry']), esc(m['notas'])
    )
    batch.append(vals)
    if len(batch) >= 50:
        lines.append('INSERT INTO `actividades_mantenimiento` (fabricante_id, familia_robot, documento, tipo_actividad, componente, intervalo_estandar, intervalo_foundry, notas) VALUES')
        lines.append(',\n'.join(batch) + ';')
        batch = []
if batch:
    lines.append('INSERT INTO `actividades_mantenimiento` (fabricante_id, familia_robot, documento, tipo_actividad, componente, intervalo_estandar, intervalo_foundry, notas) VALUES')
    lines.append(',\n'.join(batch) + ';')

lines.append('')
lines.append('SET FOREIGN_KEY_CHECKS = 1;')
lines.append('-- Done!')

sql = '\n'.join(lines)
with open(out_file, 'w', encoding='utf-8') as f:
    f.write(sql)

print('Generated: %d chars, %d lines' % (len(sql), sql.count('\n')))
print('Saved to: %s' % out_file)
