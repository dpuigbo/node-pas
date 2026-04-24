"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const globalForPrisma = globalThis;
function createPrismaClient() {
    // Use @prisma/adapter-mariadb to bypass the native Rust query engine.
    // The Rust engine crashes with "PANIC: timer has gone away" on Hostinger
    // shared hosting due to process/thread limits (~120 max).
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('[PAS] DATABASE_URL not set — Prisma will fail');
        return new client_1.PrismaClient();
    }
    // Pass URL string directly to adapter (config object hangs on Hostinger)
    const adapter = new adapter_mariadb_1.PrismaMariaDb(url);
    return new client_1.PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
}
exports.prisma = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = exports.prisma;
//# sourceMappingURL=database.js.map