import { NextResponse } from "next/server";
import { findPatientsByQuery } from "@/lib/imdad/client";
import { normalizeLookupQuery } from "@/lib/imdad/digits";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 60;

async function searchWithRetries(query: string) {
  const maxAttempts = 6;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await findPatientsByQuery(query);
    } catch (err) {
      lastError = err;
      console.error(`[book/patient] attempt ${attempt}/${maxAttempts}`, err);
      await new Promise((r) => setTimeout(r, Math.min(700 * attempt, 3000)));
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to search patient file");
}

export async function POST(request: Request) {
  let body: { query?: string };
  try {
    body = (await request.json()) as { query?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const query = normalizeLookupQuery(body.query ?? "");
  if (query.length < 5) {
    return NextResponse.json(
      { error: "Enter a valid phone number or national ID", code: "INVALID" },
      { status: 400 },
    );
  }

  try {
    const patients = await searchWithRetries(query);
    if (patients.length === 0) {
      return NextResponse.json({
        found: false,
        patients: [],
        clinicPhone: site.phoneDisplay,
        clinicTel: site.phoneTel,
      });
    }

    return NextResponse.json({
      found: true,
      patients: patients.map((p) => ({
        token: p.token,
        name: p.name,
        fileId: p.fileId,
        phoneOrId: p.phoneOrId,
      })),
    });
  } catch (err) {
    const raw = err instanceof Error ? err.message : "Failed to search";
    console.error("[book/patient]", raw);
    // UI will keep retrying quietly — never expose technical text
    return NextResponse.json({ error: "retry", retry: true }, { status: 503 });
  }
}
