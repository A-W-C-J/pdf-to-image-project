import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "PDF Tech Blog - Processing Tips & Tutorials",
    template: "%s | PDF Tech Blog",
  },
  description:
    "Expert PDF processing tutorials and tips. Learn batch conversion, OCR extraction, page merging, and security best practices. Free guides to master PDF tools efficiently!",
  keywords: [
    "PDF blog",
    "PDF processing tutorials",
    "batch PDF conversion guide",
    "OCR text extraction tips",
    "PDF page merging tutorial",
    "PDF conversion best practices",
    "PDF security guide",
    "document processing tips",
    "PDF tutorials free",
    "PDF processing tips",
    "file conversion guide",
    "advanced PDF tools tutorial",
    "PDF automation guide",
    "PDF workflow optimization",
    "PDF expert tips",
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
    canonical: "https://www.pdf2img.top/blog",
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
            url: "https://www.pdf2img.top/blog",
            publisher: {
              "@type": "Organization",
              name: "PDF Converter Tool",
              url: "https://pdf-converter.vercel.app",
            },
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": "https://www.pdf2img.top/blog",
            },
          }),
        }}
      />
      {children}
    </>
  )
}
