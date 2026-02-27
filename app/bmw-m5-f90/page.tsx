import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Офисное кресло BMW M5 F90",
  description:
    "Премиальное офисное кресло в стиле BMW M5 F90: выразительная геометрия, эргономика и бизнес‑класс.",
  alternates: {
    canonical: "/bmw-m5-f90",
  },
};

export default function BmwM5F90Page() {
  return (
    <main className="min-h-screen bg-background text-foreground pt-28 pb-20">
      <div className="container max-w-4xl space-y-10">
        <header className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.35em] text-foreground/40">
            Флагман
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-light tracking-tight">
            Офисное кресло BMW M5 F90
          </h1>
          <p className="text-sm text-foreground/60 leading-relaxed">
            Флагманская модель в стиле BMW M5 F90 для руководителей и требовательных профессионалов. Визуально
            мощный силуэт, премиальная посадка и отделка, рассчитанная на ежедневную работу.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg text-foreground">Для кого это решение</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Для тех, кто хочет подчеркнуть статус, создать сильное впечатление и получить комфорт на протяжении
            всего рабочего дня. Идеально подходит для кабинетов руководителей и переговорных комнат.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg text-foreground">Ключевые характеристики</h2>
          <ul className="list-disc pl-5 text-sm text-foreground/70 leading-relaxed">
            <li>Премиальные материалы и точная отделка.</li>
            <li>Поддержка спины для длительной работы.</li>
            <li>Сдержанный, но узнаваемый M‑характер.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg text-foreground">Посмотреть модели</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            В каталоге представлены конфигурации с разными цветами и отделками. Выберите вариант под интерьер.
          </p>
          <Link
            href="/#catalog"
            className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-5 py-2 text-xs uppercase tracking-[0.2em] text-foreground/70 hover:border-foreground/40 hover:text-foreground transition-all duration-300"
          >
            Перейти в каталог
          </Link>
        </section>
      </div>
    </main>
  );
}
