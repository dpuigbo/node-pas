"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const passport_1 = __importDefault(require("passport"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_1 = require("../config/env");
const auth_middleware_1 = require("../middleware/auth.middleware");
const database_1 = require("../config/database");
const router = (0, express_1.Router)();
// Initiate Microsoft OAuth
router.get('/microsoft', passport_1.default.authenticate('microsoft', { session: false }));
// Microsoft OAuth callback (GET — Microsoft redirects with code in query string)
router.get('/microsoft/callback', passport_1.default.authenticate('microsoft', { session: false, failureRedirect: '/login' }), (req, res) => {
    const user = req.user;
    const token = jsonwebtoken_1.default.sign({ userId: user.id }, env_1.env.JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, {
        httpOnly: true,
        secure: env_1.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    const redirectUrl = env_1.env.NODE_ENV === 'production' ? '/' : env_1.env.APP_URL;
    res.redirect(redirectUrl);
});
// Get current user
router.get('/me', auth_middleware_1.authMiddleware, (req, res) => {
    res.json({ user: (0, auth_middleware_1.getAuthUser)(req) });
});
// Logout
router.post('/logout', (_req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Sesion cerrada' });
});
// DEV: Auto-login as admin (creates user if not exists, sets JWT cookie)
// Step 1: /api/auth/dev-login -> creates user + sets cookie + shows debug
// Step 2: navigate to / to see the app
router.get('/dev-login', async (_req, res) => {
    try {
        const user = await database_1.prisma.user.upsert({
            where: { microsoftId: 'dev-admin' },
            update: {},
            create: {
                microsoftId: 'dev-admin',
                email: 'admin@pasrobotics.com',
                nombre: 'Admin Dev',
                rol: 'admin',
            },
        });
        const token = jsonwebtoken_1.default.sign({ userId: user.id }, env_1.env.JWT_SECRET, { expiresIn: '7d' });
        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({
            message: 'Login OK. Cookie seteada. Navega a / para ver la app.',
            user: { id: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
            env_node_env: env_1.env.NODE_ENV,
            jwt_secret_length: env_1.env.JWT_SECRET?.length,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Error en dev-login', details: String(error) });
    }
});
exports.default = router;
//# sourceMappingURL=auth.routes.js.map