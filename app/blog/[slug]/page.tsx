"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Calendar, Clock, Share2, BookOpen, ArrowUp } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { translations, type Language, type TranslationKey } from "@/lib/i18n"

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
    content: `
# PDF转图片的完整指南

PDF文件转换为图片格式是日常工作中经常遇到的需求。无论是为了在网页上展示文档内容，还是为了方便在移动设备上查看，PDF转图片都是一个实用的功能。

## 选择合适的图片格式

### PNG格式
- 支持透明背景
- 无损压缩，质量最高
- 文件体积较大
- 适合包含文字和图表的文档

### JPEG格式
- 有损压缩，文件体积小
- 不支持透明背景
- 适合包含照片的文档
- 压缩比可调节

## 质量优化技巧

1. **选择合适的分辨率**：通常3.0倍缩放可以获得清晰的图片
2. **批量处理**：一次性转换多页PDF可以提高效率
3. **添加水印**：保护文档版权

## 隐私保护

我们的工具采用前端处理技术，所有转换过程都在您的浏览器中完成，确保文档隐私安全。

## 常见问题解答

### 为什么选择前端处理？
前端处理确保您的文档不会被上传到任何服务器，完全保护您的隐私。

### 支持哪些浏览器？
支持所有现代浏览器，包括Chrome、Firefox、Safari和Edge。

## 总结

PDF转图片是一个实用的功能，选择合适的工具和参数可以获得最佳的转换效果。
    `,
    contentEn: `
# Complete Guide to PDF to Image Conversion

Converting PDF files to image formats is a common requirement in daily work. Whether it's for displaying document content on web pages or for convenient viewing on mobile devices, PDF to image conversion is a practical feature.

## Choosing the Right Image Format

### PNG Format
- Supports transparent backgrounds
- Lossless compression, highest quality
- Larger file size
- Suitable for documents containing text and charts

### JPEG Format
- Lossy compression, smaller file size
- No transparent background support
- Suitable for documents containing photos
- Adjustable compression ratio

## Quality Optimization Tips

1. **Choose appropriate resolution**: Usually 3.0x scaling provides clear images
2. **Batch processing**: Converting multi-page PDFs at once improves efficiency
3. **Add watermarks**: Protect document copyright

## Privacy Protection

Our tool uses frontend processing technology, all conversion processes are completed in your browser, ensuring document privacy and security.

## Frequently Asked Questions

### Why choose frontend processing?
Frontend processing ensures your documents are never uploaded to any server, completely protecting your privacy.

### Which browsers are supported?
Supports all modern browsers including Chrome, Firefox, Safari, and Edge.

## Summary

PDF to image conversion is a practical feature, choosing the right tools and parameters can achieve the best conversion results.
    `,
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
    content: `
# PDF加密与密码保护指南

PDF文件的安全性对于保护敏感信息至关重要。本文将详细介绍PDF加密机制和如何正确处理受密码保护的文件。

## PDF加密类型

### 用户密码（User Password）
- 限制文档的打开权限
- 需要输入密码才能查看内容
- 也称为"打开密码"

### 所有者密码（Owner Password）
- 控制文档的编辑权限
- 限制打印、复制、编辑等操作
- 也称为"权限密码"

## 处理加密PDF的最佳实践

1. **密码管理**：使用强密码并妥善保管
2. **权限设置**：根据需要设置适当的访问权限
3. **安全传输**：通过安全渠道传输加密文件

## 我们的工具如何处理加密PDF

我们的转换器支持处理受密码保护的PDF文件，只需输入正确的密码即可进行转换。所有处理过程都在本地完成，确保您的密码和文件安全。

## 安全建议

### 密码强度
- 使用至少8位字符
- 包含大小写字母、数字和特殊字符
- 避免使用常见词汇

### 文件管理
- 定期更新密码
- 备份重要文件
- 使用可靠的密码管理器
    `,
    contentEn: `
# PDF Encryption and Password Protection Guide

PDF file security is crucial for protecting sensitive information. This article will detail PDF encryption mechanisms and how to properly handle password-protected files.

## Types of PDF Encryption

### User Password
- Restricts document opening permissions
- Requires password input to view content
- Also known as "open password"

### Owner Password
- Controls document editing permissions
- Restricts printing, copying, editing operations
- Also known as "permissions password"

## Best Practices for Handling Encrypted PDFs

1. **Password Management**: Use strong passwords and keep them secure
2. **Permission Settings**: Set appropriate access permissions as needed
3. **Secure Transmission**: Transmit encrypted files through secure channels

## How Our Tool Handles Encrypted PDFs

Our converter supports processing password-protected PDF files, simply enter the correct password to proceed with conversion. All processing is done locally, ensuring your passwords and files remain secure.

## Security Recommendations

### Password Strength
- Use at least 8 characters
- Include uppercase, lowercase, numbers, and special characters
- Avoid common words

### File Management
- Update passwords regularly
- Backup important files
- Use reliable password managers
    `,
    tags: ["PDF安全", "密码保护", "文件加密"],
    tagsEn: ["PDF Security", "Password Protection", "File Encryption"],
    publishedAt: "2024-01-10",
    readTime: 7,
    slug: "pdf-encryption-password-protection-guide",
    seoKeywords: ["PDF密码", "PDF解密", "PDF安全"],
    seoKeywordsEn: ["PDF password", "PDF decryption", "PDF security"],
  },
]

