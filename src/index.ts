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

// API routes
app.use('/api', apiRoutes);

// Error handler
app.use(errorMiddleware);

// Serve static frontend in production
if (!isDev) {
  const clientDist = path.join(__dirname, '..', '..', 'client');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`[PAS] Servidor corriendo en puerto ${PORT} (${isDev ? 'desarrollo' : 'produccion'})`);
});

export default app;
