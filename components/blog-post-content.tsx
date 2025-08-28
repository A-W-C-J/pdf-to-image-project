'use client'

import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ReactMarkdown from 'react-markdown'
import RelatedArticles from '@/components/related-articles'
import Breadcrumb from '@/components/breadcrumb'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeRaw from 'rehype-raw'
import { useLanguage } from '@/lib/i18n'

interface BlogPost {
  id: string
  title: string
  title_en?: string
  content: string
  content_en?: string
  excerpt: string
  excerpt_en?: string
  slug: string
  published: boolean
  created_at: string
  updated_at?: string
  author?: string
  tags?: string[]
  read_time?: number
}

interface BlogPostContentProps {
  post: BlogPost
}

export default function BlogPostContent({ post }: BlogPostContentProps) {
  const { language } = useLanguage()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 面包屑导航 */}
          <Breadcrumb 
            items={[
              { label: language === 'zh' ? '首页' : 'Home', href: '/' },
              { label: language === 'zh' ? '技术博客' : 'Tech Blog', href: '/blog' },
              { label: language === 'zh' ? post.title : (post.title_en || post.title), href: `/blog/${post.slug}` }
            ]}
          />
          {/* 文章内容 */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="space-y-6">
              <div className="space-y-4">
                <CardTitle className="text-3xl md:text-4xl font-bold leading-tight">
                  {language === 'zh' ? post.title : (post.title_en || post.title)}
                </CardTitle>
                
                {/* 文章元信息 */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{post.author || (language === 'zh' ? '匿名' : 'Anonymous')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>
                      {post.read_time || 5} {language === 'zh' ? '分钟阅读' : 'min read'}
                    </span>
                  </div>
                </div>

                {/* 标签 */}
                {(post.tags && post.tags.length > 0) && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {post.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* 摘要 */}
                {(language === 'zh' ? post.excerpt : (post.excerpt_en || post.excerpt)) && (
                  <div className="p-4 bg-muted/50 rounded-lg border-l-4 border-primary">
                    <p className="text-muted-foreground italic leading-relaxed">
                      {language === 'zh' ? post.excerpt : (post.excerpt_en || post.excerpt)}
                    </p>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {/* 文章正文 */}
              <div className="prose prose-lg dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  components={{
                    // 代码块样式
                    code: ({ inline, className, children, ...props }: React.HTMLAttributes<HTMLElement> & {
                       inline?: boolean
                     }) => {
                      if (inline) {
                        return (
                          <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                            {children}
                          </code>
                        )
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    },
                    // 链接样式
                    a: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => {
                      const isExternal = href?.startsWith('http')
                      return (
                        <a
                          href={href}
                          className="text-primary hover:text-primary/80 underline underline-offset-4 transition-colors"
                          target={isExternal ? '_blank' : undefined}
                          rel={isExternal ? 'nofollow noopener noreferrer' : 'nofollow'}
                          {...props}
                        >
                          {children}
                          {isExternal && (
                            <span className="ml-1 text-xs">↗</span>
                          )}
                        </a>
                      )
                    },
                    // 表格样式
                    table: ({ children, ...props }) => (
                      <div className="overflow-x-auto my-6">
                        <table className="min-w-full border-collapse border border-border rounded-lg" {...props}>
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children, ...props }) => (
                      <th className="border border-border bg-muted px-4 py-3 text-left font-semibold" {...props}>
                        {children}
                      </th>
                    ),
                    td: ({ children, ...props }) => (
                      <td className="border border-border px-4 py-3" {...props}>
                        {children}
                      </td>
                    ),
                  }}
                >
                  {language === 'zh' ? post.content : (post.content_en || post.content)}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>

          {/* 相关文章 */}
          <RelatedArticles 
            currentSlug={post.slug}
            currentTags={post.tags}
            language={language}
            maxArticles={3}
          />

          {/* 返回链接 */}
          <div className="mt-8 pt-6 border-t border-border">
            <Link 
              href="/blog" 
              className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              {language === 'zh' ? '返回博客列表' : 'Back to Blog List'}
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}