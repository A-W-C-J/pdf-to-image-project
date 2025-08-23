import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "PDF Processing Tech Blog - Batch Processing, OCR & Advanced Tips",
    template: "%s | PDF Tech Blog",
  },
  description:
    "Technical blog about advanced PDF processing, batch conversion, OCR text extraction, page merging, security, and best practices. Learn how to work with PDF files efficiently using modern tools.",
  keywords: [
    "PDF blog",
    "PDF processing",
    "batch PDF conversion",
    "OCR text extraction",
    "PDF page merging",
    "PDF conversion",
    "PDF security",
    "document processing",
    "PDF tutorials",
    "PDF tips",
    "file conversion",
    "advanced PDF tools",
    "PDF automation",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    siteName: "PDF Tech Blog",
    title: "PDF Processing Tech Blog - Batch Processing, OCR & Advanced Tutorials",
    description:
      "Learn advanced PDF processing techniques including batch conversion, OCR text extraction, page merging, and security best practices from our comprehensive technical blog.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Tech Blog - Advanced Processing & OCR Tutorials",
    description: "Technical insights on advanced PDF processing, batch conversion, OCR text extraction, and security best practices.",
  },
  alternates: {
    canonical: "https://pdf-converter.vercel.app/blog",
    types: {
      "application/rss+xml": [{ url: "/blog/rss.xml", title: "PDF Tech Blog RSS Feed" }],
    },
  },
}

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Blog",
            name: "PDF Processing Tech Blog",
            description: "Technical blog about PDF processing, conversion, security, and best practices",
            url: "https://pdf-converter.vercel.app/blog",
            publisher: {
              "@type": "Organization",
              name: "PDF Converter Tool",
              url: "https://pdf-converter.vercel.app",
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": "https://pdf-converter.vercel.app/blog",
            },
          }),
        }}
      />
      {children}
    </>
  )
}
