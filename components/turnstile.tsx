"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
    };
  }
}

type TurnstileProps = {
  siteKey: string;
  onVerify: (token: string) => void;
  onUnavailable?: () => void;
};

export function TurnstileWidget({ siteKey, onVerify, onUnavailable }: TurnstileProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onVerifyRef = useRef(onVerify);
  const onUnavailableRef = useRef(onUnavailable);
  const renderedRef = useRef(false);

  useEffect(() => {
    onVerifyRef.current = onVerify;
  }, [onVerify]);

  useEffect(() => {
    onUnavailableRef.current = onUnavailable;
  }, [onUnavailable]);

  useEffect(() => {
    if (!siteKey) return;
    let canceled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let unavailableNotified = false;

    const notifyUnavailable = () => {
      if (unavailableNotified) return;
      unavailableNotified = true;
      onUnavailableRef.current?.();
    };

    const renderWidget = () => {
      if (canceled || !containerRef.current || !window.turnstile || renderedRef.current) return;
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      containerRef.current.innerHTML = "";
      window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token: string) => onVerifyRef.current(token),
        "error-callback": () => onVerifyRef.current(""),
        "expired-callback": () => onVerifyRef.current(""),
      });
      renderedRef.current = true;
    };

    const scriptId = "turnstile-script";
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (existing) {
      if (window.turnstile) {
        renderWidget();
      } else {
        existing.addEventListener("load", renderWidget);
        existing.addEventListener("error", notifyUnavailable);
      }
      timeoutId = setTimeout(() => {
        if (!window.turnstile) notifyUnavailable();
      }, 7000);
      return () => {
        canceled = true;
        if (timeoutId) clearTimeout(timeoutId);
        existing.removeEventListener("load", renderWidget);
        existing.removeEventListener("error", notifyUnavailable);
        renderedRef.current = false;
      };
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = renderWidget;
    script.onerror = notifyUnavailable;
    document.body.appendChild(script);
    timeoutId = setTimeout(() => {
      if (!window.turnstile) notifyUnavailable();
    }, 7000);

    return () => {
      canceled = true;
      if (timeoutId) clearTimeout(timeoutId);
      script.onload = null;
      script.onerror = null;
      renderedRef.current = false;
    };
  }, [siteKey]);

  return <div ref={containerRef} />;
}
