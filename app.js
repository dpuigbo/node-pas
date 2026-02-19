// Entry point for Phusion Passenger (Hostinger)
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Load .env with absolute path so it works regardless of cwd
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);
const dotenvResult = require('dotenv').config({ path: envPath });
if (!envExists || dotenvResult.error) {
  console.error(`[PAS] .env file ${envExists ? 'exists but failed to load' : 'NOT FOUND'} at: ${envPath}`);
}
console.log(`[PAS] DATABASE_URL ${process.env.DATABASE_URL ? 'loaded (' + process.env.DATABASE_URL.substring(0, 20) + '...)' : 'MISSING'}`);

// Fix permissions on every startup — Hostinger loses them after npm install
try {
  execSync('chmod +x node_modules/@esbuild/*/bin/esbuild node_modules/.bin/* 2>/dev/null', {
    cwd: __dirname,
    stdio: 'ignore',
  });
} catch (_) {
  // Ignore — may fail on Windows dev machines
}

// Generate Prisma client if needed
try {
  require.resolve('@prisma/client');
} catch (_) {
  try {
    console.log('[PAS] Prisma client not found, generating...');
    execSync('node node_modules/prisma/build/index.js generate', {
      cwd: __dirname,
      stdio: 'inherit',
    });
  } catch (e) {
    console.error('[PAS] Failed to generate Prisma client:', e.message);
  }
}

// Start the app
try {
  require('tsx/cjs');
  require('./src/index.ts');
} catch (err) {
  const msg = `[${new Date().toISOString()}] STARTUP ERROR:\n${err.stack || err}\n`;
  fs.appendFileSync(path.join(__dirname, 'startup-error.log'), msg);
  console.error(msg);
  // Levantar un servidor minimo que muestre el error en vez de 503 mudo
  const http = require('http');
  http.createServer((_req, res) => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'App failed to start', details: String(err) }));
  }).listen(process.env.PORT || 3000);
}
