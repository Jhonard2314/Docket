import "server-only";
import { NextRequest, NextResponse } from "next/server";

export async function handle(req: NextRequest): Promise<NextResponse> {
  const { handle: awsHandle } = await import("./handler.aws");
  return awsHandle(req);
}
