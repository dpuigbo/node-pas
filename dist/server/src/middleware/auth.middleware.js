"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.getAuthUser = getAuthUser;
exports.adminMiddleware = adminMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const database_1 = require("../config/database");
async function authMiddleware(req, res, next) {
    const token = req.cookies?.token;
    if (!token) {
        res.status(401).json({ error: 'No autenticado' });
        return;
    }
    try {
        const payload = jsonwebtoken_1.default.verify(token, env_1.env.JWT_SECRET);
        const user = await database_1.prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, nombre: true, rol: true },
        });
        if (!user || !user.rol) {
            res.status(401).json({ error: 'Usuario no encontrado' });
            return;
        }
        req.authUser = user;
        next();
    }
    catch {
        res.status(401).json({ error: 'Token invalido' });
    }
}
function getAuthUser(req) {
    return req.authUser;
}
function adminMiddleware(req, res, next) {
    const user = getAuthUser(req);
    if (!user || user.rol !== 'admin') {
        res.status(403).json({ error: 'Se requieren permisos de administrador' });
        return;
    }
    next();
}
//# sourceMappingURL=auth.middleware.js.map