// PDF转换器工具函数

import { ConvertedImage, ImageQualityAnalysis } from '@/types/pdf-converter-types'
import { FORMAT_EXTENSIONS, QUALITY_THRESHOLDS } from '@/lib/constants/pdf-converter-constants'
import GIF from "gif.js"

/**
 * 获取文件扩展名
 */
export const getFileExtension = (format: string): string => {
  return FORMAT_EXTENSIONS[format as keyof typeof FORMAT_EXTENSIONS] || 'png'
}

/**
 * 图像质量检测函数
 */
export const analyzeImageQuality = (imageData: ImageData): ImageQualityAnalysis => {
  const data = imageData.data
  let totalBrightness = 0
  let contrastSum = 0
  const pixels = data.length / 4
  
  // 计算平均亮度
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
    totalBrightness += brightness
  }
  const avgBrightness = totalBrightness / pixels
  
  // 计算对比度
  for (let i = 0; i < data.length; i += 4) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
    contrastSum += Math.pow(brightness - avgBrightness, 2)
  }
  const contrast = Math.sqrt(contrastSum / pixels)
  
  return {
    brightness: avgBrightness,
    contrast: contrast,
    isLowContrast: contrast < QUALITY_THRESHOLDS.LOW_CONTRAST,
    isDark: avgBrightness < QUALITY_THRESHOLDS.DARK_BRIGHTNESS,
    isBright: avgBrightness > QUALITY_THRESHOLDS.BRIGHT_BRIGHTNESS
  }
}

/**
 * 图像预处理函数，提升OCR识别精度
 */
export const preprocessImageForOCR = async (imageDataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const img = new window.Image()
    
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // 绘制原始图像
      ctx.drawImage(img, 0, 0)
      
      // 获取图像数据
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data
      
      // 分析图像质量
      const quality = analyzeImageQuality(imageData)
      
      // 根据图像质量自动选择处理策略
      for (let i = 0; i < data.length; i += 4) {
        // 转换为灰度
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
        
        let processed = gray
        
        // 根据图像特征选择不同的处理方式
        if (quality.isLowContrast) {
          // 低对比度图像：强化对比度
          processed = Math.min(255, Math.max(0, (gray - 128) * 2.0 + 128))
        } else if (quality.isDark) {
          // 暗图像：提升亮度并增强对比度
          processed = Math.min(255, gray * 1.3 + 30)
          processed = Math.min(255, Math.max(0, (processed - 128) * 1.2 + 128))
        } else if (quality.isBright) {
          // 亮图像：降低亮度并保持对比度
          processed = Math.max(0, gray * 0.8 - 20)
          processed = Math.min(255, Math.max(0, (processed - 128) * 1.1 + 128))
        } else {
          // 正常图像：轻微增强对比度
          processed = Math.min(255, Math.max(0, (gray - 128) * 1.2 + 128))
        }
        
        // 自适应二值化
        const threshold = quality.isDark ? QUALITY_THRESHOLDS.BINARY_THRESHOLD_DARK : 
                         quality.isBright ? QUALITY_THRESHOLDS.BINARY_THRESHOLD_BRIGHT : 
                         QUALITY_THRESHOLDS.BINARY_THRESHOLD_NORMAL
        const binary = processed > threshold ? 255 : 0
        
        data[i] = binary     // R
        data[i + 1] = binary // G
        data[i + 2] = binary // B
        // data[i + 3] 保持不变 (Alpha)
      }
      
      // 将处理后的数据放回canvas
      ctx.putImageData(imageData, 0, 0)
      
      // 返回处理后的图像数据URL
      resolve(canvas.toDataURL('image/png'))
    }
    
    img.src = imageDataUrl
  })
}

/**
 * 创建GIF动画的辅助函数
 */
