import { NextResponse } from "next/server"

interface BlogPost {
  id: string
  title: string
  titleEn: string
  excerpt: string
  excerptEn: string
  content: string
  contentEn: string
  tags: string[]
  tagsEn: string[]
  publishedAt: string
  readTime: number
  slug: string
  seoKeywords: string[]
  seoKeywordsEn: string[]
}

const mockPosts: BlogPost[] = [
  {
    id: "1",
    title: "如何高效转换PDF文件为图片格式",
    titleEn: "How to Efficiently Convert PDF Files to Image Format",
    excerpt: "详细介绍PDF转图片的最佳实践，包括格式选择、质量优化和批量处理技巧。",
    excerptEn:
      "Comprehensive guide on PDF to image conversion best practices, including format selection, quality optimization, and batch processing tips.",
    content: "PDF转换内容...",
    contentEn: "PDF conversion content...",
    tags: ["PDF转换", "图片格式", "批量处理"],
    tagsEn: ["PDF Conversion", "Image Format", "Batch Processing"],
    publishedAt: "2024-01-15",
    readTime: 5,
    slug: "efficient-pdf-to-image-conversion",
    seoKeywords: ["PDF转图片", "在线PDF转换器", "免费PDF工具"],
    seoKeywordsEn: ["PDF to image", "online PDF converter", "free PDF tool"],
  },
  {
    id: "2",
    title: "PDF文件加密与密码保护完整指南",
    titleEn: "Complete Guide to PDF Encryption and Password Protection",
    excerpt: "学习如何处理受密码保护的PDF文件，包括解密方法和安全最佳实践。",
    excerptEn:
      "Learn how to handle password-protected PDF files, including decryption methods and security best practices.",
    content: "PDF加密内容...",
    contentEn: "PDF encryption content...",
    tags: ["PDF安全", "密码保护", "文件加密"],
    tagsEn: ["PDF Security", "Password Protection", "File Encryption"],
    publishedAt: "2024-01-10",
    readTime: 7,
    slug: "pdf-encryption-password-protection-guide",
    seoKeywords: ["PDF密码", "PDF解密", "PDF安全"],
    seoKeywordsEn: ["PDF password", "PDF decryption", "PDF security"],
  },
]

export async function GET() {
  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>PDF Processing Tech Blog</title>
    <description>Technical blog about PDF processing, conversion, security, and best practices</description>
    <link>https://www.pdf2img.top/blog</link>
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://www.pdf2img.top/blog/rss.xml" rel="self" type="application/rss+xml"/>
    <generator>Next.js</generator>
    <webMaster>contact@pdf-converter.vercel.app (PDF Converter Tool)</webMaster>
    <managingEditor>contact@pdf-converter.vercel.app (PDF Converter Tool)</managingEditor>
    <copyright>Copyright ${new Date().getFullYear()} PDF Converter Tool</copyright>
    <category>Technology</category>
    <category>PDF Processing</category>
    <category>Document Conversion</category>
    
    ${mockPosts
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .map((post) => {
        const pubDate = new Date(post.publishedAt).toUTCString()
        const postUrl = `https://www.pdf2img.top/blog/${post.slug}`

        return `
    <item>
      <title><![CDATA[${post.titleEn}]]></title>
      <description><![CDATA[${post.excerptEn}]]></description>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <pubDate>${pubDate}</pubDate>
      <author>contact@pdf-converter.vercel.app (PDF Converter Tool)</author>
      ${post.tagsEn.map((tag) => `<category><![CDATA[${tag}]]></category>`).join("\n      ")}
      <content:encoded><![CDATA[
        <p>${post.excerptEn}</p>
        <p><strong>Reading time:</strong> ${post.readTime} minutes</p>
        <p><strong>Tags:</strong> ${post.tagsEn.join(", ")}</p>
        <p><a href="${postUrl}">Read the full article</a></p>
      ]]></content:encoded>
    </item>`
      })
      .join("")}
  </channel>
</rss>`

  return new NextResponse(rssXml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
