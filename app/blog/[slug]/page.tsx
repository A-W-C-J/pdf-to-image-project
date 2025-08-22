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
          .eq('published', true)
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded mb-4"></div>
              <div className="h-4 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded mb-8"></div>
              <div className="h-64 bg-gray-300 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">{error}</h1>
            <Link href="/blog" className="text-blue-600 hover:underline">
              {language === 'zh' ? '返回博客列表' : 'Back to Blog List'}
            </Link>
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* 返回按钮 */}
          <Link 
            href="/blog" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-8 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {language === 'zh' ? '返回博客列表' : 'Back to Blog List'}
          </Link>

          {/* 文章内容 */}
          <Card className="shadow-xl">
            <CardHeader className="pb-6">
              <CardTitle className="text-3xl md:text-4xl font-bold leading-tight mb-4">
                {language === 'zh' ? post.title : (post.title_en || post.title)}
              </CardTitle>
              
              {/* 文章元信息 */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
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
                <div className="flex flex-wrap gap-2 mt-4">
                  {(language === 'zh' ? post.tags : (post.tags_en || post.tags))!.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              {/* 摘要 */}
              {(language === 'zh' ? post.excerpt : (post.excerpt_en || post.excerpt)) && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 italic">
                    {language === 'zh' ? post.excerpt : (post.excerpt_en || post.excerpt)}
                  </p>
                </div>
              )}
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
                        <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      );
                    },
                    // 自定义链接样式
                    a: ({ children, href, ...props }) => (
                      <a 
                        href={href} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                        {...props}
                      >
                        {children}
                      </a>
                    ),
                    // 自定义表格样式
                    table: ({ children, ...props }) => (
                      <div className="overflow-x-auto">
                        <table className="min-w-full border-collapse border border-gray-300 dark:border-gray-600" {...props}>
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children, ...props }) => (
                      <th className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-left" {...props}>
                        {children}
                      </th>
                    ),
                    td: ({ children, ...props }) => (
                      <td className="border border-gray-300 dark:border-gray-600 px-4 py-2" {...props}>
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
          <div className="mt-8 text-center">
            <Link 
              href="/blog" 
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
