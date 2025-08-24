/**
 * 全局错误处理工具
 * 提供统一的错误处理、记录和用户友好的错误消息
 */

export interface ErrorInfo {
  message: string
  code?: string
  details?: unknown
  timestamp: Date
  userAgent?: string
  url?: string
}

export interface ErrorHandlerOptions {
  showToUser?: boolean
  logToConsole?: boolean
  reportToService?: boolean
}

/**
 * 错误类型枚举
 */
export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  FILE_PROCESSING = 'FILE_PROCESSING',
  API = 'API',
  UNKNOWN = 'UNKNOWN'
}

/**
 * 自定义应用错误类
 */
export class AppError extends Error {
  public readonly type: ErrorType
  public readonly code?: string
  public readonly details?: unknown
  public readonly timestamp: Date

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    code?: string,
    details?: unknown
  ) {
    super(message)
    this.name = 'AppError'
    this.type = type
    this.code = code
    this.details = details
    this.timestamp = new Date()

    // 确保堆栈跟踪正确指向错误发生位置
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }
}

/**
 * 错误处理器类
 */
export class ErrorHandler {
  private static instance: ErrorHandler
  private errorQueue: ErrorInfo[] = []
  private maxQueueSize = 100

  private constructor() {}

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * 处理错误的主要方法
   */
  public handleError(
    error: Error | AppError | unknown,
    options: ErrorHandlerOptions = {}
  ): ErrorInfo {
    const errorInfo = this.createErrorInfo(error)
    
    // 默认选项
    const defaultOptions: ErrorHandlerOptions = {
      showToUser: true,
      logToConsole: true,
      reportToService: false
    }
    
    const finalOptions = { ...defaultOptions, ...options }

    // 记录错误
    if (finalOptions.logToConsole) {
      this.logError(errorInfo)
    }

    // 添加到错误队列
    this.addToQueue(errorInfo)

    // 上报错误（如果需要）
    if (finalOptions.reportToService) {
      this.reportError(errorInfo)
    }

    return errorInfo
  }

  /**
   * 创建错误信息对象
   */
  private createErrorInfo(error: Error | AppError | unknown): ErrorInfo {
    const timestamp = new Date()
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : undefined
    const url = typeof window !== 'undefined' ? window.location.href : undefined

    if (error instanceof AppError) {
      return {
        message: error.message,
        code: error.code,
        details: error.details,
        timestamp,
        userAgent,
        url
      }
    }

    if (error instanceof Error) {
      return {
        message: error.message,
        code: error.name,
        details: { stack: error.stack },
        timestamp,
        userAgent,
        url
      }
    }

    // 处理非Error对象
    return {
      message: String(error) || '未知错误',
      code: 'UNKNOWN_ERROR',
      details: error,
      timestamp,
      userAgent,
      url
    }
  }

  /**
   * 记录错误到控制台
   */
  private logError(errorInfo: ErrorInfo): void {
    console.group('🚨 Error Handler')
    console.error('Message:', errorInfo.message)
    console.error('Code:', errorInfo.code)
    console.error('Timestamp:', errorInfo.timestamp.toISOString())
    if (errorInfo.details) {
      console.error('Details:', errorInfo.details)
    }
    console.groupEnd()
  }

  /**
   * 添加错误到队列
   */
  private addToQueue(errorInfo: ErrorInfo): void {
    this.errorQueue.push(errorInfo)
    
    // 保持队列大小在限制内
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift()
    }
  }

  /**
   * 上报错误到服务（预留接口）
   */
  private async reportError(errorInfo: ErrorInfo): Promise<void> {
    try {
      // 这里可以集成错误监控服务，如 Sentry、LogRocket 等
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorInfo)
      // })
      console.log('Error reported:', errorInfo)
    } catch (reportError) {
      console.error('Failed to report error:', reportError)
    }
  }

  /**
   * 获取错误队列
   */
  public getErrorQueue(): ErrorInfo[] {
    return [...this.errorQueue]
  }

  /**
   * 清空错误队列
   */
  public clearErrorQueue(): void {
    this.errorQueue = []
  }

  /**
   * 获取用户友好的错误消息
   */
  public getUserFriendlyMessage(error: Error | AppError | unknown): string {
    if (error instanceof AppError) {
      switch (error.type) {
        case ErrorType.NETWORK:
          return '网络连接出现问题，请检查您的网络连接后重试'
        case ErrorType.VALIDATION:
          return '输入的数据格式不正确，请检查后重试'
        case ErrorType.FILE_PROCESSING:
          return '文件处理失败，请确保文件格式正确且未损坏'
        case ErrorType.API:
          return '服务暂时不可用，请稍后重试'
        default:
          return error.message || '操作失败，请重试'
      }
    }

    if (error instanceof Error) {
      // 根据错误类型返回友好消息
      if (error.name === 'TypeError') {
        return '数据格式错误，请检查输入'
      }
      if (error.name === 'NetworkError') {
        return '网络连接失败，请检查网络后重试'
      }
      return '操作失败，请重试'
    }

    return '未知错误，请重试'
  }
}

// 导出单例实例
export const errorHandler = ErrorHandler.getInstance()

// 便捷函数
export function handleError(
  error: Error | AppError | unknown,
  options?: ErrorHandlerOptions
): ErrorInfo {
  return errorHandler.handleError(error, options)
}

export function createAppError(
  message: string,
  type: ErrorType = ErrorType.UNKNOWN,
  code?: string,
  details?: unknown
): AppError {
  return new AppError(message, type, code, details)
}

export function getUserFriendlyMessage(error: Error | AppError | unknown): string {
  return errorHandler.getUserFriendlyMessage(error)
}