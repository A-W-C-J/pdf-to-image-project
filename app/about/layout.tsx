import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us - PDF to Image Converter",
  description: "Learn about our mission to provide high-quality, free PDF processing tools. We make document conversion simple and efficient with privacy protection and advanced features.",
  keywords: [
    "about PDF converter",
    "PDF tools team",
    "document conversion",
    "PDF processing",
    "free tools",
    "privacy protection",
    "open source",
    "web development"
  ],
  openGraph: {
    title: "About Us - PDF to Image Converter",
    description: "Learn about our mission to provide high-quality, free PDF processing tools that make document conversion simple and efficient.",
    type: "website",
    url: "https://pdf-converter.vercel.app/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us - PDF to Image Converter",
    description: "Learn about our mission to provide high-quality, free PDF processing tools.",
  },
  alternates: {
    canonical: "https://pdf-converter.vercel.app/about",
    languages: {
      en: "https://pdf-converter.vercel.app/en/about",
      zh: "https://pdf-converter.vercel.app/zh/about",
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