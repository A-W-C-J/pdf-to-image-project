import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"

interface BlogPostTag {
  tags: string[]
  updated_at?: string
  created_at: string
}

async function getAllTags(): Promise<{ tag: string; lastModified: Date }[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: posts, error } = await supabase
      .from("blog_posts")
      .select("tags, updated_at, created_at")
      .eq("published", true)
    
    if (error) {
      console.error("Error fetching blog posts for tag sitemap:", error)
      return []
    }
    
    const tagMap = new Map<string, Date>()
    
    posts?.forEach((post: BlogPostTag) => {
      const postDate = new Date(post.updated_at || post.created_at)
      
      // 处理标签
      post.tags?.forEach(tag => {
        const existingDate = tagMap.get(tag)
        if (!existingDate || postDate > existingDate) {
          tagMap.set(tag, postDate)
        }
      })
    })
    
    return Array.from(tagMap.entries()).map(([tag, lastModified]) => ({
      tag,
      lastModified
    }))
  } catch (error) {
    console.error("Error in getAllTags:", error)
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tags = await getAllTags()
  
  return tags.map(({ tag, lastModified }) => ({
    url: `https://www.pdf2img.top/blog/tag/${encodeURIComponent(tag)}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.6,
    alternates: {
      languages: {
        en: `https://www.pdf2img.top/en/blog/tag/${encodeURIComponent(tag)}`,
        zh: `https://www.pdf2img.top/zh/blog/tag/${encodeURIComponent(tag)}`,
      },
    },
  }))
}