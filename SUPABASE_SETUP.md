# Supabase 数据库设置指南

## 问题描述

如果您在保存博客时遇到以下错误：
\`\`\`
{
    "code": "PGRST205",
    "details": null,
    "hint": null,
    "message": "Could not find the table 'public.blog_posts' in the schema cache"
}
\`\`\`

这表示您的 Supabase 数据库中缺少必要的表结构。

## 解决方案

### 步骤 1：登录 Supabase 控制台

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 登录您的账户
3. 选择您的项目

### 步骤 2：执行 SQL 脚本

1. 在左侧导航栏中，点击 **"SQL Editor"**
2. 点击 **"New Query"** 创建新查询
3. 复制 `scripts/001_create_blog_tables.sql` 文件中的所有内容
4. 粘贴到 SQL 编辑器中
5. 点击 **"Run"** 按钮执行脚本

### 步骤 3：验证表创建

1. 在左侧导航栏中，点击 **"Table Editor"**
2. 您应该能看到新创建的 `blog_posts` 表
3. 表中应该包含以下字段：
   - `id` (UUID, Primary Key)
   - `title` (Text)
   - `excerpt` (Text)
   - `content` (Text)
   - `tags` (Text Array)
   - `seo_keywords` (Text Array)
   - `slug` (Text, Unique)
   - `published` (Boolean)
   - `created_at` (Timestamp)
   - `updated_at` (Timestamp)

### 步骤 4：设置行级安全策略（可选）

如果您需要公开访问博客数据，可以添加以下策略：

\`\`\`sql
-- 允许所有人读取已发布的博客文章
CREATE POLICY "Allow public read access to published posts" ON public.blog_posts
    FOR SELECT USING (published = true);

-- 启用行级安全
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
\`\`\`

## 常见问题

### Q: 执行 SQL 脚本时出现权限错误
A: 确保您是项目的所有者或具有数据库管理权限。

### Q: 表创建成功但仍然出现错误
A: 尝试刷新浏览器缓存，或等待几分钟让 Supabase 更新其架构缓存。

### Q: 如何重置数据库
A: 在 SQL Editor 中执行 `DROP TABLE IF EXISTS public.blog_posts CASCADE;` 然后重新运行创建脚本。

## 下一步

完成数据库设置后，您就可以正常使用博客管理功能了：
- 创建新博客文章
- 编辑现有文章
- 发布/取消发布文章
- 使用 AI 生成博客内容
