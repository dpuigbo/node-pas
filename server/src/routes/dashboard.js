const router = require('express').Router();

router.get('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;

    const [clientes] = await db('clientes').where('activo', 1).count('* as total');
    const [sistemas] = await db('sistemas').count('* as total');
    const [intervenciones] = await db('intervenciones').count('* as total');
    const [ofertas] = await db('ofertas').count('* as total');
    const [modelos] = await db('modelos_componente').where('activa', 1).count('* as total');
    const [consumibles] = await db('consumible_catalogo').where('activo', 1).count('* as total');
    const [informes] = await db('informes').count('* as total');
    const [actividades] = await db('actividad_preventiva').count('* as total');

    // Intervenciones por estado
    const intPorEstado = await db('intervenciones')
      .select('estado')
      .count('* as total')
      .groupBy('estado');

    // Modelos del catálogo por tipo
    const modelosPorTipo = await db('modelos_componente')
      .where('activa', 1)
      .select('tipo')
      .count('* as total')
      .groupBy('tipo');

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

    // Ofertas recientes
    const ofertasRecientes = await db('ofertas')
      .join('clientes', 'ofertas.cliente_id', 'clientes.id')
      .select(
        'ofertas.id',
        'ofertas.referencia',
        'ofertas.titulo',
        'ofertas.tipo',
        'ofertas.estado',
        'ofertas.fecha_oferta',
        'ofertas.total_precio',
        'clientes.nombre as cliente_nombre',
      )
      .orderBy('ofertas.created_at', 'desc')
      .limit(5);

    res.json({
      stats: {
        clientes: clientes.total,
        sistemas: sistemas.total,
        intervenciones: intervenciones.total,
        ofertas: ofertas.total,
        modelos: modelos.total,
        consumibles: consumibles.total,
        informes: informes.total,
        actividades: actividades.total,
      },
      intervenciones_por_estado: intPorEstado,
      modelos_por_tipo: modelosPorTipo,
      intervenciones_recientes: recientes,
      ofertas_recientes: ofertasRecientes,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
