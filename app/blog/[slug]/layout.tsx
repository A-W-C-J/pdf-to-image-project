import type React from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

interface BlogPost {
  id: string
  title: string
  titleEn: string
  excerpt: string
  excerptEn: string
  content: string
  contentEn: string
  tags: string[]
  tagsEn: string[]
  publishedAt: string
  readTime: number
  slug: string
  seoKeywords: string[]
  seoKeywordsEn: string[]
}

const mockPosts: BlogPost[] = [
  {
    id: "1",
    title: "如何高效转换PDF文件为图片格式",
    titleEn: "How to Efficiently Convert PDF Files to Image Format",
    excerpt: "详细介绍PDF转图片的最佳实践，包括格式选择、质量优化和批量处理技巧。",
    excerptEn:
      "Comprehensive guide on PDF to image conversion best practices, including format selection, quality optimization, and batch processing tips.",
    content: "PDF转换内容...",
    contentEn: "PDF conversion content...",
    tags: ["PDF转换", "图片格式", "批量处理"],
    tagsEn: ["PDF Conversion", "Image Format", "Batch Processing"],
    publishedAt: "2024-01-15",
    readTime: 5,
    slug: "efficient-pdf-to-image-conversion",
    seoKeywords: ["PDF转图片", "在线PDF转换器", "免费PDF工具"],
    seoKeywordsEn: ["PDF to image", "online PDF converter", "free PDF tool"],
  },
  {
    id: "2",
    title: "PDF文件加密与密码保护完整指南",
    titleEn: "Complete Guide to PDF Encryption and Password Protection",
    excerpt: "学习如何处理受密码保护的PDF文件，包括解密方法和安全最佳实践。",
    excerptEn:
      "Learn how to handle password-protected PDF files, including decryption methods and security best practices.",
    content: "PDF加密内容...",
    contentEn: "PDF encryption content...",
    tags: ["PDF安全", "密码保护", "文件加密"],
    tagsEn: ["PDF Security", "Password Protection", "File Encryption"],
    publishedAt: "2024-01-10",
    readTime: 7,
    slug: "pdf-encryption-password-protection-guide",
    seoKeywords: ["PDF密码", "PDF解密", "PDF安全"],
    seoKeywordsEn: ["PDF password", "PDF decryption", "PDF security"],
  },
]

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = mockPosts.find((p) => p.slug === params.slug)

  if (!post) {
    return {
      title: "Article Not Found",
      description: "The requested article could not be found.",
    }
  }

  const publishedTime = new Date(post.publishedAt).toISOString()
  const modifiedTime = new Date().toISOString()

  return {
    title: post.titleEn,
    description: post.excerptEn,
    keywords: [...post.seoKeywordsEn, ...post.tagsEn],
    authors: [{ name: "PDF Converter Tool" }],
    creator: "PDF Converter Tool",
    publisher: "PDF Converter Tool",
    openGraph: {
      type: "article",
      locale: "en_US",
      alternateLocale: ["zh_CN"],
      url: `https://pdf-converter.vercel.app/blog/${post.slug}`,
      siteName: "PDF Tech Blog",
      title: post.titleEn,
      description: post.excerptEn,
      publishedTime,
      modifiedTime,
      authors: ["PDF Converter Tool"],
      tags: post.tagsEn,
    },
    twitter: {
      card: "summary_large_image",
      title: post.titleEn,
      description: post.excerptEn,
      creator: "@pdfconverter",
    },
    alternates: {
      canonical: `https://pdf-converter.vercel.app/blog/${post.slug}`,
      languages: {
        en: `https://pdf-converter.vercel.app/blog/${post.slug}`,
        zh: `https://pdf-converter.vercel.app/zh/blog/${post.slug}`,
      },
    },
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
  }
}

export async function generateStaticParams() {
  return mockPosts.map((post) => ({
    slug: post.slug,
  }))
}

export default function ArticleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { slug: string }
}) {
  const post = mockPosts.find((p) => p.slug === params.slug)

  if (!post) {
    notFound()
  }

  const publishedTime = new Date(post.publishedAt).toISOString()
  const modifiedTime = new Date().toISOString()

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.titleEn,
            description: post.excerptEn,
            image: `https://pdf-converter.vercel.app/api/og?title=${encodeURIComponent(post.titleEn)}`,
            author: {
              "@type": "Organization",
              name: "PDF Converter Tool",
              url: "https://pdf-converter.vercel.app",
            },
            publisher: {
              "@type": "Organization",
              name: "PDF Converter Tool",
              url: "https://pdf-converter.vercel.app",
              logo: {
                "@type": "ImageObject",
                url: "https://pdf-converter.vercel.app/favicon.png",
              },
            },
            datePublished: publishedTime,
            dateModified: modifiedTime,
            mainEntityOfPage: {
              "@type": "WebPage",
              "@id": `https://pdf-converter.vercel.app/blog/${post.slug}`,
            },
            keywords: post.seoKeywordsEn.join(", "),
            articleSection: "Technology",
            wordCount: post.content.length,
            timeRequired: `PT${post.readTime}M`,
            inLanguage: ["en", "zh"],
            isAccessibleForFree: true,
            url: `https://pdf-converter.vercel.app/blog/${post.slug}`,
          }),
        }}
      />
      {children}
    </>
  )
}
