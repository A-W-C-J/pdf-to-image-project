import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BlogPostContent from '@/components/blog-post-content'
import type { Metadata } from 'next'
import 'highlight.js/styles/github-dark.css'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const supabase = await createClient()
  const resolvedParams = await params
  const decodedSlug = decodeURIComponent(resolvedParams.slug)
  
  const { data: post } = await supabase
    .from('blog_posts')
    .select('title, excerpt, created_at')
    .eq('slug', decodedSlug)
    .single()

  if (!post) {
    return {
      title: 'Article Not Found | PDF to Image Converter',
      description: 'The requested article could not be found.'
    }
  }

  const ogImageUrl = `/api/og?title=${encodeURIComponent(post.title)}&subtitle=${encodeURIComponent(post.excerpt || 'PDF Processing Tutorial')}`
  const articleUrl = `https://www.pdf2img.top/blog/${decodedSlug}`

  return {
    title: `${post.title} | PDF to Image Converter`,
    description: post.excerpt || `Read about ${post.title} on our blog.`,
    keywords: [
      post.title,
      'PDF processing',
      'PDF conversion',
      'PDF tools',
      'document processing',
      'PDF tutorial',
      'PDF tips',
      'online PDF tools'
    ],
    authors: [{ name: 'PDF to Image Team' }],
    openGraph: {
      title: post.title,
      description: post.excerpt || `Read about ${post.title} on our blog.`,
      type: 'article',
      publishedTime: post.created_at,
      url: articleUrl,
      siteName: 'PDF to Image Converter',
      locale: 'en_US',
      alternateLocale: ['zh_CN'],
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt || `Read about ${post.title} on our blog.`,
      images: [ogImageUrl],
      creator: '@PDFtoImageTool',
    },
    alternates: {
      canonical: articleUrl,
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
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  // 获取文章数据
  const supabase = await createClient()
  
  // 解码URL参数
  const resolvedParams = await params
  const decodedSlug = decodeURIComponent(resolvedParams.slug)
  console.log('查找文章 slug:', decodedSlug)

  const { data: post, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', decodedSlug)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      notFound()
    } else {
      console.error('Error fetching blog post:', error)
      notFound()
    }
  }

  if (!post) {
    notFound()
  }

  return <BlogPostContent post={post} />
}
