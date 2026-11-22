import "server-only";
import { NextRequest, NextResponse } from "next/server";

/**
 * handler.ts — Routes all /api/* requests to either:
 *   - The local file-based backend (when DATABASE_URL is not set)
 *   - The Prisma/PostgreSQL + S3 backend (when DATABASE_URL is set)
 *
 * This keeps the local dev experience intact while enabling AWS deployment.
 */

async function getHandler() {
  if (process.env.DATABASE_URL) {
    const { handle } = await import("./handler.aws");
    return handle;
  } else {
    const { handle } = await import("./handler.local");
    return handle;
  }
}

export async function handle(req: NextRequest): Promise<NextResponse> {
  const h = await getHandler();
  return h(req);
}
