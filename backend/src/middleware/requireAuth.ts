import { Request, Response, NextFunction } from 'express';
import { auth } from '../config/auth';
import { fromNodeHeaders } from 'better-auth/node';

/**
 * Validates the Better Auth session on every protected route.
 * Attaches `res.locals.session` and `res.locals.user` on success.
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });

  if (!session?.user) {
    res.status(401).json({ success: false, message: 'Unauthorized. Please log in.' });
    return;
  }

  res.locals.session = session.session;
  res.locals.user    = session.user;
  next();
}
