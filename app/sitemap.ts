import type { MetadataRoute } from "next"

// 这个文件现在作为sitemap index，引用其他sitemap文件
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.pdf2img.top"
  const currentDate = new Date()

  // 返回sitemap index格式，引用其他sitemap文件
  return [
    {
      url: `${baseUrl}/main-sitemap.xml`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/blog/sitemap.xml`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog/tag/sitemap.xml`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ]
}
