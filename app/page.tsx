import { HomePage } from "@/components/home-page";
import { getSiteUrl } from "@/lib/site-url";

export default function Page() {
  const siteUrl = getSiteUrl();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "prime performance",
      url: siteUrl,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "prime performance",
      url: siteUrl,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePage />
    </>
  );
}
