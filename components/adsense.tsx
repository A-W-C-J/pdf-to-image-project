'use client'

import { useEffect } from 'react'

// 扩展 Window 接口以包含 adsbygoogle
declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

interface AdSenseProps {
  adSlot: string
  adFormat?: string
  adLayout?: string
  style?: React.CSSProperties
  className?: string
}

export function AdSense({
  adSlot,
  adFormat = 'fluid',
  adLayout = 'in-article',
  style = { display: 'block', textAlign: 'center' },
  className = ''
}: AdSenseProps) {
  useEffect(() => {
    try {
      // 确保 adsbygoogle 数组存在
      if (typeof window !== 'undefined') {
        window.adsbygoogle = window.adsbygoogle || []
        window.adsbygoogle.push({})
      }
    } catch (error) {
      console.error('AdSense error:', error)
    }
  }, [])

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={style}
      data-ad-layout={adLayout}
      data-ad-format={adFormat}
      data-ad-client="ca-pub-5218561367407219"
      data-ad-slot={adSlot}
    />
  )
}

// 预定义的广告组件
export function InArticleAd() {
  return (
    <div className="my-8">
      <AdSense
        adSlot="2331654799"
        adLayout="in-article"
        adFormat="fluid"
        style={{ display: 'block', textAlign: 'center' }}
      />
    </div>
  )
}

export function SidebarAd() {
  return (
    <div className="mb-4">
      <AdSense
        adSlot="2331654799"
        adFormat="auto"
        style={{ display: 'block' }}
      />
    </div>
  )
}

export function BannerAd() {
  return (
    <div className="w-full my-4">
      <AdSense
        adSlot="2331654799"
        adFormat="auto"
        style={{ display: 'block' }}
      />
    </div>
  )
}

export function AutoRelaxedAd() {
  return (
    <div className="w-full my-4">
      <AdSense
        adSlot="9523850739"
        adFormat="autorelaxed"
        style={{ display: 'block' }}
      />
    </div>
  )
}