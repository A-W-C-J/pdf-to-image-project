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
import { Plus, Edit, Trash2, Save, X, ArrowLeft, Eye, Calendar, Clock, Lock } from "lucide-react"
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

const initialPosts: BlogPost[] = [
  {
    id: "3",
    title: "PDF.js完整技术指南：前端PDF处理的最佳实践",
    titleEn: "Complete PDF.js Technical Guide: Best Practices for Frontend PDF Processing",
    excerpt: "深入探讨PDF.js库的核心功能、API使用方法、性能优化技巧以及在现代Web应用中的最佳实践。",
    excerptEn:
      "In-depth exploration of PDF.js library core features, API usage methods, performance optimization techniques, and best practices in modern web applications.",
    content: `# PDF.js完整技术指南：前端PDF处理的最佳实践

## 什么是PDF.js？

PDF.js是Mozilla开发的一个开源JavaScript库，它使用HTML5 Canvas和Web标准技术在浏览器中渲染PDF文档，无需任何插件或扩展。作为Firefox浏览器的默认PDF查看器，PDF.js已经成为Web端PDF处理的事实标准。

## 核心特性与优势

### 1. 纯JavaScript实现
- 无需Adobe Reader或其他PDF插件
- 跨平台兼容，支持所有现代浏览器
- 完全基于Web标准技术

### 2. 强大的渲染能力
- 高质量PDF页面渲染
- 支持矢量图形和文本选择
- 可配置的缩放和旋转功能

### 3. 丰富的API接口
- 文档加载和解析
- 页面渲染控制
- 文本提取和搜索
- 注释和表单处理

## 技术架构深度解析

### Worker线程架构
PDF.js采用Web Worker架构来处理PDF解析，避免阻塞主线程：

\`\`\`javascript
// 配置Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';

// 异步加载PDF
const loadingTask = pdfjsLib.getDocument('document.pdf');
loadingTask.promise.then(function(pdf) {
    console.log('PDF加载完成，页数：', pdf.numPages);
});
\`\`\`

### 渲染管道
1. **PDF解析**：Worker线程解析PDF结构
2. **页面渲染**：主线程使用Canvas API渲染
3. **文本层**：创建透明文本层支持选择和搜索

## 高级功能实现

### 1. 密码保护PDF处理
\`\`\`javascript
const loadingTask = pdfjsLib.getDocument({
    url: 'protected.pdf',
    password: 'user-password'
});

// 处理密码回调
loadingTask.onPassword = function(callback, reason) {
    const password = prompt('请输入PDF密码：');
    callback(password);
};
\`\`\`

### 2. 自定义渲染参数
\`\`\`javascript
const renderContext = {
    canvasContext: canvas.getContext('2d'),
    viewport: page.getViewport({ scale: 2.0 }),
    intent: 'display', // 或 'print'
    renderInteractiveForms: true
};

page.render(renderContext);
\`\`\`

### 3. 文本提取与搜索
\`\`\`javascript
page.getTextContent().then(function(textContent) {
    const textItems = textContent.items;
    const fullText = textItems.map(item => item.str).join(' ');
    console.log('页面文本：', fullText);
});
\`\`\`

## 性能优化策略

### 1. 内存管理
- 及时清理不需要的页面对象
- 使用页面缓存机制
- 控制同时渲染的页面数量

### 2. 渲染优化
- 使用适当的缩放比例
- 实现懒加载机制
- 优化Canvas尺寸

### 3. 网络优化
- 启用HTTP/2和压缩
- 使用CDN加速Worker文件
- 实现增量加载

## 实际应用场景

### 1. 在线PDF查看器
构建功能完整的PDF查看器，支持缩放、旋转、搜索等功能。

### 2. PDF转图片服务
将PDF页面转换为高质量图片，支持批量处理和自定义参数。

### 3. 文档预览系统
在Web应用中嵌入PDF预览功能，提升用户体验。

### 4. 表单处理系统
处理PDF表单数据，实现在线填写和提交功能。

## 常见问题与解决方案

### 1. CORS问题
确保PDF文件和Worker文件正确配置CORS头部。

### 2. 内存泄漏
正确调用cleanup方法释放资源。

### 3. 字体渲染问题
配置字体映射和回退机制。

## 未来发展趋势

PDF.js持续发展，未来将支持更多PDF特性：
- 更好的注释支持
- 增强的表单处理
- 改进的性能和内存使用
- 更多的API功能

## 总结

PDF.js作为前端PDF处理的首选方案，提供了强大而灵活的功能。通过合理使用其API和优化策略，可以构建出高性能的PDF应用。随着Web技术的发展，PDF.js将继续在文档处理领域发挥重要作用。`,
    contentEn: `# Complete PDF.js Technical Guide: Best Practices for Frontend PDF Processing

## What is PDF.js?

PDF.js is an open-source JavaScript library developed by Mozilla that renders PDF documents in browsers using HTML5 Canvas and web standard technologies, without requiring any plugins or extensions. As the default PDF viewer for Firefox browser, PDF.js has become the de facto standard for web-based PDF processing.

## Core Features and Advantages

### 1. Pure JavaScript Implementation
- No need for Adobe Reader or other PDF plugins
- Cross-platform compatibility, supports all modern browsers
- Completely based on web standard technologies

### 2. Powerful Rendering Capabilities
- High-quality PDF page rendering
- Support for vector graphics and text selection
- Configurable zoom and rotation features

### 3. Rich API Interface
- Document loading and parsing
- Page rendering control
- Text extraction and search
- Annotation and form processing

## In-Depth Technical Architecture Analysis

### Worker Thread Architecture
PDF.js uses Web Worker architecture to handle PDF parsing, avoiding main thread blocking:

\`\`\`javascript
// Configure Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'pdf.worker.min.js';

// Asynchronously load PDF
const loadingTask = pdfjsLib.getDocument('document.pdf');
loadingTask.promise.then(function(pdf) {
    console.log('PDF loaded, pages:', pdf.numPages);
});
\`\`\`

### Rendering Pipeline
1. **PDF Parsing**: Worker thread parses PDF structure
2. **Page Rendering**: Main thread renders using Canvas API
3. **Text Layer**: Creates transparent text layer for selection and search

## Advanced Feature Implementation

### 1. Password-Protected PDF Handling
\`\`\`javascript
const loadingTask = pdfjsLib.getDocument({
    url: 'protected.pdf',
    password: 'user-password'
});

// Handle password callback
loadingTask.onPassword = function(callback, reason) {
    const password = prompt('Enter PDF password:');
    callback(password);
};
\`\`\`

### 2. Custom Rendering Parameters
\`\`\`javascript
const renderContext = {
    canvasContext: canvas.getContext('2d'),
    viewport: page.getViewport({ scale: 2.0 }),
    intent: 'display', // or 'print'
    renderInteractiveForms: true
};

page.render(renderContext);
\`\`\`

### 3. Text Extraction and Search
\`\`\`javascript
page.getTextContent().then(function(textContent) {
    const textItems = textContent.items;
    const fullText = textItems.map(item => item.str).join(' ');
    console.log('Page text:', fullText);
});
\`\`\`

## Performance Optimization Strategies

### 1. Memory Management
- Timely cleanup of unnecessary page objects
- Use page caching mechanisms
- Control the number of simultaneously rendered pages

### 2. Rendering Optimization
- Use appropriate scale ratios
- Implement lazy loading mechanisms
- Optimize Canvas dimensions

### 3. Network Optimization
- Enable HTTP/2 and compression
- Use CDN to accelerate Worker files
- Implement incremental loading

## Practical Application Scenarios

### 1. Online PDF Viewer
Build a fully-featured PDF viewer supporting zoom, rotation, search, and other functions.

### 2. PDF to Image Service
Convert PDF pages to high-quality images, supporting batch processing and custom parameters.

### 3. Document Preview System
Embed PDF preview functionality in web applications to enhance user experience.

### 4. Form Processing System
Process PDF form data, enabling online filling and submission.

## Common Issues and Solutions

### 1. CORS Issues
Ensure PDF files and Worker files have proper CORS headers configured.

### 2. Memory Leaks
Properly call cleanup methods to release resources.

### 3. Font Rendering Issues
Configure font mapping and fallback mechanisms.

## Future Development Trends

PDF.js continues to evolve, with future support for more PDF features:
- Better annotation support
- Enhanced form processing
- Improved performance and memory usage
- More API functionality

## Conclusion

As the preferred solution for frontend PDF processing, PDF.js provides powerful and flexible functionality. Through proper use of its APIs and optimization strategies, high-performance PDF applications can be built. With the development of web technologies, PDF.js will continue to play an important role in document processing.`,
    tags: ["PDF.js", "前端开发", "JavaScript", "Web技术", "文档处理"],
    tagsEn: ["PDF.js", "Frontend Development", "JavaScript", "Web Technology", "Document Processing"],
    publishedAt: "2024-01-20",
    readTime: 12,
    slug: "complete-pdfjs-technical-guide",
    seoKeywords: ["PDF.js教程", "前端PDF处理", "JavaScript PDF", "Web PDF查看器", "PDF.js API", "PDF转换技术"],
    seoKeywordsEn: [
      "PDF.js tutorial",
      "frontend PDF processing",
      "JavaScript PDF",
      "web PDF viewer",
      "PDF.js API",
      "PDF conversion technology",
    ],
  },
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

export default function BlogAdminPage() {
  const [language, setLanguage] = useState<Language>("zh")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts)
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Partial<BlogPost>>({})
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const t = (key: TranslationKey): string => translations[language][key]

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  const handleLogin = () => {
    // Simple password check - in production, use proper authentication
    if (password === "admin123") {
      setIsAuthenticated(true)
      setError("")
    } else {
      setError(language === "zh" ? "密码错误" : "Incorrect password")
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

  const handleSave = () => {
    if (!formData.title || !formData.titleEn || !formData.content || !formData.contentEn) {
      setError(language === "zh" ? "请填写所有必填字段" : "Please fill in all required fields")
      return
    }

    const slug = generateSlug(formData.titleEn || formData.title || "")
    const now = new Date().toISOString().split("T")[0]

    if (editingPost) {
      // Update existing post
      setPosts(
        posts.map((post) => (post.id === editingPost.id ? ({ ...editingPost, ...formData, slug } as BlogPost) : post)),
      )
      setSuccess(language === "zh" ? "文章已更新" : "Article updated")
    } else {
      // Create new post
      const newPost: BlogPost = {
        id: Date.now().toString(),
        title: formData.title || "",
        titleEn: formData.titleEn || "",
        excerpt: formData.excerpt || "",
        excerptEn: formData.excerptEn || "",
        content: formData.content || "",
        contentEn: formData.contentEn || "",
        tags: formData.tags || [],
        tagsEn: formData.tagsEn || [],
        publishedAt: now,
        readTime: Math.ceil((formData.content?.length || 0) / 200),
        slug,
        seoKeywords: formData.seoKeywords || [],
        seoKeywordsEn: formData.seoKeywordsEn || [],
      }
      setPosts([newPost, ...posts])
      setSuccess(language === "zh" ? "文章已创建" : "Article created")
    }

    setEditingPost(null)
    setIsCreating(false)
    setFormData({})
    setTimeout(() => setSuccess(""), 3000)
  }

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post)
    setFormData(post)
    setIsCreating(false)
  }

  const handleDelete = (id: string) => {
    if (confirm(language === "zh" ? "确定要删除这篇文章吗？" : "Are you sure you want to delete this article?")) {
      setPosts(posts.filter((post) => post.id !== id))
      setSuccess(language === "zh" ? "文章已删除" : "Article deleted")
      setTimeout(() => setSuccess(""), 3000)
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>{language === "zh" ? "博客管理登录" : "Blog Admin Login"}</CardTitle>
            <CardDescription>{language === "zh" ? "请输入管理员密码" : "Please enter admin password"}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">{language === "zh" ? "密码" : "Password"}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                placeholder={language === "zh" ? "输入密码" : "Enter password"}
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button onClick={handleLogin} className="w-full">
              {language === "zh" ? "登录" : "Login"}
            </Button>
            <div className="text-center">
              <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
                {language === "zh" ? "返回博客" : "Back to Blog"}
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
                {language === "zh" ? "返回博客" : "Back to Blog"}
              </Link>
              <div className="h-4 w-px bg-border" />
              <h1 className="text-xl font-semibold">{language === "zh" ? "博客管理" : "Blog Admin"}</h1>
            </div>

            <div className="flex items-center gap-2">
              <ThemeSwitcher currentTheme={theme} onThemeChange={setTheme} language={language} />
              <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
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
                <span>
                  {editingPost
                    ? language === "zh"
                      ? "编辑文章"
                      : "Edit Article"
                    : language === "zh"
                      ? "创建文章"
                      : "Create Article"}
                </span>
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm">
                    <Save className="h-4 w-4 mr-1" />
                    {language === "zh" ? "保存" : "Save"}
                  </Button>
                  <Button onClick={handleCancel} variant="outline" size="sm">
                    <X className="h-4 w-4 mr-1" />
                    {language === "zh" ? "取消" : "Cancel"}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{language === "zh" ? "中文标题" : "Chinese Title"} *</Label>
                  <Input
                    id="title"
                    value={formData.title || ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={language === "zh" ? "输入中文标题" : "Enter Chinese title"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="titleEn">{language === "zh" ? "英文标题" : "English Title"} *</Label>
                  <Input
                    id="titleEn"
                    value={formData.titleEn || ""}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    placeholder={language === "zh" ? "输入英文标题" : "Enter English title"}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="excerpt">{language === "zh" ? "中文摘要" : "Chinese Excerpt"}</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt || ""}
                    onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    placeholder={language === "zh" ? "输入中文摘要" : "Enter Chinese excerpt"}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="excerptEn">{language === "zh" ? "英文摘要" : "English Excerpt"}</Label>
                  <Textarea
                    id="excerptEn"
                    value={formData.excerptEn || ""}
                    onChange={(e) => setFormData({ ...formData, excerptEn: e.target.value })}
                    placeholder={language === "zh" ? "输入英文摘要" : "Enter English excerpt"}
                    rows={3}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="content">{language === "zh" ? "中文内容" : "Chinese Content"} *</Label>
                  <Textarea
                    id="content"
                    value={formData.content || ""}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder={
                      language === "zh" ? "输入中文内容（支持Markdown）" : "Enter Chinese content (Markdown supported)"
                    }
                    rows={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contentEn">{language === "zh" ? "英文内容" : "English Content"} *</Label>
                  <Textarea
                    id="contentEn"
                    value={formData.contentEn || ""}
                    onChange={(e) => setFormData({ ...formData, contentEn: e.target.value })}
                    placeholder={
                      language === "zh" ? "输入英文内容（支持Markdown）" : "Enter English content (Markdown supported)"
                    }
                    rows={10}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tags">{language === "zh" ? "中文标签" : "Chinese Tags"}</Label>
                  <Input
                    id="tags"
                    value={formData.tags?.join(", ") || ""}
                    onChange={(e) => setFormData({ ...formData, tags: parseTagsString(e.target.value) })}
                    placeholder={language === "zh" ? "标签1, 标签2, 标签3" : "Tag1, Tag2, Tag3"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagsEn">{language === "zh" ? "英文标签" : "English Tags"}</Label>
                  <Input
                    id="tagsEn"
                    value={formData.tagsEn?.join(", ") || ""}
                    onChange={(e) => setFormData({ ...formData, tagsEn: parseTagsString(e.target.value) })}
                    placeholder="Tag1, Tag2, Tag3"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="seoKeywords">{language === "zh" ? "中文SEO关键词" : "Chinese SEO Keywords"}</Label>
                  <Input
                    id="seoKeywords"
                    value={formData.seoKeywords?.join(", ") || ""}
                    onChange={(e) => setFormData({ ...formData, seoKeywords: parseTagsString(e.target.value) })}
                    placeholder={language === "zh" ? "关键词1, 关键词2" : "Keyword1, Keyword2"}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seoKeywordsEn">{language === "zh" ? "英文SEO关键词" : "English SEO Keywords"}</Label>
                  <Input
                    id="seoKeywordsEn"
                    value={formData.seoKeywordsEn?.join(", ") || ""}
                    onChange={(e) => setFormData({ ...formData, seoKeywordsEn: parseTagsString(e.target.value) })}
                    placeholder="Keyword1, Keyword2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {language === "zh" ? "文章管理" : "Article Management"} ({posts.length})
              </h2>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="h-4 w-4 mr-1" />
                {language === "zh" ? "新建文章" : "New Article"}
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-semibold">{language === "zh" ? post.title : post.titleEn}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {language === "zh" ? post.excerpt : post.excerptEn}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {post.publishedAt}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {post.readTime} {language === "zh" ? "分钟" : "min"}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(language === "zh" ? post.tags : post.tagsEn).slice(0, 3).map((tag) => (
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
                        <Button variant="outline" size="sm" onClick={() => handleEdit(post)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(post.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
