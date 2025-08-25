// 优化的图片展示组件 - 防止CLS + SEO优化

"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Download, FileText, Copy } from "lucide-react"
import { ConvertedImage, OcrResult } from '@/types/pdf-converter-types'
import { 
  generateSEOAltText, 
  getOptimizedImageProps, 
  convertToWebP, 
  checkWebPSupport,
  generateImageStructuredData
} from '@/lib/utils/image-seo-utils'

interface OptimizedImageDisplayProps {
  image: ConvertedImage
  ocrResult?: OcrResult
  isShowingOcr?: boolean
  onDownload: () => void
  onExtractText: () => void
  onToggleOcr: () => void
  onCopyText: (text: string) => void
  language: string
  t: (key: string) => string
  fileName?: string
  isBatchMode?: boolean
}

export function OptimizedImageDisplay({
  image,
  ocrResult,
  isShowingOcr,
  onDownload,
  onExtractText,
  onToggleOcr,
  onCopyText,
  language,
  t,
  fileName,
  isBatchMode = false
}: OptimizedImageDisplayProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [webpSupported, setWebpSupported] = useState(false)
  const [optimizedImageSrc, setOptimizedImageSrc] = useState(image.dataUrl || "/placeholder.svg")

  // 检查WebP支持并进行图片优化
  useEffect(() => {
    const initializeImageOptimization = async () => {
      try {
        // 检查WebP支持
        const supported = await checkWebPSupport()
        setWebpSupported(supported)
        
        // 如果支持WebP且有有效的图片数据，进行转换
        if (supported && image.dataUrl && image.dataUrl.startsWith('data:image/')) {
          try {
            const webpUrl = await convertToWebP(image.dataUrl, 0.85)
            setOptimizedImageSrc(webpUrl)
          } catch (error) {
            console.warn('WebP conversion failed, using original image:', error)
            setOptimizedImageSrc(image.dataUrl)
          }
        } else {
          setOptimizedImageSrc(image.dataUrl || "/placeholder.svg")
        }
      } catch (error) {
        console.warn('Image optimization initialization failed:', error)
        setOptimizedImageSrc(image.dataUrl || "/placeholder.svg")
      }
    }

    initializeImageOptimization()
  }, [image.dataUrl])

  // 生成SEO友好的alt文本
  const seoAltText = generateSEOAltText({
    type: 'pdf-page',
    pageNumber: image.pageNumber,
    fileName: fileName,
    language: language,
    hasOCR: true,
    ocrExtracted: ocrResult?.isCompleted && !!ocrResult?.text
  })

  // 获取优化的图片属性
  const imageProps = getOptimizedImageProps({
    pageNumber: image.pageNumber,
    isPreview: false,
    isBatchMode: isBatchMode
  })

  // 生成图片结构化数据（用于SEO）
  const imageStructuredData = generateImageStructuredData({
    url: optimizedImageSrc,
    alt: seoAltText,
    width: 800,
    height: 600,
    format: webpSupported ? 'image/webp' : 'image/png',
    pageNumber: image.pageNumber,
    fileName: fileName,
    language: language
  })

  return (
    <div className="space-y-4">
      {/* 固定尺寸的图片容器，防止CLS */}
      <div className="relative group">
        <div className="aspect-[3/4] w-full bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border">
          {!imageLoaded && !imageError && (
            // 骨架屏
            <div className="w-full h-full animate-pulse bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <div className="text-gray-400 dark:text-gray-500">
                {language === "zh" ? "加载中..." : "Loading..."}
              </div>
            </div>
          )}
          
          {imageError && (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">
                  {language === "zh" ? "图片加载失败" : "Failed to load image"}
                </p>
              </div>
            </div>
          )}
          
          <Image
            src={optimizedImageSrc}
            alt={seoAltText}
            fill
            className={`object-contain transition-opacity duration-300 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            unoptimized={false} // 启用Next.js优化
            {...imageProps}
            quality={imageProps.quality}
          />
          
          {/* 悬停操作按钮 */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
            <Button 
              size="sm" 
              onClick={onDownload} 
              className="flex items-center gap-1"
              aria-label={language === "zh" 
                ? `下载第${image.pageNumber}页图像` 
                : `Download page ${image.pageNumber} image`
              }
            >
              <Download className="h-3 w-3" />
              {t("download")}
            </Button>
            
            <Button 
              size="sm" 
              variant={ocrResult?.isExtracting ? "default" : 
                      ocrResult?.isCompleted && ocrResult?.text ? "outline" : "secondary"}
              onClick={onExtractText}
              disabled={ocrResult?.isExtracting}
              className={`flex items-center gap-1 ${
                ocrResult?.isExtracting ? 'bg-blue-600 hover:bg-blue-700' : 
                ocrResult?.isCompleted && ocrResult?.text ? 'border-green-500 text-green-600 hover:bg-green-50' : ''
              }`}
              aria-label={language === "zh" 
                ? (ocrResult?.isExtracting ? `正在识别第${image.pageNumber}页文字` : 
                   ocrResult?.isCompleted && ocrResult?.text ? `第${image.pageNumber}页文字已识别` : 
                   `识别第${image.pageNumber}页文字`)
                : (ocrResult?.isExtracting ? `Extracting text from page ${image.pageNumber}` : 
                   ocrResult?.isCompleted && ocrResult?.text ? `Text extracted from page ${image.pageNumber}` : 
                   `Extract text from page ${image.pageNumber}`)
              }
            >
              {ocrResult?.isExtracting ? (
                <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
              ) : ocrResult?.isCompleted && ocrResult?.text ? (
                <div className="h-3 w-3 rounded-full bg-green-500 flex items-center justify-center">
                  <div className="h-1.5 w-1.5 bg-white rounded-full"></div>
                </div>
              ) : (
                <FileText className="h-3 w-3" />
              )}
              {ocrResult?.isExtracting ? t("extractingText") : 
               ocrResult?.isCompleted && ocrResult?.text ? t("textExtracted") : 
               t("extractText")}
            </Button>
          </div>
        </div>
      </div>
      
      {/* 页面信息 */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          {t("page")} {image.pageNumber} {t("pageUnit")}
        </p>
      </div>
      
      {/* OCR提取状态显示 */}
      {ocrResult?.isExtracting && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2" role="status" aria-live="polite">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" aria-hidden="true"></div>
            <span className="text-sm font-medium">{t("extractingText")}</span>
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400">
            {language === "zh" ? "正在识别图片中的文字内容，请稍候..." : "Recognizing text content in the image, please wait..."}
          </div>
        </div>
      )}
      
      {/* OCR结果区域 */}
      {ocrResult && !ocrResult.isExtracting && (
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleOcr}
            className="w-full flex items-center gap-2"
            aria-expanded={isShowingOcr}
            aria-controls={`ocr-result-${image.pageNumber}`}
            aria-label={language === "zh" 
              ? (isShowingOcr ? `隐藏第${image.pageNumber}页的识别文字` : `显示第${image.pageNumber}页的识别文字`)
              : (isShowingOcr ? `Hide extracted text for page ${image.pageNumber}` : `Show extracted text for page ${image.pageNumber}`)
            }
          >
            <FileText className="h-4 w-4" />
            {isShowingOcr ? (language === "zh" ? "隐藏文字" : "Hide Text") : (language === "zh" ? "显示提取的文字" : "Show Extracted Text")}
            {ocrResult.text && `(${ocrResult.text.length}${language === "zh" ? "字符" : " characters"})`}
          </Button>
          
          {isShowingOcr && ocrResult.text && (
            <div 
              id={`ocr-result-${image.pageNumber}`}
              className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-3 space-y-2"
              role="region"
              aria-labelledby={`ocr-result-title-${image.pageNumber}`}
            >
              <div className="flex items-center justify-between">
                <span 
                  id={`ocr-result-title-${image.pageNumber}`}
                  className="text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {language === "zh" ? "识别结果" : "OCR Result"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onCopyText(ocrResult.text)}
                  className="h-6 px-2"
                  aria-label={language === "zh" ? "复制识别的文字到剪贴板" : "Copy extracted text to clipboard"}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div 
                className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-32 overflow-y-auto"
                role="textbox"
                aria-readonly="true"
                aria-label={language === "zh" ? "识别出的文字内容" : "Extracted text content"}
              >
                {ocrResult.text}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 图片SEO结构化数据 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(imageStructuredData)
        }}
      />
    </div>
  )
}