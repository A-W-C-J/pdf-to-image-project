// OCR处理服务模块

import { OcrResult, ConvertedImage, OcrLanguage } from '@/types/pdf-converter-types'
import { preprocessImageForOCR } from '@/lib/utils/pdf-converter-utils'
import { OCR_PARAMS, DELAYS } from '@/lib/constants/pdf-converter-constants'
import { createWorker } from "tesseract.js"

/**
 * OCR文字提取函数
 */
export const extractTextFromImage = async (
  pageNumber: number, 
  imageDataUrl: string, 
  ocrLanguage: OcrLanguage,
  setOcrResults: React.Dispatch<React.SetStateAction<OcrResult[]>>,
  setShowOcrResults: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>,
  setStatus: (status: string) => void,
  setError: (error: string) => void,
  t: (key: string) => string,
  batchFileId?: string
) => {
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
      tessedit_ocr_engine_mode: OCR_PARAMS.TESSEDIT_OCR_ENGINE_MODE,
      preserve_interword_spaces: OCR_PARAMS.PRESERVE_INTERWORD_SPACES,
    }
    
    // 根据语言优化参数
    if (ocrLanguage === 'chi_sim' || ocrLanguage === 'chi_tra') {
      // 中文优化
      ocrParams.tessedit_pageseg_mode = OCR_PARAMS.CHINESE_PAGE_SEG_MODE
      ocrParams.tessedit_char_whitelist = '' // 允许所有中文字符
    } else if (ocrLanguage === 'eng') {
      // 英文优化
      ocrParams.tessedit_pageseg_mode = OCR_PARAMS.ENGLISH_PAGE_SEG_MODE
      ocrParams.tessedit_char_whitelist = OCR_PARAMS.ENGLISH_WHITELIST
    } else {
      // 自动检测模式
      ocrParams.tessedit_pageseg_mode = OCR_PARAMS.AUTO_PAGE_SEG_MODE
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
    
    // 延时后自动显示提取结果
    setTimeout(() => {
      const key = batchFileId ? `${batchFileId}-${pageNumber}` : pageNumber
      setShowOcrResults(prev => ({ ...prev, [key]: true }))
    }, DELAYS.OCR_RESULT_AUTO_SHOW)
    
  } catch (error) {
    console.error("OCR extraction failed:", error)
    setOcrResults(prev => 
      prev.map(r => r.pageNumber === pageNumber ? { ...r, text: "", isExtracting: false, isCompleted: true } : r)
    )
    setError(t("noTextFound"))
  }
}

/**
 * 全文OCR提取函数（用于AI总结）
 */
export const extractFullTextFromImages = async (
  images: ConvertedImage[], 
  ocrLanguage: OcrLanguage,
  setStatus: (status: string) => void,
  t: (key: string) => string
): Promise<string> => {
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
        tessedit_ocr_engine_mode: OCR_PARAMS.TESSEDIT_OCR_ENGINE_MODE,
        preserve_interword_spaces: OCR_PARAMS.PRESERVE_INTERWORD_SPACES,
      }
      
      // 根据语言优化参数
      if (ocrLanguage === 'chi_sim' || ocrLanguage === 'chi_tra') {
        // 中文优化
        ocrParams.tessedit_pageseg_mode = OCR_PARAMS.CHINESE_PAGE_SEG_MODE
        ocrParams.tessedit_char_whitelist = '' // 允许所有中文字符
      } else if (ocrLanguage === 'eng') {
        // 英文优化
        ocrParams.tessedit_pageseg_mode = OCR_PARAMS.ENGLISH_PAGE_SEG_MODE
        ocrParams.tessedit_char_whitelist = OCR_PARAMS.ENGLISH_WHITELIST
      } else {
        // 自动检测模式
        ocrParams.tessedit_pageseg_mode = OCR_PARAMS.AUTO_PAGE_SEG_MODE
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

/**
 * 复制文字到剪贴板
 */
export const copyTextToClipboard = async (
  text: string,
  setStatus: (status: string) => void,
  t: (key: string) => string
) => {
  try {
    await navigator.clipboard.writeText(text)
    setStatus(t("textCopied"))
    return true
  } catch (error) {
    console.error("Failed to copy text:", error)
    return false
  }
}

/**
 * 切换OCR结果显示
 */
export const toggleOcrResult = (
  key: string | number,
  setShowOcrResults: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>
) => {
  setShowOcrResults(prev => ({
    ...prev,
    [key]: !prev[key]
  }))
}