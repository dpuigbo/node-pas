import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import mariadb from 'mariadb';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL;

  if (!url) {
    console.error('[PAS] DATABASE_URL not set — Prisma will fail');
    return new PrismaClient();
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    console.error('[PAS] Invalid DATABASE_URL format');
    return new PrismaClient();
  }

  // Create mariadb pool directly (proven to work on Hostinger)
  // then pass it to PrismaMariaDb adapter
  const pool = mariadb.createPool({
    host: parsed.hostname,
    port: Number(parsed.port) || 3306,
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database: parsed.pathname.slice(1),
    connectionLimit: 2,
    connectTimeout: 10000,
    idleTimeout: 60000,
  });

  const adapter = new PrismaMariaDb(pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
