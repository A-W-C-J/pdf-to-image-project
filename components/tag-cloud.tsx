'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { type Language } from '@/lib/i18n';

interface TagWithCount {
  name: string;
  count: number;
}

interface TagCloudProps {
  language: Language;
  maxTags?: number;
}

export default function TagCloud({ language, maxTags = 20 }: TagCloudProps) {
  const [tags, setTags] = useState<TagWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchTags() {
      try {
        setLoading(true);

        const { data: posts, error } = await supabase
          .from('blog_posts')
          .select('tags')
          .eq('published', true);

        if (error) {
          console.error('Error fetching tags:', error);
          return;
        }

        // 统计标签出现次数
        const tagCounts: { [key: string]: number } = {};
        
        posts?.forEach(post => {
          const postTags = post.tags;
          if (postTags && Array.isArray(postTags)) {
            postTags.forEach(tag => {
              if (tag && tag.trim()) {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
              }
            });
          }
        });

        // 转换为数组并按使用频率排序
        const sortedTags = Object.entries(tagCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, maxTags);

        setTags(sortedTags);
      } catch (err) {
        console.error('Error fetching tags:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTags();
  }, [language, maxTags, supabase]);

  // 根据使用频率计算标签大小
  const getTagSize = (count: number, maxCount: number) => {
    const ratio = count / maxCount;
    if (ratio >= 0.8) return 'text-lg';
    if (ratio >= 0.6) return 'text-base';
    if (ratio >= 0.4) return 'text-sm';
    return 'text-xs';
  };

  // 根据使用频率计算标签颜色
  const getTagVariant = (count: number, maxCount: number) => {
    const ratio = count / maxCount;
    if (ratio >= 0.8) return 'default' as const;
    if (ratio >= 0.6) return 'secondary' as const;
    return 'outline' as const;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            {language === 'zh' ? '热门标签' : 'Popular Tags'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-6 bg-muted rounded w-16"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tags.length === 0) {
    return null;
  }

  const maxCount = Math.max(...tags.map(tag => tag.count));

  return (
    <>
      {/* SEO结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": language === 'zh' ? "PDF工具博客标签" : "PDF Tools Blog Tags",
            "description": language === 'zh' 
              ? "浏览PDF工具相关的热门标签和主题"
              : "Browse popular tags and topics related to PDF tools",
            "numberOfItems": tags.length,
            "itemListElement": tags.map((tag, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Thing",
                "name": tag.name,
                "url": `https://pdf-to-image.online/blog/tag/${encodeURIComponent(tag.name)}`,
                "description": language === 'zh' 
                  ? `${tag.count} 篇关于 ${tag.name} 的文章`
                  : `${tag.count} articles about ${tag.name}`
              }
            }))
          })
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            {language === 'zh' ? '热门标签' : 'Popular Tags'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge 
                key={tag.name} 
                variant={getTagVariant(tag.count, maxCount)}
                className={`${getTagSize(tag.count, maxCount)} hover:scale-105 transition-transform cursor-pointer`}
              >
                <Link 
                  href={`/blog/tag/${encodeURIComponent(tag.name)}`}
                  className="flex items-center gap-1 hover:text-primary transition-colors"
                >
                  {tag.name}
                  <span className="text-xs opacity-70">({tag.count})</span>
                </Link>
              </Badge>
            ))}
          </div>
          
          {tags.length >= maxTags && (
            <div className="mt-4 text-center">
              <Link 
                href="/blog"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {language === 'zh' ? '查看所有文章 →' : 'View all articles →'}
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}