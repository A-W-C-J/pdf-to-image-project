"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock } from "lucide-react"
// import { useLanguage } from "@/lib/i18n"
import { createClient } from "@/lib/supabase/client"

interface BlogPost {
  id: string
  title: string
  title_en?: string
  excerpt: string
  excerpt_en?: string
  tags?: string[]

  created_at: string
  read_time?: number
  slug: string
  published?: boolean
}

interface RelatedArticlesProps {
  currentSlug: string
  currentTags?: string[]
  maxArticles?: number
  language?: 'zh' | 'en'
}

export default function RelatedArticles({ currentSlug, currentTags = [], maxArticles = 3, language: propLanguage }: RelatedArticlesProps) {
  const [language, setLanguage] = useState<'zh' | 'en'>('en')

  useEffect(() => {
    if (propLanguage) {
      setLanguage(propLanguage)
    } else {
      // 从localStorage获取语言设置
      const savedLanguage = localStorage.getItem('preferred-language') as 'zh' | 'en'
      if (savedLanguage) {
        setLanguage(savedLanguage)
      }
    }
  }, [propLanguage])
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchRelatedArticles = async () => {
      try {
        setLoading(true)
        
        // 获取所有已发布的文章（除了当前文章）
        const { data: allPosts, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('published', true)
          .neq('slug', currentSlug)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching related articles:', error)
          return
        }

        if (!allPosts || allPosts.length === 0) {
          setRelatedPosts([])
          return
        }

        // 计算文章相关性得分
        const scoredPosts = allPosts.map(post => {
          let score = 0
          const postTags = post.tags || []
          
          // 基于标签相似性计算得分
          const commonTags = currentTags.filter(tag => 
            postTags.some((postTag: string) => 
              postTag.toLowerCase().includes(tag.toLowerCase()) || 
              tag.toLowerCase().includes(postTag.toLowerCase())
            )
          )
          score += commonTags.length * 10

          // 基于标题相似性（简单的关键词匹配）
          const currentTitle = language === 'zh' ? post.title : (post.title_en || post.title)
          const titleWords = currentTitle.toLowerCase().split(/\s+/)
          currentTags.forEach(tag => {
            if (titleWords.some((word: string) => word.includes(tag.toLowerCase()))) {
              score += 5
            }
          })

          // 时间因子（较新的文章得分稍高）
          const daysSinceCreated = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24)
          if (daysSinceCreated < 30) score += 2
          else if (daysSinceCreated < 90) score += 1

          return { ...post, score }
        })

        // 按得分排序并取前N篇
        const sortedPosts = scoredPosts
          .sort((a, b) => b.score - a.score)
          .slice(0, maxArticles)

        setRelatedPosts(sortedPosts)
      } catch (error) {
        console.error('Error in fetchRelatedArticles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedArticles()
  }, [currentSlug, currentTags, maxArticles, language, supabase])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return language === 'zh' 
      ? date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
      : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  if (loading) {
    return (
      <div className="mt-8 space-y-4">
        <h3 className="text-xl font-semibold border-b pb-2">
          {language === 'zh' ? '相关文章' : 'Related Articles'}
        </h3>
        <div className="grid gap-4">
          {[...Array(3)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader className="pb-3">
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="flex gap-1 mt-2">
                  <div className="h-5 bg-gray-200 rounded w-12"></div>
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (relatedPosts.length === 0) {
    return (
      <div className="mt-8 space-y-4">
        <h3 className="text-xl font-semibold">
          {language === 'zh' ? '相关文章' : 'Related Articles'}
        </h3>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground text-center py-8">
              {language === 'zh' ? '暂无相关文章推荐' : 'No related articles found'}
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mt-8 space-y-4">
      {/* 相关文章结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": language === 'zh' ? '相关文章' : 'Related Articles',
            "itemListElement": relatedPosts.map((post, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Article",
                "headline": language === 'zh' ? post.title : (post.title_en || post.title),
                "description": language === 'zh' ? post.excerpt : (post.excerpt_en || post.excerpt),
                "url": `https://www.pdf2img.top/blog/${post.slug}`,
                "datePublished": post.created_at,
                "author": {
                  "@type": "Organization",
                  "name": "PDF2IMG.TOP"
                }
              }
            }))
          })
        }}
      />
        <h3 className="text-xl font-semibold border-b pb-2">
          {language === 'zh' ? '相关文章' : 'Related Articles'}
        </h3>
        <div className="grid gap-4">
          {relatedPosts.map((post) => {
            const title = language === 'zh' ? post.title : (post.title_en || post.title)
            const excerpt = language === 'zh' ? post.excerpt : (post.excerpt_en || post.excerpt)
            const tags = post.tags || []
            
            return (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2">{title}</CardTitle>
                    <CardDescription className="line-clamp-2">{excerpt}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(post.created_at)}</span>
                        </div>
                        {post.read_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {post.read_time} {language === 'zh' ? '分钟阅读' : 'min read'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tags.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
    </div>
  )
}