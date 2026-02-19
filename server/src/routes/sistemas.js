const router = require('express').Router();

router.get('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const sistemas = await db('sistemas')
      .join('clientes', 'sistemas.cliente_id', 'clientes.id')
      .join('fabricantes', 'sistemas.fabricante_id', 'fabricantes.id')
      .join('plantas', 'sistemas.planta_id', 'plantas.id')
      .join('maquinas', 'sistemas.maquina_id', 'maquinas.id')
      .select(
        'sistemas.*',
        'clientes.nombre as cliente_nombre',
        'fabricantes.nombre as fabricante_nombre',
        'plantas.nombre as planta_nombre',
        'maquinas.nombre as maquina_nombre',
      )
      .orderBy('sistemas.nombre');
    res.json(sistemas);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const sistema = await db('sistemas')
      .join('clientes', 'sistemas.cliente_id', 'clientes.id')
      .join('fabricantes', 'sistemas.fabricante_id', 'fabricantes.id')
      .where('sistemas.id', req.params.id)
      .select('sistemas.*', 'clientes.nombre as cliente_nombre', 'fabricantes.nombre as fabricante_nombre')
      .first();
    if (!sistema) return res.status(404).json({ error: 'Sistema no encontrado' });

    const componentes = await db('componentes_sistema')
      .leftJoin('modelos_componente', 'componentes_sistema.modelo_componente_id', 'modelos_componente.id')
      .where('componentes_sistema.sistema_id', sistema.id)
      .select('componentes_sistema.*', 'modelos_componente.nombre as modelo_nombre');

    res.json({ ...sistema, componentes });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
