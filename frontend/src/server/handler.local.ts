import { NextRequest, NextResponse } from "next/server";
export async function handle(_req: NextRequest): Promise<NextResponse> {
  return NextResponse.json({ error: { code: "SERVICE_ERROR", message: "Local demo not available." } }, { status: 503 });
}
