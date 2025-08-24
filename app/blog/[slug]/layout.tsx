import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

interface BlogPost {
  id: string
  title: string
  title_en?: string
  excerpt: string
  excerpt_en?: string
  content: string
  content_en?: string
  tags: string[]

  seo_keywords?: string[]
  seo_keywords_en?: string[]
  slug: string
  published: boolean
  created_at: string
  updated_at: string
}

interface BlogLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  try {
    const { slug } = await params
    const supabase = await createClient()
    
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('published', true)
      .single()

    if (error || !post) {
      return {
        title: 'Article Not Found - PDF Tech Blog',
        description: 'The requested blog article could not be found. Browse our other PDF processing tutorials and tips.',
        robots: {
          index: false,
          follow: true,
        },
      }
    }

    const blogPost = post as BlogPost
    
    // 使用英文作为默认语言，中文作为备选
    const title = blogPost.title_en || blogPost.title
    const description = blogPost.excerpt_en || blogPost.excerpt
    const keywords = blogPost.seo_keywords_en || blogPost.seo_keywords || []
    
    return {
      title: `${title} - PDF Tech Blog`,
      description: description,
      keywords: [
        ...keywords,
        'PDF processing',
        'PDF conversion',
        'document processing',
        'PDF tools',
        'tech blog'
      ],
      authors: [{ name: 'PDF Tech Blog Team' }],
      openGraph: {
        title: title,
        description: description,
        type: 'article',
        url: `https://www.pdf2img.top/blog/${slug}`,
        siteName: 'PDF Tech Blog',
        publishedTime: blogPost.created_at,
        modifiedTime: blogPost.updated_at,
        tags: blogPost.tags,
      },
      twitter: {
        card: 'summary_large_image',
        title: title,
        description: description,
      },
      alternates: {
        canonical: `https://www.pdf2img.top/blog/${slug}`,
        languages: {
          'en-US': `https://www.pdf2img.top/en/blog/${slug}`,
          'zh-CN': `https://www.pdf2img.top/zh/blog/${slug}`,
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
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    return {
      title: 'PDF Tech Blog',
      description: 'Technical blog about PDF processing, conversion, and best practices.',
    }
  }
}

export default function BlogPostLayout({ children }: BlogLayoutProps) {
  return (
    <>
      {children}
    </>
  )
}
