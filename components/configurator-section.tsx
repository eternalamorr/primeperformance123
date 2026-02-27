"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { ConfiguratorModal } from "./configurator-modal";
import { Palette, Layers, Sparkles, Settings2 } from "lucide-react";

const configOptions = [
  {
    id: "base",
    icon: Settings2,
    title: "Основа кресла",
    description: "Выберите базу / марку",
    options: ["BMW M4", "BMW M5", "BMW M8", "BMW M3", "Своя марка"],
  },
  {
    id: "color",
    icon: Palette,
    title: "Цвет",
    description: "Выберите основной цвет",
    options: ["Черный", "Белый", "Красный", "Черно-белый", "Черно-красный", "Черно-оранжевый", "Оранжевый", "Коричневый", "Серый", "Свой цвет"],
  },
  {
    id: "extras",
    icon: Sparkles,
    title: "Доп. опции",
    description: "Функции комфорта",
    options: ["Массаж", "Вентиляция", "Подогрев"],
  },
  {
    id: "custom",
    icon: Layers,
    title: "Кастомизация",
    description: "Персональные детали",
    options: ["Индивидуальная надпись", "Спинка из карбона", "Спинка из алькантары"],
  },
];

export function ConfiguratorSection() {
  const [activeOption, setActiveOption] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openConfiguratorModal = () => {
    const section = document.getElementById("configurator");
    if (section) {
      const rect = section.getBoundingClientRect();
      const needsScroll = rect.top < -24 || rect.top > 24;
      if (needsScroll) {
        const targetTop = window.scrollY + rect.top;
        window.scrollTo({ top: targetTop, behavior: "smooth" });
        window.setTimeout(() => setIsModalOpen(true), 450);
        return;
      }
    }
    setIsModalOpen(true);
  };

  return (
    <section id="configurator" className="relative z-10 py-16 sm:py-24 md:py-40 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-m-blue/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-m-red/5 rounded-full blur-3xl" />
      </div>

      <div className="container relative">
        <div className="grid lg:grid-cols-2 gap-10 sm:gap-16 lg:gap-24 items-center">
          {/* Left side - Info */}
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-4 mb-6">
              <div className="flex h-1 w-12 rounded-full overflow-hidden">
                
                
                
              </div>
              
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-light tracking-tight mb-6 sm:mb-8">
              Создайте своё
              <br />
              <span className="font-medium">уникальное</span> кресло
            </h2>

            <p className="text-foreground/40 max-w-md text-sm leading-relaxed mb-8 sm:mb-10 mx-auto sm:mx-0">
              Конфигуратор PRIME PERFORMANCE позволит вам собрать кресло мечты. 
              Выберите цвет, материал, дополнительные опции и создайте 
              идеальное рабочее место.
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-6 mb-10 sm:mb-12">
              <button
                onClick={openConfiguratorModal}
                className="group inline-flex items-center justify-center gap-3 px-6 py-3 bg-foreground text-background text-xs uppercase tracking-[0.2em] rounded-full hover:bg-foreground/90 transition-all duration-300 w-full sm:w-auto"
              >
                В конфигуратор  
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-6 sm:pt-8 border-t border-foreground/10 text-center sm:text-left">
              {[
                { value: "50+", label: "Вариантов цвета" },
                { value: "12", label: "Типов материала" },
                { value: "∞", label: "Комбинаций" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-xl sm:text-2xl md:text-3xl font-light tracking-tight mb-1">{stat.value}</div>
                  <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-foreground/30">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side - Interactive preview */}
          <div className="relative hidden sm:block">
            {/* Config options grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {configOptions.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    "group rounded-2xl p-4 sm:p-6 cursor-pointer transition-all duration-500 border border-foreground/10",
                    "bg-background/80 backdrop-blur-md",
                    hoveredCard === option.id && "bg-foreground/[0.08] border-foreground/20"
                  )}
                  onMouseEnter={() => setHoveredCard(option.id)}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={() => setActiveOption(activeOption === option.id ? null : option.id)}
                >
                  <option.icon className={cn(
                    "w-5 h-5 sm:w-6 sm:h-6 mb-3 sm:mb-4 transition-colors duration-300",
                    hoveredCard === option.id ? "text-foreground" : "text-foreground/50"
                  )} />
                  
                  <h3 className="text-sm font-medium tracking-tight mb-1">{option.title}</h3>
                  <p className="text-foreground/50 text-[11px] sm:text-xs mb-3 sm:mb-4">{option.description}</p>

                  {/* Options preview */}
                  <div className={cn(
                    "space-y-2 overflow-hidden transition-all duration-500",
                    activeOption === option.id ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                  )}>
                    {option.options.map((opt) => (
                      <div
                        key={opt}
                        className="flex items-center gap-2 text-[11px] sm:text-xs text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
                      >
                        <span className="w-1 h-1 rounded-full bg-foreground/40" />
                        {opt}
                      </div>
                    ))}
                  </div>

                  {/* Expand indicator */}
                  <div className={cn(
                    "flex items-center gap-2 mt-3 sm:mt-4 text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-foreground/30 group-hover:text-foreground/50 transition-colors",
                    activeOption === option.id && "hidden"
                  )}>
                    <span className="w-4 h-px bg-current" />
                    Показать
                  </div>
                </div>
              ))}
            </div>


          </div>
        </div>
      </div>

      {/* Configurator Modal */}
      <ConfiguratorModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </section>
  );
}
