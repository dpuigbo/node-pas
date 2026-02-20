// Entry point for Phusion Passenger (Hostinger)
// IMPORTANT: NO child processes (execSync/spawn) — Hostinger has ~120 process limit.
// All setup uses fs.*Sync (no fork). chmod + prisma run in postinstall/build step.

const path = require('path');
const fs = require('fs');

// === 1. Restore .env from persistent location if missing (Hostinger deletes it on deploy) ===
const envPath = path.join(__dirname, '.env');
const persistentEnvPath = '/home/u306143177/.env.pas-robotics';

try {
  if (!fs.existsSync(envPath) && fs.existsSync(persistentEnvPath)) {
    // .env was deleted by deploy — restore from persistent backup
    fs.copyFileSync(persistentEnvPath, envPath);
    console.log('[PAS] Restored .env from persistent backup');
  } else if (fs.existsSync(envPath) && fs.existsSync(persistentEnvPath)) {
    // Both exist — sync: if project .env is newer (edited via SSH), update backup
    const envStat = fs.statSync(envPath);
    const backupStat = fs.statSync(persistentEnvPath);
    if (envStat.mtimeMs > backupStat.mtimeMs) {
      fs.copyFileSync(envPath, persistentEnvPath);
      console.log('[PAS] Updated persistent .env backup');
    }
  } else if (fs.existsSync(envPath) && !fs.existsSync(persistentEnvPath)) {
    // First time: create persistent backup
    fs.copyFileSync(envPath, persistentEnvPath);
    console.log('[PAS] Created persistent .env backup');
  }
} catch (envErr) {
  console.warn('[PAS] .env sync warning:', envErr.message);
}

// === 2. Load .env ===
require('dotenv').config({ path: envPath });

// === 3. Fix .htaccess (Hostinger regenerates it with broken PassengerBaseURI /) ===
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

// === 4. Start the app (pre-compiled JS, no tsx/esbuild at runtime) ===
try {
  require('./dist/server/src/index.js');
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
