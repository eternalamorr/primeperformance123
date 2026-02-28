const DEFAULT_SITE_URL = "http://localhost:3000";

export function getSiteUrl(rawValue = process.env.NEXT_PUBLIC_SITE_URL): string {
  const trimmedValue = rawValue?.trim();
  if (!trimmedValue) {
    return DEFAULT_SITE_URL;
  }

  const normalizedValue = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmedValue)
    ? trimmedValue
    : `https://${trimmedValue}`;

  try {
    return new URL(normalizedValue).toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_SITE_URL;
  }
}
