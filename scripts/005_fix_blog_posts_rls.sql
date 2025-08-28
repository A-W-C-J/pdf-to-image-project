-- 修复 blog_posts 表的行级安全策略
-- 解决插入博客文章时违反 RLS 策略的问题

-- 首先禁用现有的 RLS（如果存在）
ALTER TABLE public.blog_posts DISABLE ROW LEVEL SECURITY;

-- 删除可能存在的旧策略
DROP POLICY IF EXISTS "Allow public read access to published posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow authenticated users to insert posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow authenticated users to update posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Allow authenticated users to delete posts" ON public.blog_posts;

-- 重新启用行级安全
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许所有人读取已发布的博客文章
CREATE POLICY "Allow public read access to published posts" ON public.blog_posts
    FOR SELECT USING (published = true);

-- 创建策略：允许认证用户插入博客文章
CREATE POLICY "Allow authenticated users to insert posts" ON public.blog_posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- 创建策略：允许认证用户更新博客文章
CREATE POLICY "Allow authenticated users to update posts" ON public.blog_posts
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- 创建策略：允许认证用户删除博客文章
CREATE POLICY "Allow authenticated users to delete posts" ON public.blog_posts
    FOR DELETE USING (auth.role() = 'authenticated');

-- 如果需要允许匿名用户也能插入（用于演示目的），可以使用以下策略替代上面的插入策略
-- DROP POLICY "Allow authenticated users to insert posts" ON public.blog_posts;
-- CREATE POLICY "Allow all users to insert posts" ON public.blog_posts
--     FOR INSERT WITH CHECK (true);

-- 验证策略是否正确创建
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'blog_posts';