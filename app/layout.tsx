import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Free PDF to Image Converter - Batch Processing Tool",
    template: "%s | PDF Converter",
  },
  description:
    "Professional PDF to image converter with batch processing, OCR text extraction, and page merging. Completely free, privacy-safe, no registration required. Start converting now!",
  keywords: [
    "PDF to image converter",
    "free PDF converter",
    "online PDF to image",
    "batch PDF processing",
    "PDF to PNG converter",
    "PDF to JPEG tool",
    "OCR text extraction",
    "PDF page merge",
    "privacy safe converter",
    "bulk PDF conversion",
    "PDF text recognition",
    "multi-format PDF converter",
    "PDF to GIF animation",
    "free online tool",
    "secure PDF processing",
    "no registration required",
    "browser-based converter",
  ],
  authors: [{ name: "PDF Converter Tool" }],
  creator: "PDF Converter Tool",
  publisher: "PDF Converter Tool",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["zh_CN"],
    url: "https://www.pdf2img.top",
    siteName: "PDF to Image Converter",
    title: "Free PDF to Image Converter - No Registration Required",
    description:
      "Professional PDF to image converter with batch processing, OCR extraction, and page merging. Completely free, privacy-safe. Start converting now!",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free PDF to Image Converter - Batch Processing",
    description:
      "Professional online PDF to image tool with batch processing, OCR recognition, privacy protection. Completely free, no registration. Start now!",
  },
  alternates: {
    canonical: "https://www.pdf2img.top",
    languages: {
      "en": "https://www.pdf2img.top/en",
      "zh": "https://www.pdf2img.top/zh",
      "x-default": "https://www.pdf2img.top",
    },
  },
  generator: "Next.js",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon.png" />
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "PDF to Image Converter",
              description:
                "Free online PDF to image converter tool that supports batch conversion of PDF documents to PNG or JPEG image files.",
              url: "https://www.pdf2img.top",
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
                "Batch processing",
                "Watermark support",
                "Privacy protection",
                "No server upload required",
              ],
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
