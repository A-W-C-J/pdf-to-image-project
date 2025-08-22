import type { MetadataRoute } from "next"

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

export default function sitemap(): MetadataRoute.Sitemap {
  const blogPosts = mockPosts.map((post) => ({
    url: `https://pdf-converter.vercel.app/blog/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
    alternates: {
      languages: {
        en: `https://pdf-converter.vercel.app/blog/${post.slug}`,
        zh: `https://pdf-converter.vercel.app/zh/blog/${post.slug}`,
      },
    },
  }))

  return [
    {
      url: "https://pdf-converter.vercel.app/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
      alternates: {
        languages: {
          en: "https://pdf-converter.vercel.app/blog",
          zh: "https://pdf-converter.vercel.app/zh/blog",
        },
      },
    },
    ...blogPosts,
  ]
}
