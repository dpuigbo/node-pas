const router = require('express').Router();

router.get('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    const [clientes] = await db('clientes').count('* as total');
    const [plantas] = await db('plantas').count('* as total');
    const [sistemas] = await db('sistemas').count('* as total');
    const [intervenciones] = await db('intervenciones').count('* as total');
    const [informes] = await db('informes').count('* as total');
    const [fabricantes] = await db('fabricantes').where('activo', true).count('* as total');

    // Intervenciones por estado
    const intPorEstado = await db('intervenciones')
      .select('estado')
      .count('* as total')
      .groupBy('estado');

    // Intervenciones recientes
    const recientes = await db('intervenciones')
      .join('clientes', 'intervenciones.cliente_id', 'clientes.id')
      .select(
        'intervenciones.id',
        'intervenciones.referencia',
        'intervenciones.titulo',
        'intervenciones.tipo',
        'intervenciones.estado',
        'intervenciones.fecha_inicio',
        'clientes.nombre as cliente_nombre',
      )
      .orderBy('intervenciones.created_at', 'desc')
      .limit(10);

    // Clientes con más sistemas
    const topClientes = await db('sistemas')
      .join('clientes', 'sistemas.cliente_id', 'clientes.id')
      .select('clientes.nombre')
      .count('sistemas.id as total_sistemas')
      .groupBy('clientes.id')
      .orderBy('total_sistemas', 'desc')
      .limit(5);

    res.json({
      stats: {
        clientes: clientes.total,
        plantas: plantas.total,
        sistemas: sistemas.total,
        intervenciones: intervenciones.total,
        informes: informes.total,
        fabricantes: fabricantes.total,
      },
      intervenciones_por_estado: intPorEstado,
      intervenciones_recientes: recientes,
      top_clientes: topClientes,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
