"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { X, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductModal } from "./product-modal";

interface Product {
  id: number;
  name: string;
  price: string;
  segment?: string;
  description: string;
  fullDescription: string;
  features: string[];
  specs: { label: string; value: string }[];
  colors: { name: string; hex: string; splitHex?: [string, string] }[];
  colorGallery?: Record<string, string[]>;
  image?: string;
  gallery: string[];
}

export function PremiumCatalogModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isVisible, setIsVisible] = useState(false);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductOpen, setIsProductOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = "hidden";
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
    if (!isOpen) return;

    let active = true;
    const loadPremiumProducts = async () => {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) return;
        const data = await response.json();
        if (!active || !Array.isArray(data)) return;
        setProducts(data.filter((item: Product) => item.segment === "premium"));
      } catch {
        // Keep previous state if request failed.
      }
    };

    loadPremiumProducts();
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isVisible) return null;
  if (typeof document === "undefined") return null;

  const openDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsProductOpen(true);
  };

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
          "relative z-10 bg-background/90 backdrop-blur-md border border-foreground/10 rounded-3xl w-full max-w-[1240px] max-h-[92vh] overflow-hidden mx-4",
          "transition-all duration-700 ease-out"
        )}
        style={{
          opacity: isContentVisible ? 1 : 0,
          transform: isContentVisible
            ? "scale(1) translateY(0)"
            : "scale(0.96) translateY(18px)",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-12 h-12 rounded-full bg-foreground/10 backdrop-blur-sm flex items-center justify-center text-foreground/60 hover:text-foreground hover:bg-foreground/20 transition-all duration-300"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="border-b border-foreground/10 p-6 md:p-8">
          <div className="text-[10px] uppercase tracking-[0.3em] text-foreground/40 mb-4">
            Премиальный каталог
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-light tracking-tight">
            Коллекция мировых брендов
          </h2>
          <p className="text-foreground/50 text-sm mt-2 max-w-xl">
            Выберите кресло премиального уровня.
          </p>
        </div>

        <div className="overflow-y-auto p-6 md:p-8 max-h-[calc(92vh-200px)] custom-scrollbar">
          {products.length === 0 ? (
            <div className="text-center text-foreground/45 py-16 text-sm">Премиум-товары пока недоступны.</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-center">
              {products.map((product) => (
                <div
                  key={product.id}
                  onClick={() => openDetails(product)}
                  className="relative glass-card rounded-2xl overflow-hidden transition-all duration-500 group border border-foreground/10 cursor-pointer w-[300px] md:w-[360px]"
                >
                  <div className="px-6 pt-6 pb-4">
                    <h3 className="text-base md:text-lg font-medium tracking-tight text-foreground/90">
                      {product.name}
                    </h3>
                  </div>

                  <div className="w-full px-6">
                    <div className="w-full h-60 md:h-72 rounded-2xl bg-foreground/5 overflow-hidden">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={720}
                          height={576}
                          className="h-full w-full object-cover rounded-2xl"
                          sizes="(max-width: 768px) 300px, 360px"
                          unoptimized
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-foreground/35 text-[10px] uppercase tracking-[0.2em]">
                          Фото скоро
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="px-6 pb-6 pt-4">
                    <p className="text-foreground/40 text-xs leading-relaxed mb-4">
                      {product.description}
                    </p>

                    <ul className="space-y-2 mb-6">
                      {product.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-3 text-xs text-foreground/50">
                          <span className="w-1 h-1 rounded-full bg-foreground/30" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <div className="flex items-end justify-between pt-4 border-t border-foreground/5">
                      <div>
                        <span className="text-2xl font-light tracking-tight">{product.price}</span>
                        <span className="text-foreground/30 text-xs ml-2">RUB</span>
                      </div>
                      <button
                        onClick={(event) => {
                          event.stopPropagation();
                          openDetails(product);
                        }}
                        className="group/btn flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.15em] text-foreground/60 hover:text-foreground transition-colors duration-300"
                      >
                        Детали
                        <ArrowUpRight className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-300" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ProductModal
        product={selectedProduct}
        isOpen={isProductOpen}
        onClose={() => setIsProductOpen(false)}
      />

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
