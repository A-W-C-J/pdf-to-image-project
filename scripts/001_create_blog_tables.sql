-- 创建博客文章表
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  seo_keywords TEXT[] DEFAULT '{}',
  slug TEXT UNIQUE NOT NULL,
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON public.blog_posts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON public.blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON public.blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);

-- 插入示例数据
INSERT INTO public.blog_posts (title, excerpt, content, tags, seo_keywords, slug, published) VALUES
('PDF.js完整技术指南：前端PDF处理的最佳实践', 
 'PDF.js是Mozilla开发的开源JavaScript库，使用HTML5 Canvas和Web标准技术在浏览器中渲染PDF文档，无需任何插件或扩展。', 
 '# PDF.js完整技术指南：前端PDF处理的最佳实践

## 什么是PDF.js？

PDF.js是Mozilla开发的开源JavaScript库，使用HTML5 Canvas和Web标准技术在浏览器中渲染PDF文档，无需任何插件或扩展。

## 核心特性

### 1. 纯JavaScript实现
- 完全基于Web标准
- 无需浏览器插件
- 跨平台兼容性

### 2. 高性能渲染
- 使用Web Workers进行后台处理
- 优化的Canvas 2D渲染
- 内存管理和缓存机制

### 3. 丰富的API接口
- 文档加载和解析
- 页面渲染控制
- 文本提取功能
- 注释和表单支持

## 技术架构

PDF.js采用模块化架构设计：

- **核心层**：PDF解析和数据结构
- **显示层**：渲染和视觉呈现
- **API层**：开发者接口

## 实际应用示例

### 基础PDF渲染

```javascript
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = "pdf.worker.min.js";

async function renderPDF(url) {
  const pdf = await pdfjsLib.getDocument(url).promise;
  const page = await pdf.getPage(1);
  
  const canvas = document.getElementById("pdf-canvas");
  const context = canvas.getContext("2d");
  
  const viewport = page.getViewport({ scale: 1.5 });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  
  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;
}
