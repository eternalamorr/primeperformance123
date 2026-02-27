import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { sessionCookieName, verifySession } from "@/lib/admin-auth";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName())?.value;
  const session = verifySession(token);
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true as const, session };
}
