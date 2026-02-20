"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
function errorMiddleware(err, _req, res, _next) {
    console.error('[Error]', err.message);
    if (err.name === 'ZodError') {
        res.status(400).json({ error: 'Datos invalidos', details: err });
        return;
    }
    if (err.name === 'PrismaClientKnownRequestError') {
        res.status(409).json({ error: 'Error de base de datos', message: err.message });
        return;
    }
    res.status(500).json({ error: 'Error interno del servidor' });
}
//# sourceMappingURL=error.middleware.js.map