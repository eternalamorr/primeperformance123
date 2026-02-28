"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { Phone, X, Check, ShoppingCart, Share2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/cart-context";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { TurnstileWidget } from "@/components/turnstile";
import { getSiteUrl } from "@/lib/site-url";

const SHOW_COLORS_WITHOUT_PHOTOS = false;

interface Product {
  id: number;
  name: string;
  price: string;
  description: string;
  fullDescription: string;
  features: string[];
  specs: { label: string; value: string }[];
  colors: { name: string; hex: string; splitHex?: [string, string] }[];
  colorGallery?: Record<string, string[]>;
  badge?: string;
  image?: string;
  gallery: string[];
}

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ProductExtra {
  id: string;
  label: string;
  price: number;
}

export function ProductModal({ product, isOpen, onClose }: ProductModalProps) {
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const { addItem, setOpen } = useCart();
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copyState, setCopyState] = useState<"idle" | "success">("idle");
  const [purchaseName, setPurchaseName] = useState("");
  const [purchasePhone, setPurchasePhone] = useState("");
  const [purchaseSubmitted, setPurchaseSubmitted] = useState(false);
  const [purchaseErrors, setPurchaseErrors] = useState<{
    name?: string;
    phone?: string;
    consent?: string;
  }>({});
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [purchaseConsent, setPurchaseConsent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const previousBodyOverflow = useRef("");
  const previousHtmlOverflow = useRef("");
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [extrasOptions, setExtrasOptions] = useState<ProductExtra[]>([
    { id: "massage", label: "Массаж", price: 20000 },
    { id: "ventilation", label: "Вентиляция", price: 20000 },
    { id: "heating", label: "Подогрев", price: 20000 },
  ]);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  const parsePrice = (value: string) => {
    const digits = value.replace(/[^\d]/g, "");
    return digits ? Number(digits) : 0;
  };

  const formatPrice = (value: number) =>
    value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  const handleAddToCart = () => {
    if (!product) return;
    const colorName = availableColors[selectedColor]?.color.name;
    const extrasLabels = extrasOptions
      .filter((extra) => selectedExtras.includes(extra.id))
      .map((extra) => extra.label);
    addItem({ ...product, price: displayPrice, color: colorName, extras: extrasLabels });
    setOpen(true);
  };

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

  const phoneDigits = useMemo(
    () => normalizePhoneDigits(purchasePhone),
    [purchasePhone]
  );

  const submitOrder = async () => {
    if (!product) return;
    setPurchaseError("");
    if (!turnstileToken) {
      setPurchaseError("Подтвердите, что вы не робот.");
      return;
    }

    const colorName = availableColors[selectedColor]?.color.name;
    const extrasLabels = extrasOptions
      .filter((extra) => selectedExtras.includes(extra.id))
      .map((extra) => extra.label);

    setPurchaseLoading(true);
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "product",
          customer: { name: purchaseName.trim(), phone: purchasePhone.trim() },
          consent: purchaseConsent,
          items: [
            {
              id: product.id,
              name: product.name,
              price: displayPrice,
              quantity: 1,
              color: colorName,
              extras: extrasLabels,
            },
          ],
          turnstileToken,
          honeypot,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Не удалось отправить заявку.");
      }

      setPurchaseSubmitted(true);
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "Ошибка отправки.");
    } finally {
      setPurchaseLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      previousBodyOverflow.current = document.body.style.overflow;
      previousHtmlOverflow.current = document.documentElement.style.overflow;
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      // Delay content animation
      setTimeout(() => setIsContentVisible(true), 100);
    } else {
      setIsContentVisible(false);
      document.body.style.overflow = previousBodyOverflow.current;
      document.documentElement.style.overflow = previousHtmlOverflow.current;
      setTimeout(() => setIsVisible(false), 400);
    }

    return () => {
      document.body.style.overflow = previousBodyOverflow.current;
      document.documentElement.style.overflow = previousHtmlOverflow.current;
    };
  }, [isOpen]);

  useEffect(() => {
    if (product) {
      setSelectedColor(0);
      setSelectedImage(0);
      setSelectedExtras([]);
      setPurchaseName("");
      setPurchasePhone("");
      setPurchaseSubmitted(false);
      setPurchaseErrors({});
      setIsPurchaseOpen(false);
      setPurchaseError("");
      setPurchaseLoading(false);
      setPurchaseConsent(false);
      setTurnstileToken("");
      setHoneypot("");
      setIsShareOpen(false);
      setCopyState("idle");
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      setShareUrl(`${getSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)}/product/${product.id}`);
      return;
    }
    if (typeof window === "undefined") return;
    setShareUrl(`${window.location.origin}/product/${product.id}`);
  }, [product]);

  useEffect(() => {
    let active = true;
    const loadExtras = async () => {
      try {
        const response = await fetch("/api/product-extras");
        if (!response.ok) return;
        const data = await response.json();
        if (!active || !Array.isArray(data) || data.length === 0) return;

        const normalized = data
          .filter((item) => typeof item?.id === "string" && typeof item?.label === "string")
          .map((item) => ({
            id: item.id,
            label: item.label,
            price: Number(item.price) || 0,
          }));

        if (normalized.length > 0) {
          setExtrasOptions(normalized);
        }
      } catch {
        // Keep local fallback extras.
      }
    };
    loadExtras();
    return () => {
      active = false;
    };
  }, []);

  const availableColors = useMemo(() => {
    if (!product) return [];
    if (SHOW_COLORS_WITHOUT_PHOTOS || !product.colorGallery) {
      return product.colors.map((color, index) => ({ color, index }));
    }
    const entries = product.colors
      .map((color, index) => ({ color, index }))
      .filter(({ color }) => {
        const images = product.colorGallery?.[color.name];
        return Array.isArray(images) && images.length > 0;
      });
    return entries.length > 0 ? entries : product.colors.map((color, index) => ({ color, index }));
  }, [product]);

  const activeGallery = useMemo(() => {
    if (!product) return [];
    const colorName = availableColors[selectedColor]?.color.name;
    const mapped = colorName ? product.colorGallery?.[colorName] : undefined;
    if (mapped && mapped.length > 0) return mapped;
    return product.gallery;
  }, [product, selectedColor, availableColors]);

  const basePrice = useMemo(() => {
    if (!product) return 0;
    return parsePrice(product.price);
  }, [product]);

  const extrasTotal = useMemo(
    () =>
      extrasOptions.reduce(
        (sum, extra) => (selectedExtras.includes(extra.id) ? sum + extra.price : sum),
        0
      ),
    [extrasOptions, selectedExtras]
  );

  const displayPrice = useMemo(
    () => formatPrice(basePrice + extrasTotal),
    [basePrice, extrasTotal]
  );

  const toggleExtra = (id: string) => {
    setSelectedExtras((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  useEffect(() => {
    setSelectedImage(0);
  }, [selectedColor, product]);

  useEffect(() => {
    if (selectedColor >= availableColors.length) {
      setSelectedColor(0);
    }
  }, [availableColors, selectedColor]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isVisible || !product) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center",
        "transition-all duration-500"
      )}
    >
      {/* Backdrop */}
      <div 
        className={cn(
          "absolute inset-0 bg-background/95 backdrop-blur-xl transition-opacity duration-500",
          isContentVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Modal Content */}
      <div 
        className={cn(
          "relative z-10 w-full max-w-6xl max-h-[90vh] mx-4 overflow-hidden",
          "transition-all duration-700 ease-out",
          isContentVisible 
            ? "opacity-100 scale-100 translate-y-0" 
            : "opacity-0 scale-95 translate-y-8"
        )}
        style={{
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 w-11 h-11 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-foreground/20 transition-all duration-300"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Scrollable content */}
        <div className="overflow-y-auto max-h-[90vh] custom-scrollbar">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 p-6 md:p-10 lg:pr-20">
            {/* Left - Images */}
            <div 
              className={cn(
                "space-y-4 transition-all duration-700 delay-100",
                isContentVisible 
                  ? "opacity-100 translate-x-0" 
                  : "opacity-0 -translate-x-12"
              )}
              style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
              {/* Main Image */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-foreground/[0.03] to-transparent">
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <Image
                    src={activeGallery[selectedImage] || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-contain p-8 drop-shadow-2xl transition-all duration-500"
                    style={{
                      filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.4))",
                    }}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>
                
                {/* Soft glow */}
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-24 opacity-40"
                  style={{
                    background: "radial-gradient(ellipse at center, rgba(255, 40, 71, 0.2) 0%, transparent 70%)",
                    filter: "blur(30px)",
                  }}
                />

                {/* Image navigation arrows */}
                {activeGallery.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setSelectedImage((prev) =>
                          prev === 0 ? activeGallery.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-background/80 transition-all duration-300"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() =>
                        setSelectedImage((prev) =>
                          prev === activeGallery.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/50 backdrop-blur-sm flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-background/80 transition-all duration-300"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              <div className="flex gap-3 justify-center">
                {activeGallery.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      "relative w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-foreground/5 transition-all duration-300",
                      selectedImage === index
                        ? "ring-2 ring-foreground/50"
                        : "opacity-50 hover:opacity-100"
                    )}
                  >
                    <Image
                      src={img || "/placeholder.svg"}
                      alt={`${product.name} view ${index + 1}`}
                      fill
                      className="object-contain p-2"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Right - Info */}
            <div 
              className={cn(
                "space-y-6 transition-all duration-700 delay-200 lg:pt-6 lg:pr-12",
                isContentVisible 
                  ? "opacity-100 translate-x-0" 
                  : "opacity-0 translate-x-12"
              )}
              style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
              {/* Title & Price */}
              <div>
                <h2 className="text-3xl md:text-4xl font-display font-light tracking-tight mb-3">
                  {product.name}
                </h2>
                <p className="text-foreground/60 leading-relaxed mb-4 text-sm md:text-base">
                  {product.fullDescription}
                </p>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl md:text-4xl font-light">{displayPrice}</span>
                  <span className="text-foreground/40">RUB</span>
                </div>
                {extrasTotal > 0 && (
                  <div className="text-xs text-foreground/45 mt-2">
                    Дополнения: +{formatPrice(extrasTotal)} RUB
                  </div>
                )}
              </div>

              {/* Colors */}
              <div>
                <h3 className="text-xs uppercase tracking-[0.15em] text-foreground/50 mb-3">
                  Цвет: {availableColors[selectedColor]?.color.name ?? product.colors[0].name}
                </h3>
                <div className="flex gap-3">
                  {availableColors.map(({ color, index }, availableIndex) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(availableIndex)}
                      className={cn(
                        "relative w-9 h-9 rounded-full transition-all duration-300",
                        availableColors[selectedColor]?.index === index
                          ? "ring-2 ring-foreground/50 ring-offset-2 ring-offset-background"
                          : "hover:scale-110"
                      )}
                      style={{
                        backgroundColor: color.hex,
                        backgroundImage: color.splitHex
                          ? `linear-gradient(90deg, ${color.splitHex[0]} 0%, ${color.splitHex[0]} 50%, ${color.splitHex[1]} 50%, ${color.splitHex[1]} 100%)`
                          : undefined,
                      }}
                      title={color.name}
                    >
                      {availableColors[selectedColor]?.index === index && (
                        <Check className="absolute inset-0 m-auto w-4 h-4 text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extras */}
              <div>
                <h3 className="text-xs uppercase tracking-[0.15em] text-foreground/50 mb-3">
                  Доп. функции
                </h3>
                <div className="flex flex-wrap gap-2">
                  {extrasOptions.map((extra) => {
                    const isActive = selectedExtras.includes(extra.id);
                    return (
                      <button
                        key={extra.id}
                        onClick={() => toggleExtra(extra.id)}
                        className={cn(
                          "px-4 py-2 text-xs rounded-full transition-all duration-300",
                          isActive
                            ? "bg-foreground text-background"
                            : "bg-foreground/5 hover:bg-foreground/10 text-foreground/70"
                        )}
                      >
                        {extra.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-xs uppercase tracking-[0.15em] text-foreground/50 mb-3">Особенности</h3>
                <div className="flex flex-wrap gap-2">
                  {product.features.map((feature, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 text-xs bg-foreground/5 rounded-full text-foreground/70"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>

              {/* Specs - Compact grid */}
              <div>
                <h3 className="text-xs uppercase tracking-[0.15em] text-foreground/50 mb-3">Характеристики</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                  {product.specs.map((spec, index) => (
                    <div key={index} className="flex justify-between items-baseline py-1 border-b border-foreground/5">
                      <span className="text-foreground/40 text-xs">{spec.label}</span>
                      <span className="text-foreground text-sm font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  onClick={() => {
                    setPurchaseSubmitted(false);
                    setPurchaseErrors({});
                    setPurchaseConsent(false);
                    setPurchaseError("");
                    setTurnstileToken("");
                    setIsPurchaseOpen(true);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-3 px-6 py-3.5 bg-foreground text-background text-sm uppercase tracking-[0.15em] rounded-full hover:bg-foreground/90 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                >
                  Приобрести
                </button>
                <button
                  onClick={handleAddToCart}
                  className="w-12 h-12 rounded-full border border-foreground/20 text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-all duration-300 flex items-center justify-center"
                  aria-label="Добавить в корзину"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareOpen(true)}
                  className="w-12 h-12 rounded-full border border-foreground/20 text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-all duration-300 flex items-center justify-center"
                  aria-label="Поделиться"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-md border-foreground/10 bg-background/95 backdrop-blur-xl shadow-2xl shadow-black/40">
          <DialogTitle className="text-xl font-display font-light">Поделиться товаром</DialogTitle>
          <DialogDescription className="text-foreground/60 text-sm leading-relaxed">
            Скопируйте ссылку или отправьте в мессенджер.
          </DialogDescription>
          <div className="mt-6 grid gap-3">
            <button
              type="button"
              onClick={async () => {
                if (!shareUrl) return;
                try {
                  await navigator.clipboard.writeText(shareUrl);
                  setCopyState("success");
                  window.setTimeout(() => setCopyState("idle"), 1800);
                } catch {
                  // ignore clipboard errors
                }
              }}
              className="w-full rounded-full border border-foreground/15 px-5 py-3 text-xs uppercase tracking-[0.2em] text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-all duration-300 text-left"
            >
              {copyState === "success" ? "Ссылка скопирована" : "Скопировать ссылку"}
            </button>
            <a
              href={`https://t.me/share/url?url=${encodeURIComponent(
                shareUrl
              )}&text=${encodeURIComponent(product?.name ?? "")}`}
              target="_blank"
              rel="noreferrer"
              className="w-full rounded-full border border-foreground/15 px-5 py-3 text-xs uppercase tracking-[0.2em] text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-all duration-300"
            >
              Поделиться в Telegram
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(
                `${product?.name ?? ""} ${shareUrl}`.trim()
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full rounded-full border border-foreground/15 px-5 py-3 text-xs uppercase tracking-[0.2em] text-foreground/60 hover:text-foreground hover:border-foreground/40 transition-all duration-300"
            >
              Поделиться в WhatsApp
            </a>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPurchaseOpen} onOpenChange={setIsPurchaseOpen}>
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
                    Заполните данные, и мы свяжемся с вами для подтверждения заказа.
                  </DialogDescription>
                </div>
                <div className="grid content-start gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="purchase-name" className="text-foreground/70">
                      Имя и фамилия
                    </Label>
                  <Input
                    id="purchase-name"
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
                    <Label htmlFor="purchase-phone" className="text-foreground/70">
                      Телефон
                    </Label>
                  <Input
                    id="purchase-phone"
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
                    <p className="text-xs text-m-red">Не задан ключ Turnstile.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="product-purchase-consent"
                      checked={purchaseConsent}
                      onCheckedChange={(checked) => setPurchaseConsent(checked === true)}
                      className="mt-1"
                    />
                    <Label htmlFor="product-purchase-consent" className="text-foreground/60 leading-relaxed">
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
                    onClick={() => setIsPurchaseOpen(false)}
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
                  onClick={() => setIsPurchaseOpen(false)}
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

      {/* Custom scrollbar styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>,
    document.body
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
