import Link from 'next/link'
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Breadcrumb from '@/components/breadcrumb'

export default async function TagPage({ params }: { params: { tag: string } }) {
  // 解码标签参数
  const currentTag = decodeURIComponent(params.tag)
  
  // 获取Supabase客户端
  const supabase = await createClient()
  
  // 获取包含指定标签的文章
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
    notFound()
  }

  // 过滤包含指定标签的文章
  const posts = data?.filter(post => {
    const tags = post.tags
    return tags && tags.includes(currentTag)
  }) || []

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
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 面包屑导航 */}
          <Breadcrumb 
            items={[
              { label: '首页', href: '/' },
              { label: '技术博客', href: '/blog' },
              { label: `标签: ${currentTag}`, href: `/blog/tag/${encodeURIComponent(currentTag)}` }
            ]}
          />



          {/* 文章列表 */}
          {posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  暂无文章
                </h3>
                <p className="text-muted-foreground">
                  暂时没有关于 &ldquo;{currentTag}&rdquo; 的文章
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {posts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <CardTitle className="text-xl">
                        <Link 
                          href={`/blog/${post.slug}`}
                          className="hover:text-primary transition-colors"
                        >
                          {post.title}
                        </Link>
                      </CardTitle>
                     
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {post.tags?.map((tag: string) => (
                        <Badge key={tag} variant="secondary">
                          <Link href={`/blog/tag/${encodeURIComponent(tag)}`}>
                            {tag}
                          </Link>
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  )
}