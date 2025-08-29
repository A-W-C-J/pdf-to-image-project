import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"

interface BlogPost {
  id: string
  title: string
  title_en?: string
  excerpt: string
  excerpt_en?: string
  content: string
  content_en?: string
  tags: string[]

  created_at: string
  updated_at?: string
  read_time?: number
  slug: string
  seo_keywords?: string[]
  seo_keywords_en?: string[]
  published: boolean
}

async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false })

    if (error) {
      // Error fetching blog posts for sitemap
      return []
    }

    return data || []
  } catch (error) {
    // Error in getBlogPosts
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = await getBlogPosts()
  
  const blogPostEntries = blogPosts.map((post) => ({
    url: `https://www.pdf2img.top/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || post.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
    alternates: {
      languages: {
        en: `https://www.pdf2img.top/en/blog/${post.slug}`,
        zh: `https://www.pdf2img.top/zh/blog/${post.slug}`,
      },
    },
  }))

  return [
    {
      url: "https://www.pdf2img.top/blog",
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
      alternates: {
        languages: {
          en: "https://www.pdf2img.top/en/blog",
          zh: "https://www.pdf2img.top/zh/blog",
        },
      },
    },
    ...blogPostEntries,
  ]
}
