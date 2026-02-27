"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

export function AboutSection() {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setShouldLoadVideo(true);
          // Replay animation when entering viewport
          setIsVisible(false);
          setTimeout(() => setIsVisible(true), 50);

          // Start playback when section enters viewport.
          const video = videoRef.current;
          if (video) {
            const playPromise = video.play();
            if (playPromise) {
              playPromise.catch(() => {
                // Autoplay may be blocked by browser policies.
              });
            }
          }
        } else {
          // Reset when leaving viewport
          setIsVisible(false);

          // Pause when section leaves viewport.
          videoRef.current?.pause();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="relative z-10 py-16 sm:py-24 md:py-40 overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 lg:gap-24 items-center">
          {/* Left - Visual */}
          <div
            className={cn(
              "relative transition-all duration-1000 order-2 lg:order-1",
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            )}
            style={{
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div className="relative aspect-[4/5] max-w-[280px] sm:max-w-md mx-auto">
              <div className="absolute inset-0 rounded-3xl overflow-hidden border border-foreground/10 bg-black/20">
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  src={shouldLoadVideo ? "/videos/vidos.mp4" : undefined}
                  muted
                  loop
                  playsInline
                  autoPlay
                  preload="none"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/20" />
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div
            className={cn(
              "transition-all duration-1000 delay-200 order-1 lg:order-2 text-center lg:text-left",
              isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"
            )}
            style={{
              transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            <div 
              className={cn(
                "flex items-center gap-4 mb-6 transition-all duration-700 delay-100 justify-center lg:justify-start",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <div className="flex h-1 w-12 rounded-full overflow-hidden">
                <div className="w-1/3 h-full bg-m-blue" />
                <div className="w-1/3 h-full bg-m-red" />
                <div className="w-1/3 h-full bg-m-purple" />
              </div>
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-foreground/40">О бренде</span>
            </div>

            <h2 
              className={cn(
                "text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-light tracking-tight mb-6 sm:mb-8 transition-all duration-1000 delay-200",
                isVisible ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-8 blur-sm"
              )}
              style={{
                transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              Философия
              <br />
              <span className="font-medium">PRIME PERFORMANCE</span>
            </h2>

            <p 
              className={cn(
                "text-foreground/50 text-sm sm:text-base mb-5 sm:mb-6 leading-relaxed transition-all duration-700 delay-300 mx-auto lg:mx-0",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              Мы создаем уникальные кресла для тех, кто не идет на компромиссы.
              Вдохновленные агрессивным дизайном премиальных авто, наши кресла сочетают
              в себе спортивный характер и безупречный комфорт.
            </p>
            <p 
              className={cn(
                "text-foreground/40 text-xs sm:text-sm mb-8 sm:mb-10 leading-relaxed transition-all duration-700 delay-400 mx-auto lg:mx-0",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              Каждая модель разрабатывается с учетом эргономики и многочасовых 
              игровых сессий. Мы используем только премиальные материалы: 
              натуральную кожу, алькантару и карбоновые вставки.
            </p>

            {/* Features list */}
            <div className="space-y-3 sm:space-y-4 mb-8 sm:mb-10">
              {[
                "Собственное производство",
                "Контроль качества на каждом этапе",
                "Индивидуальная настройка под заказ",
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className={cn(
                    "flex items-center gap-4 transition-all duration-700 justify-center lg:justify-start",
                    isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                  )}
                  style={{
                    transitionDelay: `${450 + index * 100}ms`,
                  }}
                >
                  <span className="w-1 h-1 rounded-full bg-foreground/30" />
                  <span className="text-foreground/60 text-[13px] sm:text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <a
              href="#catalog"
              className={cn(
                "group inline-flex items-center gap-2 text-xs sm:text-sm uppercase tracking-[0.15em] text-foreground/50 hover:text-foreground transition-all duration-700 delay-500",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              Узнать больше
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
