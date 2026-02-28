import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductPage } from "@/components/product-page";
import { getProductByIdFromDb, getProductIdsFromDb } from "@/lib/products-db";
import { getSiteUrl } from "@/lib/site-url";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  try {
    const ids = await getProductIdsFromDb();
    return ids.map((id) => ({ id: String(id) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isFinite(productId)) {
    return { title: "Товар не найден" };
  }

  const product = await getProductByIdFromDb(productId).catch(() => null);
  if (!product) {
    return { title: "Товар не найден" };
  }

  const title = `${product.name}`;
  const description = product.description;

  return {
    title,
    description,
    alternates: {
      canonical: `/product/${productId}`,
    },
    openGraph: {
      title,
      description,
      images: product.image ? [product.image] : undefined,
      type: "website",
    },
  };
}

export default async function ProductPageRoute({ params }: PageProps) {
  const { id } = await params;
  const productId = Number(id);

  if (!Number.isFinite(productId)) {
    notFound();
  }

  const product = await getProductByIdFromDb(productId);
  if (!product) {
    notFound();
  }

  const siteUrl = getSiteUrl();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image ? [`${siteUrl}${product.image}`] : undefined,
    brand: {
      "@type": "Brand",
      name: "prime performance",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "RUB",
      price: product.price.replace(/\s/g, ""),
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/product/${productId}`,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductPage product={product} />
    </>
  );
}
