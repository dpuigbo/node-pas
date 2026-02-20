"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = requireRole;
const auth_middleware_1 = require("./auth.middleware");
function requireRole(...roles) {
    return (req, res, next) => {
        const user = (0, auth_middleware_1.getAuthUser)(req);
        if (!user) {
            res.status(401).json({ error: 'No autenticado' });
            return;
        }
        if (!roles.includes(user.rol)) {
            res.status(403).json({ error: 'No tienes permisos para realizar esta accion' });
            return;
        }
        next();
    };
}
//# sourceMappingURL=role.middleware.js.map