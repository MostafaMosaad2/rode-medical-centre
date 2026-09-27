import { NextResponse } from "next/server";
import { loadPatientLaserContext } from "@/lib/laser/status";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(request: Request) {
  const fileId = new URL(request.url).searchParams.get("fileId")?.trim() ?? "";
  if (!/^\d{3,}$/.test(fileId)) {
    return NextResponse.json(
      { success: false, error: "Invalid patient file", code: "INVALID" },
      { status: 400 },
    );
  }

  try {
    const context = await loadPatientLaserContext(fileId);
    return NextResponse.json(context.payload);
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Failed";
    console.error("[patient/laser-status]", raw);
    return NextResponse.json(
      { success: false, error: "retry", retry: true },
      { status: 503 },
    );
  }
}
