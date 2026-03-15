import { NextResponse } from "next/server";

const normalizeIp = (value: string | null) => {
  if (!value) return null;
  const ip = value.trim();
  if (!ip) return null;
  // Drop IPv6 zone ids and ports from forwarded values.
  const withoutZone = ip.split("%")[0];
  const withoutPort = withoutZone.includes(":") && withoutZone.includes(".")
    ? withoutZone.split(":")[0]
    : withoutZone;
  return withoutPort;
};

export async function getClientIp(headersInput: Headers | Promise<Headers>) {
  const headers = await headersInput;
  const candidateHeaders = [
    "cf-connecting-ip",
    "x-real-ip",
    "x-forwarded-for",
    "x-client-ip",
  ];

  for (const headerName of candidateHeaders) {
    const raw = headers.get(headerName);
    if (!raw) continue;
    const first = headerName === "x-forwarded-for" ? raw.split(",")[0] : raw;
    const normalized = normalizeIp(first);
    if (normalized) return normalized;
  }

  return "unknown";
}

export function enforceSameOrigin(request: Request) {
  const method = request.method.toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) {
    return null;
  }

  const requestOrigin = new URL(request.url).origin;
  const trustedOrigins = new Set<string>([requestOrigin]);

  const xForwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const xForwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  if (xForwardedProto && xForwardedHost) {
    trustedOrigins.add(`${xForwardedProto}://${xForwardedHost}`);
  }

  const xForwardedOrigin = request.headers.get("x-forwarded-origin")?.split(",")[0]?.trim();
  if (xForwardedOrigin) {
    try {
      trustedOrigins.add(new URL(xForwardedOrigin).origin);
    } catch {
      // Ignore malformed forwarded origin header.
    }
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) {
    try {
      trustedOrigins.add(new URL(siteUrl).origin);
    } catch {
      // Ignore malformed site url.
    }
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  let sourceOrigin = origin;
  if (!sourceOrigin && referer) {
    try {
      sourceOrigin = new URL(referer).origin;
    } catch {
      sourceOrigin = null;
    }
  }

  if (!sourceOrigin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!trustedOrigins.has(sourceOrigin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
