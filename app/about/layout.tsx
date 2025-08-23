import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us - Advanced PDF to Image Converter with Batch Processing",
  description: "Learn about our mission to provide high-quality, free PDF processing tools with advanced features like batch processing, OCR text extraction, and page merging. We make document conversion simple and efficient with privacy protection.",
  keywords: [
    "about PDF converter",
    "batch PDF processing",
    "OCR text extraction",
    "PDF page merging",
    "PDF tools team",
    "document conversion",
    "PDF processing",
    "free tools",
    "privacy protection",
    "advanced features",
    "multiple file processing",
    "web development"
  ],
  openGraph: {
    title: "About Us - Advanced PDF to Image Converter",
    description: "Learn about our mission to provide high-quality, free PDF processing tools with batch processing, OCR text extraction, page merging, and advanced features that make document conversion simple and efficient.",
    type: "website",
    url: "https://www.pdf2img.top/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us - Advanced PDF Processing Tools",
    description: "Learn about our mission to provide high-quality, free PDF processing tools with batch processing and OCR capabilities.",
  },
  alternates: {
    canonical: "https://www.pdf2img.top/about",
    languages: {
      en: "https://www.pdf2img.top/en/about",
      zh: "https://www.pdf2img.top/zh/about",
    },
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
