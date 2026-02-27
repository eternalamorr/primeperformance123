"use client";

import React from "react";
import { Gem, Layers, ShieldCheck, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const features = [
  {
    title: "Надёжность, проверенная инженерией",
    description:
      "Конструкция кресел основана на усиленном каркасе и прецизионных механизмах, рассчитанных на ежедневную интенсивную нагрузку. Каждая деталь работает на долговечность, стабильность и безупречную посадку - это инвестиция в комфорт, фокус и продуктивность.",
    icon: ShieldCheck,
  },
  {
    title: "Выразительная отделка с характером",
    description:
      "В основе дизайна — тщательно подобранные материалы и детальная проработка каждой поверхности. Фирменная строчка, аккуратная 3D-вышивка и премиальные фактуры формируют цельный образ, который одинаково органично смотрится и в офисе, и в рабочем пространстве высокого уровня.",
    icon: Gem,
  },
  {
    title: "Продуманная конструкция для ежедневной нагрузки",
    description:
      "Основу кресел составляет прочная рама и надёжные механизмы, спроектированные для стабильной работы изо дня в день. Такой подход обеспечивает долгий срок службы, высокий уровень комфорта и уверенность в результате.",
    icon: Wrench,
  },
  {
    title: "Индивидуальная сборка через конфигуратор",
    description:
      "Наш конфигуратор позволяет собрать кресло под ваши параметры: рост, вес и предпочтительный уровень жёсткости. Вы выбираете цвет, материалы и дополнительные функции, а конструкция настраивается так, чтобы обеспечить стабильность, комфорт и точное соответствие вашим задачам.",
    icon: Layers,
  },
];

export function FeaturesSection() {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute("data-index"));
            if (!visibleItems.includes(index)) {
              setVisibleItems((prev) => [...prev, index]);
            }
          }
        });
      },
      { threshold: 0.2 }
    );

    const items = sectionRef.current?.querySelectorAll("[data-index]");
    items?.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [visibleItems]);

  return (
    <section id="features" ref={sectionRef} className="relative z-10 py-16 sm:py-24 md:py-40">
      {/* Subtle section dividers */}
      <div className="absolute inset-x-0 top-0 h-px bg-foreground/10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-foreground/10 pointer-events-none" />
      
      <div className="container relative">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="w-12 h-px bg-foreground/20" />
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-foreground/40">Преимущества</span>
            <span className="w-12 h-px bg-foreground/20" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-light tracking-tight mb-5 sm:mb-6">
            Почему PRIME PERFORMANCE  
          </h2>
          <p className="text-foreground/40 max-w-md mx-auto text-sm leading-relaxed">
            Мы создаем кресла для тех, кто не идет на компромиссы
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10">
          {features.map((feature, index) => (
            <div
              key={index}
              data-index={index}
              className={cn(
                "group relative glass-card rounded-2xl p-6 sm:p-10 md:p-12 min-h-[260px] sm:min-h-[340px] md:min-h-[380px] transition-all duration-700 text-center sm:text-left",
                "hover:bg-foreground/[0.04]",
                visibleItems.includes(index)
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-12"
              )}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {/* Shimmer on hover */}
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

              <div className="relative z-10 flex h-full flex-col">
                <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 sm:gap-6 mb-6">
                  <h3 className="text-lg sm:text-xl md:text-2xl font-medium tracking-tight">
                    {feature.title}
                  </h3>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-foreground/5 flex items-center justify-center border border-foreground/10">
                    <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-foreground/60" />
                  </div>
                </div>
                <div className="h-px w-16 bg-foreground/20 mb-6 mx-auto sm:mx-0" />
                <p className="text-foreground/45 text-sm sm:text-base md:text-lg leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
