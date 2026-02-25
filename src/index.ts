import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import path from 'path';
import { configureAuth } from './config/auth';
import { errorMiddleware } from './middleware/error.middleware';
import apiRoutes from './routes';

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';
// Project root: find it by looking for package.json
// Works with tsx (__dirname=src/) and tsc (__dirname=dist/server/src/)
const PROJECT_ROOT = [__dirname, path.join(__dirname, '..'), path.join(__dirname, '..', '..', '..')]
  .find(d => require('fs').existsSync(path.join(d, 'package.json'))) || path.join(__dirname, '..');

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: isDev ? 'http://localhost:5173' : true,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Auth
configureAuth();
app.use(passport.initialize());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// DB health check — test actual database connection
app.get('/api/health/db', async (_req, res) => {
  try {
    const { prisma } = await import('./config/database');
    const timeout = new Promise<never>((_, rej) => setTimeout(() => rej(new Error('DB query timed out (10s)')), 10000));
    const query = prisma.$queryRawUnsafe('SELECT 1 as ok');
    await Promise.race([query, timeout]);
    res.json({ status: 'ok', db: 'connected' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', db: err.message });
  }
});

// Deploy webhook — lightweight restart only
// Hostinger handles git pull + npm install + build on deploy.
// This just restarts Passenger via tmp/restart.txt (uses fs, no child processes).
app.post('/api/deploy', (req, res) => {
  const secret = req.headers['x-deploy-secret'] || req.query.secret;
  if (secret !== process.env.DEPLOY_SECRET) {
    res.status(401).json({ error: 'Invalid deploy secret' });
    return;
  }
  try {
    const tmpDir = path.join(PROJECT_ROOT, 'tmp');
    const fs = require('fs');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    res.json({ status: 'restart scheduled' });
    // Touch restart.txt after response is sent
    setTimeout(() => {
      try { fs.writeFileSync(path.join(tmpDir, 'restart.txt'), String(Date.now())); } catch (_) {}
    }, 500);
  } catch (err: any) {
    res.status(500).json({ error: 'Deploy failed', details: err.message });
  }
});

// Serve uploaded files (logos, etc.)
const uploadsDir = path.join(PROJECT_ROOT, 'uploads');
require('fs').mkdirSync(path.join(uploadsDir, 'logos'), { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// API routes
app.use('/api', apiRoutes);

// Error handler
app.use(errorMiddleware);

// Serve static frontend in production
if (!isDev) {
  const clientDist = path.join(PROJECT_ROOT, 'dist', 'client');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[PAS] Servidor corriendo en puerto ${PORT} (${isDev ? 'desarrollo' : 'produccion'})`);
});

export default app;
