import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "PDF to Image Converter - Free Online PDF Converter Tool",
    template: "%s | PDF Converter",
  },
  description:
    "Free online PDF to image converter tool. Batch convert PDF to PNG/JPEG format with frontend processing for privacy protection, watermark support and custom scaling.",
  keywords: [
    "PDF to image",
    "PDF converter",
    "PDF to PNG",
    "PDF to JPEG",
    "online converter",
    "batch conversion",
    "free tool",
    "privacy protection",
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
    url: "https://pdf-converter.vercel.app",
    siteName: "PDF to Image Converter",
    title: "PDF to Image Converter - Secure & Fast Online Tool",
    description:
      "Professional PDF to image converter with batch conversion, watermark addition, and multiple format output. Frontend processing protects your file privacy.",
  },
  twitter: {
    card: "summary_large_image",
    title: "PDF to Image Converter - Free Online Tool",
    description:
      "Quickly convert PDF to high-quality images, supports PNG/JPEG formats, batch processing, privacy secure.",
  },
  alternates: {
    canonical: "https://pdf-converter.vercel.app",
    languages: {
      en: "https://pdf-converter.vercel.app/en",
      zh: "https://pdf-converter.vercel.app/zh",
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
              url: "https://pdf-converter.vercel.app",
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
