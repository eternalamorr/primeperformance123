import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit } from "@/lib/rate-limit";
import { sendTelegramMessage } from "@/lib/telegram";
import { sendSmtpMessage } from "@/lib/smtp";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { supabasePublic } from "@/lib/supabase-public";
import { enforceSameOrigin, getClientIp } from "@/lib/request-helpers";

export const runtime = "nodejs";
const isE2ETestMode =
  process.env.NODE_ENV !== "production" &&
  process.env.E2E_BYPASS_TURNSTILE === "1";
const isE2EFakeOrderMode =
  process.env.NODE_ENV !== "production" &&
  process.env.E2E_FAKE_ORDER === "1";
const allowOrdersWithoutTurnstile = process.env.ALLOW_ORDERS_WITHOUT_TURNSTILE === "1";
const allowPendingOrderQueue = process.env.ALLOW_PENDING_ORDER_QUEUE !== "0";
const enableSmtpFallback = process.env.NOTIFY_EMAIL_FALLBACK === "1";

const OrderSchema = z.object({
  source: z.enum(["cart", "product", "configurator"]),
  consent: z.literal(true),
  customer: z.object({
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().regex(/^\+?[0-9()\-\s]{10,22}$/),
  }),
  items: z
    .array(
      z.object({
        id: z.number().optional(),
        name: z.string().trim().min(1).max(220),
        price: z.string().trim().max(40).optional(),
        quantity: z.number().int().positive().optional(),
        color: z.string().trim().max(80).optional(),
        extras: z.array(z.string().trim().min(1).max(80)).max(10).optional(),
      })
    )
    .max(20)
    .optional(),
  configuration: z
    .record(
      z.string().trim().min(1).max(80),
      z.union([z.string().trim().max(500), z.number(), z.boolean(), z.null()])
    )
    .optional(),
  turnstileToken: z.string().min(1),
  honeypot: z.string().max(200).optional(),
});

const TURNSTILE_VERIFY_URL =
  "https://challenges.cloudflare.com/turnstile/v0/siteverify";

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const parsePrice = (value?: string) => {
  if (!value) return 0;
  const digits = value.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
};

const buildOrderLines = ({
  source,
  customerName,
  customerPhone,
  items,
  configuration,
  totalPrice,
  extras = [],
}: {
  source: "cart" | "product" | "configurator";
  customerName: string;
  customerPhone: string;
  items: Array<{
    name: string;
    color?: string;
    extras?: string[];
    quantity?: number;
  }>;
  configuration?: Record<string, string | number | boolean | null>;
  totalPrice: number;
  extras?: string[];
}) => {
  const header =
    source === "configurator"
      ? "Новая заявка (конфигуратор)"
      : source === "cart"
      ? "Новая заявка (корзина)"
      : "Новая заявка (каталог)";

  const lines: string[] = [
    `<b>${escapeHtml(header)}</b>`,
    `Имя: ${escapeHtml(customerName)}`,
    `Телефон: ${escapeHtml(customerPhone)}`,
  ];

  if (items.length > 0) {
    lines.push("", "<b>Состав заказа:</b>");
    items.forEach((item) => {
      const extrasText = item.extras?.length ? ` + ${item.extras.join(", ")}` : "";
      const color = item.color ? `, цвет: ${item.color}` : "";
      const qty = item.quantity ? ` x${item.quantity}` : "";
      lines.push(`• ${escapeHtml(item.name)}${color}${extrasText}${qty}`);
    });
  }

  if (configuration && Object.keys(configuration).length > 0) {
    lines.push("", "<b>Конфигурация:</b>");
    Object.entries(configuration).forEach(([key, value]) => {
      lines.push(`• ${escapeHtml(key)}: ${escapeHtml(String(value))}`);
    });
  }

  if (totalPrice) {
    lines.push("", `Итого: ${totalPrice.toLocaleString("ru-RU")} ₽`);
  }

  if (extras.length > 0) {
    lines.push("", "<b>Технические пометки:</b>", ...extras.map((x) => `• ${escapeHtml(x)}`));
  }

  return lines;
};

