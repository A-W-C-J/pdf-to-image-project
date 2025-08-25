// 批量处理相关类型定义
export interface BatchFile {
  id: string
  file: File
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

export interface ConvertedImage {
  dataUrl: string
  pageNumber: number
  type: string
  fileName?: string // 添加文件名字段用于批量处理
}

export interface OcrResult {
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