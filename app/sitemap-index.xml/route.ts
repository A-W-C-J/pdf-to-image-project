import { NextResponse } from 'next/server'

export async function GET() {
  const baseUrl = 'https://www.pdf2img.top'
  const currentDate = new Date().toISOString()

  const sitemapsXml = [
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
    .map(
      (sitemap) => `
    <sitemap>
      <loc>${sitemap.url}</loc>
      <lastmod>${sitemap.lastModified}</lastmod>
    </sitemap>`
    )
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapsXml}
</sitemapindex>`

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}