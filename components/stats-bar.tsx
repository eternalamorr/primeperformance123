"use client";

import { Truck } from "lucide-react";

export function StatsBar() {
  const stats = [
    { key: "rating", value: "5.0", label: "Рейтинг", order: "order-1 sm:order-1" },
    {
      key: "delivery",
      value: (
        <Truck
          className="w-10 h-7 sm:w-12 sm:h-8 scale-x-110 text-foreground/80"
          strokeWidth={1}
          aria-hidden="true"
        />
      ),
      label: "Доставка по всему миру",
      order: "order-3 sm:order-2",
    },
    { key: "support", value: "24/7", label: "Поддержка", order: "order-2 sm:order-3" },
  ];

  return (
    <section className="relative z-10 pt-4 sm:pt-6 pb-0">
      <div className="container">
        <div className="flex flex-wrap justify-center gap-x-10 sm:gap-x-16 gap-y-6 sm:gap-y-8 py-8 sm:py-12 border-y border-foreground/5">
          {stats.map((stat) => (
            <div key={stat.key} className={`text-center ${stat.order}`}>
              <div className="h-9 sm:h-10 md:h-12 mb-2 flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-light tracking-tight leading-none">
                {stat.value}
              </div>
              <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-foreground/30">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
