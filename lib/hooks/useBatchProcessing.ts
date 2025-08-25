// 批量处理状态管理Hook
import { useState, useCallback, useRef } from 'react'
import type { BatchFile, BatchProgress, ConvertedImage, OcrResult } from '../../types/converter'
import { PdfProcessor, type PdfProcessorConfig } from '../pdf-converter/PdfProcessor'
import { validateFilesOrThrow } from '../validation'
import { handleError, ErrorType, createAppError, getUserFriendlyMessage } from '../error-handler'

export interface UseBatchProcessingConfig {
  maxFileSize?: number
  maxFiles?: number
  allowedTypes?: string[]
  enableAutoRetry?: boolean
  maxRetryAttempts?: number
}

export interface UseBatchProcessingReturn {
  // 状态
  selectedFiles: File[]
  batchFiles: BatchFile[]
  batchProgress: BatchProgress
  isBatchMode: boolean
  isConverting: boolean
  error: string
  
  // 操作
  setIsBatchMode: (enabled: boolean) => void
  selectFiles: (files: File[]) => void
  addFiles: (files: File[]) => void
  removeFile: (fileId: string) => void
  clearAllFiles: () => void
  startBatchProcessing: (config: PdfProcessorConfig) => Promise<void>
  retryFile: (fileId: string, config: PdfProcessorConfig) => Promise<void>
  retryAllFailed: (config: PdfProcessorConfig) => Promise<void>
  downloadBatchFile: (batchFile: BatchFile) => Promise<void>
  downloadAllResults: () => Promise<void>
  
  // 统计信息
  getStatistics: () => {
    total: number
    completed: number
    failed: number
    pending: number
    processing: number
  }
}

