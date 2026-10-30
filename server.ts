import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { apiRouter } from './server/routes/apiRouter';
import { db } from './server/db/database';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Security & Parsing Middlewares
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// Request logging for audit trail
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API ${req.method}] ${req.path}`);
  }
  next();
});

// Mount Versioned API Routes
app.use('/api/v1', apiRouter);
// Forward unversioned /api/* to /api/v1/*
app.use('/api', apiRouter);

// Background Worker: Queue processing, invitation expiration, and notification dispatch
function startBackgroundWorkers() {
  setInterval(() => {
    try {
      const now = Date.now();
      // 1. Expire outdated invitations
      Array.from(db.invitations.values()).forEach((inv) => {
        if (inv.status === 'pending' && new Date(inv.expiresAt).getTime() < now) {
          inv.status = 'expired';
        }
      });

      // 2. Clean expired OTPs
      Array.from(db.otps.entries()).forEach(([key, otp]) => {
        if (otp.expiresAt < now) {
          db.otps.delete(key);
        }
      });
    } catch (err) {
      console.error('[Background Worker Error]:', err);
    }
  }, 60000); // Every 60 seconds
}

async function startServer() {
  if (!isProduction) {
    // Development mode: Mount Vite dev server middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
    console.log('[Server] Vite middleware mounted in development mode.');
  } else {
    // Production mode: Serve built static files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
    console.log('[Server] Serving static production bundle from dist.');
  }

  // Central Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Server Unhandled Error]:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error occurred.',
    });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`====================================================`);
    console.log(`🚀 VYAAPX Operating Layer Server running on port ${PORT}`);
    console.log(`🌐 Local endpoint: http://0.0.0.0:${PORT}`);
    console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`====================================================`);
    startBackgroundWorkers();
  });
}

startServer().catch((err) => {
  console.error('Fatal startup failure:', err);
  process.exit(1);
});
