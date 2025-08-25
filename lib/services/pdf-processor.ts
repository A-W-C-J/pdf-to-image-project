// PDF处理服务模块

import { ConvertedImage, ConversionResult, BatchFile, PdfOptions } from '@/types/pdf-converter-types'
import { applyWatermark, createGifAnimation } from '@/lib/utils/pdf-converter-utils'
import { MERGE_QUALITY, DEFAULT_PAGE_SPACING, DEFAULT_MERGE_MARGIN } from '@/lib/constants/pdf-converter-constants'
import { createAppError, ErrorType } from '@/lib/error-handler'

// 动态导入PDF.js以优化LCP
let pdfjsLib: typeof import('pdfjs-dist') | null = null
const loadPDFJS = async () => {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist")
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
  }
  return pdfjsLib
}

// 动态导入PDF-lib以优化LCP
let pdfLib: typeof import('pdf-lib') | null = null
const loadPDFLib = async () => {
  if (!pdfLib) {
    pdfLib = await import("pdf-lib")
  }
  return pdfLib
}

/**
 * 从URL获取PDF文件
 */
export const fetchPdfFromUrl = async (url: string, setStatus: (status: string) => void, t: (key: string) => string): Promise<ArrayBuffer> => {
  setStatus(t("fetchingPdf"))
  
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw createAppError(
        `HTTP ${response.status}: ${response.statusText}`,
        ErrorType.NETWORK,
        'FETCH_ERROR',
        { status: response.status, statusText: response.statusText }
      )
    }

    const contentType = response.headers.get("content-type")
    if (contentType && !contentType.includes("application/pdf")) {
      throw createAppError(
        t("invalidPdfUrl"),
        ErrorType.VALIDATION,
        'INVALID_CONTENT_TYPE',
        { contentType }
      )
    }

    return await response.arrayBuffer()
  } catch (error) {
    // 如果是网络错误，重新包装
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw createAppError(
        '网络连接失败，请检查网络连接后重试',
        ErrorType.NETWORK,
        'NETWORK_ERROR',
        { originalError: error.message }
      )
    }
    // 重新抛出已经包装的错误
    throw error
  }
}

/**
 * 合并页面
 */
