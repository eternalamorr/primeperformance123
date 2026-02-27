"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "prime-perfomance-cart";

export interface CartItem {
  id: number;
  name: string;
  price: string;
  image?: string;
  quantity: number;
  color?: string;
  extras?: string[];
  variantKey: string;
}

type CartProduct = {
  id: number;
  name: string;
  price: string;
  image?: string;
  gallery?: string[];
  color?: string;
  extras?: string[];
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: CartProduct, quantity?: number) => void;
  removeItem: (variantKey: string) => void;
  updateQuantity: (variantKey: string, quantity: number) => void;
  clear: () => void;
  totalItems: number;
  totalPrice: number;
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  isPurchaseOpen: boolean;
  setPurchaseOpen: (open: boolean) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const parsePrice = (price: string) => {
  const digits = price.replace(/[^\d]/g, "");
  return digits ? Number(digits) : 0;
};

const buildVariantKey = (product: CartProduct) => {
  const extrasKey = (product.extras ?? []).slice().sort().join("|");
  return `${product.id}:${product.color ?? ""}:${extrasKey}`;
};

export const formatPrice = (value: number) =>
  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setOpen] = useState(false);
  const [isPurchaseOpen, setPurchaseOpen] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const sanitized = parsed
          .filter(
            (item) =>
              item &&
              typeof item.id === "number" &&
              typeof item.name === "string" &&
              typeof item.price === "string" &&
              typeof item.quantity === "number"
          )
          .map((item) => ({
            ...item,
            variantKey:
              typeof item.variantKey === "string"
                ? item.variantKey
                : buildVariantKey(item),
          }));
        setItems(sanitized);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((product: CartProduct, quantity = 1) => {
    const variantKey = buildVariantKey(product);
    setItems((prev) => {
      const existing = prev.find((item) => item.variantKey === variantKey);
      if (existing) {
        return prev.map((item) =>
          item.variantKey === variantKey
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          image: product.image ?? product.gallery?.[0],
          quantity,
          color: product.color,
          extras: product.extras,
          variantKey,
        },
      ];
    });
  }, []);

  const updateQuantity = useCallback((variantKey: string, quantity: number) => {
    setItems((prev) =>
      prev.flatMap((item) => {
        if (item.variantKey !== variantKey) return [item];
        const nextQuantity = Math.max(0, quantity);
        if (nextQuantity === 0) return [];
        return [{ ...item, quantity: nextQuantity }];
      })
    );
  }, []);

  const removeItem = useCallback((variantKey: string) => {
    setItems((prev) => prev.filter((item) => item.variantKey !== variantKey));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );
  const totalPrice = useMemo(
    () => items.reduce((sum, item) => sum + parsePrice(item.price) * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      totalItems,
      totalPrice,
      isOpen,
      setOpen,
      isPurchaseOpen,
      setPurchaseOpen,
    }),
    [
      items,
      addItem,
      removeItem,
      updateQuantity,
      clear,
      totalItems,
      totalPrice,
      isOpen,
      isPurchaseOpen,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
