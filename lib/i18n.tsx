"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type Language = "zh" | "en"

export const translations = {
  zh: {
    title: "PDF转图片工具",
    subtitle: "将PDF文档转换为高质量图片",
    privacy: "所有处理都在您的浏览器中进行，文件不会上传到服务器",
    fileUpload: "文件上传",
    fileUploadDesc: "选择PDF文件或输入URL进行转换",
    localFile: "本地文件",
    urlInput: "URL输入",
    dragDrop: "拖拽文件到此处或点击选择",
    selected: "已选择",
    pdfUrl: "PDF链接",
    pdfUrlPlaceholder: "输入PDF文件的URL地址",
    pdfUrlDesc: "支持公开访问的PDF文件链接",
    urlReady: "URL已准备",
    fetchingPdf: "正在获取PDF文件...",
    invalidPdfUrl: "无效的PDF链接",
    pdfPassword: "PDF密码",
    pdfPasswordPlaceholder: "输入PDF文件密码",
    pdfPasswordDesc: "如果PDF文件受密码保护，请输入密码",
    passwordRequired: "此PDF文件需要密码",
    incorrectPassword: "密码错误，请重新输入",
    scale: "缩放比例",
    scaleDesc: "数值越大，图片质量越高，文件也越大",
    outputFormat: "输出格式",
    pngFormat: "PNG (无损压缩)",
    jpegFormat: "JPEG (有损压缩)",
    addWatermark: "添加水印",
    watermarkText: "水印文字",
    watermarkTextPlaceholder: "输入水印内容",
    watermarkPosition: "水印位置",
    center: "居中",
    topLeft: "左上角",
    topRight: "右上角",
    bottomLeft: "左下角",
    bottomRight: "右下角",
    opacity: "透明度",
    startConvert: "开始转换",
    converting: "转换中...",
    loadingPdfjs: "正在加载PDF.js库...",
    readingPdf: "正在读取PDF文件...",
    parsingPdf: "正在解析PDF文档...",
    totalPages: "共",
    startConverting: "页，开始转换",
    convertingPage: "正在转换第",
    pageUnit: "页",
    convertComplete: "转换完成！共生成",
    images: "张图片",
    convertFailed: "转换失败",
    unknownError: "未知错误",
    selectValidPdf: "请选择有效的PDF文件",
    convertResult: "转换结果",
    downloadAll: "下载全部",
    download: "下载",
    page: "第",
    creatingZip: "正在创建ZIP文件...",
    downloadStarted: "下载已开始",
    downloadFailed: "下载失败",
    toggleTheme: "切换主题",
    lightTheme: "浅色主题",
    darkTheme: "深色主题",
    blog: "技术博客",
    blogTitle: "PDF处理技术博客",
    blogSubtitle: "分享PDF处理、格式转换、文档安全等技术知识和最佳实践",
    searchArticles: "搜索文章...",
    noArticlesFound: "没有找到相关文章",
    backToBlog: "返回博客",
    backToConverter: "返回转换器",
    share: "分享",
    viewMoreArticles: "← 查看更多文章",
    usePdfConverter: "使用PDF转换器 →",
    minRead: "分钟阅读",
    publishedOn: "发布于",
  },
  en: {
    title: "PDF to Image Converter",
    subtitle: "Convert PDF documents to high-quality images",
    privacy: "All processing is done in your browser, files are not uploaded to servers",
    fileUpload: "File Upload",
    fileUploadDesc: "Select PDF file or enter URL for conversion",
    localFile: "Local File",
    urlInput: "URL Input",
    dragDrop: "Drag and drop file here or click to select",
    selected: "Selected",
    pdfUrl: "PDF URL",
    pdfUrlPlaceholder: "Enter PDF file URL",
    pdfUrlDesc: "Supports publicly accessible PDF file links",
    urlReady: "URL Ready",
    fetchingPdf: "Fetching PDF file...",
    invalidPdfUrl: "Invalid PDF URL",
    pdfPassword: "PDF Password",
    pdfPasswordPlaceholder: "Enter PDF file password",
    pdfPasswordDesc: "If the PDF file is password protected, please enter the password",
    passwordRequired: "This PDF file requires a password",
    incorrectPassword: "Incorrect password, please try again",
    scale: "Scale",
    scaleDesc: "Higher values produce better quality but larger files",
    outputFormat: "Output Format",
    pngFormat: "PNG (Lossless)",
    jpegFormat: "JPEG (Lossy)",
    addWatermark: "Add Watermark",
    watermarkText: "Watermark Text",
    watermarkTextPlaceholder: "Enter watermark content",
    watermarkPosition: "Watermark Position",
    center: "Center",
    topLeft: "Top Left",
    topRight: "Top Right",
    bottomLeft: "Bottom Left",
    bottomRight: "Bottom Right",
    opacity: "Opacity",
    startConvert: "Start Convert",
    converting: "Converting...",
    loadingPdfjs: "Loading PDF.js library...",
    readingPdf: "Reading PDF file...",
    parsingPdf: "Parsing PDF document...",
    totalPages: "Total",
    startConverting: "pages, starting conversion",
    convertingPage: "Converting page",
    pageUnit: "",
    convertComplete: "Conversion complete! Generated",
    images: "images",
    convertFailed: "Conversion failed",
    unknownError: "Unknown error",
    selectValidPdf: "Please select a valid PDF file",
    convertResult: "Conversion Result",
    downloadAll: "Download All",
    download: "Download",
    page: "Page",
    creatingZip: "Creating ZIP file...",
    downloadStarted: "Download started",
    downloadFailed: "Download failed",
    toggleTheme: "Toggle theme",
    lightTheme: "Light Theme",
    darkTheme: "Dark Theme",
    blog: "Tech Blog",
    blogTitle: "PDF Processing Tech Blog",
    blogSubtitle:
      "Sharing technical knowledge and best practices on PDF processing, format conversion, and document security",
    searchArticles: "Search articles...",
    noArticlesFound: "No articles found",
    backToBlog: "Back to Blog",
    backToConverter: "Back to Converter",
    share: "Share",
    viewMoreArticles: "← View more articles",
    usePdfConverter: "Use PDF Converter →",
    minRead: "min read",
    publishedOn: "Published on",
  },
} as const