export const mergePages = async (
  images: ConvertedImage[], 
  format: string,
  enableWatermark: boolean,
  watermarkText: string,
  watermarkPosition: string,
  watermarkOpacity: number,
  setProgress: (progress: number) => void
): Promise<ConvertedImage> => {
  if (!images || images.length === 0) {
    throw new Error('No images to merge')
  }
  
  // 如果是GIF格式，直接生成动画
  if (format === 'image/gif') {
    const gifDataUrl = await createGifAnimation(images)
    return {
      pageNumber: 0,
      dataUrl: gifDataUrl,
      type: format
    }
  }
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!ctx) {
    throw new Error('Failed to get canvas context')
  }
  
  return new Promise((resolve, reject) => {
    try {
      // 创建临时图片元素来获取尺寸
      const tempImages: HTMLImageElement[] = []
      let loadedCount = 0
      let hasError = false
      
      const onImageLoad = () => {
        if (hasError) return
        
        loadedCount++
        const progress = (loadedCount / images.length) * 50 // 加载占50%进度
        setProgress(progress)
        
        if (loadedCount === images.length) {
          // 所有图片加载完成，开始合并
          try {
            performMerge()
          } catch (error) {
            hasError = true
            reject(error)
          }
        }
      }
      
      const onImageError = () => {
        if (hasError) return
        hasError = true
        reject(new Error('Failed to load image for merging'))
      }
      
      // 加载所有图片
      images.forEach((image, index) => {
        const img = new window.Image()
        img.onload = onImageLoad
        img.onerror = onImageError
        img.src = image.dataUrl
        tempImages[index] = img
      })
    
    const performMerge = () => {
      try {
        setProgress(60) // 开始合并进度
        
        // 验证所有图片是否正确加载
        for (let i = 0; i < tempImages.length; i++) {
          const img = tempImages[i]
          if (!img.complete || img.naturalWidth === 0) {
            throw new Error(`Image ${i + 1} failed to load properly`)
          }
        }
        
        // 计算合并后的画布尺寸
        let totalHeight = DEFAULT_MERGE_MARGIN * 2 // 上下边距
        let maxImageWidth = 0
        
        tempImages.forEach((img) => {
          maxImageWidth = Math.max(maxImageWidth, img.width)
          totalHeight += img.height
        })
        
        // 添加页面间距
        totalHeight += DEFAULT_PAGE_SPACING * (tempImages.length - 1)
        
        setProgress(70) // 尺寸计算完成
        
        // 智能自适应尺寸计算 - 保持原始比例，避免失真
        const finalWidth = maxImageWidth + DEFAULT_MERGE_MARGIN * 2
        const finalHeight = totalHeight + DEFAULT_MERGE_MARGIN * 2
        
        // 智能缩放：只有在图片过大时才缩放，且保持宽高比
        let scaleRatio = 1
        
        // 如果图片尺寸过大，按比例缩放
        if (finalWidth > MERGE_QUALITY.MAX_REASONABLE_WIDTH) {
          scaleRatio = Math.min(scaleRatio, MERGE_QUALITY.MAX_REASONABLE_WIDTH / finalWidth)
        }
        if (finalHeight > MERGE_QUALITY.MAX_REASONABLE_HEIGHT) {
          scaleRatio = Math.min(scaleRatio, MERGE_QUALITY.MAX_REASONABLE_HEIGHT / finalHeight)
        }
        
        canvas.width = finalWidth * scaleRatio
        canvas.height = finalHeight * scaleRatio
        
        setProgress(80) // 画布设置完成
        
        // 设置白色背景
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // 绘制所有页面 - 优化质量和布局
        let currentY = DEFAULT_MERGE_MARGIN * scaleRatio
        
        // 设置高质量渲染
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        tempImages.forEach((img, index) => {
          const scaledWidth = img.width * scaleRatio
          const scaledHeight = img.height * scaleRatio
          const x = (canvas.width - scaledWidth) / 2 // 居中对齐
          
          // 使用高质量绘制
          ctx.drawImage(img, x, currentY, scaledWidth, scaledHeight)
          currentY += scaledHeight + (DEFAULT_PAGE_SPACING * scaleRatio)
          
          // 更新绘制进度
          const drawProgress = 80 + (index + 1) / tempImages.length * 10
          setProgress(drawProgress)
        })
        
        setProgress(90) // 图片绘制完成
        
        // 如果启用水印，应用到合并后的图片
        if (enableWatermark && watermarkText.trim()) {
          try {
            applyWatermark(canvas, watermarkText, watermarkPosition, watermarkOpacity)
          } catch (watermarkError) {
            console.warn('Failed to apply watermark:', watermarkError)
            // 水印失败不应该阻止合并过程
          }
        }
        
        setProgress(95) // 水印应用完成
        
        // 使用最高质量输出
        let mergedDataUrl: string
        if (format === 'image/jpeg') {
          mergedDataUrl = canvas.toDataURL(format, MERGE_QUALITY.JPEG_QUALITY)
        } else if (format === 'image/png' || format === 'image/tiff') {
          mergedDataUrl = canvas.toDataURL(format)
        } else if (format === 'image/bmp') {
          // BMP格式转换为PNG输出（浏览器原生支持）
          mergedDataUrl = canvas.toDataURL('image/png')
        } else {
          mergedDataUrl = canvas.toDataURL(format)
        }
        
        if (!mergedDataUrl || mergedDataUrl === 'data:,') {
          throw new Error('Failed to generate merged image')
        }
        
        setProgress(100) // 完成
        
        resolve({
           pageNumber: 0,
           dataUrl: mergedDataUrl,
           type: format
         })
      } catch (error) {
         hasError = true
         reject(error instanceof Error ? error : new Error('Unknown error during merge'))
       }
     }
   } catch (error) {
     reject(error instanceof Error ? error : new Error('Failed to initialize merge process'))
   }
  })
}

/**
 * 转换单个PDF文件（优化版本，使用动态导入）
 */
