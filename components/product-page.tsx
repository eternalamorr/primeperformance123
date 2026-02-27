"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useCart } from "@/components/cart-context";
import type { Product } from "@/lib/products";

interface ProductPageProps {
  product: Product;
}

export function ProductPage({ product }: ProductPageProps) {
  const router = useRouter();
  const [selectedColor, setSelectedColor] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const { addItem, setOpen } = useCart();

  const availableColors = useMemo(() => {
    if (!product.colorGallery) {
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

  const activeColorName = availableColors[selectedColor]?.color.name;
  const activeGallery =
    (activeColorName && product.colorGallery?.[activeColorName])?.length
      ? product.colorGallery?.[activeColorName]
      : product.gallery;

  const safeGallery = activeGallery?.length ? activeGallery : product.gallery;

  useEffect(() => {
    setSelectedImage(0);
  }, [selectedColor, product.id]);

  useEffect(() => {
    if (selectedColor >= availableColors.length) {
      setSelectedColor(0);
    }
  }, [availableColors, selectedColor]);

  const handleOrder = () => {
    addItem(product);
    setOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20">
        <div className="container">
          <nav className="flex items-center gap-2 text-sm text-foreground/40 mb-8">
            <Link href="/" className="hover:text-foreground transition-colors">
              Главная
            </Link>
            <ChevronRight className="w-4 h-4" />
            <Link href="/#catalog" className="hover:text-foreground transition-colors">
              Каталог
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">{product.name}</span>
          </nav>

          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-foreground/60 hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            <div className="space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-foreground/[0.03] to-transparent">
                <div className="absolute inset-0 flex items-center justify-center p-8">
                  <Image
                    src={safeGallery[selectedImage] || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-contain p-8"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3">
                {safeGallery.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative aspect-square rounded-xl overflow-hidden border ${
                      selectedImage === index ? "border-foreground" : "border-foreground/10"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} фото ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 25vw, 12vw"
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs uppercase tracking-[0.3em] text-foreground/40">Коллекция</span>
                  {product.badge && (
                    <span className="px-3 py-1 text-xs uppercase tracking-[0.2em] rounded-full border border-foreground/20 text-foreground/60">
                      {product.badge}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl lg:text-4xl font-display font-light mb-4">{product.name}</h1>
                <p className="text-foreground/60 leading-relaxed">{product.fullDescription}</p>
              </div>

              <div>
                <div className="text-2xl font-light">{product.price} RUB</div>
                <p className="text-xs text-foreground/40 uppercase tracking-[0.3em] mt-2">Цена</p>
              </div>

              <div>
                <h3 className="text-sm uppercase tracking-[0.3em] text-foreground/40 mb-4">Цвет</h3>
                <div className="flex flex-wrap gap-3">
                  {availableColors.map(({ color }, listIndex) => (
                    <button
                      key={`${color.name}-${listIndex}`}
                      onClick={() => setSelectedColor(listIndex)}
                      className={`flex items-center gap-3 px-4 py-2 rounded-full border ${
                        selectedColor === listIndex ? "border-foreground" : "border-foreground/10"
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{
                          background: color.splitHex
                            ? `linear-gradient(90deg, ${color.splitHex[0]} 50%, ${color.splitHex[1]} 50%)`
                            : color.hex,
                        }}
                      />
                      <span className="text-sm">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm uppercase tracking-[0.3em] text-foreground/40 mb-4">Преимущества</h3>
                <div className="grid gap-3">
                  {product.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-foreground/60" />
                      <span className="text-sm text-foreground/70">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm uppercase tracking-[0.3em] text-foreground/40 mb-4">Характеристики</h3>
                <div className="space-y-3">
                  {product.specs.map((spec, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between border-b border-foreground/10 pb-3"
                    >
                      <span className="text-sm text-foreground/50">{spec.label}</span>
                      <span className="text-sm text-foreground">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <button
                  onClick={handleOrder}
                  className="px-8 py-3 rounded-full bg-foreground text-background text-sm uppercase tracking-[0.2em] transition-all duration-300 hover:bg-foreground/90"
                >
                  Заказать
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
