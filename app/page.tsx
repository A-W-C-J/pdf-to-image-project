"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, FileImage, Upload, X, BookOpen, Github, User, Menu, FileText, Copy } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useLanguage } from "@/lib/i18n"
import Breadcrumb from "@/components/breadcrumb"
import FAQSchema from "@/components/faq-schema"
import GIF from "gif.js"
import { createWorker } from "tesseract.js"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import * as webllm from "@mlc-ai/web-llm"
//firebase
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  getAnalytics(app);
} 
interface ConvertedImage {
  dataUrl: string
  pageNumber: number
  type: string
  fileName?: string // 添加文件名字段用于批量处理
}

interface OcrResult {
  pageNumber: number
  text: string
  isExtracting: boolean
  isCompleted: boolean
  fileName?: string // 添加文件名字段用于批量处理
  words?: Array<{
    text: string
    bbox: {
      x0: number
      y0: number
      x1: number
      y1: number
    }
    confidence: number
  }> // 添加文字坐标信息用于可搜索PDF
}

// 批量处理相关接口
interface BatchFile {
  file: File
  id: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  convertedImages: ConvertedImage[]
  ocrResults: OcrResult[]
  error?: string
}

interface BatchProgress {
  totalFiles: number
  completedFiles: number
  currentFile: string
  overallProgress: number
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

export default function PDFConverter() {
  const { language, setLanguage, t } = useLanguage()
  const [theme, setTheme] = useState<"light" | "dark">("light")

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([])
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({ totalFiles: 0, completedFiles: 0, currentFile: '', overallProgress: 0 })
  const [isBatchMode, setIsBatchMode] = useState(false)
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
  const [showOcrResults, setShowOcrResults] = useState<{ [key: string]: boolean }>({})

  // PDF相关状态
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null)
  const [pdfOptions, setPdfOptions] = useState({
    addBookmarks: true,
    preserveQuality: true,
    ocrConfidenceThreshold: 30,
    fontSizeMultiplier: 1.0,
    pageMargin: 50,
    textLayerOpacity: 0.0,
    enableTextSelection: true
  })

