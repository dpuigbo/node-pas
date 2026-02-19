module.exports = function errorHandler(err, req, res, _next) {
  console.error(err.stack || err);
  const status = err.status || 500;
  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'Error interno' : err.message,
  });
};
