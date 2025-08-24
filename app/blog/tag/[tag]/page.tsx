'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { type Language } from '@/lib/i18n';
import Breadcrumb from '@/components/breadcrumb';

interface BlogPost {
  id: string;
  title: string;
  title_en?: string;
  excerpt: string;
  excerpt_en?: string;
  slug: string;
  published: boolean;
  created_at: string;
  author?: string;
  tags?: string[];
  tags_en?: string[];
  read_time?: number;
}

export default function TagPage() {
  const params = useParams();
  const [language, setLanguage] = useState<Language>('en');
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTag, setCurrentTag] = useState<string>('');

  const supabase = createClient();

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language') as Language;
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  useEffect(() => {
    async function fetchPostsByTag() {
      try {
        setLoading(true);
        setError(null);

        const tag = decodeURIComponent(params.tag as string);
        setCurrentTag(tag);

        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('published', true)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching posts:', error);
          setError('Failed to fetch posts');
          return;
        }

        // 过滤包含指定标签的文章
        const filteredPosts = data?.filter(post => {
          const tags = language === 'zh' ? post.tags : post.tags_en;
          return tags && tags.includes(tag);
        }) || [];

        setPosts(filteredPosts);
      } catch (err) {
        console.error('Error:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    }

    if (params.tag) {
      fetchPostsByTag();
    }
  }, [params.tag, language, supabase]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return language === 'zh' 
      ? date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
      : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getReadTimeText = (minutes?: number) => {
    if (!minutes) return '';
    return language === 'zh' ? `${minutes} 分钟阅读` : `${minutes} min read`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              {language === 'zh' ? '加载中...' : 'Loading...'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-destructive">
              {language === 'zh' ? '加载失败，请稍后重试' : 'Failed to load, please try again later'}
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* SEO结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": language === 'zh' ? `标签: ${currentTag}` : `Tag: ${currentTag}`,
            "description": language === 'zh' 
              ? `查看所有关于 ${currentTag} 的文章和教程`
              : `View all articles and tutorials about ${currentTag}`,
            "url": `https://pdf-to-image.online/blog/tag/${encodeURIComponent(currentTag)}`,
            "mainEntity": {
              "@type": "ItemList",
              "numberOfItems": posts.length,
              "itemListElement": posts.map((post, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "BlogPosting",
                  "headline": language === 'zh' ? post.title : (post.title_en || post.title),
                  "description": language === 'zh' ? post.excerpt : (post.excerpt_en || post.excerpt),
                  "url": `https://pdf-to-image.online/blog/${post.slug}`,
                  "datePublished": post.created_at,
                  "author": {
                    "@type": "Person",
                    "name": post.author || "PDF to Image Team"
                  }
                }
              }))
            }
          })
        }}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 面包屑导航 */}
          <Breadcrumb language={language} />

          {/* 页面标题 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Tag className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold">
                {language === 'zh' ? `标签: ${currentTag}` : `Tag: ${currentTag}`}
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              {language === 'zh' 
                ? `找到 ${posts.length} 篇关于 "${currentTag}" 的文章`
                : `Found ${posts.length} articles about "${currentTag}"`
              }
            </p>
          </div>

          {/* 文章列表 */}
          {posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {language === 'zh' ? '暂无文章' : 'No Articles Found'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'zh' 
                    ? `暂时没有关于 "${currentTag}" 的文章`
                    : `No articles found for "${currentTag}" yet`
                  }
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
                          {language === 'zh' ? post.title : (post.title_en || post.title)}
                        </Link>
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(post.created_at)}
                        </div>
                        {post.read_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {getReadTimeText(post.read_time)}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {language === 'zh' ? post.excerpt : (post.excerpt_en || post.excerpt)}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(language === 'zh' ? post.tags : post.tags_en)?.map((tag) => (
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

          {/* 底部导航 */}
          <div className="mt-12 pt-6 border-t border-border">
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
  );
}