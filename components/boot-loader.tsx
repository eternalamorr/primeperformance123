"use client";

import { useEffect, useState } from "react";

const MIN_VISIBLE_MS = 700;

export function BootLoader() {
  const [visible, setVisible] = useState(true);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    const startedAt = Date.now();

    const finish = () => {
      const elapsed = Date.now() - startedAt;
      const waitMs = Math.max(0, MIN_VISIBLE_MS - elapsed);
      window.setTimeout(() => {
        setHiding(true);
        window.setTimeout(() => setVisible(false), 380);
      }, waitMs);
    };

    if (document.readyState === "complete") {
      finish();
      return;
    }

    window.addEventListener("load", finish, { once: true });
    return () => window.removeEventListener("load", finish);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[2147483647] flex items-center justify-center bg-[#090b12] transition-opacity duration-300 ${
        hiding ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="pointer-events-none flex flex-col items-center gap-6">
        <div className="text-[26px] sm:text-[32px] font-display tracking-[0.22em] uppercase text-white/90">
          PRIME PERFORMANCE
        </div>
        <div className="h-px w-44 overflow-hidden bg-white/15 sm:w-56">
          <div className="loader-line h-full w-1/2 bg-white/90" />
        </div>
      </div>

      <style jsx>{`
        .loader-line {
          animation: slide 1s ease-in-out infinite;
          transform: translateX(-120%);
        }

        @keyframes slide {
          0% {
            transform: translateX(-120%);
          }
          100% {
            transform: translateX(260%);
          }
        }
      `}</style>
    </div>
  );
}
