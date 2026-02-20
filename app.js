// Entry point for Phusion Passenger (Hostinger)
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// === 1. Ensure .env exists (auto-create for Hostinger) ===
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('[PAS] .env not found — creating from production defaults...');
  const defaultEnv = [
    'NODE_ENV=production',
    'PORT=3000',
    'DATABASE_URL=mysql://u306143177_admin_db:Setupz0002cf7d36e4@127.0.0.1:3306/u306143177_pas_admin_db',
    'JWT_SECRET=k8Xp2mQ9vR4wZ7nJ3bF6yT1cA5dH0gLsE8iU2oP7qW4xN6rV9mK3jB5fY1aZ0tG',
    'MICROSOFT_CLIENT_ID=',
    'MICROSOFT_CLIENT_SECRET=',
    'MICROSOFT_CALLBACK_URL=https://admin.pasrobotics.com/api/auth/microsoft/callback',
    'APP_URL=https://admin.pasrobotics.com',
    'DEPLOY_SECRET=pas-deploy-2024-k8Xp2mQ9vR4w',
  ].join('\n') + '\n';
  fs.writeFileSync(envPath, defaultEnv);
}

// === 2. Load .env ===
require('dotenv').config({ path: envPath });

// === 3. Fix binary permissions (Hostinger loses them after npm install) ===
try {
  execSync('chmod +x node_modules/@esbuild/*/bin/esbuild node_modules/.bin/* 2>/dev/null', {
    cwd: __dirname,
    stdio: 'ignore',
  });
} catch (_) {}

// === 4. Ensure Prisma client is generated ===
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

// === 5. Start the app ===
try {
  require('tsx/cjs');
  require('./src/index.ts');
} catch (err) {
  const msg = `[${new Date().toISOString()}] STARTUP ERROR:\n${err.stack || err}\n`;
  fs.appendFileSync(path.join(__dirname, 'startup-error.log'), msg);
  console.error(msg);
  const http = require('http');
  http.createServer((_req, res) => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'App failed to start', details: String(err) }));
  }).listen(process.env.PORT || 3000);
}
