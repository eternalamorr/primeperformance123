"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Palette, Layers, Sparkles, Settings2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { TurnstileWidget } from "@/components/turnstile";

interface ConfiguratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const baseOptions = ["BMW M4", "BMW M5", "BMW M8", "BMW M3", "Своя марка"] as const;

const colorOptionsByBase: Record<(typeof baseOptions)[number], string[]> = {
  "BMW M5": ["Черный", "Черно-белый", "Красный", "Черно-красный", "Оранжевый", "Свой цвет"],
  "BMW M8": ["Черный", "Белый", "Красный", "Черно-оранжевый", "Свой цвет"],
  "BMW M4": ["Черно-оранжевый", "Черно-белый", "Черный", "Коричневый", "Свой цвет"],
  "BMW M3": ["Черный", "Белый", "Серый", "Свой цвет"],
  "Своя марка": ["Свой цвет"],
};

const configSteps = [
  {
    id: "base",
    icon: Settings2,
    title: "Основа кресла",
    description: "Выберите базу / марку",
    options: baseOptions,
  },
  {
    id: "color",
    icon: Palette,
    title: "Цвет",
    description: "Выберите основной цвет",
    options: [],
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

export function ConfiguratorModal({ isOpen, onClose }: ConfiguratorModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<
    Record<string, string | string[]>
  >({});
  const [isVisible, setIsVisible] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [purchaseName, setPurchaseName] = useState("");
  const [purchasePhone, setPurchasePhone] = useState("");
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
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
      setSelectedOptions({});
      setStepIndex(0);
      setIsComplete(false);
      setIsSubmitted(false);
      setPurchaseName("");
      setPurchasePhone("");
      setPurchaseErrors({});
      setPurchaseError("");
      setPurchaseLoading(false);
      setPurchaseConsent(false);
      setTurnstileToken("");
      setHoneypot("");
      setTimeout(() => setIsContentVisible(true), 50);
    } else {
      setIsContentVisible(false);
      document.body.style.overflow = "";
      setTimeout(() => setIsVisible(false), 400);
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("keydown", handleEsc);
    };
  }, [onClose]);

  if (!isVisible) return null;
  if (typeof document === "undefined") return null;

  const currentStep = configSteps[stepIndex];
  const isFirstStep = stepIndex === 0;
  const isLastStep = stepIndex === configSteps.length - 1;
  const resolvedOptions =
    currentStep.id === "color"
      ? colorOptionsByBase[
          (selectedOptions.base as (typeof baseOptions)[number]) || "BMW M5"
        ]
      : currentStep.options;
  const selectedValue = selectedOptions[currentStep.id];
  const canProceed =
    currentStep.id === "extras" || currentStep.id === "custom"
      ? isLastStep
        ? true
        : Array.isArray(selectedValue) && selectedValue.length > 0
      : Boolean(selectedValue);

  const handleSelect = (category: string, option: string) => {
    setSelectedOptions((prev) => {
      if (category === "extras") {
        const current = Array.isArray(prev.extras) ? prev.extras : [];
        const isActive = current.includes(option);
        const nextExtras = isActive
          ? current.filter((item) => item !== option)
          : [...current, option];
        return { ...prev, extras: nextExtras };
      }

      if (category === "custom") {
        const current = Array.isArray(prev.custom) ? prev.custom : [];
        const backrestOptions = ["Спинка из карбона", "Спинка из алькантары"];
        if (option === "Индивидуальная надпись") {
          const isActive = current.includes(option);
          const nextCustom = isActive
            ? current.filter((item) => item !== option)
            : [...current, option];
          return { ...prev, custom: nextCustom };
        }

        if (backrestOptions.includes(option)) {
          const hasSame = current.includes(option);
          const withoutBackrest = current.filter(
            (item) => !backrestOptions.includes(item)
          );
          const nextCustom = hasSame
            ? withoutBackrest
            : [...withoutBackrest, option];
          return { ...prev, custom: nextCustom };
        }
      }

      if (category !== "base") {
        return { ...prev, [category]: option };
      }

      const next: Record<string, string | string[]> = { ...prev, base: option };
      const allowedColors =
        colorOptionsByBase[option as (typeof baseOptions)[number]] || [];
      const currentColor = typeof next.color === "string" ? next.color : undefined;
      if (currentColor && !allowedColors.includes(currentColor)) {
        delete next.color;
      }
      return next;
    });
  };

  const handleBack = () => {
    if (isFirstStep) {
      onClose();
      return;
    }
    setStepIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    if (!canProceed) return;
    if (isLastStep) {
      setIsComplete(true);
      return;
    }
    setStepIndex((prev) => Math.min(configSteps.length - 1, prev + 1));
  };

  const handleSkip = () => {
    if (isLastStep) {
      setIsComplete(true);
      return;
    }
    setSelectedOptions((prev) => {
      const next = { ...prev };
      delete next[currentStep.id];
      return next;
    });
    setStepIndex((prev) => Math.min(configSteps.length - 1, prev + 1));
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

  const submitConfigOrder = async () => {
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
          source: "configurator",
          customer: { name: purchaseName.trim(), phone: purchasePhone.trim() },
          consent: purchaseConsent,
          configuration: selectedOptions,
          turnstileToken,
          honeypot,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Не удалось отправить заявку.");
      }

      setIsSubmitted(true);
    } catch (error) {
      setPurchaseError(error instanceof Error ? error.message : "Ошибка отправки.");
    } finally {
      setPurchaseLoading(false);
    }
  };

  const selectedLabel =
    currentStep.id === "extras" || currentStep.id === "custom"
      ? Array.isArray(selectedValue) && selectedValue.length > 0
        ? selectedValue.join(" + ")
        : "—"
      : selectedValue || "—";

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={cn(
          "absolute inset-0 bg-background/95 backdrop-blur-xl transition-opacity duration-500",
          isContentVisible ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <div
        className={cn(
          "relative z-10 bg-background/90 backdrop-blur-md border border-foreground/10 rounded-3xl w-full max-h-[92vh] sm:max-h-[96vh] overflow-hidden mx-3 sm:mx-4",
          isComplete ? "max-w-[720px] sm:max-w-[780px]" : "max-w-[980px] sm:max-w-[1100px]",
          "transition-all duration-700 ease-out"
        )}
        style={{
          opacity: isContentVisible ? 1 : 0,
          transform: isContentVisible
            ? "scale(1) translateY(0)"
            : "scale(0.95) translateY(20px)",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-12 h-12 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-foreground/20 transition-all duration-300"
        >
          <X className="w-5 h-5" />
        </button>

        <div
          className={cn(
            "sticky top-0 z-10 bg-background/95 backdrop-blur-md border-b border-foreground/10 p-4 sm:p-6 md:p-8",
            "transition-all duration-700 delay-100"
          )}
          style={{
            opacity: isContentVisible ? 1 : 0,
            transform: isContentVisible ? "translateY(0)" : "translateY(-20px)",
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-light tracking-tight mb-2">
                {isSubmitted
                  ? "Конфигурация отправлена"
                  : isComplete
                  ? "Оформление заявки"
                  : "Конфигуратор "}
                {!isComplete && !isSubmitted && (
                  <span className="font-medium">Prime Performance</span>
                )}
              </h2>
              <p className="text-sm text-foreground/50">
                {isSubmitted
                  ? "Мы получили вашу конфигурацию и свяжемся с вами."
                  : isComplete
                  ? "Оставьте контактные данные, и мы свяжемся с вами."
                  : "Создайте кресло своей мечты"}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 md:p-8 max-h-[calc(92vh-200px)] sm:max-h-[calc(96vh-220px)] custom-scrollbar">
          {!isComplete ? (
            <div className="flex flex-col gap-4 sm:gap-6 max-w-[760px] mx-auto">
              <div className="rounded-2xl border border-foreground/10 bg-background/50 backdrop-blur-sm p-4 sm:p-6">
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-foreground/5">
                    <currentStep.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium tracking-tight mb-1">{currentStep.title}</h3>
                    <p className="text-sm text-foreground/50">{currentStep.description}</p>
                  </div>
                </div>

                <div
                  className={cn(
                    "grid gap-3",
                    currentStep.id === "base" ? "grid-cols-1" : "grid-cols-2"
                  )}
                >
                  {resolvedOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => handleSelect(currentStep.id, option)}
                      className={cn(
                        "rounded-xl transition-all duration-300 text-left",
                        currentStep.id === "base"
                          ? "px-5 py-4 text-sm md:text-base"
                          : "px-4 py-3 text-sm",
                        currentStep.id === "extras"
                          ? Array.isArray(selectedOptions.extras) &&
                            selectedOptions.extras.includes(option)
                            ? "bg-foreground text-background"
                            : "bg-foreground/5 hover:bg-foreground/10 text-foreground/70"
                          : currentStep.id === "custom"
                          ? Array.isArray(selectedOptions.custom) &&
                            selectedOptions.custom.includes(option)
                            ? "bg-foreground text-background"
                            : "bg-foreground/5 hover:bg-foreground/10 text-foreground/70"
                          : selectedOptions[currentStep.id] === option
                          ? "bg-foreground text-background"
                          : "bg-foreground/5 hover:bg-foreground/10 text-foreground/70"
                      )}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                <div className="mt-5 text-sm text-foreground/45">
                  Выбрано: {selectedLabel}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-full max-w-[640px] rounded-2xl border border-foreground/10 bg-foreground/[0.02] p-5 sm:p-8 md:p-10 grid grid-rows-[auto_1fr_auto] gap-6">
                {isSubmitted ? (
                  <>
                    <h4 className="text-xl sm:text-2xl font-medium text-foreground">
                      Отличный выбор.
                    </h4>
                    <p className="text-base text-foreground/55 leading-relaxed">
                      Мы получили вашу конфигурацию. Менеджер свяжется с вами для уточнения деталей.
                    </p>
                  </>
                ) : (
                  <>
                    <h4 className="text-xl sm:text-2xl font-medium text-foreground">
                      Оставьте контакты
                    </h4>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        const errors: { name?: string; phone?: string; consent?: string } = {};
                        const nameOk = /^[A-Za-zА-Яа-яЁё\s-]{2,}$/.test(
                          purchaseName.trim()
                        );
                        if (!nameOk) {
                          errors.name = "Укажите имя и фамилию";
                        }
                        const digits = normalizePhoneDigits(purchasePhone);
                        if (digits.length !== 11) {
                          errors.phone = "Введите телефон в формате +7 (___) ___-__-__";
                        }
                        if (!purchaseConsent) {
                          errors.consent = "Нужно согласие на обработку персональных данных";
                        }
                        setPurchaseErrors(errors);
                        if (Object.keys(errors).length === 0) {
                          submitConfigOrder();
                        }
                      }}
                      className="grid gap-5"
                    >
                      <div className="space-y-2">
                        <label className="text-foreground/70 text-sm">Имя и фамилия</label>
                        <input
                          value={purchaseName}
                          onChange={(event) => setPurchaseName(event.target.value)}
                          placeholder="Иван Иванов"
                          className="h-12 w-full rounded-xl bg-foreground/[0.03] border border-foreground/10 px-4 text-base"
                        />
                        {purchaseErrors.name && (
                          <p className="text-xs text-m-red">{purchaseErrors.name}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-foreground/70 text-sm">Телефон</label>
                        <input
                          value={purchasePhone}
                          onChange={(event) => setPurchasePhone(formatPhone(event.target.value))}
                          placeholder="+7 (925) 063-05-50"
                          className="h-12 w-full rounded-xl bg-foreground/[0.03] border border-foreground/10 px-4 text-base"
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
                        <label className="text-foreground/70 text-sm">Проверка</label>
                        {turnstileSiteKey ? (
                          <TurnstileWidget
                            key={isSubmitted ? "submitted" : "active"}
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
                            id="config-purchase-consent"
                            checked={purchaseConsent}
                            onCheckedChange={(checked) => setPurchaseConsent(checked === true)}
                            className="mt-1"
                          />
                          <label htmlFor="config-purchase-consent" className="text-sm text-foreground/60 leading-relaxed">
                            Я согласен(а) на обработку персональных данных и принимаю{" "}
                            <Link
                              href="/privacy"
                              className="text-foreground underline underline-offset-4 hover:text-foreground/80"
                            >
                              политику конфиденциальности
                            </Link>
                            .
                          </label>
                        </div>
                        {purchaseErrors.consent && (
                          <p className="text-xs text-m-red">{purchaseErrors.consent}</p>
                        )}
                      </div>
                      {purchaseError && (
                        <p className="text-xs text-m-red">{purchaseError}</p>
                      )}
                      <button
                        type="submit"
                        disabled={purchaseLoading}
                        className={cn(
                          "mt-2 inline-flex items-center justify-center rounded-full bg-foreground px-6 py-3.5 text-sm uppercase tracking-[0.2em] text-background transition-all duration-300",
                          purchaseLoading ? "opacity-60 cursor-not-allowed" : "hover:bg-foreground/90"
                        )}
                      >
                        {purchaseLoading ? "Отправка..." : "Отправить"}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className={cn(
            "sticky bottom-0 bg-background/95 backdrop-blur-md border-t border-foreground/10 p-4 sm:p-6 md:p-8",
            "transition-all duration-700 delay-300"
          )}
          style={{
            opacity: isContentVisible ? 1 : 0,
            transform: isContentVisible ? "translateY(0)" : "translateY(20px)",
            transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {!isComplete ? (
              <>
                <div className="flex items-center gap-3 text-[9px] sm:text-[10px] uppercase tracking-[0.24em] text-foreground/40">
                  <span>Шаг {stepIndex + 1}</span>
                  <span className="w-8 h-px bg-foreground/20" />
                  <span>{configSteps.length}</span>
                </div>
                <div className="flex gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={handleBack}
                  className={cn(
                    "px-6 py-3 rounded-full border border-foreground/10 text-sm uppercase tracking-wider transition-colors flex-1 sm:flex-initial",
                    isFirstStep ? "hover:bg-foreground/5" : "hover:bg-foreground/5"
                  )}
                >
                  {isFirstStep ? "Закрыть" : "Назад"}
                </button>
                {(currentStep.id === "extras" || currentStep.id === "custom") && (
                  <button
                    onClick={handleSkip}
                    className="px-6 py-3 rounded-full border border-foreground/10 text-sm uppercase tracking-wider transition-colors flex-1 sm:flex-initial text-foreground/70 hover:bg-foreground/5"
                  >
                    Пропустить
                  </button>
                )}
                <button
                  onClick={handleNext}
                  disabled={!canProceed}
                  className={cn(
                    "px-8 py-3 rounded-full text-sm uppercase tracking-wider transition-colors flex-1 sm:flex-initial",
                    canProceed
                      ? "bg-foreground text-background hover:bg-foreground/90 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                      : "bg-foreground/30 text-foreground/40 cursor-not-allowed"
                  )}
                >
                  {isLastStep ? "Готово" : "Далее"}
                </button>
                </div>
              </>
            ) : (
              <div className="flex gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={onClose}
                  className="px-8 py-3 rounded-full text-sm uppercase tracking-wider transition-colors bg-foreground text-background hover:bg-foreground/90 hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]"
                >
                  Готово
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

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
