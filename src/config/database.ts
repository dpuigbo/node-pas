import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  // Use @prisma/adapter-mariadb to bypass the native Rust query engine.
  // The Rust engine crashes with "PANIC: timer has gone away" on Hostinger
  // shared hosting due to process/thread limits (~120 max).
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error('[PAS] DATABASE_URL not set — Prisma will fail');
    return new PrismaClient();
  }

  // Parse DATABASE_URL into adapter config
  // Format: mysql://user:password@host:port/database
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    console.error('[PAS] Invalid DATABASE_URL format');
    return new PrismaClient();
  }

  const adapter = new PrismaMariaDb({
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1), // remove leading /
    connectionLimit: 5,
    connectTimeout: 10000,    // 10s to establish connection
    acquireTimeout: 10000,    // 10s to acquire from pool
    idleTimeout: 60000,       // close idle connections after 60s
  });

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  } as any); // 'as any' needed: Prisma 6 types may not expose adapter in constructor type
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
