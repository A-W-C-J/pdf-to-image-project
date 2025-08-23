import type { MetadataRoute } from "next"
import { createClient } from "@/lib/supabase/server"

interface BlogPost {
  id: string
  title: string
  title_en?: string
  excerpt: string
  excerpt_en?: string
  content: string
  content_en?: string
  tags: string[]
  tags_en?: string[]
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
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching blog posts for sitemap:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getBlogPosts:", error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = await getBlogPosts()
  
  const blogPostEntries = blogPosts.map((post) => ({
    url: `https://www.pdf2img.top/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || post.created_at),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }))

  return [
    {
      url: "https://www.pdf2img.top/blog",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...blogPostEntries,
  ]
}
