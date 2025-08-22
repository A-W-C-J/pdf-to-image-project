"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, FileImage, Upload, X, BookOpen, Github, User, Menu, FileText, Copy } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { translations, type Language, type TranslationKey } from "@/lib/i18n"
import GIF from "gif.js"
import { createWorker } from "tesseract.js"

interface ConvertedImage {
  dataUrl: string
  pageNumber: number
  type: string
}

interface OcrResult {
  pageNumber: number
  text: string
  isExtracting: boolean
  isCompleted: boolean
}

// 获取文件扩展名的辅助函数
const getFileExtension = (format: string): string => {
  switch (format) {
    case 'image/png':
      return 'png'
    case 'image/jpeg':
      return 'jpg'
    case 'image/tiff':
      return 'tiff'
    case 'image/gif':
      return 'gif' // GIF格式输出真正的GIF文件
    case 'image/bmp':
      return 'png' // BMP格式转换为PNG输出
    default:
      return 'png'
  }
}

// 创建GIF动画的辅助函数
const createGifAnimation = async (images: ConvertedImage[]): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (images.length === 0) {
      reject(new Error('No images to create GIF'))
      return
    }

    // 获取第一张图片的尺寸
    const firstImg = new Image()
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
        const img = new Image()
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

export default function PDFConverter() {
  const [language, setLanguage] = useState<Language>("en")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const t = (key: TranslationKey): string => translations[language][key]

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [pdfUrl, setPdfUrl] = useState<string>("")
  const [inputSource, setInputSource] = useState<"file" | "url">("file")
  const [pdfPassword, setPdfPassword] = useState<string>("")
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const [scale, setScale] = useState<number>(4.0) // 提高默认缩放比例获得更高清图片
  const [format, setFormat] = useState<string>("image/png")
  const [isConverting, setIsConverting] = useState(false)
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([])
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [enableWatermark, setEnableWatermark] = useState(false)
  const [watermarkText, setWatermarkText] = useState<string>("WATERMARK")
  const [watermarkPosition, setWatermarkPosition] = useState<string>("center")
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.3)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // 合并页面相关状态
  const [enableMerge, setEnableMerge] = useState(false)
  // 智能默认值 - 不再需要用户配置
  const pageSpacing = 20 // 页面间距
  const mergeMargin = 30 // 边距

  // OCR相关状态
  const [ocrResults, setOcrResults] = useState<OcrResult[]>([])
  const [ocrLanguage, setOcrLanguage] = useState<string>("chi_sim+eng")
  const [showOcrResults, setShowOcrResults] = useState<{ [key: number]: boolean }>({})

  // OCR文字提取函数
  const extractTextFromImage = async (pageNumber: number, imageDataUrl: string) => {
    try {
      // 更新状态为正在提取
      setOcrResults(prev => {
        const existing = prev.find(r => r.pageNumber === pageNumber)
        if (existing) {
          return prev.map(r => r.pageNumber === pageNumber ? { ...r, isExtracting: true, isCompleted: false } : r)
        } else {
          return [...prev, { pageNumber, text: "", isExtracting: true, isCompleted: false }]
        }
      })

      const worker = await createWorker(ocrLanguage)
      const { data: { text } } = await worker.recognize(imageDataUrl)
      await worker.terminate()

      // 更新提取结果
      setOcrResults(prev => 
        prev.map(r => r.pageNumber === pageNumber ? { ...r, text: text.trim(), isExtracting: false, isCompleted: true } : r)
      )

      setStatus(t("textExtracted"))
      
      // 3秒后自动显示提取结果
      setTimeout(() => {
        setShowOcrResults(prev => ({ ...prev, [pageNumber]: true }))
      }, 500)
      
    } catch (error) {
      console.error("OCR extraction failed:", error)
      setOcrResults(prev => 
        prev.map(r => r.pageNumber === pageNumber ? { ...r, text: "", isExtracting: false, isCompleted: true } : r)
      )
      setError(t("noTextFound"))
    }
  }

  // 复制文字到剪贴板
  const copyTextToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setStatus(t("textCopied"))
    } catch (error) {
      console.error("Failed to copy text:", error)
    }
  }

  // 下载文本文件
  const downloadTextFile = (text: string, pageNumber: number) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `page-${pageNumber}-text.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // 切换OCR结果显示
  const toggleOcrResult = (pageNumber: number) => {
    setShowOcrResults(prev => ({
      ...prev,
      [pageNumber]: !prev[pageNumber]
    }))
  }

  const applyWatermark = (canvas: HTMLCanvasElement, text: string, position: string, opacity: number) => {
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

  const mergePages = async (images: ConvertedImage[]): Promise<ConvertedImage> => {
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
        
        const onImageError = (error: Event) => {
          if (hasError) return
          hasError = true
          reject(new Error('Failed to load image for merging'))
        }
        
        // 加载所有图片
        images.forEach((image, index) => {
          const img = new Image()
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
          let totalHeight = mergeMargin * 2 // 上下边距
          let maxImageWidth = 0
          
          tempImages.forEach((img) => {
            maxImageWidth = Math.max(maxImageWidth, img.width)
            totalHeight += img.height
          })
          
          // 添加页面间距
          totalHeight += pageSpacing * (tempImages.length - 1)
          
          setProgress(70) // 尺寸计算完成
          
          // 智能自适应尺寸计算 - 保持原始比例，避免失真
          const finalWidth = maxImageWidth + mergeMargin * 2
          const finalHeight = totalHeight + mergeMargin * 2
          
          // 智能缩放：只有在图片过大时才缩放，且保持宽高比
          let scaleRatio = 1
          const maxReasonableWidth = 4000 // 合理的最大宽度
          const maxReasonableHeight = 8000 // 合理的最大高度
          
          // 如果图片尺寸过大，按比例缩放
          if (finalWidth > maxReasonableWidth) {
            scaleRatio = Math.min(scaleRatio, maxReasonableWidth / finalWidth)
          }
          if (finalHeight > maxReasonableHeight) {
            scaleRatio = Math.min(scaleRatio, maxReasonableHeight / finalHeight)
          }
          
          canvas.width = finalWidth * scaleRatio
          canvas.height = finalHeight * scaleRatio
          
          setProgress(80) // 画布设置完成
          
          // 设置白色背景
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          
          // 绘制所有页面 - 优化质量和布局
          let currentY = mergeMargin * scaleRatio
          
          // 设置高质量渲染
          ctx.imageSmoothingEnabled = true
          ctx.imageSmoothingQuality = 'high'
          
          tempImages.forEach((img, index) => {
            const scaledWidth = img.width * scaleRatio
            const scaledHeight = img.height * scaleRatio
            const x = (canvas.width - scaledWidth) / 2 // 居中对齐
            
            // 使用高质量绘制
            ctx.drawImage(img, x, currentY, scaledWidth, scaledHeight)
            currentY += scaledHeight + (pageSpacing * scaleRatio)
            
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
            mergedDataUrl = canvas.toDataURL(format, 1.0)
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let file: File | undefined | null = null
    if ("dataTransfer" in event) {
      file = event.dataTransfer.files?.[0]
    } else {
      file = event.target.files?.[0]
    }

    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
      setPdfUrl("")
      setPdfPassword("")
      setShowPasswordInput(false)
      setError("")
      setConvertedImages([])
      setProgress(0)
      setStatus("")
    } else {
      setError(t("selectValidPdf"))
    }
    setIsDragging(false)
  }

  const handleUrlChange = (url: string) => {
    setPdfUrl(url ?? "")
    if (url && url.trim()) {
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
    setPdfPassword("")
    setShowPasswordInput(false)
    setError("")
    setConvertedImages([])
    setProgress(0)
    setStatus("")
  }

  const fetchPdfFromUrl = async (url: string): Promise<ArrayBuffer> => {
    setStatus(t("fetchingPdf"))
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type")
    if (contentType && !contentType.includes("application/pdf")) {
      throw new Error(t("invalidPdfUrl"))
    }

    return await response.arrayBuffer()
  }

  const convertPDF = async () => {
    if (!selectedFile && !pdfUrl.trim()) return

    setIsConverting(true)
    setError("")
    setConvertedImages([])
    setProgress(0)
    setStatus(t("loadingPdfjs"))
    // 重置OCR相关状态
    setOcrResults([])
    setShowOcrResults(false)

    try {
      const pdfjsLib = await import("pdfjs-dist")

      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

      console.log("[v0] PDF.js version:", pdfjsLib.version)
      console.log("[v0] Worker source set to:", pdfjsLib.GlobalWorkerOptions.workerSrc)

      let arrayBuffer: ArrayBuffer

      if (selectedFile) {
        setStatus(t("readingPdf"))
        arrayBuffer = await selectedFile.arrayBuffer()
      } else {
        arrayBuffer = await fetchPdfFromUrl(pdfUrl.trim())
      }

      setStatus(t("parsingPdf"))
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
        password: pdfPassword || undefined,
      })

      loadingTask.onPassword = (callback: (password: string) => void, reason: number) => {
        if (reason === 1) {
          // NEED_PASSWORD
          setShowPasswordInput(true)
          setStatus(t("passwordRequired"))
          setIsConverting(false)
          return
        } else if (reason === 2) {
          // INCORRECT_PASSWORD
          setError(t("incorrectPassword"))
          setShowPasswordInput(true)
          setIsConverting(false)
          return
        }
      }

      const pdfDocument = await loadingTask.promise

      const totalPages = pdfDocument.numPages
      setStatus(`${t("totalPages")} ${totalPages} ${t("startConverting")}`)

      const images: ConvertedImage[] = []

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        setStatus(`${t("convertingPage")} ${pageNumber}/${totalPages} ${t("pageUnit")}...`)
        setProgress(((pageNumber - 1) / totalPages) * 100)

        const page = await pdfDocument.getPage(pageNumber)
        const viewport = page.getViewport({ scale })

        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")!
        canvas.height = viewport.height
        canvas.width = viewport.width

        // 设置高质量渲染
        context.imageSmoothingEnabled = true
        context.imageSmoothingQuality = 'high'

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        await page.render(renderContext).promise

        if (enableWatermark && watermarkText.trim()) {
          applyWatermark(canvas, watermarkText, watermarkPosition, watermarkOpacity)
        }

        // 使用最高质量输出
        let imageDataUrl: string
        if (format === 'image/jpeg') {
          imageDataUrl = canvas.toDataURL(format, 1.0)
        } else if (format === 'image/png' || format === 'image/tiff') {
          imageDataUrl = canvas.toDataURL(format)
        } else if (format === 'image/gif') {
          // GIF格式保持原样，后续会在合并时处理
          imageDataUrl = canvas.toDataURL('image/png')
        } else if (format === 'image/bmp') {
          // BMP格式转换为PNG输出（浏览器原生支持）
          imageDataUrl = canvas.toDataURL('image/png')
        } else {
          imageDataUrl = canvas.toDataURL(format)
        }

        images.push({
          dataUrl: imageDataUrl,
          pageNumber,
          type: format,
        })
      }

      // 如果启用了合并功能或选择了GIF格式，则合并所有页面
      if ((enableMerge || format === 'image/gif') && images.length > 1) {
        try {
          setStatus(t("mergingPages"))
          const mergedImage = await mergePages(images)
          setConvertedImages([mergedImage])
          setStatus(t("mergeComplete"))
        } catch (mergeError) {
          console.error("页面合并错误:", mergeError)
          // 合并失败时，回退到显示单独的页面
          setConvertedImages(images)
          setError(`${t("mergeError")}: ${mergeError instanceof Error ? mergeError.message : String(mergeError)}`)
          setStatus(`${t("convertComplete")} ${totalPages} ${t("images")} (${t("mergeFailed")})`)
        }
      } else {
        setConvertedImages(images)
        setStatus(`${t("convertComplete")} ${totalPages} ${t("images")}`)
      }
      
      setProgress(100)
    } catch (err) {
      console.error("PDF转换错误:", err)
      if (err instanceof Error && err.message.includes("password")) {
        setShowPasswordInput(true)
        setError(t("passwordRequired"))
      } else {
        setError(`${t("convertFailed")}: ${err instanceof Error ? err.message : t("unknownError")}`)
      }
    } finally {
      setIsConverting(false)
    }
  }

  const downloadSingle = (image: ConvertedImage) => {
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

  const downloadAll = async () => {
    if (convertedImages.length === 0) return

    setStatus(t("creatingZip"))

    try {
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()

      convertedImages.forEach((image) => {
        const base64Data = image.dataUrl.split(",")[1]
        const extension = getFileExtension(image.type)
        // 如果是合并页面（pageNumber为0），使用特殊文件名
        const filename = image.pageNumber === 0 ? `merged-pages.${extension}` : `page_${image.pageNumber}.${extension}`
        zip.file(filename, base64Data, { base64: true })
      })

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const downloadUrl = URL.createObjectURL(zipBlob)

      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = "converted_pdf_images.zip"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)

      setStatus(t("downloadStarted"))
    } catch (err) {
      setError(`${t("downloadFailed")}: ${err instanceof Error ? err.message : t("unknownError")}`)
    }
  }

  const clearAll = () => {
    setSelectedFile(null)
    setPdfUrl("")
    setPdfPassword("")
    setShowPasswordInput(false)
    setConvertedImages([])
    setProgress(0)
    setStatus("")
    setError("")
    // 重置OCR相关状态
    setOcrResults([])
    setShowOcrResults({})
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    handleFileSelect(event)
  }

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Desktop Navigation */}
      <div className="hidden md:fixed md:top-4 md:left-4 md:right-4 md:z-10 md:flex md:items-center md:justify-between">
        <div className="flex gap-2">
          <Link href="/blog">
            <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
              <BookOpen className="h-4 w-4" />
              {language === "zh" ? "技术博客" : "Tech Blog"}
            </Button>
          </Link>
          <Link href="/about">
            <Button variant="outline" size="sm" className="flex items-center gap-2 bg-transparent">
              <User className="h-4 w-4" />
              {language === "zh" ? "关于我们" : "About Us"}
            </Button>
          </Link>
        </div>
        <div className="flex gap-2">
          <ThemeSwitcher currentTheme={theme} onThemeChange={setTheme} language={language} />
          <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden fixed top-4 left-4 right-4 z-10">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="bg-transparent"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
        
        {isMobileMenuOpen && (
          <div className="absolute top-12 left-0 right-0 bg-background border rounded-lg shadow-lg p-4 space-y-4">
            <Link href="/blog" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" size="sm" className="w-full flex items-center gap-2 justify-start h-10">
                <BookOpen className="h-4 w-4" />
                {language === "zh" ? "技术博客" : "Tech Blog"}
              </Button>
            </Link>
            <Link href="/about" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" size="sm" className="w-full flex items-center gap-2 justify-start h-10">
                <User className="h-4 w-4" />
                {language === "zh" ? "关于我们" : "About Us"}
              </Button>
            </Link>
            <div className="flex gap-2 pt-3 border-t">
              <div className="h-10 flex items-center">
                <ThemeSwitcher currentTheme={theme} onThemeChange={setTheme} language={language} />
              </div>
              <div className="h-10 flex items-center">
                <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2 pt-16 sm:pt-8">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
          <p className="text-sm text-muted-foreground">{t("privacy")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t("fileUpload")}
            </CardTitle>
            <CardDescription>{t("fileUploadDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-1 rounded-lg bg-muted p-1">
              <button
                type="button"
                onClick={() => setInputSource("file")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  inputSource === "file"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("localFile")}
              </button>
              <button
                type="button"
                onClick={() => setInputSource("url")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  inputSource === "url"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("urlInput")}
              </button>
            </div>

            {inputSource === "file" ? (
              <div
                className={`flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging ? "border-primary bg-muted" : "border-border"
                }`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <Label
                  htmlFor="file-input"
                  className="flex cursor-pointer flex-col items-center gap-2 text-muted-foreground"
                >
                  <Upload className="h-8 w-8" />
                  <span>{t("dragDrop")}</span>
                </Label>
                <Input
                  ref={fileInputRef}
                  id="file-input"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileSelect}
                  disabled={isConverting}
                  className="sr-only"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    {t("selected")}: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="pdf-url">{t("pdfUrl")}</Label>
                <Input
                  id="pdf-url"
                  type="url"
                  placeholder={t("pdfUrlPlaceholder")}
                  value={pdfUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  disabled={isConverting}
                />
                <p className="text-xs text-muted-foreground">{t("pdfUrlDesc")}</p>
                {pdfUrl.trim() && (
                  <p className="text-sm text-muted-foreground">
                    {t("urlReady")}: {pdfUrl}
                  </p>
                )}
              </div>
            )}

            {showPasswordInput && (
              <div className="space-y-2 border-t pt-4">
                <Label htmlFor="pdf-password">{t("pdfPassword")}</Label>
                <Input
                  id="pdf-password"
                  type="password"
                  placeholder={t("pdfPasswordPlaceholder")}
                  value={pdfPassword}
                  onChange={(e) => setPdfPassword(e.target.value)}
                  disabled={isConverting}
                />
                <p className="text-xs text-muted-foreground">{t("pdfPasswordDesc")}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scale">{t("scale")}</Label>
                <Input
                  id="scale"
                  type="number"
                  min="1.0"
                  max="5.0"
                  step="0.1"
                  value={scale.toString()}
                  onChange={(e) => setScale(Number.parseFloat(e.target.value) || 4.0)}
                  disabled={isConverting}
                />
                <p className="text-xs text-muted-foreground">{t("scaleDesc")}</p>
              </div>

              <div className="space-y-2">
                <Label>{t("outputFormat")}</Label>
                <Select value={format} onValueChange={setFormat} disabled={isConverting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image/png">{t("pngFormat")}</SelectItem>
                    <SelectItem value="image/jpeg">{t("jpegFormat")}</SelectItem>
                    <SelectItem value="image/tiff">{t("tiffFormat")}</SelectItem>
                    <SelectItem value="image/gif">{t("gifFormat")}</SelectItem>
                    <SelectItem value="image/bmp">{t("bmpFormat")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("ocrLanguage")}</Label>
                <Select value={ocrLanguage} onValueChange={setOcrLanguage} disabled={isConverting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chi_sim+eng">{t("auto")}</SelectItem>
                    <SelectItem value="chi_sim">{t("chinese")}</SelectItem>
                    <SelectItem value="eng">{t("english")}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t("ocrLanguageDesc")}</p>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-merge"
                  checked={enableMerge || format === 'image/gif'}
                  onCheckedChange={(checked) => setEnableMerge(checked as boolean)}
                  disabled={isConverting || format === 'image/gif'}
                />
                <Label 
                  htmlFor="enable-merge" 
                  className="text-sm font-medium"
                  title={format === 'image/gif' ? t("gifAutoMerge") : undefined}
                >
                  {t("mergePages")}
                </Label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                {format === 'image/gif' ? t("gifAutoMerge") : t("mergePagesDesc")}
              </p>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-watermark"
                  checked={enableWatermark}
                  onCheckedChange={(checked) => setEnableWatermark(checked as boolean)}
                  disabled={isConverting}
                />
                <Label htmlFor="enable-watermark" className="text-sm font-medium">
                  {t("addWatermark")}
                </Label>
              </div>

              {enableWatermark && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="watermark-text">{t("watermarkText")}</Label>
                    <Input
                      id="watermark-text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      disabled={isConverting}
                      placeholder={t("watermarkTextPlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("watermarkPosition")}</Label>
                    <Select value={watermarkPosition} onValueChange={setWatermarkPosition} disabled={isConverting}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">{t("center")}</SelectItem>
                        <SelectItem value="top-left">{t("topLeft")}</SelectItem>
                        <SelectItem value="top-right">{t("topRight")}</SelectItem>
                        <SelectItem value="bottom-left">{t("bottomLeft")}</SelectItem>
                        <SelectItem value="bottom-right">{t("bottomRight")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="watermark-opacity">
                      {t("opacity")} ({Math.round(watermarkOpacity * 100)}%)
                    </Label>
                    <Input
                      id="watermark-opacity"
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={watermarkOpacity.toString()}
                      onChange={(e) => setWatermarkOpacity(Number.parseFloat(e.target.value) || 0.3)}
                      disabled={isConverting}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={convertPDF}
                disabled={(!selectedFile && !pdfUrl.trim()) || isConverting}
                className="flex-1"
              >
                {isConverting ? t("converting") : t("startConvert")}
              </Button>
              {(selectedFile || pdfUrl.trim() || convertedImages.length > 0) && (
                <Button variant="outline" onClick={clearAll} disabled={isConverting}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {(status || error) && (
          <Card>
            <CardContent className="pt-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {status && !error && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{status}</p>
                  {isConverting && <Progress value={progress} className="w-full" />}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {convertedImages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  {t("convertResult")} ({convertedImages.length} {t("images")})
                </span>
                <Button onClick={downloadAll} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {t("downloadAll")}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {convertedImages.map((image) => {
                  const ocrResult = ocrResults.find(r => r.pageNumber === image.pageNumber)
                  const isShowingOcr = showOcrResults[image.pageNumber]
                  
                  return (
                    <div key={image.pageNumber} className="space-y-2">
                      <div className="relative group">
                        <img
                          src={image.dataUrl || "/placeholder.svg"}
                          alt={`${t("page")} ${image.pageNumber} ${t("pageUnit")}`}
                          className="w-full h-auto border rounded-lg shadow-sm"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                          <Button size="sm" onClick={() => downloadSingle(image)} className="flex items-center gap-1">
                            <Download className="h-3 w-3" />
                            {t("download")}
                          </Button>
                          <Button 
                            size="sm" 
                            variant={ocrResult?.isExtracting ? "default" : ocrResult?.isCompleted && ocrResult?.text ? "outline" : "secondary"}
                            onClick={() => extractTextFromImage(image.pageNumber, image.dataUrl)}
                            disabled={ocrResult?.isExtracting}
                            className={`flex items-center gap-1 ${
                              ocrResult?.isExtracting ? 'bg-blue-600 hover:bg-blue-700' : 
                              ocrResult?.isCompleted && ocrResult?.text ? 'border-green-500 text-green-600 hover:bg-green-50' : ''
                            }`}
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
                      
                      <div className="space-y-2">
                        <p className="text-sm text-center text-muted-foreground">
                          {t("page")} {image.pageNumber} {t("pageUnit")}
                        </p>
                        
                        {/* OCR提取状态显示 */}
                        {ocrResult?.isExtracting && (
                          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
                            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
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
                              onClick={() => toggleOcrResult(image.pageNumber)}
                              className="w-full flex items-center gap-2"
                            >
                              <FileText className="h-4 w-4" />
                              {isShowingOcr ? (language === "zh" ? "隐藏文字" : "Hide Text") : (language === "zh" ? "显示提取的文字" : "Show Extracted Text")}
                              {ocrResult.text && `(${ocrResult.text.length}字符)`}
                            </Button>
                            
                            {isShowingOcr && ocrResult.text && (
                              <div className="border rounded-lg p-3 bg-muted/50 space-y-2">
                                <div className="text-sm text-muted-foreground max-h-128 overflow-y-auto whitespace-pre-wrap border rounded p-2 bg-background">
                                  {ocrResult.text}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => copyTextToClipboard(ocrResult.text)}
                                    className="flex items-center gap-1"
                                  >
                                    <Copy className="h-3 w-3" />
                                    {t("copyText")}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => downloadTextFile(ocrResult.text, image.pageNumber)}
                                    className="flex items-center gap-1"
                                  >
                                    <Download className="h-3 w-3" />
                                    {t("downloadText")}
                                  </Button>
                                </div>
                              </div>
                            )}
                            
                            {isShowingOcr && !ocrResult.text && !ocrResult.isExtracting && (
                              <div className="text-sm text-muted-foreground text-center py-2">
                                {t("noTextFound")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <footer className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <p className="text-sm text-muted-foreground">
                {language === "zh" ? "© 2024 PDF转图片工具" : "© 2024 PDF to Image Converter"}
              </p>
              <a
                href="https://github.com/A-W-C-J/pdf-to-image-project"
                target="_blank"
                rel="nofollow noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                {language === "zh" ? "开源项目" : "Open Source"}
              </a>
            </div>
            <div className="text-xs text-muted-foreground">
              {language === "zh" ? "基于 PDF.js 构建的在线工具" : "Built with PDF.js"}
            </div>
          </div>
        </footer>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: language === "zh" ? "PDF转图片工具" : "PDF to Image Converter",
              description:
                language === "zh"
                  ? "免费在线PDF转图片工具，支持批量转换、水印添加、多种格式输出"
                  : "Free online PDF to image converter with batch conversion, watermark support, and multiple format output",
              url: "https://www.pdf2img.top",
              applicationCategory: "UtilityApplication",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              codeRepository: "https://github.com/A-W-C-J/pdf-to-image-project",
              programmingLanguage: ["TypeScript", "JavaScript"],
              runtimePlatform: "Web Browser",
              author: {
                "@type": "Organization",
                name: "PDF2IMG.TOP",
              },
            }),
          }}
        />
      </div>
    </div>
  )
}
