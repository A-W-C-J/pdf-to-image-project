import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: {
    default: "PDF Processing Tech Blog - Tips & Tutorials",
    template: "%s | PDF Tech Blog",
  },
  description:
    "Technical blog about PDF processing, conversion, security, and best practices. Learn how to work with PDF files efficiently.",
  keywords: [
    "PDF blog",
    "PDF processing",
    "PDF conversion",
    "PDF security",
    "document processing",
    "PDF tutorials",
    "PDF tips",
    "file conversion",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    siteName: "PDF Tech Blog",
    title: "PDF Processing Tech Blog - Expert Tips & Tutorials",
    description:
      "Learn PDF processing techniques, conversion methods, and security best practices from our comprehensive technical blog.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF Tech Blog - Expert Tips & Tutorials",
    description: "Technical insights on PDF processing, conversion, and security best practices.",
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
