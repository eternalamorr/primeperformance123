import { NextResponse } from "next/server";
import { sessionCookieName } from "@/lib/admin-auth";
import { enforceSameOrigin } from "@/lib/request-helpers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const originCheck = enforceSameOrigin(request);
  if (originCheck) return originCheck;

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 0,
  });
  return response;
}
