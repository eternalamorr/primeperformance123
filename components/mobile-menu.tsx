"use client";

import { cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";

interface MobileMenuProps {
  className?: string;
}

export const MobileMenu = ({ className }: MobileMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";

  const menuItems = useMemo(
    () => [
      { name: "Каталог", href: isHome ? "#catalog" : "/#catalog" },
      { name: "Конфигуратор", href: isHome ? "#configurator" : "/#configurator" },
      { name: "О бренде", href: isHome ? "#about" : "/#about" },
    ],
    [isHome]
  );

  const handleLinkClick = () => {
    setIsOpen(false);
  };

  return (
    <Dialog.Root modal={false} open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className={cn(
            "group lg:hidden p-1.5 sm:p-2 text-foreground transition-colors",
            className
          )}
          aria-label="Open menu"
        >
          <Menu className="group-[[data-state=open]]:hidden" size={24} />
          <X className="hidden group-[[data-state=open]]:block" size={24} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal forceMount>
        <div
          data-overlay="true"
          className={cn(
            "fixed z-30 inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        />

        <Dialog.Content
          forceMount
          onInteractOutside={(e) => {
            if (
              e.target instanceof HTMLElement &&
              e.target.dataset.overlay !== "true"
            ) {
              e.preventDefault();
            }
          }}
          className={cn(
            "fixed inset-0 z-40 flex items-center justify-center px-6 transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          )}
        >
          <Dialog.Title className="sr-only">Menu</Dialog.Title>
          <Dialog.Description className="sr-only">
            Основные разделы и быстрый доступ к заказу.
          </Dialog.Description>

          <div
            className={cn(
              "w-full max-w-[420px] rounded-3xl border border-foreground/10 bg-background/80 backdrop-blur-xl p-8 transition-all duration-300",
              isOpen ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-4 scale-[0.98] pointer-events-none"
            )}
          >
            <nav className="flex flex-col items-center space-y-5 text-center">
              {menuItems.map((item, index) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={handleLinkClick}
                  className={cn(
                    "text-base font-display font-light uppercase tracking-[0.18em] text-foreground/70 transition-all ease-out duration-300 hover:text-foreground py-1",
                    isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )}
                  style={{ transitionDelay: `${index * 60}ms` }}
                >
                  {item.name}
                </Link>
              ))}

              <div className="mt-4">
                <Link
                  href={isHome ? "#catalog" : "/#catalog"}
                  onClick={handleLinkClick}
                  className={cn(
                    "inline-flex items-center justify-center px-8 py-3 bg-foreground text-background text-[11px] uppercase tracking-[0.2em] rounded-full hover:bg-foreground/90 transition-all duration-300",
                    isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  )}
                  style={{ transitionDelay: `${menuItems.length * 60}ms` }}
                >
                  Заказать
                </Link>
              </div>
            </nav>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
