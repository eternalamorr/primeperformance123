"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type ProductRecord = {
  id: number;
  name: string;
  price: string;
  segment?: string | null;
  description?: string | null;
  full_description?: string | null;
  features?: string[] | string | null;
  specs?: unknown;
  colors?: unknown;
  color_gallery?: unknown;
  badge?: string | null;
  image?: string | null;
  gallery?: unknown;
  is_upgrade?: boolean | null;
};

type OrderRecord = {
  id: string;
  created_at: string;
  source: string;
  customer_name: string;
  customer_phone: string;
  items?: unknown;
  configuration?: unknown;
  total_price?: number | null;
  status?: string | null;
};

const emptyProduct = (): ProductRecord => ({
  id: Date.now(),
  name: "",
  price: "",
  segment: "standard",
  description: "",
  full_description: "",
  features: [],
  specs: [],
  colors: [],
  color_gallery: null,
  badge: "",
  image: "",
  gallery: [],
  is_upgrade: false,
});

const formatJson = (value: unknown) => {
  if (value === null || value === undefined) return "";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
};

const parseJson = (value: string, fallback: unknown) => {
  if (!value.trim()) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const normalizeGallery = (value: unknown) =>
  Array.isArray(value) ? value.filter((item) => typeof item === "string") : [];

const normalizeColorGallery = (value: unknown): Record<string, string[]> => {
  if (!value || typeof value !== "object") return {};
  const entries = Object.entries(value as Record<string, unknown>).map(([key, v]) => [
    key,
    normalizeGallery(v),
  ]);
  return Object.fromEntries(entries) as Record<string, string[]>;
};

const buildProductPayload = (draft: ProductRecord) => ({
  id: draft.id,
  name: draft.name ?? "",
  price: draft.price ?? "",
  segment: (draft.segment ?? "standard") as "standard" | "premium",
  description: draft.description ?? null,
  full_description: draft.full_description ?? null,
  features:
    typeof draft.features === "string"
      ? draft.features
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : draft.features ?? [],
  specs: draft.specs ?? [],
  colors: draft.colors ?? [],
  color_gallery: draft.color_gallery ?? null,
  badge: draft.badge ?? null,
  image: draft.image ?? null,
  gallery: draft.gallery ?? [],
  is_upgrade: Boolean(draft.is_upgrade),
});

const buildProductPatchPayload = (draft: ProductRecord) => {
  const payload = buildProductPayload(draft);
  if (payload.price.trim() === "") {
    delete (payload as Partial<typeof payload>).price;
  }
  return payload;
};

export function AdminDashboard() {
  const [tab, setTab] = useState<"products" | "orders">("products");
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [activeProductId, setActiveProductId] = useState<number | null>(null);
  const [productDraft, setProductDraft] = useState<ProductRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  const activeProduct = useMemo(
    () => products.find((p) => p.id === activeProductId) ?? null,
    [products, activeProductId]
  );

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [productsRes, ordersRes] = await Promise.all([
          fetch("/admin/api/products"),
          fetch("/admin/api/orders"),
        ]);
        if (productsRes.ok) {
          const data = await productsRes.json();
          setProducts(Array.isArray(data) ? data : []);
        }
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setOrders(Array.isArray(data) ? data : []);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (activeProduct) {
      setProductDraft({ ...activeProduct });
    } else {
      setProductDraft(null);
    }
  }, [activeProduct]);

  const handleLogout = async () => {
    await fetch("/admin/api/auth/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const handleSelectProduct = (product: ProductRecord) => {
    setActiveProductId(product.id);
    setTab("products");
  };

  const handleNewProduct = () => {
    const draft = emptyProduct();
    setProductDraft(draft);
    setActiveProductId(draft.id);
    setProducts((prev) => [draft, ...prev]);
  };

  const saveProduct = async () => {
    if (!productDraft) return;
    setMessage("");

    const exists = products.some((p) => p.id === productDraft.id);
    const payload = exists
      ? buildProductPatchPayload(productDraft)
      : buildProductPayload(productDraft);

    const res = await fetch(
      exists ? `/admin/api/products/${productDraft.id}` : "/admin/api/products",
      {
        method: exists ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data?.details?.fieldErrors) {
        const entries = Object.entries(data.details.fieldErrors as Record<string, string[]>)
          .filter(([, v]) => Array.isArray(v) && v.length > 0)
          .map(([key, v]) => `${key}: ${v.join(", ")}`);
        setMessage(entries.length > 0 ? entries.join(" | ") : data?.error || "Ошибка сохранения.");
      } else {
        setMessage(data?.error || "Ошибка сохранения.");
      }
      return;
    }

    const updated = exists
      ? products.map((p) => (p.id === productDraft.id ? payload : p))
      : [payload, ...products];
    setProducts(updated);
    setMessage("Сохранено.");
  };

  const deleteProduct = async () => {
    if (!productDraft) return;
    if (!confirm("Удалить товар?")) return;
    const res = await fetch(`/admin/api/products/${productDraft.id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage(data?.error || "Ошибка удаления.");
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== productDraft.id));
    setActiveProductId(null);
    setProductDraft(null);
  };

  const uploadImage = async (file: File, target: "image" | "gallery") => {
    setUploading(true);
    setMessage("");
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/admin/api/upload", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Ошибка загрузки.");
      }
      const data = await res.json();
      const url = data.url as string;
      setProductDraft((prev) => {
        if (!prev) return prev;
        if (target === "image") {
          return { ...prev, image: url };
        }
        const gallery = normalizeGallery(prev.gallery);
        return { ...prev, gallery: [...gallery, url] };
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Ошибка загрузки.");
    } finally {
      setUploading(false);
    }
  };

  const moveItem = (list: string[], from: number, to: number) => {
    const next = [...list];
    const item = next.splice(from, 1)[0];
    next.splice(to, 0, item);
    return next;
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#161616,_#0a0a0a)] text-white">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/40 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.4em] text-white/40">
              prime performance
            </div>
            <h1 className="text-2xl font-light">Админ‑панель</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setTab("products")}
              className={cn(
                "rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] border",
                tab === "products"
                  ? "border-white text-white"
                  : "border-white/10 text-white/50"
              )}
            >
              Товары
            </button>
            <button
              onClick={() => setTab("orders")}
              className={cn(
                "rounded-full px-4 py-2 text-xs uppercase tracking-[0.2em] border",
                tab === "orders"
                  ? "border-white text-white"
                  : "border-white/10 text-white/50"
              )}
            >
              Заказы
            </button>
            <button
              onClick={handleLogout}
              className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/60 hover:text-white"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {loading && <p className="text-white/50 text-sm">Загрузка...</p>}
        {tab === "products" && (
          <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm uppercase tracking-[0.3em] text-white/50">
                  Каталог
                </h2>
                <button
                  onClick={handleNewProduct}
                  className="rounded-full bg-white text-black px-4 py-2 text-xs uppercase tracking-[0.2em]"
                >
                  Добавить
                </button>
              </div>
              <div className="mt-4 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-left transition",
                      activeProductId === product.id
                        ? "border-white/40 bg-white/10"
                        : "border-white/10 hover:border-white/30"
                    )}
                  >
                    <div className="text-sm">{product.name || "Без названия"}</div>
                    <div className="text-xs text-white/50">{product.price || "—"}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
              {!productDraft ? (
                <p className="text-white/50">Выберите товар для редактирования.</p>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm uppercase tracking-[0.3em] text-white/50">
                      Карточка товара
                    </h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={deleteProduct}
                        className="rounded-full border border-red-400/40 px-4 py-2 text-xs uppercase tracking-[0.2em] text-red-200"
                      >
                        Удалить
                      </button>
                      <button
                        onClick={saveProduct}
                        className="rounded-full bg-white text-black px-4 py-2 text-xs uppercase tracking-[0.2em]"
                      >
                        Сохранить
                      </button>
                    </div>
                  </div>

                  {message && <p className="text-xs text-amber-200">{message}</p>}

                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                        ID
                      </label>
                      <input
                        type="number"
                        value={productDraft.id}
                        onChange={(e) =>
                          setProductDraft({ ...productDraft, id: Number(e.target.value) })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                        Цена
                      </label>
                      <input
                        value={productDraft.price ?? ""}
                        onChange={(e) =>
                          setProductDraft({ ...productDraft, price: e.target.value })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                        Сегмент
                      </label>
                      <select
                        value={productDraft.segment ?? "standard"}
                        onChange={(e) =>
                          setProductDraft({ ...productDraft, segment: e.target.value })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2"
                      >
                        <option value="standard">Стандарт</option>
                        <option value="premium">Премиум</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                      Название
                    </label>
                    <input
                      value={productDraft.name ?? ""}
                      onChange={(e) =>
                        setProductDraft({ ...productDraft, name: e.target.value })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                      Краткое описание
                    </label>
                    <textarea
                      value={productDraft.description ?? ""}
                      onChange={(e) =>
                        setProductDraft({ ...productDraft, description: e.target.value })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                      Полное описание
                    </label>
                    <textarea
                      value={productDraft.full_description ?? ""}
                      onChange={(e) =>
                        setProductDraft({ ...productDraft, full_description: e.target.value })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                      Фичи (через запятую)
                    </label>
                    <input
                      value={Array.isArray(productDraft.features) ? productDraft.features.join(", ") : ""}
                      onChange={(e) =>
                        setProductDraft({
                          ...productDraft,
                          features: e.target.value.split(",").map((t) => t.trim()).filter(Boolean),
                        })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                        Главная картинка
                      </label>
                      <input
                        value={productDraft.image ?? ""}
                        onChange={(e) =>
                          setProductDraft({ ...productDraft, image: e.target.value })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2"
                      />
                      {productDraft.image && (
                        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10">
                          <Image
                            src={productDraft.image}
                            alt="preview"
                            width={640}
                            height={320}
                            className="h-40 w-full object-cover"
                            sizes="640px"
                            unoptimized
                          />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(file, "image");
                        }}
                        className="text-xs text-white/60"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                        Галерея (JSON)
                      </label>
                      <div className="space-y-3">
                        <div className="grid gap-3">
                          {normalizeGallery(productDraft.gallery).map((url, index, list) => (
                            <div
                              key={`${url}-${index}`}
                              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 p-2"
                            >
                              <Image
                                src={url}
                                alt="gallery"
                                width={64}
                                height={64}
                                className="h-16 w-16 rounded-xl object-cover"
                                sizes="64px"
                                unoptimized
                              />
                              <div className="text-xs text-white/70 break-all flex-1">
                                {url}
                              </div>
                              <div className="flex flex-col gap-1">
                                <button
                                  type="button"
                                  disabled={index === 0}
                                  onClick={() => {
                                    const next = moveItem(list, index, index - 1);
                                    setProductDraft({ ...productDraft, gallery: next });
                                  }}
                                  className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60 disabled:opacity-40"
                                >
                                  Вверх
                                </button>
                                <button
                                  type="button"
                                  disabled={index === list.length - 1}
                                  onClick={() => {
                                    const next = moveItem(list, index, index + 1);
                                    setProductDraft({ ...productDraft, gallery: next });
                                  }}
                                  className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60 disabled:opacity-40"
                                >
                                  Вниз
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const next = list.filter((_, i) => i !== index);
                                    setProductDraft({ ...productDraft, gallery: next });
                                  }}
                                  className="rounded-full border border-red-400/40 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-red-200"
                                >
                                  Удалить
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <textarea
                          value={formatJson(productDraft.gallery)}
                          onChange={(e) =>
                            setProductDraft({
                              ...productDraft,
                              gallery: parseJson(e.target.value, []),
                            })
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 min-h-[120px]"
                        />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) uploadImage(file, "gallery");
                        }}
                        className="text-xs text-white/60"
                      />
                      {uploading && <p className="text-xs text-white/40">Загрузка...</p>}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                        Specs (JSON)
                      </label>
                      <textarea
                        value={formatJson(productDraft.specs)}
                        onChange={(e) =>
                          setProductDraft({
                            ...productDraft,
                            specs: parseJson(e.target.value, []),
                          })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 min-h-[120px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                        Цвета (JSON)
                      </label>
                      <textarea
                        value={formatJson(productDraft.colors)}
                        onChange={(e) =>
                          setProductDraft({
                            ...productDraft,
                            colors: parseJson(e.target.value, []),
                          })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 min-h-[120px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                      Галерея цветов (перетасовка)
                    </label>
                    <div className="grid gap-4">
                      {Object.entries(normalizeColorGallery(productDraft.color_gallery)).map(
                        ([color, images]) => (
                          <div key={color} className="rounded-2xl border border-white/10 bg-black/30 p-3">
                            <div className="text-xs uppercase tracking-[0.2em] text-white/60 mb-3">
                              {color}
                            </div>
                            <div className="grid gap-3">
                              {images.map((url, index, list) => (
                                <div
                                  key={`${color}-${url}-${index}`}
                                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 p-2"
                                >
                                  <Image
                                    src={url}
                                    alt={color}
                                    width={56}
                                    height={56}
                                    className="h-14 w-14 rounded-xl object-cover"
                                    sizes="56px"
                                    unoptimized
                                  />
                                  <div className="text-xs text-white/70 break-all flex-1">
                                    {url}
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <button
                                      type="button"
                                      disabled={index === 0}
                                      onClick={() => {
                                        const next = moveItem(list, index, index - 1);
                                        const nextMap = {
                                          ...normalizeColorGallery(productDraft.color_gallery),
                                          [color]: next,
                                        };
                                        setProductDraft({ ...productDraft, color_gallery: nextMap });
                                      }}
                                      className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60 disabled:opacity-40"
                                    >
                                      Вверх
                                    </button>
                                    <button
                                      type="button"
                                      disabled={index === list.length - 1}
                                      onClick={() => {
                                        const next = moveItem(list, index, index + 1);
                                        const nextMap = {
                                          ...normalizeColorGallery(productDraft.color_gallery),
                                          [color]: next,
                                        };
                                        setProductDraft({ ...productDraft, color_gallery: nextMap });
                                      }}
                                      className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/60 disabled:opacity-40"
                                    >
                                      Вниз
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const next = list.filter((_, i) => i !== index);
                                        const nextMap = {
                                          ...normalizeColorGallery(productDraft.color_gallery),
                                          [color]: next,
                                        };
                                        setProductDraft({ ...productDraft, color_gallery: nextMap });
                                      }}
                                      className="rounded-full border border-red-400/40 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-red-200"
                                    >
                                      Удалить
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                    <textarea
                      value={formatJson(productDraft.color_gallery)}
                      onChange={(e) =>
                        setProductDraft({
                          ...productDraft,
                          color_gallery: parseJson(e.target.value, null),
                        })
                      }
                      className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2 min-h-[140px]"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                        Бейдж
                      </label>
                      <input
                        value={productDraft.badge ?? ""}
                        onChange={(e) =>
                          setProductDraft({ ...productDraft, badge: e.target.value })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs uppercase tracking-[0.2em] text-white/50">
                        Upgrade
                      </label>
                      <select
                        value={productDraft.is_upgrade ? "yes" : "no"}
                        onChange={(e) =>
                          setProductDraft({ ...productDraft, is_upgrade: e.target.value === "yes" })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-2"
                      >
                        <option value="no">Нет</option>
                        <option value="yes">Да</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-sm uppercase tracking-[0.3em] text-white/50">
              Заявки
            </h2>
            <div className="mt-4 space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-2xl border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-sm">{order.customer_name}</div>
                      <div className="text-xs text-white/50">{order.customer_phone}</div>
                    </div>
                    <div className="text-xs uppercase tracking-[0.2em] text-white/40">
                      {order.source}
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-white/50">
                    {new Date(order.created_at).toLocaleString("ru-RU")}
                  </div>
                  {Boolean(order.items) && (
                    <pre className="mt-3 whitespace-pre-wrap text-xs text-white/70">
                      {JSON.stringify(order.items, null, 2)}
                    </pre>
                  )}
                  {Boolean(order.configuration) && (
                    <pre className="mt-3 whitespace-pre-wrap text-xs text-white/70">
                      {JSON.stringify(order.configuration, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
              {orders.length === 0 && (
                <p className="text-white/50">Пока нет заявок.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
