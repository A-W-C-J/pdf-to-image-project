import type { MetadataRoute } from "next"
import { NextResponse } from "next/server"

export async function GET() {
  const baseUrl = "https://www.pdf2img.top"
  const currentDate = new Date().toISOString()

  const sitemap: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1.0,
      alternates: {
        languages: {
          en: `${baseUrl}/en`,
          zh: `${baseUrl}/zh`,
        },
      },
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
      alternates: {
        languages: {
          en: `${baseUrl}/en/about`,
          zh: `${baseUrl}/zh/about`,
        },
      },
    },
    {
      url: `${baseUrl}/topup`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
      alternates: {
        languages: {
          en: `${baseUrl}/en/topup`,
          zh: `${baseUrl}/zh/topup`,
        },
      },
    },
  ]

  // 生成XML格式的sitemap
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${sitemap
    .map(
      (item) => `<url>
<loc>${item.url}</loc>
${item.alternates?.languages ? Object.entries(item.alternates.languages)
        .map(([lang, url]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${url}" />`)
        .join('\n') : ''}
<lastmod>${item.lastModified}</lastmod>
<changefreq>${item.changeFrequency}</changefreq>
<priority>${item.priority}</priority>
</url>`
    )
    .join('\n')}
</urlset>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}