export async function POST(request: Request) {
  const originCheck = enforceSameOrigin(request);
  if (originCheck) return originCheck;

  const ip = await getClientIp(headers());

  const limiter = await rateLimit({ key: ip, limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Слишком много запросов. Попробуйте позже." },
      { status: 429 }
    );
  }

  let payload: z.infer<typeof OrderSchema>;
  try {
    payload = OrderSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Некорректные данные." }, { status: 400 });
  }

  if (payload.honeypot && payload.honeypot.trim().length > 0) {
    return NextResponse.json({ error: "Запрос отклонен." }, { status: 400 });
  }

  let turnstileDegraded = false;
  if (!isE2ETestMode) {
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (!turnstileSecret) {
      if (!allowOrdersWithoutTurnstile) {
        return NextResponse.json(
          { error: "Turnstile не настроен на сервере." },
          { status: 500 }
        );
      }
      turnstileDegraded = true;
    }

    if (!turnstileDegraded && turnstileSecret) {
      try {
        const verifyRes = await fetch(TURNSTILE_VERIFY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            secret: turnstileSecret,
            response: payload.turnstileToken,
            remoteip: ip,
          }),
        });

        if (!verifyRes.ok) {
          if (!allowOrdersWithoutTurnstile) {
            return NextResponse.json(
              { error: "Сервис проверки недоступен." },
              { status: 503 }
            );
          }
          turnstileDegraded = true;
        } else {
          const verifyBody = (await verifyRes.json()) as { success?: boolean };
          if (!verifyBody?.success) {
            return NextResponse.json(
              { error: "Проверка Turnstile не пройдена." },
              { status: 400 }
            );
          }
        }
      } catch {
        if (!allowOrdersWithoutTurnstile) {
          return NextResponse.json(
            { error: "Сервис проверки недоступен." },
            { status: 503 }
          );
        }
        turnstileDegraded = true;
      }
    }

    if (turnstileDegraded) {
      // Extra friction when anti-bot provider is unavailable.
      const degradedLimiter = await rateLimit({
        key: `turnstile-degraded:${ip}`,
        limit: 2,
        windowMs: 10 * 60 * 1000,
      });
      if (!degradedLimiter.ok) {
        return NextResponse.json(
          { error: "Слишком много запросов. Попробуйте позже." },
          { status: 429 }
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1200));
    }
  }

  const items = payload.items ?? [];
  const totalPrice = items.reduce((sum, item) => {
    const quantity = item.quantity ?? 1;
    return sum + parsePrice(item.price) * quantity;
  }, 0);

  let queued = false;
  if (!isE2EFakeOrderMode) {
    const orderRow = {
      source: payload.source,
      customer_name: payload.customer.name.trim(),
      customer_phone: payload.customer.phone.trim(),
      items,
      configuration: payload.configuration ?? null,
      total_price: totalPrice || null,
      status: "new",
    };
    const { error } = await supabasePublic.from("orders").insert(orderRow);

    if (error) {
      if (!allowPendingOrderQueue) {
        return NextResponse.json(
          { error: "Не удалось сохранить заказ." },
          { status: 500 }
        );
      }

      const queuedRes = await supabaseAdmin.from("pending_orders").insert({
        source: orderRow.source,
        customer_name: orderRow.customer_name,
        customer_phone: orderRow.customer_phone,
        items: orderRow.items,
        configuration: orderRow.configuration,
        total_price: orderRow.total_price,
        payload: payload,
        reason: "orders_insert_failed",
        last_error: error.message,
      });

      if (queuedRes.error) {
        return NextResponse.json(
          { error: "Не удалось сохранить заказ. Попробуйте позже." },
          { status: 503 }
        );
      }
      queued = true;
    }
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!isE2EFakeOrderMode) {
    const messageLines = buildOrderLines({
      source: payload.source,
      customerName: payload.customer.name,
      customerPhone: payload.customer.phone,
      items,
      configuration: payload.configuration,
      totalPrice,
      extras: [
        ...(turnstileDegraded ? ["Turnstile fallback mode enabled"] : []),
        ...(queued ? ["Order queued to pending_orders"] : []),
      ],
    });

    let telegramSent = false;
    try {
      if (token && chatId) {
        await sendTelegramMessage({
          token,
          chatId,
          text: messageLines.join("\n"),
        });
        telegramSent = true;
      }
    } catch (error) {
      console.error("Failed to send Telegram message", error);
    }

    if ((!telegramSent || !token || !chatId) && enableSmtpFallback) {
      try {
        await sendSmtpMessage({
          subject: "Prime Performance: новая заявка",
          text: messageLines
            .map((line) => line.replace(/<[^>]*>/g, ""))
            .join("\n"),
          html: messageLines.join("<br/>"),
        });
      } catch (error) {
        console.error("Failed to send SMTP fallback message", error);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    queued,
    degraded: turnstileDegraded,
    testMode: isE2ETestMode || isE2EFakeOrderMode,
  });
}
