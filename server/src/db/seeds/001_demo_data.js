/**
 * Datos de demostración para PAS Robotics Manage
 */
exports.seed = async function (knex) {
  // Limpiar en orden inverso de dependencias
  await knex('componentes_informe').del();
  await knex('informes').del();
  await knex('intervencion_sistemas').del();
  await knex('intervenciones').del();
  await knex('componentes_sistema').del();
  await knex('sistemas').del();
  await knex('maquinas').del();
  await knex('plantas').del();
  await knex('clientes').del();
  await knex('versiones_template').del();
  await knex('modelos_componente').del();
  await knex('fabricantes').del();

  // ── Fabricantes ──
  const [abb] = await knex('fabricantes').insert([
    { nombre: 'ABB', activo: true, orden: 1 },
  ]).returning('id');
  const [kuka] = await knex('fabricantes').insert([
    { nombre: 'KUKA', activo: true, orden: 2 },
  ]).returning('id');
  const [fanuc] = await knex('fabricantes').insert([
    { nombre: 'FANUC', activo: true, orden: 3 },
  ]).returning('id');

  const abbId = abb.id || abb;
  const kukaId = kuka.id || kuka;
  const fanucId = fanuc.id || fanuc;

  // ── Modelos de componente ──
  const [irc5] = await knex('modelos_componente').insert([
    { fabricante_id: abbId, tipo: 'controller', nombre: 'IRC5' },
  ]).returning('id');
  const [irb6700] = await knex('modelos_componente').insert([
    { fabricante_id: abbId, tipo: 'mechanical_unit', nombre: 'IRB 6700' },
  ]).returning('id');
  const [duAbb] = await knex('modelos_componente').insert([
    { fabricante_id: abbId, tipo: 'drive_unit', nombre: 'Drive Module DM1' },
  ]).returning('id');

  const irc5Id = irc5.id || irc5;
  const irb6700Id = irb6700.id || irb6700;
  const duAbbId = duAbb.id || duAbb;

  // ── Templates de ejemplo ──
  const controllerSchema = JSON.stringify({
    blocks: [
      { id: 'b1', type: 'header', config: { title: 'Informe de Mantenimiento Preventivo', subtitle: 'Controladora IRC5', showLogo: true, showDate: true, showReference: true, logoPosition: 'left', logoUrl: '' } },
      { id: 'b2', type: 'section_title', config: { title: 'Inspección General', level: 1, color: '#2563eb' } },
      { id: 'b3', type: 'tristate', config: { key: 'cables_alimentacion', label: 'Cables de alimentación', withObservation: true, required: true, maintenanceLevel: 'level1' } },
      { id: 'b4', type: 'tristate', config: { key: 'sistema_ventilacion', label: 'Sistema de ventilación', withObservation: true, required: true, maintenanceLevel: 'level1' } },
      { id: 'b5', type: 'tristate', config: { key: 'indicadores_led', label: 'Indicadores LED', withObservation: true, required: false, maintenanceLevel: 'level1' } },
      { id: 'b6', type: 'section_title', config: { title: 'Parámetros', level: 1, color: '#059669' } },
      { id: 'b7', type: 'number_field', config: { key: 'temperatura_interna', label: 'Temperatura interna', unit: '°C', required: true } },
      { id: 'b8', type: 'number_field', config: { key: 'voltaje_bus_dc', label: 'Voltaje bus DC', unit: 'V', required: true } },
      { id: 'b9', type: 'section_title', config: { title: 'Observaciones', level: 1, color: '#6b7280' } },
      { id: 'b10', type: 'text_area', config: { key: 'observaciones', label: 'Observaciones generales', rows: 4, placeholder: 'Escriba aquí sus observaciones...' } },
    ],
    pageConfig: { orientation: 'portrait', margins: { top: 20, right: 15, bottom: 20, left: 15 }, fontSize: 10 },
  });

  await knex('versiones_template').insert([
    { modelo_componente_id: irc5Id, version_num: 1, estado: 'activo', schema_json: controllerSchema, notas: 'Versión inicial' },
  ]);

  const muSchema = JSON.stringify({
    blocks: [
      { id: 'b1', type: 'header', config: { title: 'Informe de Mantenimiento', subtitle: 'Unidad Mecánica IRB 6700', showLogo: true, showDate: true, showReference: true, logoPosition: 'left', logoUrl: '' } },
      { id: 'b2', type: 'section_title', config: { title: 'Inspección Visual', level: 1, color: '#2563eb' } },
      { id: 'b3', type: 'tristate', config: { key: 'carroceria', label: 'Carrocería', withObservation: true, required: true, maintenanceLevel: 'level1' } },
      { id: 'b4', type: 'tristate', config: { key: 'cableado_externo', label: 'Cableado externo', withObservation: true, required: true, maintenanceLevel: 'level1' } },
      { id: 'b5', type: 'tristate', config: { key: 'mangueras', label: 'Mangueras', withObservation: true, required: true, maintenanceLevel: 'level2' } },
      { id: 'b6', type: 'tristate', config: { key: 'conectores', label: 'Conectores', withObservation: true, required: true, maintenanceLevel: 'level2' } },
      { id: 'b7', type: 'section_title', config: { title: 'Firma', level: 1, color: '#6b7280' } },
      { id: 'b8', type: 'signature', config: { key: 'firma_tecnico', label: 'Firma del técnico', role: 'Técnico PAS', required: true } },
    ],
    pageConfig: { orientation: 'portrait', margins: { top: 20, right: 15, bottom: 20, left: 15 }, fontSize: 10 },
  });

  await knex('versiones_template').insert([
    { modelo_componente_id: irb6700Id, version_num: 1, estado: 'activo', schema_json: muSchema, notas: 'Versión inicial' },
  ]);

  // ── Clientes demo ──
  const [cliente1] = await knex('clientes').insert([
    { nombre: 'Seat Martorell', sede: 'Barcelona', tarifa_hora_trabajo: 85, tarifa_hora_viaje: 45, dietas: 35, peajes: 15, km: 0.30 },
  ]).returning('id');
  const [cliente2] = await knex('clientes').insert([
    { nombre: 'Volkswagen Navarra', sede: 'Pamplona', tarifa_hora_trabajo: 85, tarifa_hora_viaje: 45, dietas: 35, peajes: 20, km: 0.30 },
  ]).returning('id');

  const c1Id = cliente1.id || cliente1;
  const c2Id = cliente2.id || cliente2;

  // ── Plantas ──
  const [planta1] = await knex('plantas').insert([
    { cliente_id: c1Id, nombre: 'Planta Pintura', direccion: 'Carrer de Seat, Martorell' },
  ]).returning('id');
  const [planta2] = await knex('plantas').insert([
    { cliente_id: c2Id, nombre: 'Planta Carrocería', direccion: 'Polígono Industrial Landaben, Pamplona' },
  ]).returning('id');

  const p1Id = planta1.id || planta1;
  const p2Id = planta2.id || planta2;

  // ── Máquinas ──
  const [maq1] = await knex('maquinas').insert([
    { cliente_id: c1Id, planta_id: p1Id, nombre: 'Línea Pintura L1' },
  ]).returning('id');
  const [maq2] = await knex('maquinas').insert([
    { cliente_id: c2Id, planta_id: p2Id, nombre: 'Célula Soldadura C3' },
  ]).returning('id');

  const m1Id = maq1.id || maq1;
  const m2Id = maq2.id || maq2;

  // ── Sistemas ──
  const [sys1] = await knex('sistemas').insert([
    { cliente_id: c1Id, planta_id: p1Id, maquina_id: m1Id, fabricante_id: abbId, nombre: 'Robot Pintura ABB-01' },
  ]).returning('id');
  const [sys2] = await knex('sistemas').insert([
    { cliente_id: c2Id, planta_id: p2Id, maquina_id: m2Id, fabricante_id: kukaId, nombre: 'Robot Soldadura KUKA-01' },
  ]).returning('id');

  const s1Id = sys1.id || sys1;

  // ── Componentes del sistema 1 ──
  await knex('componentes_sistema').insert([
    { sistema_id: s1Id, tipo: 'controller', modelo_componente_id: irc5Id, etiqueta: 'Controladora IRC5', numero_serie: 'IRC5-2024-001', numero_ejes: 6 },
    { sistema_id: s1Id, tipo: 'mechanical_unit', modelo_componente_id: irb6700Id, etiqueta: 'IRB 6700-235/2.65', numero_serie: 'IRB6700-2024-001', numero_ejes: 6 },
    { sistema_id: s1Id, tipo: 'drive_unit', modelo_componente_id: duAbbId, etiqueta: 'Drive Module DM1', numero_serie: 'DM1-2024-001', numero_ejes: 6 },
  ]);

  // ── Intervenciones demo ──
  await knex('intervenciones').insert([
    { cliente_id: c1Id, tipo: 'preventiva', estado: 'borrador', referencia: 'INT-2024-001', titulo: 'Mantenimiento preventivo Q1 2024', fecha_inicio: '2024-03-15', notas: 'Revisión trimestral programada' },
    { cliente_id: c1Id, tipo: 'correctiva', estado: 'en_curso', referencia: 'INT-2024-002', titulo: 'Reparación fallo servo eje 3', fecha_inicio: '2024-03-20', notas: 'Fallo reportado por operador' },
    { cliente_id: c2Id, tipo: 'preventiva', estado: 'completada', referencia: 'INT-2024-003', titulo: 'Mantenimiento preventivo anual', fecha_inicio: '2024-02-01', fecha_fin: '2024-02-03' },
  ]);

  // ── Config global ──
  await knex('config_global').insert([
    { clave: 'empresa_nombre', valor: 'PAS Robotics' },
    { clave: 'empresa_direccion', valor: 'Barcelona, España' },
    { clave: 'empresa_telefono', valor: '+34 600 000 000' },
  ]);
};
