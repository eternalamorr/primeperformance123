"use client";

import React from "react";
import { Phone, ShoppingCart, Minus, Plus, Trash2, X } from "lucide-react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { formatPrice, useCart } from "@/components/cart-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import Image from "next/image";
import { TurnstileWidget } from "@/components/turnstile";
import { useTurnstileSiteKey } from "@/hooks/use-turnstile-site-key";

export function CartDrawer() {
  const {
    items,
    totalItems,
    totalPrice,
    updateQuantity,
    removeItem,
    clear,
    isOpen,
    setOpen,
    isPurchaseOpen,
    setPurchaseOpen,
  } = useCart();
  const hasItems = items.length > 0;
  const [purchaseName, setPurchaseName] = React.useState("");
  const [purchasePhone, setPurchasePhone] = React.useState("");
  const [purchaseSubmitted, setPurchaseSubmitted] = React.useState(false);
  const [purchaseErrors, setPurchaseErrors] = React.useState<{ name?: string; phone?: string; consent?: string }>({});
  const [purchaseLoading, setPurchaseLoading] = React.useState(false);
  const [purchaseError, setPurchaseError] = React.useState("");
  const [turnstileToken, setTurnstileToken] = React.useState("");
  const [honeypot, setHoneypot] = React.useState("");
  const [purchaseConsent, setPurchaseConsent] = React.useState(false);
  const previousPurchaseOpen = React.useRef(false);
  const turnstileSiteKey = useTurnstileSiteKey();

  React.useEffect(() => {
    if (isPurchaseOpen && !previousPurchaseOpen.current) {
      setPurchaseName("");
      setPurchasePhone("");
      setPurchaseSubmitted(false);
      setPurchaseErrors({});
      setPurchaseError("");
      setPurchaseLoading(false);
      setTurnstileToken("");
      setHoneypot("");
      setPurchaseConsent(false);
    }
    previousPurchaseOpen.current = isPurchaseOpen;
  }, [isPurchaseOpen]);

  const normalizePhoneDigits = (value: string) => {
    const digits = value.replace(/\D/g, "");
    if (!digits) return "";
    let normalized = digits;
    if (digits[0] === "8") normalized = "7" + digits.slice(1);
    if (normalized[0] !== "7") normalized = "7" + normalized;
    return normalized.slice(0, 11);
  };

  const formatPhone = (value: string) => {
    const digits = normalizePhoneDigits(value);
    if (!digits) return "";
    const rest = digits.slice(1);
    let formatted = "+7";
    if (rest.length > 0) formatted += ` (${rest.slice(0, 3)}`;
    if (rest.length >= 3) formatted += ")";
    if (rest.length > 3) formatted += ` ${rest.slice(3, 6)}`;
    if (rest.length > 6) formatted += `-${rest.slice(6, 8)}`;
    if (rest.length > 8) formatted += `-${rest.slice(8, 10)}`;
    return formatted;
  };

  const phoneDigits = React.useMemo(
    () => normalizePhoneDigits(purchasePhone),
    [purchasePhone]
  );

  const submitOrder = async () => {
    setPurchaseError("");
    if (!turnstileToken) {
      setPurchaseError("Подтвердите, что вы не робот.");
      return;
    }

    setPurchaseLoading(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "cart",
          customer: { name: purchaseName.trim(), phone: purchasePhone.trim() },
          consent: purchaseConsent,
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            color: item.color,
            extras: item.extras,
          })),
          turnstileToken,
          honeypot,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Не удалось отправить заявку.");
      }

      setPurchaseSubmitted(true);
      clear();
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "Ошибка отправки.");
    } finally {
      setPurchaseLoading(false);
    }
  };

  return (
    <>
      <Drawer open={isOpen} onOpenChange={setOpen} direction="right">
      <DrawerTrigger asChild>
        <button
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-foreground/20 text-foreground/60 transition-all duration-300 hover:border-foreground/40 hover:text-foreground"
          aria-label="Корзина"
        >
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 rounded-full bg-foreground px-1 text-[10px] font-medium text-background">
              {totalItems}
            </span>
          )}
        </button>
      </DrawerTrigger>
      <DrawerContent className="bg-background/95 backdrop-blur-xl border-foreground/10">
        <DrawerHeader className="border-b border-foreground/10 px-6">
          <div className="flex items-start justify-between">
            <div>
              <DrawerTitle className="text-xs uppercase tracking-[0.25em] text-foreground/70">
                Корзина
              </DrawerTitle>
              <DrawerDescription className="text-foreground/40 text-xs">
                {hasItems ? `Товаров: ${totalItems}` : "Корзина пока пуста"}
              </DrawerDescription>
            </div>
            <DrawerClose asChild>
              <button className="h-9 w-9 rounded-full border border-foreground/10 text-foreground/50 transition-all duration-300 hover:border-foreground/30 hover:text-foreground">
                <X className="h-4 w-4 m-auto" />
              </button>
            </DrawerClose>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!hasItems && (
            <div className="py-16 text-center text-sm text-foreground/40">
              Добавьте товары из каталога, чтобы оформить заказ.
            </div>
          )}
          {hasItems && (
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.variantKey} className="flex gap-4 border-b border-foreground/10 pb-4">
                  <div className="h-16 w-16 shrink-0 rounded-lg bg-foreground/5 p-2">
                    <Image
                      src={item.image || "/placeholder.svg"}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="h-full w-full object-contain"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-foreground/40">{item.price} RUB</p>
                      </div>
                      <button
                        onClick={() => removeItem(item.variantKey)}
                        className="text-foreground/40 transition-all duration-300 hover:text-foreground"
                        aria-label="Удалить товар"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {(item.color || (item.extras && item.extras.length > 0)) && (
                      <div className="text-[11px] text-foreground/40">
                        {item.color && <span>Цвет: {item.color}</span>}
                        {item.extras && item.extras.length > 0 && (
                          <span>
                            {item.color ? " · " : ""}
                            Доп. опции: {item.extras.join(", ")}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-full border border-foreground/15">
                        <button
                          onClick={() => updateQuantity(item.variantKey, item.quantity - 1)}
                          className="h-8 w-8 text-foreground/60 transition-all duration-300 hover:text-foreground"
                          aria-label="Уменьшить количество"
                        >
                          <Minus className="h-4 w-4 m-auto" />
                        </button>
                        <span className="min-w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantKey, item.quantity + 1)}
                          className="h-8 w-8 text-foreground/60 transition-all duration-300 hover:text-foreground"
                          aria-label="Увеличить количество"
                        >
                          <Plus className="h-4 w-4 m-auto" />
                        </button>
                      </div>
                      <span className="text-xs text-foreground/40">
                        {formatPrice(item.quantity * Number(item.price.replace(/[^\d]/g, "")))} RUB
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DrawerFooter className="border-t border-foreground/10 px-6">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/60">Итого</span>
            <span className="text-lg font-medium">{formatPrice(totalPrice)} RUB</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={clear}
              disabled={!hasItems}
              className={cn(
                "flex-1 rounded-full border border-foreground/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-foreground/60 transition-all duration-300",
                hasItems
                  ? "hover:border-foreground/40 hover:text-foreground"
                  : "cursor-not-allowed opacity-40"
              )}
            >
              Очистить
            </button>
            <button
              disabled={!hasItems}
              className={cn(
                "flex-1 rounded-full bg-foreground px-4 py-2 text-xs uppercase tracking-[0.2em] text-background transition-all duration-300",
                hasItems ? "hover:bg-foreground/90" : "cursor-not-allowed opacity-40"
              )}
              onClick={() => {
                if (!hasItems) return;
                setPurchaseSubmitted(false);
                setPurchaseErrors({});
                setPurchaseOpen(true);
              }}
            >
              Приобрести
            </button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>

    <Dialog open={isPurchaseOpen} onOpenChange={setPurchaseOpen}>
      <DialogContent className="!w-[96vw] !max-w-[1280px] sm:!max-w-[1280px] min-h-[480px] sm:min-h-[560px] md:min-h-[640px] !p-6 sm:!p-10 md:!p-12 border-foreground/10 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/40">
        <div className="grid gap-12 lg:grid-cols-2 items-stretch">
          {!purchaseSubmitted ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const errors: { name?: string; phone?: string; consent?: string } = {};
                const nameOk = /^[A-Za-zА-Яа-яЁё\s-]{2,}$/.test(purchaseName.trim());
                if (!nameOk) {
                  errors.name = "Укажите имя и фамилию";
                }
                if (phoneDigits.length !== 11) {
                  errors.phone = "Введите телефон в формате +7 (___) ___-__-__";
                }
                if (!purchaseConsent) {
                  errors.consent = "Нужно согласие на обработку персональных данных";
                }
                setPurchaseErrors(errors);
                if (Object.keys(errors).length === 0) {
                  submitOrder();
                }
              }}
              className="grid h-full grid-rows-[auto_1fr_auto] gap-6 pt-8 md:pt-12"
            >
              <div className="space-y-2">
                <DialogTitle className="text-3xl font-display font-light">
                  Оформление заказа
                </DialogTitle>
                <DialogDescription className="text-foreground/50 text-base leading-[2.8]">
                  Заполните данные, и менеджер свяжется с вами для подтверждения заказа.
                </DialogDescription>
              </div>
                <div className="grid content-start gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="cart-purchase-name" className="text-foreground/70">
                      Имя и фамилия
                    </Label>
                  <Input
                    id="cart-purchase-name"
                    value={purchaseName}
                    onChange={(event) => setPurchaseName(event.target.value)}
                    placeholder="Иван Иванов"
                    className="h-12 bg-foreground/[0.03] border-foreground/10 text-base"
                    aria-invalid={Boolean(purchaseErrors.name)}
                  />
                  {purchaseErrors.name && (
                    <p className="text-xs text-m-red">{purchaseErrors.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cart-purchase-phone" className="text-foreground/70">
                    Телефон
                  </Label>
                  <Input
                    id="cart-purchase-phone"
                    value={purchasePhone}
                    onChange={(event) => setPurchasePhone(formatPhone(event.target.value))}
                    placeholder="+7 (925) 063-05-50"
                    className="h-12 bg-foreground/[0.03] border-foreground/10 text-base"
                    aria-invalid={Boolean(purchaseErrors.phone)}
                    inputMode="tel"
                  />
                  {purchaseErrors.phone && (
                    <p className="text-xs text-m-red">{purchaseErrors.phone}</p>
                  )}
                </div>
                <input
                  type="text"
                  value={honeypot}
                  onChange={(event) => setHoneypot(event.target.value)}
                  className="hidden"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
                <div className="space-y-2">
                  <Label className="text-foreground/70">Проверка</Label>
                  {turnstileSiteKey ? (
                    <TurnstileWidget
                      key={purchaseSubmitted ? "submitted" : "active"}
                      siteKey={turnstileSiteKey}
                      onVerify={setTurnstileToken}
                      onUnavailable={() =>
                        setPurchaseError("Сервис проверки временно недоступен. Попробуйте чуть позже.")
                      }
                    />
                  ) : (
                    <p className="text-xs text-m-red">
                      Не задан ключ Turnstile.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="cart-purchase-consent"
                      checked={purchaseConsent}
                      onCheckedChange={(checked) => setPurchaseConsent(checked === true)}
                      className="mt-1"
                    />
                    <Label htmlFor="cart-purchase-consent" className="text-foreground/60 leading-relaxed">
                      Я согласен(а) на обработку персональных данных и принимаю{" "}
                      <Link
                        href="/privacy"
                        className="text-foreground underline underline-offset-4 hover:text-foreground/80"
                      >
                        политику конфиденциальности
                      </Link>
                      .
                    </Label>
                  </div>
                  {purchaseErrors.consent && (
                    <p className="text-xs text-m-red">{purchaseErrors.consent}</p>
                  )}
                </div>
                {purchaseError && (
                  <p className="text-xs text-m-red">{purchaseError}</p>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="submit"
                  disabled={purchaseLoading}
                  className={cn(
                    "flex-1 inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3.5 text-sm uppercase tracking-[0.25em] text-background transition-all duration-300",
                    purchaseLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-foreground/90"
                  )}
                >
                  {purchaseLoading ? "Отправка..." : "Подтвердить"}
              </button>
              <button
                type="button"
                onClick={() => setPurchaseOpen(false)}
                className="flex-1 inline-flex items-center justify-center rounded-full border border-foreground/20 px-6 py-3.5 text-sm uppercase tracking-[0.25em] text-foreground/60 transition-all duration-300 hover:border-foreground/40 hover:text-foreground"
              >
                Отмена
              </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5 text-center md:text-left">
              <DialogTitle className="text-3xl font-display font-light">
                Спасибо за заявку
              </DialogTitle>
              <DialogDescription className="text-foreground/60 text-base">
                Мы получили ваш запрос. Менеджер свяжется с вами для составления заказа.
              </DialogDescription>
              <button
                onClick={() => setPurchaseOpen(false)}
                className="inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3.5 text-sm uppercase tracking-[0.25em] text-background transition-all duration-300 hover:bg-foreground/90"
              >
                Готово
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-12 grid h-full grid-rows-[auto_1fr_auto] gap-6">
            <h4 className="text-2xl font-medium text-foreground">
              Либо свяжитесь с нами для заказа
            </h4>
            <div className="grid content-start gap-4 text-base text-foreground/55">
              <p className="leading-relaxed">
                Ответим быстро и поможем оформить заказ в удобном мессенджере.
              </p>
              <div className="grid gap-3 text-sm text-foreground/50">
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-10 rounded-full bg-foreground/20" />
                  Согласуем детали заказа
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-10 rounded-full bg-foreground/20" />
                  Подберем материалы и цвет
                </div>
                <div className="flex items-center gap-3">
                  <span className="h-1.5 w-10 rounded-full bg-foreground/20" />
                  Закрепим удобный способ связи
                </div>
              </div>
            </div>
            <div className="flex flex-wrap md:flex-nowrap items-center gap-2.5">
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-3.5 py-2.5 text-xs uppercase tracking-[0.1em] text-foreground/70 transition-all duration-300 hover:border-foreground/40 hover:text-foreground whitespace-nowrap"
              >
                <TelegramIcon className="h-4 w-4" />
                Telegram
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-full border border-foreground/15 px-3.5 py-2.5 text-xs uppercase tracking-[0.1em] text-foreground/70 transition-all duration-300 hover:border-foreground/40 hover:text-foreground whitespace-nowrap"
              >
                <WhatsAppIcon className="h-4 w-4" />
                WhatsApp
              </a>
              <a
                href="tel:+79250630550"
                className="md:ml-auto flex items-center gap-2 text-[13px] text-foreground/60 whitespace-nowrap hover:text-foreground transition-colors duration-300"
              >
                <Phone className="h-4 w-4 text-foreground/40" />
                +7 (925) 063-05-50
              </a>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
