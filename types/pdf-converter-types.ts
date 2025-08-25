// PDF转换器相关类型定义

export interface ConvertedImage {
  dataUrl: string
  pageNumber: number
  type: string
  fileName?: string // 用于批量处理
}

export interface OcrResult {
  pageNumber: number
  text: string
  isExtracting: boolean
  isCompleted: boolean
  fileName?: string // 用于批量处理
  words?: Array<{
    text: string
    bbox: {
      x0: number
      y0: number
      x1: number
      y1: number
    }
    confidence: number
  }> // 文字坐标信息用于可搜索PDF
}

// 批量处理相关接口
export interface BatchFile {
  file: File
  id: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  progress: number
  convertedImages: ConvertedImage[]
  ocrResults: OcrResult[]
  error?: string
}

export interface BatchProgress {
  totalFiles: number
  completedFiles: number
  currentFile: string
  overallProgress: number
}

// PDF选项配置
export interface PdfOptions {
  addBookmarks: boolean
  preserveQuality: boolean
  ocrConfidenceThreshold: number
  fontSizeMultiplier: number
  pageMargin: number
  textLayerOpacity: number
  enableTextSelection: boolean
}

// AI总结选项
export interface SummaryOptions {
  language: string
  length: string
}

// 图像质量分析结果
export interface ImageQualityAnalysis {
  brightness: number
  contrast: number
  isLowContrast: boolean
  isDark: boolean
  isBright: boolean
}

// 转换结果类型
export interface ConversionResult {
  images: ConvertedImage[]
  ocrResults?: OcrResult[]
}

// 输入源类型
export type InputSource = "file" | "url"

// 转换状态类型
export type ConversionStatus = 'idle' | 'converting' | 'completed' | 'error'

// 水印位置类型
export type WatermarkPosition = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"

// 输出格式类型
export type OutputFormat = "image/png" | "image/jpeg" | "image/tiff" | "image/gif" | "image/bmp" | "application/pdf"

// OCR语言类型
export type OcrLanguage = "chi_sim+eng" | "chi_sim" | "chi_tra" | "eng"

// PDF转Word格式类型
export type DocumentFormat = "docx" | "md" | "tex"

// 公式模式类型
export type FormulaMode = "normal" | "dollar"