  // AI总结相关状态
  const [enableSummary, setEnableSummary] = useState(false)
  const [summaryOptions, setSummaryOptions] = useState({
    language: 'auto',
    length: 'medium'
  })
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false)
  const [summaryResult, setSummaryResult] = useState<string>('')
  const [isModelLoading, setIsModelLoading] = useState(false)

  // 图像质量检测函数
  const analyzeImageQuality = (imageData: ImageData) => {
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
      isLowContrast: contrast < 30,
      isDark: avgBrightness < 100,
      isBright: avgBrightness > 200
    }
  }

  // 图像预处理函数，提升OCR识别精度
  const preprocessImageForOCR = async (imageDataUrl: string): Promise<string> => {
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
          const threshold = quality.isDark ? 100 : quality.isBright ? 160 : 128
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

  // WebLLM引擎实例
  const [engine, setEngine] = useState<webllm.MLCEngineInterface | null>(null)

  // 初始化WebLLM引擎
  const initializeWebLLM = async () => {
    if (engine) return engine
    
    try {
      setIsModelLoading(true)
      setStatus(t("loadingModel"))
      
      const selectedModel = "Llama-3.2-3B-Instruct-q4f32_1-MLC"
      
      const newEngine = await webllm.CreateMLCEngine(selectedModel, {
        initProgressCallback: (report: webllm.InitProgressReport) => {
          setStatus(`${t("loadingModel")} ${Math.round(report.progress * 100)}%`)
        }
      })
      
      setEngine(newEngine)
      setIsModelLoading(false)
      setStatus(t("modelLoaded"))
      
      return newEngine
    } catch (error) {
      console.error('WebLLM initialization failed:', error)
      setIsModelLoading(false)
      setError(`模型加载失败: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    }
  }

  // 生成文本总结
  const generateSummary = async (fullText: string): Promise<string> => {
    try {
      setIsGeneratingSummary(true)
      setStatus(t("generatingSummary"))
      
      const llmEngine = await initializeWebLLM()
      
      // 根据用户选择的语言和长度构建提示词
      const languagePrompt = summaryOptions.language === 'zh' ? '请用中文' : 
                             summaryOptions.language === 'en' ? 'Please respond in English' : 
                             '请根据文档内容自动选择合适的语言'
      const lengthPrompt = {
        'short': summaryOptions.language === 'zh' ? '简短地（100-200字）' : 
                 summaryOptions.language === 'en' ? 'briefly (100-200 words)' : 
                 '简短地总结（100-200字）',
        'medium': summaryOptions.language === 'zh' ? '中等详细程度（300-500字）' : 
                  summaryOptions.language === 'en' ? 'in moderate detail (300-500 words)' : 
                  '中等详细程度地总结（300-500字）',
        'long': summaryOptions.language === 'zh' ? '详细地（500-800字）' : 
                summaryOptions.language === 'en' ? 'in detail (500-800 words)' : 
                '详细地总结（500-800字）'
      }[summaryOptions.length]
      
      const prompt = `${languagePrompt}${lengthPrompt}总结以下PDF文档的主要内容。请提取关键信息、主要观点和重要结论：\n\n${fullText}`
      
      const response = await llmEngine.chat.completions.create({
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })
      
      const summary = response.choices[0]?.message?.content || '总结生成失败'
      setSummaryResult(summary)
      setStatus(t("summaryGenerated"))
      
      return summary
    } catch (error) {
      console.error('Summary generation failed:', error)
      setError(`总结生成失败: ${error instanceof Error ? error.message : String(error)}`)
      throw error
    } finally {
      setIsGeneratingSummary(false)
    }
  }

  // 全文OCR提取函数（用于AI总结）
  const extractFullTextFromImages = async (images: ConvertedImage[]): Promise<string> => {
    let fullText = ''
    
    for (const image of images) {
      try {
        setStatus(`${t("extractingText")} ${image.pageNumber}/${images.length}...`)
        
        // 对图像进行预处理以提升识别精度
        const preprocessedImageUrl = await preprocessImageForOCR(image.dataUrl)
        
        // 创建OCR工作器并配置参数
        const worker = await createWorker(ocrLanguage)
        
        // 根据语言和图像特征动态设置OCR参数
        const ocrParams: { [key: string]: string } = {
          tessedit_ocr_engine_mode: '1', // 使用LSTM OCR引擎
          preserve_interword_spaces: '1', // 保留单词间空格
        }
        
        // 根据语言优化参数
        if (ocrLanguage === 'chi_sim' || ocrLanguage === 'chi_tra') {
          // 中文优化
          ocrParams.tessedit_pageseg_mode = '6' // 单一文本块
          ocrParams.tessedit_char_whitelist = '' // 允许所有中文字符
        } else if (ocrLanguage === 'eng') {
          // 英文优化
          ocrParams.tessedit_pageseg_mode = '1' // 自动页面分割
          ocrParams.tessedit_char_whitelist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:"\'\-()[]{}/@#$%^&*+=<>|\\~`'
        } else {
          // 自动检测模式
          ocrParams.tessedit_pageseg_mode = '3' // 完全自动页面分割
        }
        
        // 设置OCR引擎参数
        await worker.setParameters(ocrParams)
        
        const { data: { text } } = await worker.recognize(preprocessedImageUrl)
        await worker.terminate()
        
        if (text.trim()) {
          fullText += `\n\n=== 第${image.pageNumber}页 ===\n${text.trim()}`
        }
        
      } catch (error) {
        console.error(`OCR extraction failed for page ${image.pageNumber}:`, error)
        // 继续处理下一页，不中断整个流程
      }
    }
    
    return fullText.trim()
  }

  // OCR文字提取函数
  const extractTextFromImage = async (pageNumber: number, imageDataUrl: string, batchFileId?: string) => {
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

      // 对图像进行预处理以提升识别精度
      const preprocessedImageUrl = await preprocessImageForOCR(imageDataUrl)
      
      // 创建OCR工作器并配置参数
      const worker = await createWorker(ocrLanguage)
      
      // 根据语言和图像特征动态设置OCR参数
      const ocrParams: { [key: string]: string } = {
        tessedit_ocr_engine_mode: '1', // 使用LSTM OCR引擎
        preserve_interword_spaces: '1', // 保留单词间空格
      }
      
      // 根据语言优化参数
      if (ocrLanguage === 'chi_sim' || ocrLanguage === 'chi_tra') {
        // 中文优化
        ocrParams.tessedit_pageseg_mode = '6' // 单一文本块
        ocrParams.tessedit_char_whitelist = '' // 允许所有中文字符
      } else if (ocrLanguage === 'eng') {
        // 英文优化
        ocrParams.tessedit_pageseg_mode = '1' // 自动页面分割
        ocrParams.tessedit_char_whitelist = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:"\'-()[]{}/@#$%^&*+=<>|\\~`'
      } else {
        // 自动检测模式
        ocrParams.tessedit_pageseg_mode = '3' // 完全自动页面分割
      }
      
      // 设置OCR引擎参数
      await worker.setParameters(ocrParams)
      
      const result = await worker.recognize(preprocessedImageUrl)
      const text = result.data.text
      // Tesseract.js Page 类型中没有 words 属性，使用空数组
      const words: Array<{
        text: string
        bbox: { x0: number; y0: number; x1: number; y1: number }
        confidence: number
      }> = []
      await worker.terminate()

      // 处理文字坐标信息
      const wordsWithCoords = words?.map((word: {
        text: string
        bbox: {
          x0: number
          y0: number
          x1: number
          y1: number
        }
        confidence: number
      }) => ({
        text: word.text,
        bbox: {
          x0: word.bbox.x0,
          y0: word.bbox.y0,
          x1: word.bbox.x1,
          y1: word.bbox.y1
        },
        confidence: word.confidence
      })) || []

      // 更新提取结果
      setOcrResults(prev => 
        prev.map(r => r.pageNumber === pageNumber ? { 
          ...r, 
          text: text.trim(), 
          words: wordsWithCoords,
          isExtracting: false, 
          isCompleted: true 
        } : r)
      )

      setStatus(t("textExtracted"))
      
      // 3秒后自动显示提取结果
      setTimeout(() => {
        const key = batchFileId ? `${batchFileId}-${pageNumber}` : pageNumber
        setShowOcrResults(prev => ({ ...prev, [key]: true }))
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



  // 切换OCR结果显示
  const toggleOcrResult = (key: string | number) => {
    setShowOcrResults(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  // 生成可搜索PDF
  const generateSearchablePdf = async () => {
    if (convertedImages.length === 0) {
      setError(t("noImagesAvailable"))
      return
    }

    setIsGeneratingPdf(true)
    setStatus(t("generatingPdf"))

    try {
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
      setGeneratedPdfUrl(url)
      
      setStatus(t("pdfGenerated"))
    } catch (error) {
      console.error('PDF generation failed:', error)
      setError(t("pdfGenerationFailed"))
    } finally {
      setIsGeneratingPdf(false)
    }
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
    let files: FileList | null = null
    if ("dataTransfer" in event) {
      files = event.dataTransfer.files
    } else {
      files = event.target.files
    }

    if (files && files.length > 0) {
      const pdfFiles = Array.from(files).filter(file => file.type === "application/pdf")
      
      if (pdfFiles.length === 0) {
        setError(t("selectValidPdf"))
        return
      }
      
      if (!isBatchMode) {
        if (pdfFiles.length === 1) {
          // 单文件模式 - 处理单个文件
          setSelectedFile(pdfFiles[0])
          setPdfUrl("")
          setError("")
          setPdfPassword("")
          setShowPasswordInput(false)
          setConvertedImages([])
          setProgress(0)
          setStatus("")
        } else {
          // 单文件模式下选择了多个文件，提示用户
          setError(language === "zh" ? "单文件模式下只能选择一个PDF文件，请开启批量模式或只选择一个文件" : "Only one PDF file can be selected in single file mode. Please enable batch mode or select only one file")
          return
        }
      } else {
        // 批量模式 - 追加文件而不是替换
        const existingFileNames = new Set(selectedFiles.map(f => f.name))
        const newFiles = pdfFiles.filter(file => !existingFileNames.has(file.name))
        
        if (newFiles.length === 0) {
          setError(language === "zh" ? "所选文件已存在于列表中" : "Selected files already exist in the list")
          return
        }
        
        const updatedFiles = [...selectedFiles, ...newFiles]
        setSelectedFiles(updatedFiles)
        
        const newBatchFiles: BatchFile[] = newFiles.map(file => ({
          file,
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          status: 'pending' as const,
          progress: 0,
          convertedImages: [],
          ocrResults: [],
        }))
        
        setBatchFiles(prev => [...prev, ...newBatchFiles])
        setBatchProgress(prev => ({
          ...prev,
          totalFiles: updatedFiles.length,
        }))
        setError("")
      }
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

  // 批量处理PDF文件
  const processBatchFiles = async () => {
    if (batchFiles.length === 0) return

    setIsConverting(true)
    setError("")
    
    try {
      for (let i = 0; i < batchFiles.length; i++) {
        const batchFile = batchFiles[i]
        
        // 更新当前处理的文件
        setBatchProgress(prev => ({
          ...prev,
          currentFile: batchFile.file.name,
          overallProgress: (i / batchFiles.length) * 100
        }))
        
        // 更新文件状态为处理中
        setBatchFiles(prev => prev.map(f => 
          f.id === batchFile.id ? { ...f, status: 'processing' as const } : f
        ))
        
        try {
          const result = await convertSinglePDF(batchFile.file, batchFile.id)
          
          // 更新文件状态为完成
          setBatchFiles(prev => prev.map(f => 
            f.id === batchFile.id ? { 
              ...f, 
              status: 'completed' as const, 
              progress: 100,
              convertedImages: result.images,
              ocrResults: result.ocrResults || []
            } : f
          ))
          
          setBatchProgress(prev => ({
            ...prev,
            completedFiles: prev.completedFiles + 1
          }))
          
        } catch (error) {
          // 更新文件状态为错误
          setBatchFiles(prev => prev.map(f => 
            f.id === batchFile.id ? { 
              ...f, 
              status: 'error' as const, 
              error: error instanceof Error ? error.message : 'Unknown error'
            } : f
          ))
        }
      }
      
      // 完成所有处理
      setBatchProgress(prev => ({
        ...prev,
        overallProgress: 100,
        currentFile: ''
      }))
      
      setStatus(language === "zh" ? "批量处理完成" : "Batch processing completed")
      
    } catch (error) {
      setError(`${t("convertFailed")}: ${error instanceof Error ? error.message : t("unknownError")}`)
    } finally {
      setIsConverting(false)
    }
  }

  // 重试所有失败的文件
  const retryAllFailedFiles = async () => {
    const failedFiles = batchFiles.filter(f => f.status === 'error')
    if (failedFiles.length === 0 || isConverting) return

    setIsConverting(true)
    setError("")

    // 重置所有失败文件的状态
    setBatchFiles(prev => prev.map(f => 
      f.status === 'error' ? {
        ...f,
        status: 'pending' as const,
        progress: 0,
        convertedImages: [],
        ocrResults: [],
        error: undefined
      } : f
    ))

    setStatus(language === "zh" ? `正在重试 ${failedFiles.length} 个失败的文件...` : `Retrying ${failedFiles.length} failed files...`)

    try {
      // 逐个处理失败的文件
      for (const failedFile of failedFiles) {
        try {
          // 更新文件状态为处理中
          setBatchFiles(prev => prev.map(f => 
            f.id === failedFile.id ? { ...f, status: 'processing' as const } : f
          ))

          // 更新批量进度
          setBatchProgress(prev => ({
            ...prev,
            currentFile: failedFile.file.name
          }))

          // 转换PDF
          const result = await convertSinglePDF(failedFile.file, failedFile.id)
          
          // 更新文件状态为完成
          setBatchFiles(prev => prev.map(f => 
            f.id === failedFile.id ? {
              ...f,
              status: 'completed' as const,
              progress: 100,
              convertedImages: result.images,
              ocrResults: result.ocrResults || []
            } : f
          ))

        } catch (error) {
          // 更新文件状态为错误
          setBatchFiles(prev => prev.map(f => 
            f.id === failedFile.id ? {
              ...f,
              status: 'error' as const,
              error: error instanceof Error ? error.message : 'Unknown error'
            } : f
          ))
        }
      }

      // 更新整体进度
      const completedCount = batchFiles.filter(f => f.status === 'completed').length
      setBatchProgress(prev => ({
        ...prev,
        completedFiles: completedCount,
        overallProgress: (completedCount / batchFiles.length) * 100,
        currentFile: ''
      }))

      const remainingFailedCount = batchFiles.filter(f => f.status === 'error').length
      if (remainingFailedCount === 0) {
        setStatus(language === "zh" ? "所有文件重试成功" : "All files retry successful")
      } else {
        setStatus(language === "zh" ? `重试完成，仍有 ${remainingFailedCount} 个文件失败` : `Retry completed, ${remainingFailedCount} files still failed`)
      }
      
    } catch (error) {
      setError(`${t("convertFailed")}: ${error instanceof Error ? error.message : t("unknownError")}`)
    } finally {
      setIsConverting(false)
      setBatchProgress(prev => ({
        ...prev,
        currentFile: ''
      }))
    }
  }

  // 重试批量处理中的单个文件
  const retryBatchFile = async (fileId: string) => {
    const fileToRetry = batchFiles.find(f => f.id === fileId)
    if (!fileToRetry || isConverting) return

    // 重置文件状态
    setBatchFiles(prev => prev.map(f => 
      f.id === fileId ? {
        ...f,
        status: 'pending' as const,
        progress: 0,
        convertedImages: [],
        ocrResults: [],
        error: undefined
      } : f
    ))

    setIsConverting(true)
    setError("")

    try {
      // 更新文件状态为处理中
      setBatchFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'processing' as const } : f
      ))

      // 更新批量进度
      setBatchProgress(prev => ({
        ...prev,
        currentFile: fileToRetry.file.name
      }))

      // 转换PDF
      const result = await convertSinglePDF(fileToRetry.file, fileId)
      
      // 更新文件状态为完成
      setBatchFiles(prev => prev.map(f => 
        f.id === fileId ? {
          ...f,
          status: 'completed' as const,
          progress: 100,
          convertedImages: result.images,
          ocrResults: result.ocrResults || []
        } : f
      ))

      // 更新整体进度
      const completedCount = batchFiles.filter(f => f.status === 'completed' || f.id === fileId).length
      setBatchProgress(prev => ({
        ...prev,
        completedFiles: completedCount,
        overallProgress: (completedCount / batchFiles.length) * 100,
        currentFile: ''
      }))

      setStatus(language === "zh" ? `文件 ${fileToRetry.file.name} 重试成功` : `File ${fileToRetry.file.name} retry successful`)
      
    } catch (error) {
      // 更新文件状态为错误
      setBatchFiles(prev => prev.map(f => 
        f.id === fileId ? {
          ...f,
          status: 'error' as const,
          error: error instanceof Error ? error.message : 'Unknown error'
        } : f
      ))
      
      setBatchProgress(prev => ({
        ...prev,
        currentFile: ''
      }))
      
      setError(`${t("convertFailed")}: ${error instanceof Error ? error.message : t("unknownError")}`)
    } finally {
      setIsConverting(false)
    }
  }

  // 转换单个PDF文件
  const convertSinglePDF = async (file: File, fileId?: string): Promise<{ images: ConvertedImage[], ocrResults?: OcrResult[] }> => {
    const pdfjsLib = await import("pdfjs-dist")
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdfDocument = await loadingTask.promise
    const totalPages = pdfDocument.numPages
    const images: ConvertedImage[] = []

    for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
      // 更新单个文件的进度
      if (fileId) {
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

  const convertPDF = async () => {
    if (isBatchMode) {
      await processBatchFiles()
      return
    }
    
    if (!selectedFile && !pdfUrl.trim()) return

    setIsConverting(true)
    setError("")
    setConvertedImages([])
    setProgress(0)
    setStatus(t("loadingPdfjs"))
    // 重置OCR相关状态
    setOcrResults([])
    setShowOcrResults({})

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
          canvas: canvas,
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
      
      // 如果启用了AI总结功能，执行全文OCR和总结
      if (enableSummary && images.length > 0) {
        try {
          setStatus(t("extractingText"))
          const fullText = await extractFullTextFromImages(images)
          
          if (fullText.trim()) {
            await generateSummary(fullText)
          } else {
            setError('未能从PDF中提取到文本内容，无法生成总结')
          }
        } catch (summaryError) {
          console.error('Summary generation error:', summaryError)
          setError(`总结生成失败: ${summaryError instanceof Error ? summaryError.message : String(summaryError)}`)
        }
      }
      
    } catch (err) {
      console.error("PDF转换错误:", err)
      if (err instanceof Error && err.message.includes("password")) {
        setShowPasswordInput(true)
        setError(t("passwordRequired"))
      } else {
        setError(`${t("convertFailed")}: ${err instanceof Error ? err.message : t("unknownError")}`)
      }
    } finally {
      setIsGeneratingSummary(false)
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

  const downloadBatchFile = async (batchFile: BatchFile) => {
    if (batchFile.convertedImages.length === 0) return

    setStatus(t("creatingZip"))

    try {
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()

      batchFile.convertedImages.forEach((image) => {
        const base64Data = image.dataUrl.split(",")[1]
        const extension = getFileExtension(image.type)
        const filename = image.pageNumber === 0 ? `merged-pages.${extension}` : `page_${image.pageNumber}.${extension}`
        zip.file(filename, base64Data, { base64: true })
      })

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const downloadUrl = URL.createObjectURL(zipBlob)

      const link = document.createElement("a")
      link.href = downloadUrl
      const fileName = batchFile.file.name.replace(/\.pdf$/i, '')
      link.download = `${fileName}_converted_images.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)

      setStatus(t("downloadStarted"))
    } catch (err) {
      setError(`${t("downloadFailed")}: ${err instanceof Error ? err.message : t("unknownError")}`)
    }
  }

  const downloadAll = async () => {
    if (isBatchMode) {
      // 批量模式：下载所有文件的图片
      const allImages = batchFiles.flatMap(f => f.convertedImages)
      if (allImages.length === 0) return

      setStatus(t("creatingZip"))

      try {
        const JSZip = (await import("jszip")).default
        const zip = new JSZip()

        // 为每个文件创建单独的文件夹
        batchFiles.forEach((batchFile) => {
          if (batchFile.convertedImages.length > 0) {
            const folderName = batchFile.file.name.replace(/\.pdf$/i, '')
            const folder = zip.folder(folderName)
            
            batchFile.convertedImages.forEach((image) => {
              const base64Data = image.dataUrl.split(",")[1]
              const extension = getFileExtension(image.type)
              const filename = image.pageNumber === 0 ? `merged-pages.${extension}` : `page_${image.pageNumber}.${extension}`
              folder?.file(filename, base64Data, { base64: true })
            })
          }
        })

        const zipBlob = await zip.generateAsync({ type: "blob" })
        const downloadUrl = URL.createObjectURL(zipBlob)

        const link = document.createElement("a")
        link.href = downloadUrl
        link.download = "batch_converted_pdf_images.zip"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(downloadUrl)

        setStatus(t("downloadStarted"))
      } catch (err) {
        setError(`${t("downloadFailed")}: ${err instanceof Error ? err.message : t("unknownError")}`)
      }
    } else {
      // 单文件模式：下载当前文件的所有图片
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
  }

  const clearAll = () => {
    setSelectedFile(null)
    setSelectedFiles([])
    setBatchFiles([])
    setBatchProgress({ totalFiles: 0, completedFiles: 0, currentFile: '', overallProgress: 0 })
    setIsBatchMode(false)
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
        <div className="pt-16 sm:pt-8">
          <Breadcrumb />
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("subtitle")}</p>
            <p className="text-sm text-muted-foreground">{t("privacy")}</p>
          </div>
        </div>

        <Card>
          {/* <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t("fileUpload")}
            </CardTitle>
            <CardDescription>{t("fileUploadDesc")}</CardDescription>
          </CardHeader> */}
          <CardContent className="space-y-4">
            <div className="space-y-3">
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
              
              {inputSource === "file" && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="batch-mode"
                    checked={isBatchMode}
                    onCheckedChange={(checked) => {
                      setIsBatchMode(!!checked)
                      if (!checked) {
                        // 切换到单文件模式时清理批量状态
                        setSelectedFiles([])
                        setBatchFiles([])
                        setBatchProgress({ totalFiles: 0, completedFiles: 0, currentFile: '', overallProgress: 0 })
                      } else {
                        // 切换到批量模式时清理单文件状态
                        setSelectedFile(null)
                        setConvertedImages([])
                        setOcrResults([])
                        setShowOcrResults({})
                      }
                      // 清理通用状态
                      setError("")
                      setStatus("")
                      setProgress(0)
                      setIsConverting(false)
                      // 重置文件输入元素，允许重新选择相同文件
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ""
                      }
                    }}
                    disabled={isConverting}
                  />
                  <Label htmlFor="batch-mode" className="text-sm font-medium">
                    {language === "zh" ? "批量处理模式" : "Batch Processing Mode"}
                  </Label>
                </div>
              )}
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
                  multiple={isBatchMode}
                  onChange={handleFileSelect}
                  disabled={isConverting}
                  className="sr-only"
                />
                {!isBatchMode && selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    {t("selected")}: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
                
                {isBatchMode && selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      {language === "zh" ? `已选择 ${selectedFiles.length} 个文件` : `${selectedFiles.length} files selected`}
                    </p>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {selectedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                          <span className="truncate flex-1">{file.name}</span>
                          <span className="ml-2 whitespace-nowrap">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                        </div>
                      ))}
                    </div>
                  </div>
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
                    <SelectItem value="application/pdf">{t("searchablePdfFormat")}</SelectItem>
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

            {/* PDF高级选项 */}
            {format === 'application/pdf' && (
              <div className="space-y-4 border-t pt-4">
                <h4 className="text-sm font-medium">{t("pdfAdvancedOptions")}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ocr-confidence">
                      {t("ocrConfidenceThreshold")} ({pdfOptions.ocrConfidenceThreshold}%)
                    </Label>
                    <Input
                      id="ocr-confidence"
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={pdfOptions.ocrConfidenceThreshold.toString()}
                      onChange={(e) => setPdfOptions(prev => ({
                        ...prev,
                        ocrConfidenceThreshold: Number.parseInt(e.target.value) || 30
                      }))}
                      disabled={isConverting}
                    />
                    <p className="text-xs text-muted-foreground">{t("ocrConfidenceDesc")}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="font-size">
                      {t("fontSizeMultiplier")} ({pdfOptions.fontSizeMultiplier.toFixed(1)}x)
                    </Label>
                    <Input
                      id="font-size"
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={pdfOptions.fontSizeMultiplier.toString()}
                      onChange={(e) => setPdfOptions(prev => ({
                        ...prev,
                        fontSizeMultiplier: Number.parseFloat(e.target.value) || 1.0
                      }))}
                      disabled={isConverting}
                    />
                    <p className="text-xs text-muted-foreground">{t("fontSizeDesc")}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="page-margin">
                      {t("pageMargin")} ({pdfOptions.pageMargin}px)
                    </Label>
                    <Input
                      id="page-margin"
                      type="range"
                      min="0"
                      max="100"
                      step="10"
                      value={pdfOptions.pageMargin.toString()}
                      onChange={(e) => setPdfOptions(prev => ({
                        ...prev,
                        pageMargin: Number.parseInt(e.target.value) || 50
                      }))}
                      disabled={isConverting}
                    />
                    <p className="text-xs text-muted-foreground">{t("pageMarginDesc")}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="text-opacity">
                      {t("textLayerOpacity")} ({Math.round(pdfOptions.textLayerOpacity * 100)}%)
                    </Label>
                    <Input
                      id="text-opacity"
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.1"
                      value={pdfOptions.textLayerOpacity.toString()}
                      onChange={(e) => setPdfOptions(prev => ({
                        ...prev,
                        textLayerOpacity: Number.parseFloat(e.target.value) || 0.0
                      }))}
                      disabled={isConverting}
                    />
                    <p className="text-xs text-muted-foreground">{t("textLayerDesc")}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable-text-selection"
                    checked={pdfOptions.enableTextSelection}
                    onCheckedChange={(checked) => setPdfOptions(prev => ({
                      ...prev,
                      enableTextSelection: checked as boolean
                    }))}
                    disabled={isConverting}
                  />
                  <Label htmlFor="enable-text-selection" className="text-sm font-medium">
                    {t("enableTextSelection")}
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground pl-6">{t("textSelectionDesc")}</p>

                {/* AI总结功能 */}
                <div className="space-y-3 border-t pt-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="enable-summary"
                      checked={enableSummary}
                      onCheckedChange={(checked) => setEnableSummary(checked as boolean)}
                      disabled={isConverting || isGeneratingSummary}
                    />
                    <Label htmlFor="enable-summary" className="text-sm font-medium">
                      {t("enableSummary")}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground pl-6">{t("enableSummaryDesc")}</p>

                  {enableSummary && (
                    <div className="pl-6 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="summary-language">{t("summaryLanguage")}</Label>
                          <p className="text-sm text-muted-foreground">{t("summaryLanguageDesc")}</p>
                          <Select
                            value={summaryOptions.language}
                            onValueChange={(value) => setSummaryOptions(prev => ({ ...prev, language: value }))}
                            disabled={isConverting || isGeneratingSummary}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">{t("auto")}</SelectItem>
                              <SelectItem value="zh">{t("chinese")}</SelectItem>
                              <SelectItem value="en">{t("english")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="summary-length">{t("summaryLength")}</Label>
                          <p className="text-sm text-muted-foreground">{t("summaryLengthDesc")}</p>
                          <Select
                            value={summaryOptions.length}
                            onValueChange={(value) => setSummaryOptions(prev => ({ ...prev, length: value }))}
                            disabled={isConverting || isGeneratingSummary}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="short">{t("summaryShort")}</SelectItem>
                              <SelectItem value="medium">{t("summaryMedium")}</SelectItem>
                              <SelectItem value="long">{t("summaryLong")}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {isModelLoading && (
                        <div className="text-sm text-muted-foreground">
                          {t("loadingModel")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={convertPDF}
                disabled={(
                  isBatchMode 
                    ? selectedFiles.length === 0 
                    : (!selectedFile && !pdfUrl.trim())
                ) || isConverting}
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

        {(status || error || (isBatchMode && batchProgress.totalFiles > 0)) && (
          <Card>
            <CardContent className="pt-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {status && !error && !isBatchMode && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{status}</p>
                  {isConverting && <Progress value={progress} className="w-full" />}
                </div>
              )}
              {isBatchMode && batchProgress.totalFiles > 0 && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium">批量处理进度</span>
                      <div className="flex items-center gap-2">
                        <span>{batchProgress.completedFiles}/{batchProgress.totalFiles} 文件</span>
                        {batchFiles.some(f => f.status === 'error') && !isConverting && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={retryAllFailedFiles}
                            className="h-6 px-2 text-xs"
                          >
                            重试失败
                          </Button>
                        )}
                      </div>
                    </div>
                    <Progress value={batchProgress.overallProgress} className="w-full" />
                  </div>
                  {batchProgress.currentFile && (
                    <p className="text-sm text-muted-foreground">
                      正在处理: {batchProgress.currentFile}
                    </p>
                  )}
                  <div className="space-y-2">
                    {batchFiles.map((batchFile) => (
                      <div key={batchFile.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{batchFile.file.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={batchFile.progress} className="flex-1 h-2" />
                            <span className="text-xs text-muted-foreground">{Math.round(batchFile.progress)}%</span>
                          </div>
                        </div>
                        <div className="ml-2 flex items-center gap-2">
                          {batchFile.status === 'pending' && (
                            <span className="text-xs text-gray-500">等待中</span>
                          )}
                          {batchFile.status === 'processing' && (
                            <span className="text-xs text-blue-500">处理中</span>
                          )}
                          {batchFile.status === 'completed' && (
                            <span className="text-xs text-green-500">已完成</span>
                          )}
                          {batchFile.status === 'error' && (
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-red-500" title={batchFile.error}>错误</span>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => retryBatchFile(batchFile.id)}
                                  className="h-6 px-2 text-xs"
                                  disabled={isConverting}
                                >
                                  重试
                                </Button>
                              </div>
                              {batchFile.error && (
                                <div className="text-xs text-red-400 max-w-48 text-right truncate" title={batchFile.error}>
                                  {batchFile.error}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* AI总结结果显示 */}
        {summaryResult && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {t("summaryResult")}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      navigator.clipboard.writeText(summaryResult)
                      setStatus(t("summaryCopied"))
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Copy className="h-4 w-4" />
                    {t("copySummary")}
                  </Button>
                  <Button
                    onClick={() => {
                      const blob = new Blob([summaryResult], { type: 'text/plain;charset=utf-8' })
                      const url = URL.createObjectURL(blob)
                      const link = document.createElement('a')
                      link.href = url
                      link.download = 'pdf-summary.txt'
                      link.click()
                      URL.revokeObjectURL(url)
                      setStatus(t("downloadSummary"))
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {t("downloadSummary")}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                  {summaryResult}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

        {(convertedImages.length > 0 || (isBatchMode && batchFiles.some(f => f.convertedImages.length > 0))) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  {isBatchMode ? (
                    `批量转换结果 (${batchFiles.reduce((total, f) => total + f.convertedImages.length, 0)} 张图片)`
                  ) : (
                    `${t("convertResult")} (${convertedImages.length} ${t("images")})`
                  )}
                </span>
                <div className="flex items-center gap-2">
                  <Button onClick={downloadAll} className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    {t("downloadAll")}
                  </Button>
                  {format === "application/pdf" && (
                    <Button 
                      onClick={generateSearchablePdf} 
                      disabled={isGeneratingPdf || ocrResults.length === 0}
                      className="flex items-center gap-2"
                      variant="outline"
                    >
                      <FileText className="h-4 w-4" />
                      {isGeneratingPdf ? t("generatingPdf") : t("downloadSearchablePdf")}
                    </Button>
                  )}
                  {generatedPdfUrl && (
                    <Button 
                      onClick={() => {
                        const link = document.createElement('a')
                        link.href = generatedPdfUrl
                        link.download = 'searchable-document.pdf'
                        link.click()
                      }}
                      className="flex items-center gap-2"
                      variant="default"
                    >
                      <Download className="h-4 w-4" />
                      {t("previewPdf")}
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isBatchMode ? (
                <div className="space-y-6">
                  {batchFiles.filter(f => f.convertedImages.length > 0).map((batchFile) => (
                    <div key={batchFile.id} className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h3 className="font-medium text-lg">{batchFile.file.name}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {batchFile.convertedImages.length} 张图片
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadBatchFile(batchFile)}
                            className="flex items-center gap-1"
                          >
                            <Download className="h-3 w-3" />
                            下载
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {batchFile.convertedImages.map((image) => {
                          const ocrResult = batchFile.ocrResults.find(r => r.pageNumber === image.pageNumber)
                          const isShowingOcr = showOcrResults[`${batchFile.id}-${image.pageNumber}`]
                          
                          return (
                            <div key={`${batchFile.id}-${image.pageNumber}`} className="space-y-2">
                              <div className="relative group">
                                <Image
                                  src={image.dataUrl || "/placeholder.svg"}
                                  alt={`${batchFile.file.name} - 第 ${image.pageNumber} 页`}
                                  className="w-full h-auto border rounded-lg shadow-sm"
                                  width={500}
                                  height={300}
                                  unoptimized
                                />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                                  <Button size="sm" onClick={() => downloadSingle(image)} className="flex items-center gap-1">
                                    <Download className="h-3 w-3" />
                                    下载
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant={ocrResult?.isExtracting ? "default" : ocrResult?.isCompleted && ocrResult?.text ? "outline" : "secondary"}
                                    onClick={() => extractTextFromImage(image.pageNumber, image.dataUrl, batchFile.id)}
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
                                    {ocrResult?.isExtracting ? "识别中" : 
                                     ocrResult?.isCompleted && ocrResult?.text ? "已识别" : 
                                     "识别文字"}
                                  </Button>
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <p className="text-sm text-center text-muted-foreground">
                                  第 {image.pageNumber} 页
                                </p>
                                
                                {/* OCR结果显示 */}
                                {ocrResult && ocrResult.isCompleted && ocrResult.text && (
                                  <div className="space-y-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => toggleOcrResult(`${batchFile.id}-${image.pageNumber}`)}
                                      className="w-full flex items-center gap-2"
                                    >
                                      <FileText className="h-4 w-4" />
                                      {isShowingOcr ? "隐藏文字" : "显示文字"}
                                    </Button>
                                    {isShowingOcr && (
                                      <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-3 space-y-2">
                                        <div className="flex items-center justify-between">
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">识别结果</span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => copyTextToClipboard(ocrResult.text)}
                                            className="h-6 px-2"
                                          >
                                            <Copy className="h-3 w-3" />
                                          </Button>
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                          {ocrResult.text}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {convertedImages.map((image) => {
                  const ocrResult = ocrResults.find(r => r.pageNumber === image.pageNumber)
                  const isShowingOcr = showOcrResults[image.pageNumber]
                  
                  return (
                    <div key={image.pageNumber} className="space-y-2">
                      <div className="relative group">
                        <Image
                          src={image.dataUrl || "/placeholder.svg"}
                          alt={`${t("page")} ${image.pageNumber} ${t("pageUnit")}`}
                          className="w-full h-auto border rounded-lg shadow-sm"
                          width={800}
                          height={600}
                          unoptimized
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
                              <div className="bg-gray-50 dark:bg-gray-900 border rounded-lg p-3 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {language === "zh" ? "识别结果" : "OCR Result"}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => copyTextToClipboard(ocrResult.text)}
                                    className="h-6 px-2"
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap max-h-32 overflow-y-auto">
                                  {ocrResult.text}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            </CardContent>
          </Card>
        )}

        <FAQSchema />

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
