"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";

const GL = dynamic(() => import("./gl").then((mod) => mod.GL), { ssr: false });
const ChairHeroScene = dynamic(
  () => import("./chair-hero-scene").then((mod) => mod.ChairHeroScene),
  { ssr: false }
);

export function Hero() {
  const [showChair, setShowChair] = useState(true);
  const [effectsReady, setEffectsReady] = useState(false);
  const [glowIntensity, setGlowIntensity] = useState(1);
  const sectionRef = useRef<HTMLDivElement>(null);
  const hovering = false;

  useEffect(() => {
    const idleCallback =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? (window as Window & {
            requestIdleCallback: (callback: IdleRequestCallback) => number;
            cancelIdleCallback: (id: number) => void;
          }).requestIdleCallback
        : null;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let idleId: number | null = null;

    if (idleCallback) {
      idleId = idleCallback(() => setEffectsReady(true));
    } else {
      timeoutId = setTimeout(() => setEffectsReady(true), 250);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (idleId !== null && "cancelIdleCallback" in window) {
        (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      }
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setShowChair(true);
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -10% 0px" }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let ticking = false;
    const updateIntensity = () => {
      const heroHeight = sectionRef.current?.offsetHeight || window.innerHeight;
      const raw = 1 - Math.min(window.scrollY / (heroHeight * 0.9), 1);
      const eased = raw * raw * (3 - 2 * raw);
      setGlowIntensity(eased);
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateIntensity();
        ticking = false;
      });
    };

    updateIntensity();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={sectionRef} className="relative flex flex-col min-h-svh justify-center overflow-visible">
      {effectsReady ? (
        <GL hovering={hovering} intensity={glowIntensity} />
      ) : (
        <div id="webgl" aria-hidden="true" className="absolute inset-0 bg-[#232730]" />
      )}
      <div
        className={`hero-ambient-glow pointer-events-none ${
          showChair ? "hero-ambient-glow-show" : ""
        }`}
      />
      
      {/* Grain overlay */}
      <div className="grain absolute inset-0 z-[2] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 container">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-16 lg:gap-32 pt-14 sm:pt-20 lg:pt-16 hero-mobile-layout">
          <div className="w-full max-w-2xl lg:max-w-[760px] lg:-mt-8 hero-copy-wrap">
            <div
              className={`hero-copy ${showChair ? "hero-copy-show" : "opacity-0"} relative`}
              style={{
                animationName: showChair ? "heroCopyIn" : "none",
                animationDuration: "1s",
                animationTimingFunction: "ease-out",
                animationFillMode: "both",
                animationDelay: "0.35s",
              }}
            >
              <div className="flex items-center gap-4 text-foreground/50 text-[10px] uppercase tracking-[0.35em] hero-step hero-step-1 hero-kicker">
                <span className="h-[2px] w-10 rounded-full m-stripe" />
                prime performance
              </div>
              <h1 className="mt-7 text-5xl sm:text-6xl md:text-7xl lg:text-[88px] xl:text-[102px] font-sans font-light tracking-tight text-foreground/95 leading-[0.9] hero-step hero-step-2 hero-title text-center sm:text-left mx-auto sm:mx-0 max-w-[340px] sm:max-w-none">
                <span className="block font-semibold">Stand apart.</span>
                <span className="mt-3 block text-2xl sm:text-3xl md:text-4xl lg:text-[52px] xl:text-[60px] font-light">Define your mark.</span>
              </h1>
              <p className="mt-6 text-sm sm:text-base md:text-[19px] text-foreground/55 leading-relaxed hero-step hero-step-3 hero-sub text-center sm:text-left mx-auto sm:mx-0 max-w-[340px] sm:max-w-none">
                Премиальные кресла, вдохновленные эстетикой спорткаров. Для тех, кто не идет на компромиссы.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-4 hero-step hero-step-4 hero-actions hero-actions-desktop">
                <Link
                  href="#catalog"
                  className="inline-flex items-center gap-3 rounded-full bg-foreground px-8 py-3.5 text-[11px] uppercase tracking-[0.3em] text-background transition-all duration-300 hover:bg-foreground/90"
                >
                  Каталог
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="#configurator"
                  className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-foreground/60 transition-all duration-300 hover:text-foreground"
                >
                  <span className="h-px w-6 bg-foreground/30" />
                  Конфигуратор
                </Link>
              </div>
            </div>
          </div>

          <div
            className={`relative w-full lg:flex-1 hero-model ${
              showChair ? "hero-model-show" : ""
            }`}
          >
            <ChairHeroScene animateIn={showChair} />
          </div>
          <div className="hero-actions hero-actions-mobile">
            <Link
              href="#catalog"
              className="inline-flex items-center gap-3 rounded-full bg-foreground px-8 py-3.5 text-[11px] uppercase tracking-[0.3em] text-background transition-all duration-300 hover:bg-foreground/90"
            >
              Каталог
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#configurator"
              className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-foreground/60 transition-all duration-300 hover:text-foreground"
            >
              <span className="h-px w-6 bg-foreground/30" />
              Конфигуратор
            </Link>
          </div>
        </div>
      </div>
      <style jsx>{`
        .hero-model {
          margin-left: auto;
          height: clamp(560px, 66vw, 980px);
          opacity: 0;
          pointer-events: none;
          overflow: visible;
          perspective: 1200px;
          transition: opacity 0.6s ease-out;
        }
        .hero-model-show {
          opacity: 1;
          pointer-events: auto;
        }
        .hero-ambient-glow {
          position: absolute;
          inset: -12% -8% -24%;
          z-index: 1;
          background:
            radial-gradient(55% 45% at 22% 18%, rgba(0, 128, 221, 0.22), transparent 72%),
            radial-gradient(60% 50% at 78% 20%, rgba(255, 40, 71, 0.18), transparent 74%),
            radial-gradient(70% 60% at 50% 55%, rgba(255, 255, 255, 0.18), transparent 76%);
          filter: blur(46px) saturate(0.95) contrast(1.15);
          opacity: 0;
          mix-blend-mode: soft-light;
          transform: translateY(12px);
          transition: opacity 0.9s ease-out, transform 0.9s ease-out;
        }
        .hero-ambient-glow-show {
          opacity: 0.85;
          transform: translateY(0);
          transition-delay: 0.45s;
        }
        @keyframes heroCopyIn {
          0% { opacity: 0; transform: translateY(18px); filter: blur(6px); }
          100% { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        .hero-copy {
          perspective: 1200px;
        }
        .hero-step {
          opacity: 0;
          transform: translate3d(var(--step-offset, 0px), 22px, -90px) rotateX(12deg);
          transform-style: preserve-3d;
          transform-origin: left center;
          will-change: transform, opacity;
        }
        .hero-copy-show .hero-step {
          animation: heroStepIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) both;
          animation-delay: var(--step-delay, 0s);
        }
        .hero-actions-mobile {
          display: none;
        }
        .hero-step-1 { --step-delay: 0.05s; --step-offset: -20px; }
        .hero-step-2 { --step-delay: 0.15s; --step-offset: -12px; }
        .hero-step-3 { --step-delay: 0.25s; --step-offset: -4px; }
        .hero-step-4 { --step-delay: 0.35s; --step-offset: 4px; }
        .hero-step-5 { --step-delay: 0.5s; --step-offset: 10px; }
        .hero-step-6 { --step-delay: 0.65s; --step-offset: 16px; }
        .hero-step-7 { --step-delay: 0.8s; --step-offset: 22px; }
        .hero-step-8 { --step-delay: 0.95s; --step-offset: 28px; }
        @keyframes heroStepIn {
          0% { opacity: 0; transform: translate3d(var(--step-offset, 0px), 22px, -90px) rotateX(12deg); }
          100% { opacity: 1; transform: translate3d(var(--step-offset, 0px), 0, 0) rotateX(0deg); }
        }
        @media (max-width: 640px) {
          .hero-mobile-layout {
            position: relative;
            min-height: calc(100svh - 120px);
            padding-bottom: clamp(8px, 3.5vw, 24px);
            gap: clamp(10px, 3.2vw, 20px);
          }
          .hero-copy {
            position: static;
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .hero-copy-wrap {
            order: 1;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            width: 100%;
            margin-top: clamp(6px, 2.6vw, 18px);
          }
          .hero-step {
            --step-offset: 0px;
            transform-origin: center;
          }
          .hero-kicker {
            display: none;
          }
          .hero-title,
          .hero-sub {
            text-align: center;
          }
          .hero-title {
            width: 100%;
            max-width: 360px;
            margin-left: auto;
            margin-right: auto;
            font-size: clamp(40px, 14vw, 88px);
            line-height: 1.06;
            letter-spacing: 0.01em;
          }
          .hero-title span {
            font-size: clamp(19px, 5.8vw, 28px);
          }
          .hero-sub {
            width: 100%;
            max-width: 360px;
            margin-left: auto;
            margin-right: auto;
            font-size: clamp(13px, 3.8vw, 16px);
            line-height: 1.55;
          }
          .hero-actions {
            order: 3;
            width: 100%;
            justify-content: center;
            margin-top: clamp(8px, 3vw, 18px);
            z-index: 5;
          }
          .hero-actions-desktop {
            display: none;
          }
          .hero-actions-mobile {
            display: flex;
            gap: 12px;
            flex-wrap: wrap;
            justify-content: center;
            margin-top: auto;
          }
          .hero-model {
            order: 2;
            height: clamp(320px, 48svh, 520px);
            max-width: min(420px, 92vw);
            margin-left: auto;
            margin-right: auto;
            margin-top: clamp(12px, 3.6vw, 24px);
            margin-bottom: clamp(4px, 1.6vw, 10px);
          }
        }
      `}</style>

      {/* Bottom gradient fade */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-48 z-[1] pointer-events-none"
        style={{
          background: "linear-gradient(to top, rgba(5, 5, 8, 1) 0%, transparent 100%)",
        }}
      />
    </div>
  );
}
