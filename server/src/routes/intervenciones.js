const router = require('express').Router();

router.get('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { estado, tipo, cliente_id } = req.query;
    let query = db('intervenciones')
      .join('clientes', 'intervenciones.cliente_id', 'clientes.id')
      .select('intervenciones.*', 'clientes.nombre as cliente_nombre');

    if (estado) query = query.where('intervenciones.estado', estado);
    if (tipo) query = query.where('intervenciones.tipo', tipo);
    if (cliente_id) query = query.where('intervenciones.cliente_id', cliente_id);

    const intervenciones = await query.orderBy('intervenciones.created_at', 'desc');
    res.json(intervenciones);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const intervencion = await db('intervenciones')
      .join('clientes', 'intervenciones.cliente_id', 'clientes.id')
      .where('intervenciones.id', req.params.id)
      .select('intervenciones.*', 'clientes.nombre as cliente_nombre')
      .first();
    if (!intervencion) return res.status(404).json({ error: 'Intervención no encontrada' });

    const sistemas = await db('intervencion_sistemas')
      .join('sistemas', 'intervencion_sistemas.sistema_id', 'sistemas.id')
      .where('intervencion_sistemas.intervencion_id', intervencion.id)
      .select('sistemas.*');

    const informes = await db('informes')
      .where('intervencion_id', intervencion.id);

    res.json({ ...intervencion, sistemas, informes });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { cliente_id, tipo, titulo, referencia, fecha_inicio, notas } = req.body;
    if (!cliente_id || !tipo) {
      return res.status(400).json({ error: 'cliente_id y tipo son obligatorios' });
    }

    const [id] = await db('intervenciones').insert({
      cliente_id, tipo, titulo, referencia, fecha_inicio, notas, estado: 'borrador',
    });
    const intervencion = await db('intervenciones').where('id', id).first();
    res.status(201).json(intervencion);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { tipo, estado, titulo, referencia, fecha_inicio, fecha_fin, notas } = req.body;
    await db('intervenciones').where('id', req.params.id).update({
      tipo, estado, titulo, referencia, fecha_inicio, fecha_fin, notas,
      updated_at: db.fn.now(),
    });
    const intervencion = await db('intervenciones').where('id', req.params.id).first();
    res.json(intervencion);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
