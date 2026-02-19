const router = require('express').Router();

// Listar clientes
router.get('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const clientes = await db('clientes')
      .select('clientes.*')
      .select(db.raw('(SELECT COUNT(*) FROM plantas WHERE plantas.cliente_id = clientes.id) as total_plantas'))
      .select(db.raw('(SELECT COUNT(*) FROM sistemas WHERE sistemas.cliente_id = clientes.id) as total_sistemas'))
      .orderBy('nombre');
    res.json(clientes);
  } catch (err) {
    next(err);
  }
});

// Obtener un cliente
router.get('/:id', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const cliente = await db('clientes').where('id', req.params.id).first();
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    const plantas = await db('plantas').where('cliente_id', cliente.id);
    const sistemas = await db('sistemas')
      .join('fabricantes', 'sistemas.fabricante_id', 'fabricantes.id')
      .where('sistemas.cliente_id', cliente.id)
      .select('sistemas.*', 'fabricantes.nombre as fabricante_nombre');

    res.json({ ...cliente, plantas, sistemas });
  } catch (err) {
    next(err);
  }
});

// Crear cliente
router.post('/', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { nombre, sede, tarifa_hora_trabajo, tarifa_hora_viaje, dietas, peajes, km } = req.body;
    if (!nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });

    const [id] = await db('clientes').insert({
      nombre, sede, tarifa_hora_trabajo, tarifa_hora_viaje, dietas, peajes, km,
    });
    const cliente = await db('clientes').where('id', id).first();
    res.status(201).json(cliente);
  } catch (err) {
    next(err);
  }
});

// Actualizar cliente
router.put('/:id', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    const { nombre, sede, tarifa_hora_trabajo, tarifa_hora_viaje, dietas, peajes, km } = req.body;
    await db('clientes').where('id', req.params.id).update({
      nombre, sede, tarifa_hora_trabajo, tarifa_hora_viaje, dietas, peajes, km,
      updated_at: db.fn.now(),
    });
    const cliente = await db('clientes').where('id', req.params.id).first();
    res.json(cliente);
  } catch (err) {
    next(err);
  }
});

// Eliminar cliente
router.delete('/:id', async (req, res, next) => {
  try {
    const db = req.app.locals.db;
    await db('clientes').where('id', req.params.id).del();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