export const createGifAnimation = async (images: ConvertedImage[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (images.length === 0) {
      reject(new Error('No images to create GIF'))
      return
    }

    // 获取第一张图片的尺寸
    const firstImg = new window.Image()
    firstImg.onload = () => {
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: firstImg.width,
        height: firstImg.height
      })

      let loadedCount = 0
      const canvases: HTMLCanvasElement[] = []

      // 预加载所有图片并转换为canvas
      images.forEach((image, index) => {
        const img = new window.Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d', { willReadFrequently: true })!
          canvas.width = firstImg.width
          canvas.height = firstImg.height
          
          // 绘制白色背景
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          
          // 绘制图片
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          canvases[index] = canvas
          
          loadedCount++
          if (loadedCount === images.length) {
            // 所有图片加载完成，开始生成GIF
            canvases.forEach(canvas => {
              gif.addFrame(canvas, { delay: 1000 }) // 1秒延迟
            })
            
            gif.on('finished', (blob: Blob) => {
              const reader = new FileReader()
              reader.onload = () => {
                resolve(reader.result as string)
              }
              reader.onerror = () => {
                reject(new Error('Failed to read GIF blob'))
              }
              reader.readAsDataURL(blob)
            })
            
            gif.render()
          }
        }
        img.onerror = () => {
          reject(new Error(`Failed to load image ${index}`))
        }
        img.src = image.dataUrl
      })
    }
    firstImg.onerror = () => {
      reject(new Error('Failed to load first image'))
    }
    firstImg.src = images[0].dataUrl
  })
}

/**
 * 应用水印
 */
export const applyWatermark = (canvas: HTMLCanvasElement, text: string, position: string, opacity: number) => {
  const context = canvas.getContext("2d")!
  const canvasWidth = canvas.width
  const canvasHeight = canvas.height

  context.save()

  context.globalAlpha = opacity
  context.fillStyle = "#000000"
  context.font = `${Math.max(canvasWidth, canvasHeight) / 20}px Arial`
  context.textAlign = "center"
  context.textBaseline = "middle"

  let x = canvasWidth / 2
  let y = canvasHeight / 2

  switch (position) {
    case "top-left":
      x = canvasWidth * 0.2
      y = canvasHeight * 0.1
      break
    case "top-right":
      x = canvasWidth * 0.8
      y = canvasHeight * 0.1
      break
    case "bottom-left":
      x = canvasWidth * 0.2
      y = canvasHeight * 0.9
      break
    case "bottom-right":
      x = canvasWidth * 0.8
      y = canvasHeight * 0.9
      break
    case "center":
    default:
      x = canvasWidth / 2
      y = canvasHeight / 2
      break
  }

  context.translate(x, y)
  context.rotate(-Math.PI / 6)
  context.fillText(text, 0, 0)

  context.restore()
}

/**
 * 复制文字到剪贴板
 */
export const copyTextToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error("Failed to copy text:", error)
    return false
  }
}

/**
 * 下载单个图像
 */
export const downloadSingle = (image: ConvertedImage) => {
  const link = document.createElement("a")
  link.href = image.dataUrl
  const extension = getFileExtension(image.type)
  // 如果是合并页面（pageNumber为0），使用特殊文件名
  const filename = image.pageNumber === 0 ? `merged-pages.${extension}` : `page_${image.pageNumber}.${extension}`
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * 创建并下载ZIP文件
 */
export const createAndDownloadZip = async (images: ConvertedImage[], fileName: string) => {
  const JSZip = (await import("jszip")).default
  const zip = new JSZip()

  images.forEach((image) => {
    const base64Data = image.dataUrl.split(",")[1]
    const extension = getFileExtension(image.type)
    const filename = image.pageNumber === 0 ? `merged-pages.${extension}` : `page_${image.pageNumber}.${extension}`
    zip.file(filename, base64Data, { base64: true })
  })

  const zipBlob = await zip.generateAsync({ type: "blob" })
  const downloadUrl = URL.createObjectURL(zipBlob)

  const link = document.createElement("a")
  link.href = downloadUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(downloadUrl)
}