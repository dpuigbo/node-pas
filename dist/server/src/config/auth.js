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
            const user = await database_1.prisma.user.upsert({
                where: { microsoftId },
                update: {
                    nombre,
                    avatar,
                },
                create: {
                    microsoftId,
                    email,
                    nombre,
                    avatar,
                    rol: 'tecnico',
                },
            });
            done(null, user);
        }
        catch (error) {
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