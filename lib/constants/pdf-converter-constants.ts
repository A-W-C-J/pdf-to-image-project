// PDF转换器常量定义

import { PdfOptions, SummaryOptions } from '@/types/pdf-converter-types'

// Firebase配置
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
}

// 默认转换设置
export const DEFAULT_SCALE = 4.0
export const DEFAULT_FORMAT = "image/png"
export const DEFAULT_WATERMARK_TEXT = "WATERMARK"
export const DEFAULT_WATERMARK_POSITION = "center"
export const DEFAULT_WATERMARK_OPACITY = 0.3
export const DEFAULT_OCR_LANGUAGE = "chi_sim+eng"

// 页面合并默认设置
export const DEFAULT_PAGE_SPACING = 20
export const DEFAULT_MERGE_MARGIN = 30

// 文件大小限制
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB
export const MAX_WORD_FILE_SIZE = 300 * 1024 * 1024 // 300MB
export const MAX_BATCH_FILES = 10

// PDF选项默认值
export const DEFAULT_PDF_OPTIONS: PdfOptions = {
  addBookmarks: true,
  preserveQuality: true,
  ocrConfidenceThreshold: 30,
  fontSizeMultiplier: 1.0,
  pageMargin: 50,
  textLayerOpacity: 0.0,
  enableTextSelection: true
}

// AI总结选项默认值
export const DEFAULT_SUMMARY_OPTIONS: SummaryOptions = {
  language: 'auto',
  length: 'medium'
}

// WebLLM模型配置
export const DEFAULT_MODEL = "Llama-3.2-3B-Instruct-q4f32_1-MLC"

// 图像质量阈值
export const QUALITY_THRESHOLDS = {
  LOW_CONTRAST: 30,
  DARK_BRIGHTNESS: 100,
  BRIGHT_BRIGHTNESS: 200,
  BINARY_THRESHOLD_DARK: 100,
  BINARY_THRESHOLD_BRIGHT: 160,
  BINARY_THRESHOLD_NORMAL: 128
}

// 输出格式映射
export const FORMAT_EXTENSIONS = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/tiff': 'tiff',
  'image/gif': 'gif',
  'image/bmp': 'png', // BMP格式转换为PNG输出
  'application/pdf': 'pdf'
} as const

// OCR参数配置
export const OCR_PARAMS = {
  TESSEDIT_OCR_ENGINE_MODE: '1', // 使用LSTM OCR引擎
  PRESERVE_INTERWORD_SPACES: '1', // 保留单词间空格
  CHINESE_PAGE_SEG_MODE: '6', // 中文单一文本块
  ENGLISH_PAGE_SEG_MODE: '1', // 英文自动页面分割
  AUTO_PAGE_SEG_MODE: '3', // 完全自动页面分割
  ENGLISH_WHITELIST: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?;:"\'\-()[]{}/@#$%^&*+=<>|\\~`'
}

// 合并图像质量设置
export const MERGE_QUALITY = {
  MAX_REASONABLE_WIDTH: 4000,
  MAX_REASONABLE_HEIGHT: 8000,
  JPEG_QUALITY: 1.0
}

// 延时设置
export const DELAYS = {
  OCR_RESULT_AUTO_SHOW: 500, // OCR结果自动显示延时
  STATUS_CLEAR: 3000 // 状态信息清除延时
}