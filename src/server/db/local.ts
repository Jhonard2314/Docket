// Local file-based storage is disabled in production.
// All requests are handled by handler.aws.ts using PostgreSQL and S3.
export async function withStore(): Promise<never> {
  throw new Error("Local storage is not available in production.");
}
export function publicUser(u: any) { return u; }
export function verifyPassword() { return false; }
export function hashPassword() { return ""; }
export const dataDir = "";
