import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const turnstileSiteKey = (
    process.env.TURNSTILE_SITE_KEY ??
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ??
    ""
  ).trim();

  return NextResponse.json(
    { turnstileSiteKey },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
