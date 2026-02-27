import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Офисное кресло BMW",
  description:
    "Премиальные офисные кресла в стиле BMW M‑серии: эргономика, статусный дизайн и комфорт для долгой работы.",
  alternates: {
    canonical: "/office-chair-bmw",
  },
};

export default function OfficeChairBmwPage() {
  return (
    <main className="min-h-screen bg-background text-foreground pt-28 pb-20">
      <div className="container max-w-4xl space-y-10">
        <header className="space-y-4">
          <p className="text-[10px] uppercase tracking-[0.35em] text-foreground/40">
            Коллекция
          </p>
          <h1 className="text-3xl md:text-4xl font-display font-light tracking-tight">
            Офисное кресло BMW
          </h1>
          <p className="text-sm text-foreground/60 leading-relaxed">
            Prime performance — это премиальные офисные кресла в стиле BMW M‑серии. Мы сочетали
            выразительный дизайн, эргономику и материалы бизнес‑класса, чтобы создать рабочее кресло,
            которое подчёркивает статус и обеспечивает комфорт весь день.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg text-foreground">Почему выбирают стиль BMW</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            Форма спинки повторяет спортивный характер автомобильных сидений, а посадка рассчитана на
            длительную работу. Это идеальное решение для кабинета руководителя, переговорных комнат и
            премиальных офисов.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg text-foreground">Ключевые преимущества</h2>
          <ul className="list-disc pl-5 text-sm text-foreground/70 leading-relaxed">
            <li>Премиальная отделка и выразительный силуэт.</li>
            <li>Эргономичная форма для долгих рабочих сессий.</li>
            <li>Статусный дизайн, усиливающий впечатление от офиса.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg text-foreground">Посмотреть модели</h2>
          <p className="text-sm text-foreground/70 leading-relaxed">
            В каталоге представлены линейки BMW M5, M4 и M8 — каждая с уникальным характером и цветовой
            конфигурацией.
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
