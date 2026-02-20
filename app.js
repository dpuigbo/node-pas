// Entry point for Phusion Passenger (Hostinger)
// IMPORTANT: NO child processes (execSync/spawn) — Hostinger has ~120 process limit.
// All setup uses fs.*Sync (no fork). chmod + prisma run in postinstall/build step.

const path = require('path');
const fs = require('fs');

// === 1. Load .env if it exists (local dev), otherwise rely on Hostinger panel vars ===
require('dotenv').config({ path: path.join(__dirname, '.env') });

// === 2. Fix .htaccess (Hostinger regenerates it with broken PassengerBaseURI /) ===
const htaccessPath = path.join(__dirname, '.htaccess');
const htaccessContent = [
  'PassengerAppRoot ' + __dirname,
  'PassengerAppType node',
  'PassengerNodejs /opt/alt/alt-nodejs20/root/bin/node',
  'PassengerStartupFile app.js',
].join('\n') + '\n';
try {
  const current = fs.existsSync(htaccessPath) ? fs.readFileSync(htaccessPath, 'utf-8') : '';
  if (current.includes('PassengerBaseURI') || current !== htaccessContent) {
    fs.writeFileSync(htaccessPath, htaccessContent);
    console.log('[PAS] Fixed .htaccess (removed PassengerBaseURI)');
  }
} catch (_) {}

// === 3. Fix esbuild binary permissions (fs.chmodSync, no child process) ===
try {
  const esbuildBin = path.join(__dirname, 'node_modules', '@esbuild', 'linux-x64', 'bin', 'esbuild');
  if (fs.existsSync(esbuildBin)) {
    fs.chmodSync(esbuildBin, 0o755);
  }
} catch (_) {}

// === 4. Start the app ===
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
