// 图片SEO优化工具模块

/**
 * 将图片转换为WebP格式
 * @param imageDataUrl - 原始图片的Data URL
 * @param quality - WebP质量 (0-1)
 * @returns Promise<string> - WebP格式的Data URL
 */
export async function convertToWebP(imageDataUrl: string, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }
        
        canvas.width = img.width
        canvas.height = img.height
        
        // 绘制图片到canvas
        ctx.drawImage(img, 0, 0)
        
        // 转换为WebP格式
        const webpDataUrl = canvas.toDataURL('image/webp', quality)
        
        // 检查浏览器是否支持WebP
        if (webpDataUrl.startsWith('data:image/webp')) {
          resolve(webpDataUrl)
        } else {
          // 如果不支持WebP，回退到原始格式
          resolve(imageDataUrl)
        }
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image for WebP conversion'))
      }
      
      img.src = imageDataUrl
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 检查浏览器是否支持WebP格式
 * @returns Promise<boolean>
 */
export function checkWebPSupport(): Promise<boolean> {
  return new Promise((resolve) => {
    const webP = new Image()
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2)
    }
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
  })
}

/**
 * 生成SEO友好的alt文本
 * @param context - 图片上下文信息
 * @returns string - 描述性的alt文本
 */
export function generateSEOAltText(context: {
  type: 'pdf-page' | 'converted-image' | 'preview' | 'result'
  pageNumber?: number
  fileName?: string
  format?: string
  language: string
  hasOCR?: boolean
  ocrExtracted?: boolean
}): string {
  const { type, pageNumber, fileName, format, language, hasOCR, ocrExtracted } = context
  
  // 基础描述
  let baseDescription = ''
  
  switch (type) {
    case 'pdf-page':
      baseDescription = language === 'zh' 
        ? `PDF文档第${pageNumber}页转换后的图片`
        : `Converted image of PDF page ${pageNumber}`
      break
    case 'converted-image':
      baseDescription = language === 'zh'
        ? `PDF转${format?.toUpperCase() || '图片'}格式的结果`
        : `PDF to ${format?.toUpperCase() || 'image'} conversion result`
      break
    case 'preview':
      baseDescription = language === 'zh'
        ? `PDF页面预览图像`
        : `PDF page preview image`
      break
    case 'result':
      baseDescription = language === 'zh'
        ? `转换完成的图片文件`
        : `Successfully converted image file`
      break
    default:
      baseDescription = language === 'zh'
        ? `PDF处理结果图像`
        : `PDF processing result image`
  }
  
  // 添加文件名信息（如果提供）
  if (fileName) {
    const cleanFileName = fileName.replace(/\.(pdf|PDF)$/, '')
    baseDescription = language === 'zh'
      ? `${cleanFileName} - ${baseDescription}`
      : `${cleanFileName} - ${baseDescription}`
  }
  
  // 添加页码信息
  if (pageNumber && type !== 'pdf-page') {
    baseDescription += language === 'zh'
      ? ` (第${pageNumber}页)`
      : ` (page ${pageNumber})`
  }
  
  // 添加OCR信息
  if (hasOCR) {
    if (ocrExtracted) {
      baseDescription += language === 'zh'
        ? ' - 已提取文字内容'
        : ' - text content extracted'
    } else {
      baseDescription += language === 'zh'
        ? ' - 支持文字识别'
        : ' - supports text recognition'
    }
  }
  
  return baseDescription
}

/**
 * 优化图片的性能属性
 * @param context - 图片上下文信息
 * @returns 优化后的图片属性对象
 */
export function getOptimizedImageProps(context: {
  pageNumber?: number
  isPreview?: boolean
  isBatchMode?: boolean
}) {
  const { pageNumber = 1, isPreview = false, isBatchMode = false } = context
  
  // 确定图片优先级
  const priority = isPreview || pageNumber <= 2 || (!isBatchMode && pageNumber === 1)
  
  // 确定loading策略
  const loading = priority ? 'eager' : 'lazy'
  
  // 确定sizes属性
  let sizes = '(max-width: 768px) 100vw'
  
  if (isBatchMode) {
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
  } else {
    sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 800px'
  }
  
  return {
    priority,
    loading: loading as 'eager' | 'lazy',
    sizes,
    quality: 85, // 默认质量
    placeholder: 'blur' as const,
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
  }
}

/**
 * 为图片添加结构化数据
 * @param context - 图片上下文信息
 * @returns 图片的结构化数据对象
 */
export function generateImageStructuredData(context: {
  url: string
  alt: string
  width?: number
  height?: number
  format?: string
  pageNumber?: number
  fileName?: string
  language: string
}) {
  const { url, alt, width, height, format, pageNumber, fileName, language } = context
  
  return {
    "@context": "https://schema.org",
    "@type": "ImageObject",
    "contentUrl": url,
    "description": alt,
    "name": language === 'zh' 
      ? `PDF转图片 - ${fileName || '转换结果'}${pageNumber ? ` 第${pageNumber}页` : ''}`
      : `PDF to Image - ${fileName || 'Conversion Result'}${pageNumber ? ` Page ${pageNumber}` : ''}`,
    "encodingFormat": format || "image/png",
    "width": width,
    "height": height,
    "thumbnail": url,
    "license": "https://creativecommons.org/licenses/by/4.0/",
    "acquireLicensePage": "https://www.pdf2img.top",
    "creator": {
      "@type": "Organization",
      "name": "PDF Tools",
      "url": "https://www.pdf2img.top"
    },
    "usageInfo": "https://www.pdf2img.top/terms",
    "creditText": language === 'zh' 
      ? "由PDF转图片工具生成" 
      : "Generated by PDF to Image Converter"
  }
}

/**
 * 获取图片的MIME类型
 * @param dataUrl - 图片的Data URL
 * @returns string - MIME类型
 */
export function getImageMimeType(dataUrl: string): string {
  const match = dataUrl.match(/data:([^;]+);/)
  return match ? match[1] : 'image/png'
}

/**
 * 获取图片的文件扩展名
 * @param mimeType - MIME类型
 * @returns string - 文件扩展名
 */
export function getImageExtension(mimeType: string): string {
  const extensionMap: { [key: string]: string } = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/tiff': 'tiff'
  }
  
  return extensionMap[mimeType] || 'png'
}

/**
 * 压缩图片以优化文件大小
 * @param imageDataUrl - 原始图片的Data URL
 * @param maxWidth - 最大宽度
 * @param maxHeight - 最大高度
 * @param quality - 压缩质量 (0-1)
 * @returns Promise<string> - 压缩后的Data URL
 */
export async function compressImage(
  imageDataUrl: string, 
  maxWidth: number = 1920, 
  maxHeight: number = 1080, 
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        if (!ctx) {
          reject(new Error('Canvas context not available'))
          return
        }
        
        // 计算新的尺寸，保持宽高比
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height
          
          if (width > height) {
            width = maxWidth
            height = width / aspectRatio
          } else {
            height = maxHeight
            width = height * aspectRatio
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        // 绘制压缩后的图片
        ctx.drawImage(img, 0, 0, width, height)
        
        // 根据原始格式输出
        const mimeType = getImageMimeType(imageDataUrl)
        const compressedDataUrl = canvas.toDataURL(mimeType, quality)
        
        resolve(compressedDataUrl)
      }
      
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'))
      }
      
      img.src = imageDataUrl
    } catch (error) {
      reject(error)
    }
  })
}