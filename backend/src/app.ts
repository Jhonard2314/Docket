import 'dotenv/config';
import express      from 'express';
import cors         from 'cors';
import path         from 'path';
import { toNodeHandler } from 'better-auth/node';
import { auth }          from './config/auth';
import categoryRoutes    from './routes/categoryRoutes';
import documentRoutes    from './routes/documentRoutes';
import userRoutes        from './routes/userRoutes';

const app = express();

// ── CORS ───────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_ORIGIN ?? 'http://localhost:5500',
  credentials: true,
}));

// ── Body parsers ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Better Auth — handles /api/auth/* automatically ───────────────────────────
app.all('/api/auth/*', toNodeHandler(auth));

// ── Application API routes ─────────────────────────────────────────────────────
app.use('/api/categories', categoryRoutes);
app.use('/api/documents',  documentRoutes);
app.use('/api/users',      userRoutes);

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Serve frontend static files ────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: err.message ?? 'Internal server error.' });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`Docket backend running on port ${PORT}`));

export default app;
