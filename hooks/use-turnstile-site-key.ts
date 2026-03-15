"use client";

import { useEffect, useState } from "react";

const buildTimeTurnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function useTurnstileSiteKey() {
  const [turnstileSiteKey, setTurnstileSiteKey] = useState(buildTimeTurnstileSiteKey);

  useEffect(() => {
    if (turnstileSiteKey) return;

    let canceled = false;

    const loadRuntimeKey = async () => {
      try {
        const response = await fetch("/api/public-config", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { turnstileSiteKey?: unknown };
        const key =
          typeof data?.turnstileSiteKey === "string"
            ? data.turnstileSiteKey.trim()
            : "";
        if (!canceled && key) {
          setTurnstileSiteKey(key);
        }
      } catch {
        // Keep empty key fallback on network/config errors.
      }
    };

    void loadRuntimeKey();

    return () => {
      canceled = true;
    };
  }, [turnstileSiteKey]);

  return turnstileSiteKey;
}
