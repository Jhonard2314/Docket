import { Request, Response, NextFunction } from 'express';
import { auth }              from '../config/auth';
import { fromNodeHeaders }   from 'better-auth/node';
import prisma                from '../config/db';

/**
 * Validates the Better Auth session and attaches the full user record
 * (including role, departmentId, isActive) to res.locals.user.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });

  if (!session?.user) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Please sign in.' } });
    return;
  }

  // Fetch full user record for role / department / isActive
  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { id: true, name: true, email: true, role: true, departmentId: true, isActive: true },
  });

  if (!user || !user.isActive) {
    res.status(401).json({ error: { code: 'UNAUTHENTICATED', message: 'Account is inactive.' } });
    return;
  }

  res.locals.session = session.session;
  res.locals.user    = user;
  next();
}
