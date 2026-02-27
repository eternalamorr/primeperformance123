import React from "react"
import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { HeaderWrapper } from "@/components/header-wrapper";
import { FooterWrapper } from "@/components/footer-wrapper";
import { CartProvider } from "@/components/cart-context";
import { CookieConsent } from "@/components/cookie-consent";
import { BootLoader } from "@/components/boot-loader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const siteName = "PRIME PERFORMANCE";
const defaultTitle = "Премиальные офисные кресла";
const defaultDescription =
  "Офисные кресла бизнес-класса в стиле BMW M-серии. Премиальные материалы, эргономика и максимальный комфорт для работы.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} | ${defaultTitle}`,
    template: `%s | ${siteName}`,
  },
  description: defaultDescription,
  applicationName: siteName,
  generator: "Next.js",
  keywords: [
    "офисное кресло BMW",
    "офисное кресло BMW M5 F90",
    "офисные кресла бизнес класса",
    "кресло BMW M5",
    "кресло BMW M5 F90",
    "премиальные офисные кресла",
    "кресло руководителя",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName,
    title: `${siteName} | ${defaultTitle}`,
    description: defaultDescription,
    images: [
      {
        url: "/chairs/catalog%20main%20photos/m5-catalog-main-photo.png",
        width: 1200,
        height: 630,
        alt: "Премиальные офисные кресла prime performance",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteName} | ${defaultTitle}`,
    description: defaultDescription,
    images: ["/chairs/catalog%20main%20photos/m5-catalog-main-photo.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <CartProvider>
          <BootLoader />
          <HeaderWrapper />
          {children}
          <FooterWrapper />
          <CookieConsent />
        </CartProvider>
      </body>
    </html>
  );
}