export const convertSinglePDF = async (
  file: File, 
  scale: number,
  format: string,
  enableWatermark: boolean,
  watermarkText: string,
  watermarkPosition: string,
  watermarkOpacity: number,
  fileId?: string,
  setBatchFiles?: React.Dispatch<React.SetStateAction<BatchFile[]>>
): Promise<ConversionResult> => {
  // 动态加载PDF.js以优化LCP
  const pdfjsLib = await loadPDFJS()

  const arrayBuffer = await file.arrayBuffer()
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
  const pdfDocument = await loadingTask.promise
  const totalPages = pdfDocument.numPages
  const images: ConvertedImage[] = []

  for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
    // 更新单个文件的进度
    if (fileId && setBatchFiles) {
      setBatchFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress: (pageNumber / totalPages) * 100 } : f
      ))
    }

    const page = await pdfDocument.getPage(pageNumber)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")!
    canvas.height = viewport.height
    canvas.width = viewport.width

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'

    const renderContext = {
      canvasContext: context,
      viewport: viewport,
      canvas: canvas,
    }

    await page.render(renderContext).promise

    if (enableWatermark && watermarkText.trim()) {
      applyWatermark(canvas, watermarkText, watermarkPosition, watermarkOpacity)
    }

    let imageDataUrl: string
    if (format === 'image/jpeg') {
      imageDataUrl = canvas.toDataURL(format, 1.0)
    } else if (format === 'image/png' || format === 'image/tiff') {
      imageDataUrl = canvas.toDataURL(format)
    } else if (format === 'image/gif') {
      imageDataUrl = canvas.toDataURL('image/png')
    } else if (format === 'image/bmp') {
      imageDataUrl = canvas.toDataURL('image/png')
    } else {
      imageDataUrl = canvas.toDataURL(format)
    }

    images.push({
      dataUrl: imageDataUrl,
      pageNumber,
      type: format,
      fileName: file.name
    })
  }

  return { images }
}

/**
 * 生成可搜索PDF（优化版本，使用动态导入）
 */
export const generateSearchablePdf = async (
  convertedImages: ConvertedImage[],
  ocrResults: Array<{ pageNumber: number; words?: Array<{ text: string; confidence: number; bbox: { x0: number; y0: number; x1: number; y1: number } }> }>,
  pdfOptions: PdfOptions,
  t: (key: string) => string
): Promise<string> => {
  if (convertedImages.length === 0) {
    throw new Error(t("noImagesAvailable"))
  }

  // 动态加载PDF-lib以优化LCP
  const { PDFDocument, rgb, StandardFonts } = await loadPDFLib()

  // 创建新的PDF文档
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  for (const image of convertedImages) {
    // 将图像数据转换为Uint8Array
    const imageBytes = await fetch(image.dataUrl).then(res => res.arrayBuffer())
    let pdfImage
    
    // 根据图像类型选择合适的嵌入方法
    if (image.type === 'image/jpeg' || image.dataUrl.includes('data:image/jpeg')) {
      pdfImage = await pdfDoc.embedJpg(new Uint8Array(imageBytes))
    } else {
      pdfImage = await pdfDoc.embedPng(new Uint8Array(imageBytes))
    }
    
    // 获取图像尺寸
    const imageDims = pdfImage.scale(1)
    
    // 创建新页面
    const page = pdfDoc.addPage([imageDims.width, imageDims.height])
    
    // 绘制图像
    page.drawImage(pdfImage, {
      x: 0,
      y: 0,
      width: imageDims.width,
      height: imageDims.height,
    })

    // 添加文字层（使用配置的置信度阈值）
    const ocrResult = ocrResults.find(r => r.pageNumber === image.pageNumber)
    if (ocrResult?.words && ocrResult.words.length > 0) {
      for (const word of ocrResult.words) {
        if (word.confidence > pdfOptions.ocrConfidenceThreshold) {
          // 计算文字位置和大小（考虑页面边距）
          const x = word.bbox.x0 + pdfOptions.pageMargin
          const y = imageDims.height - word.bbox.y1 + pdfOptions.pageMargin // PDF坐标系Y轴翻转
          const height = word.bbox.y1 - word.bbox.y0
          
          // 计算合适的字体大小（使用配置的倍数）
          const baseFontSize = Math.max(8, Math.min(height * 0.8, 20))
          const fontSize = baseFontSize * pdfOptions.fontSizeMultiplier
          
          // 添加文字层（透明度可配置）
          page.drawText(word.text, {
            x: x,
            y: y,
            size: fontSize,
            font: font,
            color: rgb(0, 0, 0),
            opacity: pdfOptions.enableTextSelection ? pdfOptions.textLayerOpacity : 0,
          })
        }
      }
    }

    // 添加书签（如果启用）
    if (pdfOptions.addBookmarks) {
      // 这里可以添加书签逻辑
    }
  }

  // 生成PDF字节数组
  const pdfBytes = await pdfDoc.save()
  
  // 创建下载链接
  const blob = new Blob([pdfBytes], { type: 'application/pdf' })
  const url = URL.createObjectURL(blob)
  
  return url
}