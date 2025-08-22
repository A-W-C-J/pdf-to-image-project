"use client"
import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Save, X, ArrowLeft, Eye, Calendar, Lock, Sparkles, Loader2 } from "lucide-react"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { createClient } from "@/lib/supabase/client"

interface BlogPost {
  id: string
  title: string
  excerpt: string
  content: string
  tags: string[]
  created_at: string
  slug: string
  seo_keywords: string[]
  published: boolean
}

export default function BlogAdminPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Partial<BlogPost>>({})
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)

  const [aiTopic, setAiTopic] = useState("")
  const [aiLanguage, setAiLanguage] = useState("中文")
  const [isGenerating, setIsGenerating] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false })

        if (error) {
          console.error("Error loading articles:", error)
          setError(`加载文章失败: ${error.message || '未知错误'}`)
          return
        }

        setPosts(data || [])
        console.log('博客数据加载成功:', data?.length || 0, '篇文章')
      } catch (error) {
        console.error("Error loading articles:", error)
        setError("加载文章失败")
      } finally {
        setLoading(false)
      }
    }

    if (isAuthenticated) {
      loadArticles()
    }
  }, [isAuthenticated, supabase])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  const handleLogin = () => {
    // Simple password check - in production, use proper authentication
    if (password === "admin123") {
      setIsAuthenticated(true)
      setError("")
    } else {
      setError("密码错误")
    }
  }

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim()
  }

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      setError("请填写所有必填字段")
      return
    }

    setLoading(true)
    setError("")

    try {
      const slug = generateSlug(formData.title || "")

      if (editingPost) {
        // Update existing post
        const { error } = await supabase
          .from("blog_posts")
          .update({
            title: formData.title,
            excerpt: formData.excerpt || "",
            content: formData.content,
            tags: formData.tags || [],
            seo_keywords: formData.seo_keywords || [],
            slug,
            published: formData.published || false,
          })
          .eq("id", editingPost.id)

        if (error) throw error

        // Update local state
        setPosts(
          posts.map((post) => (post.id === editingPost.id ? ({ ...post, ...formData, slug } as BlogPost) : post)),
        )
        setSuccess("文章已更新")
      } else {
        // Create new post
        const { data, error } = await supabase
          .from("blog_posts")
          .insert({
            title: formData.title,
            excerpt: formData.excerpt || "",
            content: formData.content,
            tags: formData.tags || [],
            seo_keywords: formData.seo_keywords || [],
            slug,
            published: formData.published || false,
          })
          .select()
          .single()

        if (error) throw error

        // Add to local state
        setPosts([data, ...posts])
        setSuccess("文章已创建")
      }

      // 重新加载数据以确保列表更新
      const { data: updatedPosts, error: loadError } = await supabase
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false })
      
      if (!loadError && updatedPosts) {
        setPosts(updatedPosts)
      }

      setEditingPost(null)
      setIsCreating(false)
      setFormData({})
      setTimeout(() => setSuccess(""), 3000)
    } catch (error: any) {
      console.error("Error saving article:", error)
      setError(error.message || "保存失败")
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post)
    setFormData(post)
    setIsCreating(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这篇文章吗？")) return

    setLoading(true)
    try {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id)

      if (error) throw error

      setPosts(posts.filter((post) => post.id !== id))
      setSuccess("文章已删除")
      setTimeout(() => setSuccess(""), 3000)
    } catch (error: any) {
      console.error("Error deleting article:", error)
      setError(error.message || "删除失败")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditingPost(null)
    setIsCreating(false)
    setFormData({})
    setError("")
  }

  const parseTagsString = (tagsString: string): string[] => {
    return tagsString
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
  }

  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) {
      setError("请输入创作主题")
      return
    }

    setIsGenerating(true)
    setError("")

    try {
      const response = await fetch("/api/generate-blog", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: aiTopic,
          language: aiLanguage,
        }),
      })

      if (!response.ok) {
        throw new Error("生成失败")
      }

      const aiData = await response.json()

      setFormData({
        title: aiData.title,
        excerpt: aiData.excerpt,
        content: aiData.content,
        tags: aiData.tags || [],
        seo_keywords: aiData.seo_keywords || [],
      })

      setSuccess("AI内容生成成功！请检查并编辑内容")
      setTimeout(() => setSuccess(""), 5000)
    } catch (error: any) {
      console.error("AI generation error:", error)
      setError(error.message || "AI生成失败，请稍后重试")
    } finally {
      setIsGenerating(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>博客管理登录</CardTitle>
            <CardDescription>请输入管理员密码</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                placeholder="输入密码"
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button onClick={handleLogin} className="w-full">
              登录
            </Button>
            <div className="text-center">
              <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
                返回博客
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/blog"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                返回博客
              </Link>
              <div className="h-4 w-px bg-border" />
              <h1 className="text-xl font-semibold">博客管理</h1>
            </div>

            <div className="flex items-center gap-2">
              <ThemeSwitcher currentTheme={theme} onThemeChange={setTheme} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {success && (
          <Alert className="mb-6">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {isCreating || editingPost ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{editingPost ? "编辑文章" : "创建文章"}</span>
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm" disabled={loading}>
                    <Save className="h-4 w-4 mr-1" />
                    {loading ? "保存中..." : "保存"}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-1" />
                    取消
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    AI博客生成助手
                  </CardTitle>
                  <CardDescription>输入主题和语言，让DeepSeek AI为您生成专业的博客内容</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="aiTopic">创作主题</Label>
                      <Input
                        id="aiTopic"
                        value={aiTopic}
                        onChange={(e) => setAiTopic(e.target.value)}
                        placeholder="例如：PDF.js、React、SEO优化"
                        disabled={isGenerating}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="aiLanguage">创作语言</Label>
                      <Select value={aiLanguage} onValueChange={setAiLanguage} disabled={isGenerating}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="中文">中文</SelectItem>
                          <SelectItem value="英语">英语</SelectItem>
                          <SelectItem value="日语">日语</SelectItem>
                          <SelectItem value="韩语">韩语</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button onClick={handleAIGenerate} disabled={isGenerating || !aiTopic.trim()} className="w-full">
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        AI生成中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        生成博客内容
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-2">
                <Label htmlFor="title">标题 *</Label>
                <Input
                  id="title"
                  value={formData.title || ""}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="输入文章标题"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">摘要</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt || ""}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="输入文章摘要"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">内容 *</Label>
                <Textarea
                  id="content"
                  value={formData.content || ""}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="输入文章内容（支持Markdown）"
                  rows={15}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">标签</Label>
                <Input
                  id="tags"
                  value={formData.tags?.join(", ") || ""}
                  onChange={(e) => setFormData({ ...formData, tags: parseTagsString(e.target.value) })}
                  placeholder="标签1, 标签2, 标签3"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoKeywords">SEO关键词</Label>
                <Input
                  id="seoKeywords"
                  value={formData.seo_keywords?.join(", ") || ""}
                  onChange={(e) => setFormData({ ...formData, seo_keywords: parseTagsString(e.target.value) })}
                  placeholder="关键词1, 关键词2, 关键词3"
                />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">文章管理 ({posts.length})</h2>
              <Button onClick={() => setIsCreating(true)} disabled={loading}>
                <Plus className="h-4 w-4 mr-1" />
                新建文章
              </Button>
            </div>

            {loading && posts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">加载中...</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">暂无博客文章</p>
                <p className="text-sm text-muted-foreground mt-2">点击"新建文章"开始创建您的第一篇博客</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {posts.map((post) => (
                  <Card key={post.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <h3 className="text-lg font-semibold">{post.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt}</p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(post.created_at).toLocaleDateString("zh-CN")}
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {post.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link href={`/blog/${post.slug}`} target="_blank">
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm" onClick={() => handleEdit(post)} disabled={loading}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(post.id)} disabled={loading}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
