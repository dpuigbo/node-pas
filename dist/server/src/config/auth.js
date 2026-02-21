"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configureAuth = configureAuth;
const passport_1 = __importDefault(require("passport"));
const passport_microsoft_1 = require("passport-microsoft");
const database_1 = require("./database");
const env_1 = require("./env");
/** Upsert user with timeout and retry */
async function upsertUserWithRetry(microsoftId, email, nombre, avatar, retries = 2) {
    const timeoutMs = 10000;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const upsertPromise = database_1.prisma.user.upsert({
                where: { microsoftId },
                update: { nombre, avatar },
                create: { microsoftId, email, nombre, avatar, rol: 'tecnico' },
            });
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error(`DB upsert timed out after ${timeoutMs}ms (attempt ${attempt}/${retries})`)), timeoutMs));
            const user = await Promise.race([upsertPromise, timeoutPromise]);
            return user;
        }
        catch (err) {
            console.error(`[Auth] Upsert attempt ${attempt}/${retries} failed:`, err.message);
            if (attempt === retries)
                throw err;
            // Small wait before retry
            await new Promise((r) => setTimeout(r, 1000));
        }
    }
}
function configureAuth() {
    if (!env_1.env.MICROSOFT_CLIENT_ID || !env_1.env.MICROSOFT_CLIENT_SECRET) {
        console.warn('[Auth] Microsoft OAuth credentials not configured. Auth disabled.');
        return;
    }
    passport_1.default.use(new passport_microsoft_1.Strategy({
        clientID: env_1.env.MICROSOFT_CLIENT_ID,
        clientSecret: env_1.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: env_1.env.MICROSOFT_CALLBACK_URL,
        tenant: env_1.env.MICROSOFT_TENANT_ID || 'common',
        scope: ['user.read', 'profile', 'email', 'openid'],
    }, async (_accessToken, _refreshToken, profile, done) => {
        try {
            const email = profile._json?.email || profile.emails?.[0]?.value || profile.upn || profile._json?.preferred_username;
            if (!email) {
                return done(new Error('No se encontro email en el perfil de Microsoft'));
            }
            const microsoftId = profile.oid || profile.id;
            const nombre = profile.displayName || email.split('@')[0];
            const avatar = null;
            console.log('[Auth] Microsoft callback — upserting user:', { microsoftId, email, nombre });
            const user = await upsertUserWithRetry(microsoftId, email, nombre, avatar);
            console.log('[Auth] User upserted successfully:', user.id);
            done(null, user);
        }
        catch (error) {
            console.error('[Auth] Microsoft callback error:', error);
            done(error);
        }
    }));
    passport_1.default.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport_1.default.deserializeUser(async (id, done) => {
        try {
            const user = await database_1.prisma.user.findUnique({ where: { id } });
            done(null, user);
        }
        catch (error) {
            done(error);
        }
    });
}
//# sourceMappingURL=auth.js.map