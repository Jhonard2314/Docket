import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors    from 'cors';
import path    from 'path';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { auth }            from './config/auth';
import { requireAuth }     from './middleware/requireAuth';
import categoryRoutes      from './routes/categoryRoutes';
import documentRoutes      from './routes/documentRoutes';
import userRoutes          from './routes/userRoutes';
import departmentRoutes    from './routes/departmentRoutes';
import { getDashboard }    from './services/documentService';

type Role = 'EMPLOYEE' | 'DEPARTMENT_HEAD' | 'ADMIN';

const app = express();

// ── CORS ───────────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.FRONTEND_ORIGIN ?? 'http://localhost:5500',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Better Auth — /api/auth/* ─────────────────────────────────────────────────
app.all('/api/auth/*splat', toNodeHandler(auth));

// ── GET /api/me — current session user ───────────────────────────────────────
app.get('/api/me', requireAuth, (req: Request, res: Response) => {
  const u = res.locals.user;
  res.json({
    data: {
      id:           u.id,
      name:         u.name,
      email:        u.email,
      role:         u.role,
      departmentId: u.departmentId ?? null,
      isActive:     u.isActive ?? true,
    },
  });
});

// ── GET /api/dashboard ────────────────────────────────────────────────────────
app.get('/api/dashboard', requireAuth, async (req: Request, res: Response) => {
  try {
    const u = res.locals.user;
    const data = await getDashboard(u.id, u.role as Role, u.departmentId);
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: { code: 'ERROR', message: err.message } });
  }
});

// ── Application routes ────────────────────────────────────────────────────────
app.use('/api/documents',         documentRoutes);
app.use('/api/categories',        categoryRoutes);
app.use('/api/admin/users',       userRoutes);
app.use('/api/admin/departments', departmentRoutes);
app.use('/api/admin/categories',  categoryRoutes);  // same handler, admin-guarded POST/PATCH/DELETE

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// ── Frontend static files ──────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', '..', 'frontend')));

// ── Global error handler ───────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: { code: 'SERVER_ERROR', message: err.message ?? 'Internal server error.' } });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`Docket backend running on port ${PORT}`));

export default app;
