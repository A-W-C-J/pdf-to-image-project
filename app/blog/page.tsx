"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Calendar, ArrowLeft } from "lucide-react"
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

export default function BlogPage() {
  const [language, setLanguage] = useState<Language>("zh")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([])
  const [allPosts, setAllPosts] = useState<BlogPost[]>([])

  const t = (key: TranslationKey): string => translations[language][key]

  useEffect(() => {
    const loadArticles = () => {
      try {
        const storedArticles = localStorage.getItem("blogArticles")
        if (storedArticles) {
          const articles = JSON.parse(storedArticles)
          setAllPosts(articles)
          setFilteredPosts(articles)
        } else {
          setAllPosts([])
          setFilteredPosts([])
        }
      } catch (error) {
        console.error("Error loading articles:", error)
        setAllPosts([])
        setFilteredPosts([])
      }
    }

    loadArticles()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPosts(allPosts)
      return
    }

    const filtered = allPosts.filter((post) => {
      const title = language === "zh" ? post.title : post.titleEn
      const excerpt = language === "zh" ? post.excerpt : post.excerptEn
      const tags = language === "zh" ? post.tags : post.tagsEn

      return (
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tags.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    })

    setFilteredPosts(filtered)
  }, [searchTerm, language, allPosts])

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                {language === "zh" ? "返回转换器" : "Back to Converter"}
              </Link>
              <div className="h-4 w-px bg-border" />
              <h1 className="text-xl font-semibold">{language === "zh" ? "技术博客" : "Tech Blog"}</h1>
            </div>

            <div className="flex items-center gap-2">
              <ThemeSwitcher currentTheme={theme} onThemeChange={setTheme} language={language} />
              <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-6 mb-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold">{language === "zh" ? "PDF处理技术博客" : "PDF Processing Tech Blog"}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === "zh"
                ? "分享PDF处理、格式转换、文档安全等技术知识和最佳实践"
                : "Sharing technical knowledge and best practices on PDF processing, format conversion, and document security"}
            </p>
          </div>

          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "zh" ? "搜索文章..." : "Search articles..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Card key={post.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg leading-tight">
                  <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                    {language === "zh" ? post.title : post.titleEn}
                  </Link>
                </CardTitle>
                <CardDescription className="line-clamp-3">
                  {language === "zh" ? post.excerpt : post.excerptEn}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-1">
                  {(language === "zh" ? post.tags : post.tagsEn).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  {new Date(post.publishedAt).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US")}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {searchTerm
                ? language === "zh"
                  ? "没有找到相关文章"
                  : "No articles found"
                : language === "zh"
                  ? "暂无文章，请前往管理界面创建"
                  : "No articles yet, please create some in the admin interface"}
            </p>
            {!searchTerm && (
              <Link
                href="/blog/admin"
                className="inline-block mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {language === "zh" ? "前往管理界面" : "Go to Admin"}
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
