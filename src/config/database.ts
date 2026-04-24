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

  // Pass URL string directly to adapter (config object hangs on Hostinger)
  const adapter = new PrismaMariaDb(url);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  } as any);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
