"use client";

import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import { usePathname } from "next/navigation";
import { COMPANY } from "@/lib/company";

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

function VKIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle
        cx="12"
        cy="12"
        r="4.2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export function Footer() {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";
  const withHome = (hash: string) => (isHome ? hash : `/${hash}`);

  return (
    <footer id="footer" className="relative z-10 mt-0">
      <div className="relative container">
        <div className="border-t border-foreground/10 pt-12 sm:pt-14 pb-12 sm:pb-14">
          {/* Mobile footer */}
          <div className="sm:hidden">
            <div className="rounded-[28px] border border-foreground/10 bg-white/[0.03] p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <Link href="/" className="inline-flex items-center gap-3">
                  <div className="flex h-5 w-1 overflow-hidden rounded-full">
                    <div className="w-full h-1/3 bg-m-blue" />
                    <div className="w-full h-1/3 bg-m-red" />
                    <div className="w-full h-1/3 bg-m-purple" />
                  </div>
                  <span className="text-sm font-display font-medium tracking-[0.22em] uppercase">
                    prime performance
                  </span>
                </Link>
                <div className="flex gap-2">
                  {[
                    { name: "Telegram", icon: TelegramIcon, href: "https://t.me/prime_performance_ru" },
                    { name: "Instagram", icon: VKIcon, href: "https://www.instagram.com/prime_perfomance_seat?igsh=MWowbTMzZTVseTJ4cw%3D%3D&utm_source=qr" },
                    { name: "WhatsApp", icon: WhatsAppIcon, href: "https://wa.me/message/FDRLCZAXDD6CM1" },
                  ].map(({ name, icon: Icon, href }) => (
                    <a
                      key={name}
                      href={href}
                      className="w-8 h-8 rounded-full border border-foreground/15 flex items-center justify-center text-foreground/40 hover:text-foreground hover:border-foreground/30 transition-all duration-300"
                      aria-label={name}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-foreground/55 text-[12px] leading-relaxed">
                Премиальные кресла, вдохновленные эстетикой спорткаров. Для тех, кто не идет на компромиссы.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 text-[12px] text-foreground/60">
                {[
                  { label: "Каталог", href: withHome("#catalog") },
                  { label: "Конфигуратор", href: withHome("#configurator") },
                  { label: "О бренде", href: withHome("#about") },
                ].map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-full border border-foreground/10 px-3 py-2 text-center hover:text-foreground hover:border-foreground/30 transition-colors duration-300"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="sr-only" aria-label="SEO links">
                {[
                  { label: "Офисное кресло BMW", href: "/office-chair-bmw" },
                  { label: "BMW M5 F90", href: "/bmw-m5-f90" },
                  { label: "Кресла бизнес‑класса", href: "/office-chairs-business-class" },
                ].map((item) => (
                  <Link key={item.label} href={item.href}>
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 text-[12px] text-foreground/60">
                <a
                  href={`tel:${COMPANY.phoneHref}`}
                  className="inline-flex items-center gap-2 hover:text-foreground transition-colors duration-300"
                >
                  <Phone className="h-4 w-4 text-foreground/40" />
                  <span>{COMPANY.phoneDisplay}</span>
                </a>
                <a
                  href={`mailto:${COMPANY.email}`}
                  className="inline-flex items-center gap-2 hover:text-foreground transition-colors duration-300"
                >
                  <Mail className="h-4 w-4 text-foreground/40" />
                  <span>{COMPANY.email}</span>
                </a>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-3 text-[11px] text-foreground/40">
              <p>© 2026 PRIME PERFORMANCE. Все права защищены.</p>
              <p>
                {COMPANY.legalName} · ИНН {COMPANY.inn} · ОГРНИП {COMPANY.ogrnip}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/privacy" className="hover:text-foreground/70 transition-colors duration-300">
                  Политика конфиденциальности
                </Link>
                <Link href="/privacy" className="hover:text-foreground/70 transition-colors duration-300">
                  Условия использования
                </Link>
                <Link href="/privacy" className="hover:text-foreground/70 transition-colors duration-300">
                  Оферта
                </Link>
              </div>
            </div>
          </div>

          {/* Desktop footer */}
          <div className="hidden sm:grid grid-cols-2 lg:grid-cols-[1.35fr_0.8fr_0.9fr_0.9fr] gap-10 lg:gap-12 xl:gap-16 text-left">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-1">
              <Link href="/" className="inline-flex items-center gap-3 mb-6 justify-start w-auto">
                <div className="flex h-5 w-1 overflow-hidden rounded-full">
                  <div className="w-full h-1/3 bg-m-blue" />
                  <div className="w-full h-1/3 bg-m-red" />
                  <div className="w-full h-1/3 bg-m-purple" />
                </div>
                <span className="text-base sm:text-lg font-display font-medium tracking-[0.15em] uppercase">
                  prime performance
                </span>
              </Link>
              <p className="text-foreground/50 text-[12px] sm:text-sm leading-relaxed max-w-sm">
                Премиальные кресла, вдохновленные эстетикой спорткаров. Для тех, кто не идет на компромиссы.
              </p>
            </div>

            {/* Navigation */}
            <div className="sm:col-span-1">
              <h4 className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-foreground/30 mb-6">Навигация</h4>
              <ul className="space-y-2.5 sm:space-y-4">
                {[
                  { label: "Каталог", href: withHome("#catalog") },
                  { label: "Конфигуратор", href: withHome("#configurator") },
                  { label: "О бренде", href: withHome("#about") },
                ].map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-foreground/50 hover:text-foreground transition-colors duration-300 text-[12px] sm:text-sm inline-flex justify-start w-auto"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Popular */}
            <div className="sr-only" aria-label="SEO links">
              <h4>Популярные запросы</h4>
              <ul>
                {[
                  { label: "Офисное кресло BMW", href: "/office-chair-bmw" },
                  { label: "BMW M5 F90", href: "/bmw-m5-f90" },
                  { label: "Бизнес‑класс", href: "/office-chairs-business-class" },
                ].map((item) => (
                  <li key={item.label}>
                    <Link href={item.href}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="sm:col-span-1">
              <h4 className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-foreground/30 mb-6">Контакты</h4>
              <ul className="space-y-2.5 sm:space-y-4 text-[12px] sm:text-sm text-foreground/50">
                <li>
                  <a
                    href={`tel:${COMPANY.phoneHref}`}
                    className="inline-flex items-center gap-2 hover:text-foreground transition-colors duration-300 justify-start w-auto"
                  >
                    <Phone className="h-4 w-4 text-foreground/40" />
                    <span>{COMPANY.phoneDisplay}</span>
                  </a>
                </li>
                <li>
                  <a
                    href={`mailto:${COMPANY.email}`}
                    className="inline-flex items-center gap-2 hover:text-foreground transition-colors duration-300 justify-start w-auto"
                  >
                    <Mail className="h-4 w-4 text-foreground/40" />
                    <span>{COMPANY.email}</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Social */}
            <div className="col-span-2 sm:col-span-2 lg:col-span-1">
              <h4 className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-foreground/30 mb-6">Социальные сети</h4>
              <div className="flex gap-3 justify-start">
                {[
                  { name: "Telegram", icon: TelegramIcon, href: "https://t.me/prime_performance_ru" },
                  { name: "Instagram", icon: VKIcon, href: "https://www.instagram.com/prime_perfomance_seat?igsh=MWowbTMzZTVseTJ4cw%3D%3D&utm_source=qr" },
                  { name: "WhatsApp", icon: WhatsAppIcon, href: "https://wa.me/message/FDRLCZAXDD6CM1" },
                ].map(({ name, icon: Icon, href }) => (
                  <a
                    key={name}
                    href={href}
                    className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-foreground/10 flex items-center justify-center text-foreground/30 hover:text-foreground hover:border-foreground/30 transition-all duration-300"
                    aria-label={name}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="hidden sm:block mt-10 sm:mt-20 pt-8 sm:pt-12 border-t border-foreground/10">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-8 text-left items-start xl:items-center">
              <p className="text-[12px] sm:text-sm text-foreground/40 xl:justify-self-start">
                © 2026 PRIME PERFORMANCE. Все права защищены.
              </p>
              <p className="text-[12px] sm:text-sm text-foreground/40 xl:text-center xl:justify-self-center">
                {COMPANY.legalName} · ИНН {COMPANY.inn} · ОГРНИП {COMPANY.ogrnip}
              </p>
              <div className="w-full xl:w-auto xl:justify-self-end">
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] sm:text-sm text-foreground/40 text-left xl:justify-end">
                  <Link href="/privacy" className="hover:text-foreground/70 transition-colors duration-300">
                    Политика конфиденциальности
                  </Link>
                  <Link href="/privacy" className="hover:text-foreground/70 transition-colors duration-300">
                    Условия использования
                  </Link>
                  <Link href="/privacy" className="hover:text-foreground/70 transition-colors duration-300">
                    Оферта
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
