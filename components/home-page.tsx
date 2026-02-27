"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Hero } from "@/components/hero";

const ProductCarousel = dynamic(
  () => import("@/components/product-carousel").then((mod) => mod.ProductCarousel),
  {
    loading: () => <section className="min-h-[520px]" aria-hidden="true" />,
  }
);

const ConfiguratorSection = dynamic(
  () => import("@/components/configurator-section").then((mod) => mod.ConfiguratorSection),
  {
    loading: () => <section className="min-h-[540px]" aria-hidden="true" />,
  }
);

const FeaturesSection = dynamic(
  () => import("@/components/features-section").then((mod) => mod.FeaturesSection),
  {
    loading: () => <section className="min-h-[420px]" aria-hidden="true" />,
  }
);

const AboutSection = dynamic(
  () => import("@/components/about-section").then((mod) => mod.AboutSection),
  {
    loading: () => <section className="min-h-[480px]" aria-hidden="true" />,
  }
);

const StatsBar = dynamic(
  () => import("@/components/stats-bar").then((mod) => mod.StatsBar),
  {
    loading: () => <section className="min-h-[140px]" aria-hidden="true" />,
  }
);

export function HomePage() {
  useEffect(() => {
    const hash = window.location.hash;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    if (!hash) {
      window.scrollTo({ top: 0, left: 0 });
      return;
    }

    const target = document.getElementById(hash.replace("#", ""));
    if (target) {
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, []);

  return (
    <>
      <Hero />
      <ProductCarousel />
      <ConfiguratorSection />
      <FeaturesSection />
      <AboutSection />
      <StatsBar />
    </>
  );
}
