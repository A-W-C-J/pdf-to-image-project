'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { translations, type Language } from '@/lib/i18n';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';

interface BlogPost {
  id: string;
  title: string;
  title_en?: string;
  content: string;
  content_en?: string;
  excerpt: string;
  excerpt_en?: string;
  slug: string;
  published: boolean;
  created_at: string;
  updated_at?: string;
  author?: string;
  tags?: string[];
  tags_en?: string[];
  read_time?: number;
}

export default function BlogPostPage() {
  const params = useParams();
  const [language, setLanguage] = useState<Language>('zh');
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    async function fetchPost() {
      try {
        setLoading(true);
        setError(null);

        // 解码URL参数
        const decodedSlug = decodeURIComponent(params.slug as string);
        console.log('查找文章 slug:', decodedSlug);

        const { data, error } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('slug', decodedSlug)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No rows returned
            notFound();
          } else {
            throw error;
          }
        }

        if (!data) {
          notFound();
        }

        setPost(data);
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError(language === 'zh' ? '加载文章失败' : 'Failed to load article');
      } finally {
        setLoading(false);
      }
    }

    if (params.slug) {
      fetchPost();
    }
  }, [params.slug, supabase, language]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-6 bg-muted rounded w-32"></div>
              <Card>
                <CardHeader className="space-y-4">
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                  <div className="flex gap-4">
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-4 bg-muted rounded w-16"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-20"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="h-4 bg-muted rounded w-full"></div>
                    <div className="h-4 bg-muted rounded w-5/6"></div>
                    <div className="h-4 bg-muted rounded w-4/5"></div>
                    <div className="h-32 bg-muted rounded"></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <h1 className="text-2xl font-bold text-destructive mb-4">{error}</h1>
              <Link 
                href="/blog" 
                className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {language === 'zh' ? '返回博客列表' : 'Back to Blog List'}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    notFound();
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return language === 'zh' 
      ? date.toLocaleDateString('zh-CN')
      : date.toLocaleDateString('en-US');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link 
                href="/blog" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                {language === 'zh' ? '返回博客列表' : 'Back to Blog List'}
              </Link>
              <div className="h-4 w-px bg-border" />
              <h1 className="text-xl font-semibold">{language === 'zh' ? '技术博客' : 'Tech Blog'}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
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
                {((language === 'zh' ? post.tags : (post.tags_en || post.tags)) && (language === 'zh' ? post.tags : (post.tags_en || post.tags))!.length > 0) && (
                  <div className="flex flex-wrap gap-2">
                    {(language === 'zh' ? post.tags : (post.tags_en || post.tags))!.map((tag, index) => (
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
                    // 自定义代码块样式
                    code: ({ node, inline, className, children, ...props }) => {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <pre className={className} {...props}>
                          <code className={className}>{children}</code>
                        </pre>
                      ) : (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      );
                    },
                    // 自定义链接样式
                    a: ({ children, href, ...props }) => {
                      // 检查是否为外部链接
                      const isExternal = href && (href.startsWith('http') || href.startsWith('https'));
                      
                      return (
                        <a 
                          href={href} 
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noopener noreferrer nofollow" : undefined}
                          className="text-primary hover:text-primary/80 underline underline-offset-4 decoration-2 transition-colors"
                          {...props}
                        >
                          {children}
                        </a>
                      );
                    },
                    // 自定义表格样式
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

          {/* 底部导航 */}
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
  );
}