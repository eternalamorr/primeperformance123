"use client";

import { useEffect } from "react";
import { Hero } from "@/components/hero";
import { ProductCarousel } from "@/components/product-carousel";
import { ConfiguratorSection } from "@/components/configurator-section";
import { FeaturesSection } from "@/components/features-section";
import { AboutSection } from "@/components/about-section";
import { StatsBar } from "@/components/stats-bar";

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
