import type { MetadataRoute } from "next"

export default function sitemapIndex(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.pdf2img.top"
  const currentDate = new Date()

  return [
    {
      url: `${baseUrl}/sitemap.xml`,
      lastModified: currentDate,
    },
    {
      url: `${baseUrl}/blog/sitemap.xml`,
      lastModified: currentDate,
    },
    {
      url: `${baseUrl}/blog/tag/sitemap.xml`,
      lastModified: currentDate,
    },
  ]
}