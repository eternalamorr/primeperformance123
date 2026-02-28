import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createSession, safeEqual, sessionCookieName, verifyAdminPassword } from "@/lib/admin-auth";
import { enforceSameOrigin, getClientIp } from "@/lib/request-helpers";
import { rateLimit } from "@/lib/rate-limit";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";

const LoginSchema = z.object({
  username: z.string().trim().min(1).max(120),
  password: z.string().min(1).max(300),
});

type AdminUserRow = {
  username: string;
  password_hash: string;
  is_active: boolean;
};

export async function POST(request: Request) {
  const supabaseAdmin = getSupabaseAdmin();
  const originCheck = enforceSameOrigin(request);
  if (originCheck) return originCheck;

  const limiter = await rateLimit({
    key: `admin-login:${await getClientIp(headers())}`,
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Слишком много попыток входа. Попробуйте позже." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = LoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Некорректные данные входа." }, { status: 400 });
  }

  const username = parsed.data.username;
  const password = parsed.data.password;
  const isProd = process.env.NODE_ENV === "production";

  const { data: dbAdminRaw, error: dbError } = await supabaseAdmin
    .from("admin_users")
    .select("username,password_hash,is_active")
    .eq("username", username)
    .maybeSingle();
  const dbAdmin = (dbAdminRaw ?? null) as AdminUserRow | null;

  if (dbError && dbError.code !== "42P01") {
    console.error("Failed to query admin_users:", dbError);
    return NextResponse.json({ error: "Ошибка проверки учетных данных." }, { status: 500 });
  }

  if (dbAdmin?.is_active) {
    const ok = await verifyAdminPassword(password, dbAdmin.password_hash);
    if (!ok) {
      return NextResponse.json({ error: "Неверный логин или пароль." }, { status: 401 });
    }
  } else {
    if (isProd) {
      return NextResponse.json(
        { error: "Админ не настроен в БД (admin_users)." },
        { status: 500 }
      );
    }

    const adminUser = process.env.ADMIN_USER;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUser || !adminPassword) {
      return NextResponse.json(
        { error: "Админ не настроен." },
        { status: 500 }
      );
    }

    if (!safeEqual(username, adminUser) || !safeEqual(password, adminPassword)) {
      return NextResponse.json(
        { error: "Неверный логин или пароль." },
        { status: 401 }
      );
    }
  }

  const token = createSession(username);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 60 * 60 * 24,
  });
  return response;
}
