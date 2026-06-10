const router = require('express').Router();

// Listar modelos del catálogo (con filtros)
router.get('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { tipo, fabricante_id, familia_id, q, activa } = req.query;

    let query = db('modelos_componente')
      .join('fabricantes', 'modelos_componente.fabricante_id', 'fabricantes.id')
      .leftJoin('lu_familia', 'modelos_componente.familia_id', 'lu_familia.id')
      .leftJoin('lu_generacion_controlador', 'modelos_componente.generacion_controlador_id', 'lu_generacion_controlador.id')
      .select(
        'modelos_componente.id',
        'modelos_componente.tipo',
        'modelos_componente.nombre',
        'modelos_componente.type_variant',
        'modelos_componente.activa',
        'modelos_componente.nivel_n1',
        'modelos_componente.nivel_n2_inf',
        'modelos_componente.nivel_n2_sup',
        'modelos_componente.nivel_n3',
        'modelos_componente.tipo_bateria_medida',
        'fabricantes.nombre as fabricante_nombre',
        'lu_familia.codigo as familia_codigo',
        'lu_generacion_controlador.nombre as generacion_nombre',
      );

    if (tipo) query = query.where('modelos_componente.tipo', tipo);
    if (fabricante_id) query = query.where('modelos_componente.fabricante_id', fabricante_id);
    if (familia_id) query = query.where('modelos_componente.familia_id', familia_id);
    if (activa !== undefined && activa !== '') query = query.where('modelos_componente.activa', activa === '1' || activa === 'true' ? 1 : 0);
    if (q) query = query.where('modelos_componente.nombre', 'like', `%${q}%`);

    const modelos = await query
      .orderBy(['modelos_componente.tipo', 'modelos_componente.nombre'])
      .limit(1000);
    res.json(modelos);
  } catch (err) {
    next(err);
  }
});

// Familias (para filtros)
router.get('/familias', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const familias = await db('lu_familia')
      .join('fabricantes', 'lu_familia.fabricante_id', 'fabricantes.id')
      .where('lu_familia.activa', 1)
      .select('lu_familia.*', 'fabricantes.nombre as fabricante_nombre')
      .select(db.raw('(SELECT COUNT(*) FROM modelos_componente WHERE modelos_componente.familia_id = lu_familia.id) as total_modelos'))
      .orderBy('lu_familia.codigo');
    res.json(familias);
  } catch (err) {
    next(err);
  }
});

// Detalle de un modelo: lubricación, horas por nivel, actividades
router.get('/:id', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const modelo = await db('modelos_componente')
      .join('fabricantes', 'modelos_componente.fabricante_id', 'fabricantes.id')
      .leftJoin('lu_familia', 'modelos_componente.familia_id', 'lu_familia.id')
      .where('modelos_componente.id', req.params.id)
      .select(
        'modelos_componente.*',
        'fabricantes.nombre as fabricante_nombre',
        'lu_familia.codigo as familia_codigo',
      )
      .first();
    if (!modelo) return res.status(404).json({ error: 'Modelo no encontrado' });

    const lubricacion = await db('lubricacion')
      .leftJoin('consumible_catalogo', 'lubricacion.consumible_id', 'consumible_catalogo.id')
      .leftJoin('lu_nivel_mantenimiento', 'lubricacion.nivel_id', 'lu_nivel_mantenimiento.id')
      .where('lubricacion.modelo_componente_id', modelo.id)
      .select(
        'lubricacion.*',
        'consumible_catalogo.nombre as consumible_nombre',
        'consumible_catalogo.tipo as consumible_tipo',
        'lu_nivel_mantenimiento.codigo as nivel_codigo',
      )
      .orderBy('lubricacion.eje');

    const horas = await db('mantenimiento_horas_modelo')
      .leftJoin('lu_nivel_mantenimiento', 'mantenimiento_horas_modelo.nivel_id', 'lu_nivel_mantenimiento.id')
      .leftJoin('modelos_componente as ctrl', 'mantenimiento_horas_modelo.controlador_modelo_id', 'ctrl.id')
      .where('mantenimiento_horas_modelo.modelo_componente_id', modelo.id)
      .select(
        'mantenimiento_horas_modelo.*',
        'lu_nivel_mantenimiento.codigo as nivel_codigo',
        'lu_nivel_mantenimiento.nombre as nivel_nombre',
        'ctrl.nombre as controlador_nombre',
      );

    res.json({ ...modelo, lubricacion, horas_mantenimiento: horas });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
