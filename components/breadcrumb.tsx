"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { ChevronRight, Home } from "lucide-react"

interface BreadcrumbItem {
  label: string
  href: string
}

interface BreadcrumbProps {
  items?: BreadcrumbItem[]
  language?: 'zh' | 'en'
}

export default function Breadcrumb({ items, language: propLanguage }: BreadcrumbProps) {
  const pathname = usePathname()
  const [language, setLanguage] = useState<'zh' | 'en'>('en')

  useEffect(() => {
    if (propLanguage) {
      setLanguage(propLanguage)
    } else {
      // 从localStorage获取语言设置
      const savedLanguage = localStorage.getItem('preferred-language') as 'zh' | 'en'
      if (savedLanguage) {
        setLanguage(savedLanguage)
      }
    }
  }, [propLanguage])

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      title: {
        zh: '首页',
        en: 'Home'
      }
    }
    return translations[key]?.[language] || key
  }

  // 自动生成面包屑项目
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (items) return items

    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [
      { label: t('title'), href: '/' }
    ]

    let currentPath = ''
    pathSegments.forEach((segment) => {
      currentPath += `/${segment}`
      
      let label = segment
      switch (segment) {
        case 'blog':
          label = language === 'zh' ? '技术博客' : 'Tech Blog'
          break
        case 'about':
          label = language === 'zh' ? '关于我们' : 'About Us'
          break
        case 'admin':
          label = language === 'zh' ? '管理后台' : 'Admin'
          break
        default:
          // 对于动态路由，保持原始值
          label = decodeURIComponent(segment)
      }

      breadcrumbs.push({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        href: currentPath
      })
    })

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  // 生成结构化数据
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.label,
      "item": `https://www.pdf2img.top${item.href}`
    }))
  }

  if (breadcrumbs.length <= 1) {
    return null
  }

  return (
    <>
      {/* 结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData)
        }}
      />
      
      {/* 面包屑导航 */}
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
          {breadcrumbs.map((item, index) => (
            <li key={item.href} className="flex items-center">
              {index === 0 && (
                <Home className="w-4 h-4 mr-1" />
              )}
              
              {index < breadcrumbs.length - 1 ? (
                <Link
                  href={item.href}
                  className="hover:text-foreground transition-colors"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-foreground font-medium">
                  {item.label}
                </span>
              )}
              
              {index < breadcrumbs.length - 1 && (
                <ChevronRight className="w-4 h-4 mx-2" />
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  )
}