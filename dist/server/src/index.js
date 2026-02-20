"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const passport_1 = __importDefault(require("passport"));
const path_1 = __importDefault(require("path"));
const auth_1 = require("./config/auth");
const error_middleware_1 = require("./middleware/error.middleware");
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';
// Project root: find it by looking for package.json
// Works with tsx (__dirname=src/) and tsc (__dirname=dist/server/src/)
const PROJECT_ROOT = [__dirname, path_1.default.join(__dirname, '..'), path_1.default.join(__dirname, '..', '..', '..')]
    .find(d => require('fs').existsSync(path_1.default.join(d, 'package.json'))) || path_1.default.join(__dirname, '..');
// Middleware
app.use((0, helmet_1.default)({ contentSecurityPolicy: false }));
app.use((0, cors_1.default)({
    origin: isDev ? 'http://localhost:5173' : true,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Auth
(0, auth_1.configureAuth)();
app.use(passport_1.default.initialize());
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// DB health check — test actual database connection
app.get('/api/health/db', async (_req, res) => {
    try {
        const { prisma } = await Promise.resolve().then(() => __importStar(require('./config/database')));
        const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('DB query timed out (10s)')), 10000));
        const query = prisma.$queryRawUnsafe('SELECT 1 as ok');
        await Promise.race([query, timeout]);
        res.json({ status: 'ok', db: 'connected' });
    }
    catch (err) {
        res.status(500).json({ status: 'error', db: err.message });
    }
});
// Deploy webhook — lightweight restart only
// Hostinger handles git pull + npm install + build on deploy.
// This just restarts Passenger via tmp/restart.txt (uses fs, no child processes).
app.post('/api/deploy', (req, res) => {
    const secret = req.headers['x-deploy-secret'] || req.query.secret;
    if (secret !== process.env.DEPLOY_SECRET) {
        res.status(401).json({ error: 'Invalid deploy secret' });
        return;
    }
    try {
        const tmpDir = path_1.default.join(PROJECT_ROOT, 'tmp');
        const fs = require('fs');
        if (!fs.existsSync(tmpDir))
            fs.mkdirSync(tmpDir, { recursive: true });
        res.json({ status: 'restart scheduled' });
        // Touch restart.txt after response is sent
        setTimeout(() => {
            try {
                fs.writeFileSync(path_1.default.join(tmpDir, 'restart.txt'), String(Date.now()));
            }
            catch (_) { }
        }, 500);
    }
    catch (err) {
        res.status(500).json({ error: 'Deploy failed', details: err.message });
    }
});
// API routes
app.use('/api', routes_1.default);
// Error handler
app.use(error_middleware_1.errorMiddleware);
// Serve static frontend in production
if (!isDev) {
    const clientDist = path_1.default.join(PROJECT_ROOT, 'dist', 'client');
    app.use(express_1.default.static(clientDist));
    app.get('*', (_req, res) => {
        res.sendFile(path_1.default.join(clientDist, 'index.html'));
    });
}
app.listen(PORT, () => {
    console.log(`[PAS] Servidor corriendo en puerto ${PORT} (${isDev ? 'desarrollo' : 'produccion'})`);
});
exports.default = app;
//# sourceMappingURL=index.js.map