export type TranslationKey = keyof typeof translations.zh

function detectBrowserLanguage(): Language {
  if (typeof window === "undefined") return "en" // Default for SSR

  const browserLang = navigator.language || navigator.languages?.[0] || "en"

  // Check if browser language starts with supported language codes
  if (browserLang.startsWith("zh")) return "zh"
  if (browserLang.startsWith("en")) return "en"

  // Default fallback
  return "en"
}

// Language Context
interface LanguageContextType {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // Check localStorage first, then browser language
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("preferred-language") as Language
      if (saved && (saved === "zh" || saved === "en")) {
        return saved
      }
    }
    return detectBrowserLanguage()
  })

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("preferred-language", language)
    }
  }, [language])

  const t = (key: TranslationKey): string => translations[language][key]

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

// SEO Translations
export const seoTranslations = {
  zh: {
    title: "PDF转图片工具 - 免费在线PDF转换器",
    description: "免费的在线PDF转图片工具，支持转换为PNG/JPEG格式，高质量输出，隐私安全，无需上传文件",
    keywords: "PDF转图片,PDF转换器,PDF to PNG,PDF to JPEG,在线转换,免费工具",
    ogTitle: "PDF转图片工具 - 免费在线转换",
    ogDescription: "将PDF文档转换为高质量图片，支持PNG/JPEG格式，完全在浏览器中处理，保护您的隐私",
    twitterTitle: "PDF转图片工具",
    twitterDescription: "免费的在线PDF转图片转换器，高质量输出，隐私安全",
    structuredDataName: "PDF转图片工具",
    structuredDataDescription: "免费的在线PDF转图片转换工具，支持多种格式输出",
    canonicalUrl: "https://www.pdf2img.top/",
  },
  en: {
    title: "PDF to Image Converter - Free Online PDF Converter",
    description:
      "Free online PDF to image converter, supports PNG/JPEG formats, high-quality output, privacy-safe, no file upload required",
    keywords: "PDF to image,PDF converter,PDF to PNG,PDF to JPEG,online converter,free tool",
    ogTitle: "PDF to Image Converter - Free Online Tool",
    ogDescription:
      "Convert PDF documents to high-quality images, supports PNG/JPEG formats, processed entirely in browser for privacy",
    twitterTitle: "PDF to Image Converter",
    twitterDescription: "Free online PDF to image converter with high-quality output and privacy protection",
    structuredDataName: "PDF to Image Converter",
    structuredDataDescription: "Free online PDF to image conversion tool with multiple format support",
    canonicalUrl: "https://www.pdf2img.top/en",
  },
}