interface BlogPostPageProps {
  params: {
    slug: string
  }
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
  const [language, setLanguage] = useState<Language>("zh")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [readingProgress, setReadingProgress] = useState(0)
  const [showBackToTop, setShowBackToTop] = useState(false)
  const [allPosts, setAllPosts] = useState<BlogPost[]>(mockPosts)

  const t = (key: TranslationKey): string => translations[language][key]

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  useEffect(() => {
    const loadArticles = () => {
      try {
        const storedArticles = localStorage.getItem("blogArticles")
        if (storedArticles) {
          const articles = JSON.parse(storedArticles)
          const combinedPosts = [
            ...articles,
            ...mockPosts.filter((mock) => !articles.some((stored: BlogPost) => stored.slug === mock.slug)),
          ]
          setAllPosts(combinedPosts)
        } else {
          setAllPosts(mockPosts)
        }
      } catch (error) {
        console.error("Error loading articles:", error)
        setAllPosts(mockPosts)
      }
    }

    loadArticles()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = (scrollTop / docHeight) * 100

      setReadingProgress(Math.min(100, Math.max(0, progress)))
      setShowBackToTop(scrollTop > 500)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const post = allPosts.find((p) => p.slug === params.slug)

  if (!post) {
    notFound()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: language === "zh" ? post.title : post.titleEn,
          text: language === "zh" ? post.excerpt : post.excerptEn,
          url: window.location.href,
        })
      } catch (err) {
        console.log("Error sharing:", err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const generateTableOfContents = (content: string) => {
    const headings = content.match(/^#{1,3}\s+(.+)$/gm) || []
    return headings.map((heading, index) => {
      const level = heading.match(/^#+/)?.[0].length || 1
      const text = heading.replace(/^#+\s+/, "")
      const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      return { level, text, id, index }
    })
  }

  const tableOfContents = generateTableOfContents(language === "zh" ? post.content : post.contentEn)

  const formatContent = (content: string) => {
    return content.replace(/^(#{1,3})\s+(.+)$/gm, (match, hashes, text) => {
      const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
      return `${hashes} ${text} {#${id}}`
    })
  }

  const relatedPosts = allPosts.filter((p) => p.id !== post.id).slice(0, 2)

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-150 ease-out"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/blog"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                {t("backToBlog")}
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                {t("share")}
              </Button>
              <ThemeSwitcher currentTheme={theme} onThemeChange={setTheme} language={language} />
              <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1 order-2 lg:order-1">
            <div className="sticky top-8 space-y-6">
              {tableOfContents.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="h-4 w-4" />
                      <h3 className="font-semibold text-sm">{language === "zh" ? "目录" : "Table of Contents"}</h3>
                    </div>
                    <nav className="space-y-2">
                      {tableOfContents.map((item) => (
                        <a
                          key={item.index}
                          href={`#${item.id}`}
                          className={`block text-sm text-muted-foreground hover:text-foreground transition-colors ${
                            item.level === 1 ? "font-medium" : item.level === 2 ? "pl-3" : "pl-6"
                          }`}
                        >
                          {item.text}
                        </a>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
              )}

              {relatedPosts.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-sm mb-4">
                      {language === "zh" ? "相关文章" : "Related Articles"}
                    </h3>
                    <div className="space-y-3">
                      {relatedPosts.map((relatedPost) => (
                        <Link key={relatedPost.id} href={`/blog/${relatedPost.slug}`} className="block group">
                          <h4 className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                            {language === "zh" ? relatedPost.title : relatedPost.titleEn}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {relatedPost.readTime} {t("minRead")}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </aside>

          <article className="lg:col-span-3 order-1 lg:order-2 space-y-8">
            <header className="space-y-4">
              <h1 className="text-4xl font-bold leading-tight">{language === "zh" ? post.title : post.titleEn}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.publishedAt).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US")}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readTime} {t("minRead")}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {(language === "zh" ? post.tags : post.tagsEn).map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </header>

            <Card>
              <CardContent className="prose prose-gray dark:prose-invert max-w-none pt-6">
                <div
                  className="space-y-6"
                  dangerouslySetInnerHTML={{
                    __html: (language === "zh" ? post.content : post.contentEn)
                      .split("\n")
                      .map((line) => {
                        if (line.startsWith("# ")) {
                          const text = line.replace("# ", "")
                          const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
                          return `<h1 id="${id}" class="text-3xl font-bold mt-8 mb-4 scroll-mt-8">${text}</h1>`
                        }
                        if (line.startsWith("## ")) {
                          const text = line.replace("## ", "")
                          const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
                          return `<h2 id="${id}" class="text-2xl font-semibold mt-6 mb-3 scroll-mt-8">${text}</h2>`
                        }
                        if (line.startsWith("### ")) {
                          const text = line.replace("### ", "")
                          const id = text.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5]+/g, "-")
                          return `<h3 id="${id}" class="text-xl font-medium mt-4 mb-2 scroll-mt-8">${text}</h3>`
                        }
                        if (line.startsWith("- ")) {
                          return `<li class="ml-4">${line.replace("- ", "")}</li>`
                        }
                        if (line.match(/^\d+\.\s/)) {
                          return `<li class="ml-4">${line.replace(/^\d+\.\s/, "")}</li>`
                        }
                        if (line.startsWith("**") && line.endsWith("**")) {
                          return `<p class="font-semibold mt-4 mb-2">${line.replace(/\*\*/g, "")}</p>`
                        }
                        if (line.trim() === "") {
                          return "<br>"
                        }
                        return `<p class="mb-4 leading-relaxed">${line}</p>`
                      })
                      .join(""),
                  }}
                />
              </CardContent>
            </Card>

            <footer className="border-t pt-8">
              <div className="flex justify-between items-center">
                <Link href="/blog" className="text-primary hover:underline">
                  {t("viewMoreArticles")}
                </Link>
                <Link href="/" className="text-primary hover:underline">
                  {t("usePdfConverter")}
                </Link>
              </div>
            </footer>
          </article>
        </div>
      </main>

      {showBackToTop && (
        <Button onClick={scrollToTop} size="sm" className="fixed bottom-8 right-8 z-40 rounded-full shadow-lg">
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