export function useBatchProcessing(config: UseBatchProcessingConfig = {}): UseBatchProcessingReturn {
  // 基础状态
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([])
  const [batchProgress, setBatchProgress] = useState<BatchProgress>({
    totalFiles: 0,
    completedFiles: 0,
    currentFile: '',
    overallProgress: 0
  })
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState('')
  
  // Refs
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // 生成唯一ID
  const generateFileId = useCallback(() => {
    return Math.random().toString(36).substr(2, 9)
  }, [])
  
  // 选择文件
  const selectFiles = useCallback((files: File[]) => {
    try {
      validateFilesOrThrow(files, {
        maxSize: config.maxFileSize || 50 * 1024 * 1024, // 50MB
        allowedTypes: config.allowedTypes || ['application/pdf'],
        maxFiles: config.maxFiles || 10
      })
      
      // 过滤出PDF文件
      const pdfFiles = files.filter(file => file.type === 'application/pdf')
      
      if (pdfFiles.length === 0) {
        throw createAppError('请选择有效的PDF文件', ErrorType.VALIDATION, 'NO_PDF_FILES')
      }
      
      setSelectedFiles(pdfFiles)
      setError('')
      
      // 创建批量文件对象
      const newBatchFiles: BatchFile[] = pdfFiles.map(file => ({
        file,
        id: generateFileId(),
        status: 'pending',
        progress: 0,
        convertedImages: [],
        ocrResults: []
      }))
      
      setBatchFiles(newBatchFiles)
      setBatchProgress({
        totalFiles: newBatchFiles.length,
        completedFiles: 0,
        currentFile: '',
        overallProgress: 0
      })
      
    } catch (error) {
      setError(getUserFriendlyMessage(error))
      handleError(error, { showToUser: true })
    }
  }, [config.maxFileSize, config.allowedTypes, config.maxFiles, generateFileId])
  
  // 添加文件
  const addFiles = useCallback((files: File[]) => {
    const existingFileNames = new Set(selectedFiles.map(f => f.name))
    const newFiles = files.filter(file => 
      file.type === 'application/pdf' && !existingFileNames.has(file.name)
    )
    
    if (newFiles.length === 0) {
      setError('所选文件已存在于列表中或不是有效的PDF文件')
      return
    }
    
    try {
      const totalFiles = selectedFiles.length + newFiles.length
      if (totalFiles > (config.maxFiles || 10)) {
        throw createAppError(
          `最多只能选择${config.maxFiles || 10}个文件`,
          ErrorType.VALIDATION,
          'TOO_MANY_FILES'
        )
      }
      
      const updatedFiles = [...selectedFiles, ...newFiles]
      setSelectedFiles(updatedFiles)
      
      // 添加新的批量文件对象
      const newBatchFiles: BatchFile[] = newFiles.map(file => ({
        file,
        id: generateFileId(),
        status: 'pending',
        progress: 0,
        convertedImages: [],
        ocrResults: []
      }))
      
      setBatchFiles(prev => [...prev, ...newBatchFiles])
      setBatchProgress((prev: BatchProgress) => ({
        ...prev,
        totalFiles: prev.totalFiles + newBatchFiles.length
      }))
      
      setError('')
    } catch (error) {
      setError(getUserFriendlyMessage(error))
      handleError(error, { showToUser: true })
    }
  }, [selectedFiles, config.maxFiles, generateFileId])
  
  // 移除文件
  const removeFile = useCallback((fileId: string) => {
    setBatchFiles(prev => {
      const updatedFiles = prev.filter(f => f.id !== fileId)
      
      // 更新选中文件列表
      const updatedSelectedFiles = updatedFiles.map(f => f.file)
      setSelectedFiles(updatedSelectedFiles)
      
      // 更新进度
      const completedCount = updatedFiles.filter(f => f.status === 'completed').length
      setBatchProgress({
        totalFiles: updatedFiles.length,
        completedFiles: completedCount,
        currentFile: '',
        overallProgress: updatedFiles.length > 0 ? (completedCount / updatedFiles.length) * 100 : 0
      })
      
      return updatedFiles
    })
  }, [])
  
  // 清除所有文件
  const clearAllFiles = useCallback(() => {
    // 如果正在转换，先取消
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    setSelectedFiles([])
    setBatchFiles([])
    setBatchProgress({
      totalFiles: 0,
      completedFiles: 0,
      currentFile: '',
      overallProgress: 0
    })
    setIsConverting(false)
    setError('')
  }, [])
  
  // 开始批量处理
  const startBatchProcessing = useCallback(async (processorConfig: PdfProcessorConfig) => {
    if (batchFiles.length === 0 || isConverting) return
    
    setIsConverting(true)
    setError('')
    
    // 创建中断控制器
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    
    try {
      // 重置所有文件状态
      setBatchFiles((prev: BatchFile[]) => prev.map(f => ({
        ...f,
        status: 'pending' as const,
        progress: 0,
        convertedImages: [],
        ocrResults: [],
        error: undefined
      })))
      
      setBatchProgress((prev: BatchProgress) => ({
        ...prev,
        completedFiles: 0,
        overallProgress: 0,
        currentFile: ''
      }))
      
      // 逐个处理文件
      for (let i = 0; i < batchFiles.length; i++) {
        if (abortController.signal.aborted) break
        
        const batchFile = batchFiles[i]
        
        try {
          // 更新当前处理文件
          setBatchProgress((prev: BatchProgress) => ({
            ...prev,
            currentFile: batchFile.file.name
          }))
          
          // 更新文件状态为处理中
          setBatchFiles((prev: BatchFile[]) => prev.map(f => 
            f.id === batchFile.id ? { ...f, status: 'processing' as const } : f
          ))
          
          // 转换PDF
          const result = await convertSingleFile(batchFile.file, batchFile.id, processorConfig)
          
          // 更新文件状态为完成
          setBatchFiles((prev: BatchFile[]) => prev.map(f => 
            f.id === batchFile.id ? {
              ...f,
              status: 'completed' as const,
              progress: 100,
              convertedImages: result.images,
              ocrResults: result.ocrResults || []
            } : f
          ))
          
        } catch (error) {
          console.error(`文件 ${batchFile.file.name} 处理失败:`, error)
          
          // 更新文件状态为错误
          setBatchFiles((prev: BatchFile[]) => prev.map(f => 
            f.id === batchFile.id ? {
              ...f,
              status: 'error' as const,
              error: error instanceof Error ? error.message : '未知错误'
            } : f
          ))
        }
        
        // 更新整体进度
        const completedCount = i + 1
        setBatchProgress((prev: BatchProgress) => ({
          ...prev,
          completedFiles: completedCount,
          overallProgress: (completedCount / batchFiles.length) * 100
        }))
      }
      
      setBatchProgress((prev: BatchProgress) => ({
        ...prev,
        currentFile: ''
      }))
      
    } catch (error) {
      setError(`批量处理失败: ${error instanceof Error ? error.message : '未知错误'}`)
      handleError(error, { showToUser: true })
    } finally {
      setIsConverting(false)
      abortControllerRef.current = null
    }
  }, [batchFiles, isConverting])
  
  // 转换单个文件
  const convertSingleFile = async (
    file: File, 
    fileId: string, 
    processorConfig: PdfProcessorConfig
  ): Promise<{ images: ConvertedImage[], ocrResults?: OcrResult[] }> => {
    const processor = new PdfProcessor(processorConfig, (progress: number) => {
      // 更新单个文件的进度
      setBatchFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress } : f
      ))
    })
    
    const result = await processor.convertFromFile()
    return result
  }
  
  // 重试单个文件
  const retryFile = useCallback(async (fileId: string, processorConfig: PdfProcessorConfig) => {
    const fileToRetry = batchFiles.find(f => f.id === fileId)
    if (!fileToRetry || isConverting) return
    
    setIsConverting(true)
    setError('')
    
    try {
      // 重置文件状态
      setBatchFiles(prev => prev.map(f => 
        f.id === fileId ? {
          ...f,
          status: 'processing' as const,
          progress: 0,
          convertedImages: [],
          ocrResults: [],
          error: undefined
        } : f
      ))
      
      setBatchProgress((prev: BatchProgress) => ({
        ...prev,
        currentFile: fileToRetry.file.name
      }))
      
      // 转换PDF
      const result = await convertSingleFile(fileToRetry.file, fileId, processorConfig)
      
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
      setBatchProgress((prev: BatchProgress) => ({
        ...prev,
        completedFiles: completedCount,
        overallProgress: (completedCount / batchFiles.length) * 100,
        currentFile: ''
      }))
      
    } catch (error) {
      // 更新文件状态为错误
      setBatchFiles(prev => prev.map(f => 
        f.id === fileId ? {
          ...f,
          status: 'error' as const,
          error: error instanceof Error ? error.message : '未知错误'
        } : f
      ))
      
      setBatchProgress((prev: BatchProgress) => ({
        ...prev,
        currentFile: ''
      }))
      
      setError(`重试失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsConverting(false)
    }
  }, [batchFiles, isConverting])
  
  // 重试所有失败的文件
  const retryAllFailed = useCallback(async (processorConfig: PdfProcessorConfig) => {
    const failedFiles = batchFiles.filter(f => f.status === 'error')
    if (failedFiles.length === 0 || isConverting) return
    
    setIsConverting(true)
    setError('')
    
    try {
      for (const failedFile of failedFiles) {
        try {
          // 重置文件状态
          setBatchFiles((prev: BatchFile[]) => prev.map(f => 
            f.id === failedFile.id ? {
              ...f,
              status: 'processing' as const,
              progress: 0,
              convertedImages: [],
              ocrResults: [],
              error: undefined
            } : f
          ))
          
          setBatchProgress((prev: BatchProgress) => ({
            ...prev,
            currentFile: failedFile.file.name
          }))
          
          // 转换PDF
          const result = await convertSingleFile(failedFile.file, failedFile.id, processorConfig)
          
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
          // 保持错误状态
          setBatchFiles(prev => prev.map(f => 
            f.id === failedFile.id ? {
              ...f,
              status: 'error' as const,
              error: error instanceof Error ? error.message : '未知错误'
            } : f
          ))
        }
      }
      
      // 更新整体进度
      const completedCount = batchFiles.filter(f => f.status === 'completed').length
      setBatchProgress((prev: BatchProgress) => ({
        ...prev,
        completedFiles: completedCount,
        overallProgress: (completedCount / batchFiles.length) * 100,
        currentFile: ''
      }))
      
    } catch (error) {
      setError(`批量重试失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsConverting(false)
    }
  }, [batchFiles, isConverting])
  
  // 下载单个批量文件的结果
  const downloadBatchFile = useCallback(async (batchFile: BatchFile) => {
    if (batchFile.convertedImages.length === 0) return
    
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      
      batchFile.convertedImages.forEach((image: ConvertedImage) => {
        const extension = image.type === 'image/jpeg' ? 'jpg' : 
                         image.type === 'image/png' ? 'png' :
                         image.type === 'image/gif' ? 'gif' : 'png'
        
        const filename = `${batchFile.file.name}-page-${image.pageNumber}.${extension}`
        const base64Data = image.dataUrl.split(',')[1]
        zip.file(filename, base64Data, { base64: true })
      })
      
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = url
      link.download = `${batchFile.file.name}-converted.zip`
      link.click()
      
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (error) {
      console.error('下载失败:', error)
    }
  }, [])
  
  // 下载所有结果
  const downloadAllResults = useCallback(async () => {
    const completedFiles = batchFiles.filter(f => 
      f.status === 'completed' && f.convertedImages.length > 0
    )
    
    if (completedFiles.length === 0) return
    
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      
      completedFiles.forEach((batchFile) => {
        const folder = zip.folder(batchFile.file.name.replace('.pdf', ''))
        
        batchFile.convertedImages.forEach((image: ConvertedImage) => {
          const extension = image.type === 'image/jpeg' ? 'jpg' : 
                           image.type === 'image/png' ? 'png' :
                           image.type === 'image/gif' ? 'gif' : 'png'
          
          const filename = `page-${image.pageNumber}.${extension}`
          const base64Data = image.dataUrl.split(',')[1]
          folder?.file(filename, base64Data, { base64: true })
        })
      })
      
      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const link = document.createElement('a')
      link.href = url
      link.download = 'batch-converted-results.zip'
      link.click()
      
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (error) {
      setError(`下载失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }, [batchFiles])
  
  // 获取统计信息
  const getStatistics = useCallback(() => {
    const total = batchFiles.length
    const completed = batchFiles.filter(f => f.status === 'completed').length
    const failed = batchFiles.filter(f => f.status === 'error').length
    const pending = batchFiles.filter(f => f.status === 'pending').length
    const processing = batchFiles.filter(f => f.status === 'processing').length
    
    return { total, completed, failed, pending, processing }
  }, [batchFiles])
  
  return {
    // 状态
    selectedFiles,
    batchFiles,
    batchProgress,
    isBatchMode,
    isConverting,
    error,
    
    // 操作
    setIsBatchMode,
    selectFiles,
    addFiles,
    removeFile,
    clearAllFiles,
    startBatchProcessing,
    retryFile,
    retryAllFailed,
    downloadBatchFile,
    downloadAllResults,
    
    // 统计信息
    getStatistics
  }
}