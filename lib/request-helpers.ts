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

  if (sourceOrigin !== requestOrigin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
