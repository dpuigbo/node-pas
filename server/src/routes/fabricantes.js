const router = require('express').Router();

router.get('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const fabricantes = await db('fabricantes')
      .select('fabricantes.*')
      .select(db.raw('(SELECT COUNT(*) FROM modelos_componente WHERE modelos_componente.fabricante_id = fabricantes.id) as total_modelos'))
      .orderBy('orden');
    res.json(fabricantes);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const fabricante = await db('fabricantes').where('id', req.params.id).first();
    if (!fabricante) return res.status(404).json({ error: 'Fabricante no encontrado' });

    const modelos = await db('modelos_componente').where('fabricante_id', fabricante.id);
    res.json({ ...fabricante, modelos });
  } catch (err) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { nombre, activo = true, orden = 0 } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const [id] = await db('fabricantes').insert({ nombre, activo, orden });
    const fabricante = await db('fabricantes').where('id', id).first();
    res.status(201).json(fabricante);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
