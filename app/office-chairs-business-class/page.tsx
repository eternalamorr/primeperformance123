import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Офисные кресла бизнес‑класса",
  description:
    "Офисные кресла бизнес‑класса: эргономика, премиальные материалы и статусный дизайн для руководителей.",
  alternates: {
    canonical: "/office-chairs-business-class",
  },
};

export default function OfficeChairsBusinessClassPage() {
  return (
    <main className="min-h-screen bg-background text-foreground pt-28 pb-20">
      <div className="container max-w-4xl space-y-10">
        <header className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.35em] text-foreground/40">
            Бизнес‑класс
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-light tracking-tight">
            Офисные кресла бизнес‑класса
          </h1>
          <p className="text-sm text-foreground/60 leading-relaxed">
            Премиальные офисные кресла для руководителей и специалистов, которые ценят комфорт, статус и
            продуманный дизайн. Подойдут для кабинетов, переговорных и представительских зон.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg text-foreground">Что отличает бизнес‑класс</h2>
          <ul className="list-disc pl-5 text-sm text-foreground/70 leading-relaxed">
            <li>Материалы повышенной износостойкости.</li>
            <li>Эргономичная посадка и поддержка спины.</li>
            <li>Визуальная выразительность и статусный образ.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg text-foreground">Выбрать модель</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            В каталоге представлены кресла в стиле BMW M‑серии и классические варианты. Подберите решение
            под интерьер и задачи вашего офиса.
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
