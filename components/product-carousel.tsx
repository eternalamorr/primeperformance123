"use client";

import React, { useEffect, useMemo } from "react";
import { useState, useRef } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { ProductModal } from "./product-modal";
import { PremiumCatalogModal } from "./premium-catalog-modal";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Product } from "@/lib/products";

export function ProductCarousel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const lastScrollTime = useRef<number>(0);
  const isMobile = useIsMobile();
  const cardSpacing = useMemo(() => (isMobile ? 280 : 420), [isMobile]);
  const visibleProducts = useMemo(
    () => products.filter((product) => product.segment !== "premium"),
    [products]
  );

  useEffect(() => {
    let active = true;
    const allowedRemoteHosts = (process.env.NEXT_PUBLIC_ALLOWED_IMAGE_HOSTS ?? "")
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean);

    const isAllowedImage = (value: string) => {
      if (value.startsWith("http://")) return false;
      if (value.startsWith("https://")) {
        try {
          const host = new URL(value).hostname.toLowerCase();
          return allowedRemoteHosts.includes(host);
        } catch {
          return false;
        }
      }
      return value.startsWith("/");
    };

    const hasValidMedia = (item: Product) => {
      if (item.image && !isAllowedImage(item.image)) return false;
      if (item.gallery && item.gallery.length > 0 && item.gallery.some((img) => !isAllowedImage(img))) {
        return false;
      }
      if (item.colorGallery) {
        for (const list of Object.values(item.colorGallery)) {
          if (list.some((img) => !isAllowedImage(img))) return false;
        }
      }
      return true;
    };

    const loadProducts = async () => {
      if (active) {
        setIsLoading(true);
        setLoadError(null);
      }
      try {
        const res = await fetch("/api/products");
        if (!res.ok) {
          if (active) setLoadError("Не удалось загрузить каталог.");
          return;
        }
        const data = await res.json();
        if (active && Array.isArray(data) && data.length > 0) {
          const allValid = data.every((item: Product) => hasValidMedia(item));
          if (allValid) {
            setProducts(data);
            setLoadError(null);
          } else {
            setLoadError("Каталог временно недоступен.");
          }
        } else if (active) {
          setLoadError("Каталог пока пуст.");
        }
      } catch {
        if (active) setLoadError("Ошибка сети при загрузке каталога.");
      } finally {
        if (active) setIsLoading(false);
      }
    };
    loadProducts();
    return () => {
      active = false;
    };
  }, [reloadKey]);

  useEffect(() => {
    if (visibleProducts.length > 0 && activeIndex >= visibleProducts.length) {
      setActiveIndex(0);
    }
  }, [visibleProducts, activeIndex]);

  useEffect(() => {
    if (isMobile && visibleProducts.length > 0) {
      setActiveIndex(0);
    }
  }, [isMobile, visibleProducts.length]);

  const openProductModal = (product: Product) => {
    const catalogSection = document.getElementById("catalog");
    if (catalogSection) {
      const rect = catalogSection.getBoundingClientRect();
      const needsScroll = rect.top < -24 || rect.top > 24;
      if (needsScroll) {
        const targetTop = window.scrollY + rect.top;
        window.scrollTo({ top: targetTop, behavior: "smooth" });
        setSelectedProduct(product);
        window.setTimeout(() => setIsModalOpen(true), 450);
        return;
      }
    }
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const closeProductModal = () => {
    setIsModalOpen(false);
  };

  const handlePrev = () => {
    setActiveIndex((prev) =>
      prev === 0 ? Math.max(0, visibleProducts.length - 1) : prev - 1
    );
  };

  const handleNext = () => {
    setActiveIndex((prev) =>
      prev === Math.max(0, visibleProducts.length - 1) ? 0 : prev + 1
    );
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    setStartX("touches" in e ? e.touches[0].clientX : e.clientX);
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    const endX = "changedTouches" in e ? e.changedTouches[0].clientX : e.clientX;
    const diff = startX - endX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handleNext();
      else handlePrev();
    }
  };

  // Use useEffect to add native wheel handler with { passive: false }
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleNativeWheel = (e: WheelEvent) => {
      // Prevent page scrolling when over carousel
      e.preventDefault();
      
      // Throttle scroll events
      const now = Date.now();
      if (now - lastScrollTime.current < 250) return;
      
      const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const threshold = 30;
      
      if (Math.abs(delta) > threshold) {
        lastScrollTime.current = now;
        if (delta > 0) {
          setActiveIndex((prev) =>
            prev === Math.max(0, visibleProducts.length - 1) ? 0 : prev + 1
          );
        } else {
          setActiveIndex((prev) =>
            prev === 0 ? Math.max(0, visibleProducts.length - 1) : prev - 1
          );
        }
      }
    };

    container.addEventListener('wheel', handleNativeWheel, { passive: false });
    
    return () => {
      container.removeEventListener('wheel', handleNativeWheel);
    };
  }, [visibleProducts.length]);

  const handleCardClick = (index: number, product: Product) => {
    if (index !== activeIndex) {
      setActiveIndex(index);
      return;
    }

    if (product.isUpgrade) {
      setIsPremiumOpen(true);
      return;
    }

    openProductModal(product);
  };

  const getCardStyle = (index: number) => {
    const diff = index - activeIndex;
    const absDiff = Math.abs(diff);
    
    if (absDiff > 2) {
      return {
        transform: `translateX(${diff * 100}%) scale(0.5) rotateY(${diff > 0 ? -60 : 60}deg)`,
        opacity: 0,
        zIndex: 0,
        filter: "blur(4px)",
      };
    }

    const translateX = diff * cardSpacing; // Больше дистанция, меньше перекрытие
    const scale = 1 - absDiff * 0.15;
    const rotateY = diff * -15;
    const opacity = 1 - absDiff * 0.4;
    const zIndex = diff === 0 ? 20 : 10 - absDiff; // Активная карточка всегда сверху

    return {
      transform: `translateX(${translateX}px) scale(${scale}) rotateY(${rotateY}deg)`,
      opacity,
      zIndex,
      filter: diff === 0 ? "none" : "blur(1px)", // Размытие неактивных
      willChange: "transform, opacity, filter",
    };
  };

  return (
    <section id="catalog" className="relative z-10 py-16 sm:py-24 md:py-40">
      {/* Subtle section dividers */}
      <div className="absolute inset-x-0 top-0 h-px bg-foreground/10 pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-foreground/10 pointer-events-none" />
      
      <div className="container relative">
        {/* Section Header */}
        <div className="text-center mb-12 sm:mb-20">
          <div className="flex items-center justify-center gap-4 mb-6">
            <span className="w-12 h-px bg-foreground/20" />
            <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-foreground/40">Коллекция</span>
            <span className="w-12 h-px bg-foreground/20" />
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-light tracking-tight mb-5 sm:mb-6">
            Наши модели
          </h2>
          <p className="text-foreground/40 max-w-md mx-auto text-sm leading-relaxed">
            Каждая модель создана с вниманием к деталям и стремлением к совершенству
          </p>
        </div>

        {/* Carousel Container */}
        {isLoading ? (
          <div className="relative h-[520px] sm:h-[600px] md:h-[700px] rounded-3xl border border-foreground/10 bg-foreground/[0.02] flex items-center justify-center">
            <div className="text-sm text-foreground/50">Загружаем каталог...</div>
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="relative h-[520px] sm:h-[600px] md:h-[700px] rounded-3xl border border-foreground/10 bg-foreground/[0.02] flex items-center justify-center">
            <div className="text-center">
              <div className="text-sm text-foreground/55 mb-4">
                {loadError ?? "Каталог временно недоступен."}
              </div>
              <button
                onClick={() => setReloadKey((prev) => prev + 1)}
                className="rounded-full border border-foreground/20 px-5 py-2 text-xs uppercase tracking-[0.2em] text-foreground/65 hover:text-foreground hover:border-foreground/40 transition-all duration-300"
              >
                Повторить
              </button>
            </div>
          </div>
        ) : (
          <>
            <div 
              ref={containerRef}
              className="relative h-[520px] sm:h-[600px] md:h-[700px] overflow-hidden"
              style={{ perspective: "1200px" }}
              onMouseDown={handleDragStart}
              onMouseUp={handleDragEnd}
              onMouseLeave={() => setIsDragging(false)}
              onTouchStart={handleDragStart}
              onTouchEnd={handleDragEnd}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                {visibleProducts.map((product, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <div
                      key={product.id}
                      className={cn(
                        "absolute w-[260px] sm:w-[300px] md:w-[360px] transition-[transform,opacity,filter] duration-600 ease-out pointer-events-auto cursor-pointer"
                      )}
                      style={{
                        ...getCardStyle(index),
                        transformStyle: "preserve-3d",
                        backfaceVisibility: "hidden",
                      }}
                      onClick={() => handleCardClick(index, product)}
                    >
                      <ProductCard
                        product={product} 
                        isActive={isActive} 
                        onNavigate={() =>
                          product.isUpgrade ? setIsPremiumOpen(true) : openProductModal(product)
                        }
                      />
                    </div>
                  );
                })}
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={handlePrev}
                className="absolute left-2 sm:left-4 md:left-12 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full glass flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all duration-300"
                aria-label="Previous"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 sm:right-4 md:right-12 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full glass flex items-center justify-center text-foreground/50 hover:text-foreground hover:bg-foreground/5 transition-all duration-300"
                aria-label="Next"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Dots Indicator */}
            <div className="flex justify-center items-center gap-3 mt-8 sm:mt-12">
              {visibleProducts.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={cn(
                    "transition-all duration-500",
                    index === activeIndex
                      ? "w-8 h-1 bg-foreground rounded-full"
                      : "w-1 h-1 bg-foreground/20 rounded-full hover:bg-foreground/40"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product Modal */}
      <ProductModal 
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={closeProductModal}
      />
      <PremiumCatalogModal
        isOpen={isPremiumOpen}
        onClose={() => setIsPremiumOpen(false)}
      />
    </section>
  );
}

function ProductCard({ product, isActive, onNavigate }: { product: Product; isActive: boolean; onNavigate: () => void }) {
  if (product.isUpgrade) {
    return (
      <div
        className={cn(
          "relative glass-card rounded-2xl overflow-hidden transition-all duration-500 group border border-foreground/10 text-center sm:text-left",
          isActive && "shadow-glass cursor-pointer"
        )}
      >
        <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
          <h3 className="text-sm sm:text-base md:text-lg font-medium tracking-tight text-foreground/90">
            Премиальная коллекция
          </h3>
        </div>

        <div className="w-full px-5 sm:px-6">
          <div className="w-full h-52 sm:h-60 md:h-72 rounded-2xl overflow-hidden bg-gradient-to-br from-foreground/[0.03] to-transparent">
            <Image
              src="/chairs/premium-catalog-card.png"
              alt="Премиальная коллекция"
              width={720}
              height={576}
              className="w-full h-full object-cover rounded-2xl"
              sizes="(max-width: 768px) 100vw, 420px"
            />
          </div>
        </div>

        <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 sm:pt-4">
          <p className="text-foreground/40 text-[11px] sm:text-xs leading-relaxed mb-4">
            Откройте расширенный каталог кресел с флагманскими линейками мировых брендов.
          </p>

          <ul className="space-y-2 mb-5 sm:mb-6">
            <li className="flex items-center gap-3 text-xs text-foreground/50 justify-center sm:justify-start">
              <span className="w-1 h-1 rounded-full bg-foreground/30" />
              Эксклюзивные материалы
            </li>
            <li className="flex items-center gap-3 text-xs text-foreground/50 justify-center sm:justify-start">
              <span className="w-1 h-1 rounded-full bg-foreground/30" />
              Лимитированные серии
            </li>
            <li className="flex items-center gap-3 text-xs text-foreground/50 justify-center sm:justify-start">
              <span className="w-1 h-1 rounded-full bg-foreground/30" />
              Флагманские бренды
            </li>
          </ul>

          <div className="flex items-end justify-between pt-4 border-t border-foreground/5">
            <div>
              <span className="text-xl sm:text-2xl font-light tracking-tight">Premium</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNavigate();
              }}
              className="group/btn flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.15em] text-foreground/60 hover:text-foreground transition-colors duration-300"
            >
              Открыть
              <ArrowUpRight className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-300" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
      <div
        className={cn(
          "relative glass-card rounded-2xl overflow-hidden transition-all duration-500 group text-center sm:text-left",
          isActive && "shadow-glass cursor-pointer"
        )}
      >
      {/* Title */}
      <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-3 sm:pb-4">
        <h3 className="text-sm sm:text-base md:text-lg font-medium tracking-tight text-foreground/90">
          {product.name}
        </h3>
      </div>

      {/* Product Image */}
      <div className="w-full px-5 sm:px-6">
      <div className="w-full h-52 sm:h-60 md:h-72 rounded-2xl overflow-hidden bg-gradient-to-br from-foreground/[0.02] to-transparent">
            <Image
            src={product.image || "/chairs/catalog%20main%20photos/m5-catalog-main-photo.png"}
            alt={product.name}
            width={720}
            height={576}
            className="w-full h-full object-cover rounded-2xl"
            style={{
              filter: "drop-shadow(0 12px 32px rgba(0,0,0,0.35))",
            }}
            sizes="(max-width: 768px) 100vw, 420px"
            unoptimized={Boolean(product.image?.startsWith("https://"))}
          />
      </div>
      </div>

      {/* Product Info */}
      <div className="px-5 sm:px-6 pb-5 sm:pb-6 pt-3 sm:pt-4">
        <p className="text-foreground/40 text-[11px] sm:text-xs leading-relaxed mb-4">
          {product.description}
        </p>

        <ul className="space-y-2 mb-5 sm:mb-6">
          {product.features.map((feature, i) => (
            <li
              key={i}
              className="flex items-center gap-3 text-[11px] sm:text-xs text-foreground/50 justify-center sm:justify-start"
            >
              <span className="w-1 h-1 rounded-full bg-foreground/30" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="flex items-end justify-between pt-4 border-t border-foreground/5">
          <div>
            <span className="text-xl sm:text-2xl font-light tracking-tight">{product.price}</span>
            <span className="text-foreground/30 text-xs ml-2">RUB</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate();
            }}
            className="group/btn flex items-center gap-2 px-4 py-2 text-xs uppercase tracking-[0.15em] text-foreground/60 hover:text-foreground transition-colors duration-300"
          >
            Детали
            <ArrowUpRight className="w-3 h-3 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
