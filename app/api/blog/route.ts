import { type NextRequest } from "next/server"
import { createServiceClient } from "@/lib/supabase/server"

interface BlogPostData {
  title: string
  excerpt?: string
  content: string
  tags?: string[]
  seo_keywords?: string[]
  slug?: string
  published?: boolean
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

// GET - 获取所有博客文章
export async function GET() {
  try {
    const supabase = createServiceClient()
    
    const { data, error } = await supabase
      .from("blog_posts")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      // Error fetching blog posts
      return new Response(
        JSON.stringify({ error: "获取博客文章失败", details: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    // Unexpected error
    return new Response(
      JSON.stringify({ error: "服务器内部错误" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}

// POST - 创建新博客文章
export async function POST(request: NextRequest) {
  try {
    const body: BlogPostData = await request.json()
    
    // 验证必填字段
    if (!body.title || !body.content) {
      return new Response(
        JSON.stringify({ error: "标题和内容为必填字段" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    const supabase = createServiceClient()
    
    // 生成slug
    const slug = body.slug || generateSlug(body.title)
    
    // 插入新文章
    const { data, error } = await supabase
      .from("blog_posts")
      .insert({
        title: body.title,
        excerpt: body.excerpt || "",
        content: body.content,
        tags: body.tags || [],
        seo_keywords: body.seo_keywords || [],
        slug,
        published: body.published || false,
      })
      .select()
      .single()

    if (error) {
      // Error creating blog post
      return new Response(
        JSON.stringify({ error: "创建博客文章失败", details: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    return new Response(JSON.stringify({ data }), {
      status: 201,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    // Unexpected error
    return new Response(
      JSON.stringify({ error: "服务器内部错误" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}

// PUT - 更新博客文章
export async function PUT(request: NextRequest) {
  try {
    const body: BlogPostData & { id: string } = await request.json()
    
    // 验证必填字段
    if (!body.id || !body.title || !body.content) {
      return new Response(
        JSON.stringify({ error: "ID、标题和内容为必填字段" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    const supabase = createServiceClient()
    
    // 生成slug
    const slug = body.slug || generateSlug(body.title)
    
    // 更新文章
    const { data, error } = await supabase
      .from("blog_posts")
      .update({
        title: body.title,
        excerpt: body.excerpt || "",
        content: body.content,
        tags: body.tags || [],
        seo_keywords: body.seo_keywords || [],
        slug,
        published: body.published || false,
      })
      .eq("id", body.id)
      .select()
      .single()

    if (error) {
      // Error updating blog post
      return new Response(
        JSON.stringify({ error: "更新博客文章失败", details: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    // Unexpected error
    return new Response(
      JSON.stringify({ error: "服务器内部错误" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}

// DELETE - 删除博客文章
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json()
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: "缺少文章ID" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    const supabase = createServiceClient()
    
    const { error } = await supabase
      .from("blog_posts")
      .delete()
      .eq("id", id)

    if (error) {
      // Error deleting blog post
      return new Response(
        JSON.stringify({ error: "删除博客文章失败", details: error.message }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      )
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    })
  } catch (error) {
    // Unexpected error
    return new Response(
      JSON.stringify({ error: "服务器内部错误" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    )
  }
}