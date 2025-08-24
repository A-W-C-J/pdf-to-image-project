import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BlogPostContent from '@/components/blog-post-content'
import 'highlight.js/styles/github-dark.css'

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  // 获取文章数据
  const supabase = await createClient()
  
  // 解码URL参数
  const decodedSlug = decodeURIComponent(params.slug)
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
