import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';
import path from 'path';
import { execSync } from 'child_process';
import { configureAuth } from './config/auth';
import { errorMiddleware } from './middleware/error.middleware';
import apiRoutes from './routes';

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

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

// Deploy webhook — called by GitHub Actions after client build
app.post('/api/deploy', (req, res) => {
  const secret = req.headers['x-deploy-secret'] || req.query.secret;
  if (secret !== process.env.DEPLOY_SECRET) {
    res.status(401).json({ error: 'Invalid deploy secret' });
    return;
  }
  try {
    const projectRoot = path.join(__dirname, '..');
    const output = execSync('bash deploy.sh 2>&1', {
      cwd: projectRoot,
      timeout: 60000,
      encoding: 'utf-8',
    });
    res.json({ status: 'deployed', output });
  } catch (err: any) {
    res.status(500).json({ error: 'Deploy failed', output: err.stdout || err.message });
  }
});

// API routes
app.use('/api', apiRoutes);

// Error handler
app.use(errorMiddleware);

// Serve static frontend in production
if (!isDev) {
  // __dirname = <project>/src/ (running TS directly with tsx)
  const clientDist = path.join(__dirname, '..', 'dist', 'client');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[PAS] Servidor corriendo en puerto ${PORT} (${isDev ? 'desarrollo' : 'produccion'})`);
});

export default app;
