import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Us - Free PDF Processing Tools",
  description: "Discover our mission to provide professional, free PDF processing tools. We offer batch conversion, OCR extraction, and page merging with complete privacy protection. Start using our tools today!",
  keywords: [
    "about PDF converter",
    "free PDF tools",
    "batch PDF processing",
    "OCR text extraction",
    "PDF page merging",
    "privacy safe PDF tools",
    "document conversion team",
    "PDF processing mission",
    "free online tools",
    "privacy protection",
    "professional PDF tools",
    "no registration required",
    "secure PDF processing"
  ],
  openGraph: {
    title: "About Us - Free PDF Processing Tools",
    description: "Discover our mission to provide professional, free PDF processing tools. We offer batch conversion, OCR extraction, and page merging with complete privacy protection. Start using our tools today!",
    type: "website",
    url: "https://www.pdf2img.top/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Us - Free PDF Processing Tools",
    description: "Professional, free PDF processing tools with batch conversion, OCR extraction, and privacy protection. Start using our tools today!",
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
