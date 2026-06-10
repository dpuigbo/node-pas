const router = require('express').Router();

router.use('/dashboard', require('./dashboard'));
router.use('/clientes', require('./clientes'));
router.use('/fabricantes', require('./fabricantes'));
router.use('/intervenciones', require('./intervenciones'));
router.use('/sistemas', require('./sistemas'));
router.use('/modelos', require('./modelos'));
router.use('/consumibles', require('./consumibles'));
router.use('/ofertas', require('./ofertas'));

// Health check
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
