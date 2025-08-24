import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/client';

interface Props {
  params: { tag: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const tag = decodeURIComponent(params.tag);
  
  // 获取该标签下的文章数量
  const supabase = createClient();
  const { data: posts } = await supabase
    .from('blog_posts')
    .select('id, tags, tags_en')
    .eq('published', true);
  
  const postCount = posts?.filter(post => 
    (post.tags && post.tags.includes(tag)) || 
    (post.tags_en && post.tags_en.includes(tag))
  ).length || 0;

  const title = `${tag} - PDF工具相关文章 | PDF to Image`;
  const titleEn = `${tag} - PDF Tools Articles | PDF to Image`;
  const description = `浏览所有关于 ${tag} 的PDF工具文章和教程，共${postCount}篇专业内容。学习PDF转换、处理和优化的最佳实践。`;
  const descriptionEn = `Browse all ${tag} related PDF tools articles and tutorials. ${postCount} professional articles about PDF conversion, processing and optimization best practices.`;

  return {
    title,
    description,
    keywords: [
      tag,
      'PDF工具',
      'PDF转换',
      'PDF处理',
      '在线工具',
      'PDF to Image',
      'PDF教程',
      '文档处理',
      'PDF tools',
      'PDF conversion',
      'PDF processing',
      'online tools',
      'PDF tutorials',
      'document processing'
    ],
    openGraph: {
      title: titleEn,
      description: descriptionEn,
      type: 'website',
      url: `https://pdf-to-image.online/blog/tag/${encodeURIComponent(tag)}`,
      siteName: 'PDF to Image - Free Online PDF Tools',
      locale: 'en_US',
      alternateLocale: 'zh_CN',
      images: [
        {
          url: 'https://pdf-to-image.online/og-image.jpg',
          width: 1200,
          height: 630,
          alt: `${tag} - PDF Tools Articles`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: titleEn,
      description: descriptionEn,
      images: ['https://pdf-to-image.online/og-image.jpg'],
      creator: '@PDFtoImageTool',
    },
    alternates: {
      canonical: `https://pdf-to-image.online/blog/tag/${encodeURIComponent(tag)}`,
      languages: {
        'en': `https://pdf-to-image.online/blog/tag/${encodeURIComponent(tag)}`,
        'zh': `https://pdf-to-image.online/blog/tag/${encodeURIComponent(tag)}`,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    other: {
      'article:section': 'Technology',
      'article:tag': tag,
    },
  };
}

export default function TagLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}