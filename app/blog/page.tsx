"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { Input } from "@/components/ui/input"
import { Search, Calendar } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useLanguage } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"
import Breadcrumb from "@/components/breadcrumb"
import TagCloud from "@/components/tag-cloud"

interface BlogPost {
  id: string
  title: string
  title_en?: string
  excerpt: string
  excerpt_en?: string
  content: string
  content_en?: string
  tags?: string[]
  tags_en?: string[]
  created_at: string
  read_time?: number
  slug: string
  published?: boolean
  author?: string
  updated_at?: string
}

// 博客数据现在从 Supabase 数据库加载

export default function BlogPage() {
  const { language, setLanguage } = useLanguage()
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredPosts, setFilteredPosts] = useState<BlogPost[]>([])
  const [allPosts, setAllPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const { data, error: supabaseError } = await supabase
          .from("blog_posts")
          .select("*")
          .order("created_at", { ascending: false })

        if (supabaseError) {
          console.error("Error loading articles:", supabaseError)
          setError(`加载文章失败: ${supabaseError.message || '未知错误'}`)
          setAllPosts([])
          setFilteredPosts([])
          return
        }

        // 转换数据格式以匹配 BlogPost 接口
        const formattedPosts: BlogPost[] = (data || []).map(post => ({
          id: post.id,
          title: post.title || '',
          title_en: post.title_en,
          excerpt: post.excerpt || '',
          excerpt_en: post.excerpt_en,
          content: post.content || '',
          content_en: post.content_en,
          tags: Array.isArray(post.tags) ? post.tags : undefined,
          tags_en: Array.isArray(post.tags_en) ? post.tags_en : undefined,
          created_at: post.created_at || new Date().toISOString(),
          read_time: post.read_time || 5,
          slug: post.slug || '',
          published: post.published,
          author: post.author,
          updated_at: post.updated_at
        }))

        setAllPosts(formattedPosts)
        setFilteredPosts(formattedPosts)
        console.log('博客数据加载成功:', formattedPosts.length, '篇文章')
      } catch (error) {
        console.error("Error loading articles:", error)
        setError('加载文章时发生错误')
        setAllPosts([])
        setFilteredPosts([])
      } finally {
        setLoading(false)
      }
    }

    loadArticles()
  }, [supabase])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPosts(allPosts)
      return
    }

    const filtered = allPosts.filter((post) => {
      const title = language === "zh" ? post.title : (post.title_en || post.title)
      const excerpt = language === "zh" ? post.excerpt : (post.excerpt_en || post.excerpt)
      const tags = language === "zh" ? (post.tags || []) : (post.tags_en || post.tags || [])

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
      <div className="fixed top-4 right-4 z-10 flex flex-col sm:flex-row gap-2">
        <ThemeSwitcher currentTheme={theme} onThemeChange={setTheme} language={language} />
        <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Breadcrumb />
        </div>
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

        {/* 标签云 */}
        <div className="mb-8">
          <TagCloud language={language} maxTags={15} />
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {language === "zh" ? "正在加载文章..." : "Loading articles..."}
            </p>
          </div>
        )}

        {/* 错误状态 */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {language === "zh" ? "重新加载" : "Reload"}
            </button>
          </div>
        )}

        {/* 博客列表 */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg leading-tight">
                    <Link href={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                      {language === "zh" ? post.title : (post.title_en || post.title)}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {language === "zh" ? post.excerpt : (post.excerpt_en || post.excerpt)}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-1">
                    {(language === "zh" ? (post.tags || []) : (post.tags_en || post.tags || [])).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        <Link href={`/blog/tag/${encodeURIComponent(tag)}`} className="hover:text-primary transition-colors">
                          {tag}
                        </Link>
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(post.created_at).toLocaleDateString(language === "zh" ? "zh-CN" : "en-US")}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && filteredPosts.length === 0 && (
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
