/**
 * Schema inicial — PAS Robotics Manage
 * Basado en SPEC.md
 */
exports.up = function (knex) {
  return knex.schema
    // ── Catálogos ──
    .createTable('fabricantes', (t) => {
      t.increments('id');
      t.string('nombre').notNullable().unique();
      t.boolean('activo').defaultTo(true);
      t.integer('orden').defaultTo(0);
      t.timestamps(true, true);
    })

    .createTable('modelos_componente', (t) => {
      t.increments('id');
      t.integer('fabricante_id').unsigned().notNullable()
        .references('id').inTable('fabricantes').onDelete('RESTRICT');
      t.enu('tipo', ['controller', 'mechanical_unit', 'drive_unit']).notNullable();
      t.string('nombre').notNullable();
      t.text('notas');
      t.json('config_aceites'); // JSON de aceites por eje
      t.timestamps(true, true);
      t.unique(['fabricante_id', 'tipo', 'nombre']);
    })

    .createTable('versiones_template', (t) => {
      t.increments('id');
      t.integer('modelo_componente_id').unsigned().notNullable()
        .references('id').inTable('modelos_componente').onDelete('CASCADE');
      t.integer('version_num').notNullable();
      t.enu('estado', ['borrador', 'activo', 'obsoleto']).defaultTo('borrador');
      t.json('schema_json').notNullable(); // bloques + pageConfig
      t.text('notas');
      t.timestamps(true, true);
    })

    .createTable('aceites', (t) => {
      t.increments('id');
      t.string('nombre').notNullable();
      t.string('fabricante');
      t.decimal('coste', 10, 2);
      t.decimal('precio', 10, 2);
      t.timestamps(true, true);
    })

    .createTable('consumibles', (t) => {
      t.increments('id');
      t.string('nombre').notNullable();
      t.string('fabricante');
      t.decimal('coste', 10, 2);
      t.decimal('precio', 10, 2);
      t.timestamps(true, true);
    })

    // ── Clientes y ubicaciones ──
    .createTable('clientes', (t) => {
      t.increments('id');
      t.string('nombre').notNullable();
      t.string('sede');
      t.decimal('tarifa_hora_trabajo', 10, 2);
      t.decimal('tarifa_hora_viaje', 10, 2);
      t.decimal('dietas', 10, 2);
      t.decimal('peajes', 10, 2);
      t.decimal('km', 10, 2);
      t.timestamps(true, true);
    })

    .createTable('plantas', (t) => {
      t.increments('id');
      t.integer('cliente_id').unsigned().notNullable()
        .references('id').inTable('clientes').onDelete('CASCADE');
      t.string('nombre').notNullable();
      t.string('direccion');
      t.timestamps(true, true);
      t.unique(['cliente_id', 'nombre']);
    })

    .createTable('maquinas', (t) => {
      t.increments('id');
      t.integer('cliente_id').unsigned().notNullable()
        .references('id').inTable('clientes').onDelete('CASCADE');
      t.integer('planta_id').unsigned().notNullable()
        .references('id').inTable('plantas').onDelete('CASCADE');
      t.string('nombre').notNullable();
      t.timestamps(true, true);
    })

    // ── Sistemas robóticos ──
    .createTable('sistemas', (t) => {
      t.increments('id');
      t.integer('cliente_id').unsigned().notNullable()
        .references('id').inTable('clientes').onDelete('CASCADE');
      t.integer('planta_id').unsigned().notNullable()
        .references('id').inTable('plantas').onDelete('CASCADE');
      t.integer('maquina_id').unsigned().notNullable()
        .references('id').inTable('maquinas').onDelete('CASCADE');
      t.integer('fabricante_id').unsigned().notNullable()
        .references('id').inTable('fabricantes').onDelete('RESTRICT');
      t.string('nombre').notNullable();
      t.timestamps(true, true);
      t.unique(['cliente_id', 'fabricante_id', 'nombre']);
    })

    .createTable('componentes_sistema', (t) => {
      t.increments('id');
      t.integer('sistema_id').unsigned().notNullable()
        .references('id').inTable('sistemas').onDelete('CASCADE');
      t.enu('tipo', ['controller', 'mechanical_unit', 'drive_unit']).notNullable();
      t.integer('modelo_componente_id').unsigned()
        .references('id').inTable('modelos_componente').onDelete('SET NULL');
      t.string('etiqueta');
      t.string('numero_serie');
      t.integer('numero_ejes');
      t.json('metadatos');
      t.timestamps(true, true);
    })

    // ── Intervenciones e informes ──
    .createTable('intervenciones', (t) => {
      t.increments('id');
      t.integer('cliente_id').unsigned().notNullable()
        .references('id').inTable('clientes').onDelete('CASCADE');
      t.enu('tipo', ['preventiva', 'correctiva']).notNullable();
      t.enu('estado', ['borrador', 'en_curso', 'completada', 'facturada']).defaultTo('borrador');
      t.string('referencia');
      t.string('titulo');
      t.date('fecha_inicio');
      t.date('fecha_fin');
      t.text('notas');
      t.timestamps(true, true);
    })

    .createTable('intervencion_sistemas', (t) => {
      t.integer('intervencion_id').unsigned().notNullable()
        .references('id').inTable('intervenciones').onDelete('CASCADE');
      t.integer('sistema_id').unsigned().notNullable()
        .references('id').inTable('sistemas').onDelete('CASCADE');
      t.primary(['intervencion_id', 'sistema_id']);
    })

    .createTable('informes', (t) => {
      t.increments('id');
      t.integer('intervencion_id').unsigned().notNullable()
        .references('id').inTable('intervenciones').onDelete('CASCADE');
      t.integer('sistema_id').unsigned().notNullable()
        .references('id').inTable('sistemas').onDelete('CASCADE');
      t.enu('estado', ['borrador', 'finalizado', 'entregado']).defaultTo('borrador');
      t.date('fecha_realizacion');
      t.text('notas');
      t.string('usuario_id'); // auditoría
      t.timestamps(true, true);
      t.unique(['intervencion_id', 'sistema_id']);
    })

    .createTable('componentes_informe', (t) => {
      t.increments('id');
      t.integer('informe_id').unsigned().notNullable()
        .references('id').inTable('informes').onDelete('CASCADE');
      t.integer('componente_sistema_id').unsigned().notNullable()
        .references('id').inTable('componentes_sistema').onDelete('CASCADE');
      t.string('tipo_componente');
      t.string('etiqueta');
      t.integer('orden').defaultTo(0);
      t.integer('version_template_id').unsigned()
        .references('id').inTable('versiones_template').onDelete('SET NULL');
      t.json('schema_congelado'); // snapshot del template
      t.json('datos');            // datos rellenados por el técnico
      t.timestamps(true, true);
      t.unique(['informe_id', 'componente_sistema_id']);
    })

    // ── Configuración global ──
    .createTable('config_global', (t) => {
      t.string('clave').primary();
      t.text('valor');
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists('config_global')
    .dropTableIfExists('componentes_informe')
    .dropTableIfExists('informes')
    .dropTableIfExists('intervencion_sistemas')
    .dropTableIfExists('intervenciones')
    .dropTableIfExists('componentes_sistema')
    .dropTableIfExists('sistemas')
    .dropTableIfExists('maquinas')
    .dropTableIfExists('plantas')
    .dropTableIfExists('clientes')
    .dropTableIfExists('consumibles')
    .dropTableIfExists('aceites')
    .dropTableIfExists('versiones_template')
    .dropTableIfExists('modelos_componente')
    .dropTableIfExists('fabricantes');
};
