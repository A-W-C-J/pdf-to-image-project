"use client"

import { useLanguage, seoTranslations } from "@/lib/i18n"
import Head from "next/head"

export function SEOHead() {
  const { language } = useLanguage()
  const seo = seoTranslations[language]

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: seo.structuredDataName,
    description: seo.structuredDataDescription,
    url: seo.canonicalUrl,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "PDF to PNG conversion",
      "PDF to JPEG conversion",
      "PDF to GIF conversion",
      "Batch processing",
      "OCR text extraction",
      "PDF page merging",
      "Watermark support",
      "Privacy protection",
      "No server upload required",
      "Multiple file processing",
      "Text recognition",
      "Image quality optimization",
    ],
  }

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{seo.metaTitle}</title>
      <meta name="description" content={seo.metaDescription} />
      <meta name="keywords" content={seo.keywords} />
      <meta name="robots" content="index, follow" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={seo.ogTitle} />
      <meta property="og:description" content={seo.ogDescription} />
      <meta property="og:url" content={seo.canonicalUrl} />
      <meta property="og:site_name" content="PDF to Image Converter" />
      <meta property="og:locale" content={language === "zh" ? "zh_CN" : "en_US"} />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={seo.twitterTitle} />
      <meta name="twitter:description" content={seo.twitterDescription} />

      {/* Additional SEO Meta Tags */}
      <meta name="author" content="PDF Converter Tool" />
      <meta name="generator" content="Next.js" />
      <meta name="theme-color" content="#ffffff" />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData),
        }}
      />
    </Head>
  )
}
