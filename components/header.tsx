"use client";

import Link from "next/link";
import { MobileMenu } from "./mobile-menu";
import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { CartDrawer } from "@/components/cart-drawer";
import { useCart } from "@/components/cart-context";
import { usePathname, useRouter } from "next/navigation";

export const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const { totalItems, setPurchaseOpen } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === "/" || pathname === "";

  useEffect(() => {
    const handleScroll = () => {
      if (window.innerWidth < 640) {
        setScrolled(true);
        return;
      }
      setScrolled(window.scrollY > 50);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const handleOrderClick = () => {
    if (totalItems === 0) {
      if (isHome) {
        const catalogSection = document.getElementById("catalog");
        if (catalogSection) {
          catalogSection.scrollIntoView({ behavior: "smooth", block: "start" });
          window.history.replaceState(null, "", "#catalog");
        } else {
          window.location.hash = "#catalog";
        }
      } else {
        router.push("/#catalog");
      }
      return;
    }
    setPurchaseOpen(true);
  };

  const navItems = useMemo(
    () => [
      { label: "Каталог", href: isHome ? "#catalog" : "/#catalog" },
      { label: "Конфигуратор", href: isHome ? "#configurator" : "/#configurator" },
      { label: "О бренде", href: isHome ? "#about" : "/#about" },
    ],
    [isHome]
  );

  return (
    <div
      className={cn(
        "fixed z-50 left-0 w-full transition-all duration-500 ease-out",
        scrolled 
          ? "top-4 px-4" 
          : "top-0 py-6 md:py-8"
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between container transition-all duration-500",
          scrolled ? "glass-strong rounded-2xl py-4 shadow-glass" : ""
        )}
      >
        <Link href="/" className="flex items-center gap-3 group">
          {/* M Stripe Logo Mark */}
          <div className="flex h-6 w-1 overflow-hidden rounded-full">
            
            
            
          </div>
          <span className="text-lg sm:text-xl md:text-2xl font-display font-medium tracking-[0.12em] sm:tracking-[0.15em] uppercase">
            {"Prime Performance"}
          </span>
        </Link>
        <nav className="flex max-lg:hidden absolute left-1/2 -translate-x-1/2 items-center justify-center gap-x-10">
          {navItems.map((item) => (
            <Link
              className="uppercase inline-block text-xs tracking-[0.15em] text-foreground/50 hover:text-foreground duration-300 transition-colors ease-out"
              href={item.href}
              key={item.label}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <a
            href="tel:+79250630550"
            className="hidden md:inline-flex items-center text-[11px] uppercase tracking-[0.18em] text-foreground/60 hover:text-foreground transition-colors"
          >
            +7 (925) 063-05-50
          </a>
          <CartDrawer />
          <button
            type="button"
            onClick={handleOrderClick}
            className="max-lg:hidden inline-flex items-center justify-center px-6 py-2.5 border border-foreground/20 text-foreground text-xs uppercase tracking-[0.15em] rounded-full hover:bg-foreground hover:text-background transition-all duration-300"
          >
            Заказать
          </button>
          <MobileMenu />
        </div>
      </header>
    </div>
  );
};
