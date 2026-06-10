const router = require('express').Router();

// Listar catálogo de consumibles
router.get('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { tipo, q, activo } = req.query;

    let query = db('consumible_catalogo').select('*');
    if (tipo) query = query.where('tipo', tipo);
    if (activo !== undefined && activo !== '') query = query.where('activo', activo === '1' || activo === 'true' ? 1 : 0);
    if (q) {
      query = query.where((b) => {
        b.where('nombre', 'like', `%${q}%`)
          .orWhere('codigo_interno', 'like', `%${q}%`)
          .orWhere('codigo_fabricante', 'like', `%${q}%`);
      });
    }

    const consumibles = await query.orderBy(['tipo', 'nombre']);
    res.json(consumibles);
  } catch (err) {
    next(err);
  }
});

// Tipos disponibles (para filtros)
router.get('/tipos', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const tipos = await db('consumible_catalogo')
      .select('tipo')
      .count('* as total')
      .groupBy('tipo')
      .orderBy('total', 'desc');
    res.json(tipos);
  } catch (err) {
    next(err);
  }
});

// Detalle con histórico de precios
router.get('/:id', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const consumible = await db('consumible_catalogo').where('id', req.params.id).first();
    if (!consumible) return res.status(404).json({ error: 'Consumible no encontrado' });

    const historico = await db('consumible_precio_historico')
      .where('consumible_id', consumible.id)
      .orderBy('fecha_precio', 'desc');

    res.json({ ...consumible, precio_historico: historico });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
