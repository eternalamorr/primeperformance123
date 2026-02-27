"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import Link from "next/link";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "pp-cookie-consent";

type ConsentState = "accepted" | "rejected" | null;

const readConsent = (): ConsentState => {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "accepted" || saved === "rejected") return saved;
  } catch {
    // Ignore storage access errors (private mode, blocked storage, etc.).
  }
  return null;
};

const writeConsent = (value: Exclude<ConsentState, null>) => {
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    // Ignore storage write errors and still update UI state.
  }
};

export function CookieConsent() {
  const [consent, setConsent] = useState<ConsentState>(null);
  const [isReady, setIsReady] = useState(false);
  const metricaId = process.env.NEXT_PUBLIC_YANDEX_METRICA_ID;

  useEffect(() => {
    setConsent(readConsent());
    setIsReady(true);
  }, []);

  const accept = () => {
    writeConsent("accepted");
    setConsent("accepted");
  };

  const reject = () => {
    writeConsent("rejected");
    setConsent("rejected");
  };

  return (
    <>
      {isReady && consent === "accepted" && metricaId ? (
        <>
          <Script
            id="yandex-metrica"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
              (function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
              m[i].l=1*new Date();
              for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
              k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
              (window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");

              ym(${JSON.stringify(metricaId)}, "init", {
                clickmap:true,
                trackLinks:true,
                accurateTrackBounce:true,
                webvisor:true
              });
              `,
            }}
          />
          <noscript>
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://mc.yandex.ru/watch/${metricaId}`}
                style={{ position: "absolute", left: "-9999px" }}
                alt=""
              />
            </div>
          </noscript>
        </>
      ) : null}

      {isReady && consent === null ? (
        <div className="fixed inset-x-4 bottom-4 z-[2147483647] flex justify-center">
          <div className="w-full max-w-3xl rounded-2xl border border-foreground/15 bg-background/95 p-4 shadow-2xl shadow-black/30 backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="text-sm text-foreground/70 leading-relaxed">
                Мы используем cookie и аналитические инструменты (Яндекс.Метрика), чтобы улучшать сайт.{" "}
                <Link
                  href="/privacy"
                  className="text-foreground underline underline-offset-4 hover:text-foreground/80"
                >
                  Подробнее в политике обработки данных
                </Link>
                .
              </div>
              <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                <button
                  type="button"
                  onClick={reject}
                  className={cn(
                    "rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground/60 transition-all duration-300",
                    "hover:border-foreground/40 hover:text-foreground"
                  )}
                >
                  Отклонить
                </button>
                <button
                  type="button"
                  onClick={accept}
                  className="rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] text-background transition-all duration-300 hover:bg-foreground/90"
                >
                  Принять
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
