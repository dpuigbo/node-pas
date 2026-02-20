"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(3000),
    DATABASE_URL: zod_1.z.string().min(1),
    JWT_SECRET: zod_1.z.string().min(16).default('dev-secret-change-in-production'),
    MICROSOFT_CLIENT_ID: zod_1.z.string().default(''),
    MICROSOFT_CLIENT_SECRET: zod_1.z.string().default(''),
    MICROSOFT_CALLBACK_URL: zod_1.z.string().default('http://localhost:3000/api/auth/microsoft/callback'),
    APP_URL: zod_1.z.string().default('http://localhost:5173'),
});
function loadEnv() {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
        console.warn('Running with defaults for missing optional vars');
        return {
            NODE_ENV: process.env.NODE_ENV || 'development',
            PORT: Number(process.env.PORT) || 3000,
            DATABASE_URL: process.env.DATABASE_URL || '',
            JWT_SECRET: process.env.JWT_SECRET || 'dev-secret-change-in-production',
            MICROSOFT_CLIENT_ID: process.env.MICROSOFT_CLIENT_ID || '',
            MICROSOFT_CLIENT_SECRET: process.env.MICROSOFT_CLIENT_SECRET || '',
            MICROSOFT_CALLBACK_URL: process.env.MICROSOFT_CALLBACK_URL || 'http://localhost:3000/api/auth/microsoft/callback',
            APP_URL: process.env.APP_URL || 'http://localhost:5173',
        };
    }
    return parsed.data;
}
exports.env = loadEnv();
//# sourceMappingURL=env.js.map