// AI处理服务模块

import { SummaryOptions, ConvertedImage } from '@/types/pdf-converter-types'
import { DEFAULT_MODEL } from '@/lib/constants/pdf-converter-constants'
import { extractFullTextFromImages } from './ocr-processor'
import * as webllm from "@mlc-ai/web-llm"

/**
 * 初始化WebLLM引擎
 */
export const initializeWebLLM = async (
  engine: webllm.MLCEngineInterface | null,
  setEngine: React.Dispatch<React.SetStateAction<webllm.MLCEngineInterface | null>>,
  setIsModelLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setStatus: (status: string) => void,
  setError: (error: string) => void,
  t: (key: string) => string
): Promise<webllm.MLCEngineInterface> => {
  if (engine) return engine
  
  try {
    setIsModelLoading(true)
    setStatus(t("loadingModel"))
    
    const newEngine = await webllm.CreateMLCEngine(DEFAULT_MODEL, {
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

/**
 * 生成文本总结
 */
export const generateSummary = async (
  fullText: string,
  summaryOptions: SummaryOptions,
  engine: webllm.MLCEngineInterface | null,
  setEngine: React.Dispatch<React.SetStateAction<webllm.MLCEngineInterface | null>>,
  setIsModelLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setIsGeneratingSummary: React.Dispatch<React.SetStateAction<boolean>>,
  setSummaryResult: React.Dispatch<React.SetStateAction<string>>,
  setStatus: (status: string) => void,
  setError: (error: string) => void,
  t: (key: string) => string
): Promise<string> => {
  try {
    setIsGeneratingSummary(true)
    setStatus(t("generatingSummary"))
    
    const llmEngine = await initializeWebLLM(
      engine, 
      setEngine, 
      setIsModelLoading, 
      setStatus, 
      setError, 
      t
    )
    
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

/**
 * 生成AI总结（包含OCR提取）
 */
export const generateAISummary = async (
  images: ConvertedImage[],
  summaryOptions: SummaryOptions,
  ocrLanguage: string,
  engine: webllm.MLCEngineInterface | null,
  setEngine: React.Dispatch<React.SetStateAction<webllm.MLCEngineInterface | null>>,
  setIsModelLoading: React.Dispatch<React.SetStateAction<boolean>>,
  setIsGeneratingSummary: React.Dispatch<React.SetStateAction<boolean>>,
  setSummaryResult: React.Dispatch<React.SetStateAction<string>>,
  setStatus: (status: string) => void,
  setError: (error: string) => void,
  t: (key: string) => string
): Promise<void> => {
  if (images.length === 0) {
    setError('没有可用的图像进行总结')
    return
  }

  try {
    setStatus(t("extractingText"))
    const fullText = await extractFullTextFromImages(images, ocrLanguage as any, setStatus, t)
    
    if (fullText.trim()) {
      await generateSummary(
        fullText,
        summaryOptions,
        engine,
        setEngine,
        setIsModelLoading,
        setIsGeneratingSummary,
        setSummaryResult,
        setStatus,
        setError,
        t
      )
    } else {
      setError('未能从PDF中提取到文本内容，无法生成总结')
    }
  } catch (summaryError) {
    console.error('Summary generation error:', summaryError)
    setError(`总结生成失败: ${summaryError instanceof Error ? summaryError.message : String(summaryError)}`)
  }
}