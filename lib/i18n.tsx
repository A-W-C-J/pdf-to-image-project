"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export const translations = {
  zh: {
    title: "PDF转图片工具",
    subtitle: "支持批量转换和下载",
    privacy: "纯前端转换，无服务器，保护您的隐私",
    fileUpload: "文件上传与设置",
    fileUploadDesc: "选择或拖放PDF文件并配置转换参数",
    dragDrop: "拖放文件到此处，或点击选择文件",
    selected: "已选择",
    scale: "缩放比例 (越大越清晰)",
    scaleDesc: "1.0 = 72DPI, 2.0 = 144DPI, 3.0 = 216DPI",
    outputFormat: "输出格式",
    pngFormat: "PNG (无损)",
    jpegFormat: "JPEG (压缩)",
    addWatermark: "添加水印",
    watermarkText: "水印文字",
    watermarkTextPlaceholder: "输入水印文字",
    watermarkPosition: "水印位置",
    center: "居中",
    topLeft: "左上角",
    topRight: "右上角",
    bottomLeft: "左下角",
    bottomRight: "右下角",
    opacity: "透明度",
    startConvert: "开始转换",
    converting: "转换中...",
    convertResult: "转换结果",
    images: "张图片",
    downloadAll: "下载全部 (ZIP)",
    download: "下载",
    page: "第",
    pageUnit: "页",
    selectValidPdf: "请选择有效的PDF文件",
    loadingPdfjs: "正在加载PDF.js...",
    readingPdf: "正在读取PDF文件...",
    parsingPdf: "正在解析PDF文档...",
    totalPages: "共",
    startConverting: "页，开始转换...",
    convertingPage: "正在转换第",
    convertComplete: "转换完成！共生成",
    convertFailed: "转换失败",
    unknownError: "未知错误",
    creatingZip: "正在创建ZIP包...",
    downloadStarted: "下载已开始！",
    downloadFailed: "下载失败",
    lightTheme: "浅色主题",
    darkTheme: "深色主题",
    toggleTheme: "切换主题",
    metaTitle: "PDF转图片工具 - 免费在线PDF转换器",
    metaDescription:
      "免费的PDF转图片在线工具，支持批量转换PDF为PNG/JPEG格式，纯前端处理保护隐私，支持水印添加和自定义缩放比例。",
    keywords: "PDF转图片,PDF转换器,PDF to PNG,PDF to JPEG,在线转换,批量转换,免费工具,隐私保护",
    ogTitle: "PDF转图片工具 - 安全快速的在线转换器",
    ogDescription: "专业的PDF转图片工具，支持批量转换、水印添加、多种格式输出。纯前端处理，保护您的文件隐私。",
    twitterTitle: "PDF转图片工具 - 免费在线转换",
    twitterDescription: "快速将PDF转换为高质量图片，支持PNG/JPEG格式，批量处理，隐私安全。",
    structuredDataName: "PDF转图片转换器",
    structuredDataDescription: "免费的在线PDF转图片工具，支持批量转换PDF文档为PNG或JPEG格式的图片文件。",
    canonicalUrl: "https://pdf-converter.vercel.app/zh",
  },
  en: {
    title: "PDF to Image Converter",
    subtitle: "Batch conversion and download support",
    privacy: "Pure frontend conversion, no server, protect your privacy",
    fileUpload: "File Upload & Settings",
    fileUploadDesc: "Select or drag and drop PDF files and configure conversion parameters",
    dragDrop: "Drag and drop files here, or click to select files",
    selected: "Selected",
    scale: "Scale (higher = clearer)",
    scaleDesc: "1.0 = 72DPI, 2.0 = 144DPI, 3.0 = 216DPI",
    outputFormat: "Output Format",
    pngFormat: "PNG (Lossless)",
    jpegFormat: "JPEG (Compressed)",
    addWatermark: "Add Watermark",
    watermarkText: "Watermark Text",
    watermarkTextPlaceholder: "Enter watermark text",
    watermarkPosition: "Watermark Position",
    center: "Center",
    topLeft: "Top Left",
    topRight: "Top Right",
    bottomLeft: "Bottom Left",
    bottomRight: "Bottom Right",
    opacity: "Opacity",
    startConvert: "Start Conversion",
    converting: "Converting...",
    convertResult: "Conversion Results",
    images: "images",
    downloadAll: "Download All (ZIP)",
    download: "Download",
    page: "Page",
    pageUnit: "",
    selectValidPdf: "Please select a valid PDF file",
    loadingPdfjs: "Loading PDF.js...",
    readingPdf: "Reading PDF file...",
    parsingPdf: "Parsing PDF document...",
    totalPages: "Total",
    startConverting: "pages, starting conversion...",
    convertingPage: "Converting page",
    convertComplete: "Conversion complete! Generated",
    convertFailed: "Conversion failed",
    unknownError: "Unknown error",
    creatingZip: "Creating ZIP package...",
    downloadStarted: "Download started!",
    downloadFailed: "Download failed",
    lightTheme: "Light Theme",
    darkTheme: "Dark Theme",
    toggleTheme: "Toggle Theme",
    metaTitle: "PDF to Image Converter - Free Online PDF Converter Tool",
    metaDescription:
      "Free online PDF to image converter tool. Batch convert PDF to PNG/JPEG format with frontend processing for privacy protection, watermark support and custom scaling.",
    keywords:
      "PDF to image,PDF converter,PDF to PNG,PDF to JPEG,online converter,batch conversion,free tool,privacy protection",
    ogTitle: "PDF to Image Converter - Secure & Fast Online Tool",
    ogDescription:
      "Professional PDF to image converter with batch conversion, watermark addition, and multiple format output. Frontend processing protects your file privacy.",
    twitterTitle: "PDF to Image Converter - Free Online Tool",
    twitterDescription:
      "Quickly convert PDF to high-quality images, supports PNG/JPEG formats, batch processing, privacy secure.",
    structuredDataName: "PDF to Image Converter",
    structuredDataDescription:
      "Free online PDF to image converter tool that supports batch conversion of PDF documents to PNG or JPEG image files.",
    canonicalUrl: "https://pdf-converter.vercel.app/en",
  },
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.zh

export const seoTranslations = {
  zh: {
    metaTitle: translations.zh.metaTitle,
    metaDescription: translations.zh.metaDescription,
    keywords: translations.zh.keywords,
    ogTitle: translations.zh.ogTitle,
    ogDescription: translations.zh.ogDescription,
    twitterTitle: translations.zh.twitterTitle,
    twitterDescription: translations.zh.twitterDescription,
    structuredDataName: translations.zh.structuredDataName,
    structuredDataDescription: translations.zh.structuredDataDescription,
    canonicalUrl: translations.zh.canonicalUrl,
  },
  en: {
    metaTitle: translations.en.metaTitle,
    metaDescription: translations.en.metaDescription,
    keywords: translations.en.keywords,
    ogTitle: translations.en.ogTitle,
    ogDescription: translations.en.ogDescription,
    twitterTitle: translations.en.twitterTitle,
    twitterDescription: translations.en.twitterDescription,
    structuredDataName: translations.en.structuredDataName,
    structuredDataDescription: translations.en.structuredDataDescription,
    canonicalUrl: translations.en.canonicalUrl,
  },
}

const LanguageContext = createContext<{
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}>({
  language: "zh",
  setLanguage: () => {},
  t: () => "",
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("zh")

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
