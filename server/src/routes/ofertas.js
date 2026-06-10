const router = require('express').Router();

router.get('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { estado, cliente_id } = req.query;

    let query = db('ofertas')
      .join('clientes', 'ofertas.cliente_id', 'clientes.id')
      .select('ofertas.*', 'clientes.nombre as cliente_nombre');

    if (estado) query = query.where('ofertas.estado', estado);
    if (cliente_id) query = query.where('ofertas.cliente_id', cliente_id);

    const ofertas = await query.orderBy('ofertas.created_at', 'desc');
    res.json(ofertas);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const oferta = await db('ofertas')
      .join('clientes', 'ofertas.cliente_id', 'clientes.id')
      .where('ofertas.id', req.params.id)
      .select('ofertas.*', 'clientes.nombre as cliente_nombre')
      .first();
    if (!oferta) return res.status(404).json({ error: 'Oferta no encontrada' });

    const sistemas = await db('oferta_sistema')
      .join('sistemas', 'oferta_sistema.sistema_id', 'sistemas.id')
      .leftJoin('lu_nivel_mantenimiento', 'oferta_sistema.nivel_id', 'lu_nivel_mantenimiento.id')
      .where('oferta_sistema.oferta_id', oferta.id)
      .select(
        'sistemas.id',
        'sistemas.nombre',
        'oferta_sistema.horas',
        'oferta_sistema.coste_consumibles',
        'oferta_sistema.precio_consumibles',
        'lu_nivel_mantenimiento.codigo as nivel_codigo',
      );

    const calendario = await db('oferta_bloque_calendario')
      .where('oferta_id', oferta.id)
      .orderBy(['fecha', 'hora_inicio']);

    res.json({ ...oferta, sistemas, calendario });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
