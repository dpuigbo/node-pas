"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorMiddleware = errorMiddleware;
function errorMiddleware(err, req, res, _next) {
    console.error('[Error]', req.method, req.path, err.name, err.message);
    if (err.stack)
        console.error(err.stack);
    if (err.name === 'ZodError') {
        res.status(400).json({ error: 'Datos invalidos', details: err });
        return;
    }
    if (err.name === 'PrismaClientKnownRequestError' || err.name === 'PrismaClientValidationError') {
        res.status(409).json({ error: 'Error de base de datos', message: err.message });
        return;
    }
    // Devolver mensaje en respuesta para diagnostico (hasta que tengamos panel de logs)
    res.status(500).json({ error: 'Error interno del servidor', message: err.message, name: err.name });
}
//# sourceMappingURL=error.middleware.js.map