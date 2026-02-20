// Entry point for Phusion Passenger (Hostinger)
// IMPORTANT: This file must stay lightweight — NO child processes (execSync/spawn).
// Hostinger has strict process limits; chmod + prisma generate run in postinstall/build.

const path = require('path');
const fs = require('fs');

// === 1. Load .env if it exists (local dev), otherwise rely on Hostinger panel vars ===
require('dotenv').config({ path: path.join(__dirname, '.env') });

// === 2. Start the app (no child processes — just require) ===
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
