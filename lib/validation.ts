/**
 * 输入验证工具
 * 提供各种数据验证功能
 */

import { ErrorType, createAppError } from './error-handler'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export interface FileValidationOptions {
  maxSize?: number // 字节
  allowedTypes?: string[]
  maxFiles?: number
}

/**
 * 验证器类
 */
export class Validator {
  /**
   * 验证文件
   */
  static validateFile(
    file: File,
    options: FileValidationOptions = {}
  ): ValidationResult {
    const errors: string[] = []
    
    const defaultOptions: Required<FileValidationOptions> = {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ['application/pdf'],
      maxFiles: 10
    }
    
    const finalOptions = { ...defaultOptions, ...options }

    // 检查文件大小
    if (file.size > finalOptions.maxSize) {
      const maxSizeMB = Math.round(finalOptions.maxSize / (1024 * 1024))
      errors.push(`文件大小不能超过 ${maxSizeMB}MB`)
    }

    // 检查文件类型
    if (!finalOptions.allowedTypes.includes(file.type)) {
      const allowedExtensions = finalOptions.allowedTypes
        .map(type => {
          switch (type) {
            case 'application/pdf': return 'PDF'
            case 'image/jpeg': return 'JPEG'
            case 'image/png': return 'PNG'
            case 'image/gif': return 'GIF'
            default: return type
          }
        })
        .join('、')
      errors.push(`只支持 ${allowedExtensions} 格式的文件`)
    }

    // 检查文件名
    if (!file.name || file.name.trim() === '') {
      errors.push('文件名不能为空')
    }

    // 检查文件是否损坏（基础检查）
    if (file.size === 0) {
      errors.push('文件似乎已损坏或为空')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证文件列表
   */
  static validateFiles(
    files: FileList | File[],
    options: FileValidationOptions = {}
  ): ValidationResult {
    const errors: string[] = []
    const fileArray = Array.from(files)
    
    const defaultOptions: Required<FileValidationOptions> = {
      maxSize: 50 * 1024 * 1024, // 50MB
      allowedTypes: ['application/pdf'],
      maxFiles: 10
    }
    
    const finalOptions = { ...defaultOptions, ...options }

    // 检查文件数量
    if (fileArray.length > finalOptions.maxFiles) {
      errors.push(`最多只能选择 ${finalOptions.maxFiles} 个文件`)
    }

    if (fileArray.length === 0) {
      errors.push('请选择至少一个文件')
    }

    // 验证每个文件
    fileArray.forEach((file) => {
      const fileValidation = this.validateFile(file, finalOptions)
      if (!fileValidation.isValid) {
        fileValidation.errors.forEach(error => {
          errors.push(`文件 "${file.name}": ${error}`)
        })
      }
    })

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证URL
   */
  static validateUrl(url: string): ValidationResult {
    const errors: string[] = []

    if (!url || url.trim() === '') {
      errors.push('URL不能为空')
      return { isValid: false, errors }
    }

    try {
      const urlObj = new URL(url.trim())
      
      // 检查协议
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        errors.push('URL必须使用HTTP或HTTPS协议')
      }

      // 检查是否为PDF文件
      const pathname = urlObj.pathname.toLowerCase()
      if (!pathname.endsWith('.pdf')) {
        errors.push('URL必须指向PDF文件（.pdf扩展名）')
      }

    } catch {
      errors.push('URL格式不正确')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证邮箱地址
   */
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = []
    
    if (!email || email.trim() === '') {
      errors.push('邮箱地址不能为空')
      return { isValid: false, errors }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      errors.push('邮箱地址格式不正确')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证字符串长度
   */
  static validateStringLength(
    value: string,
    minLength: number = 0,
    maxLength: number = Infinity,
    fieldName: string = '字段'
  ): ValidationResult {
    const errors: string[] = []
    
    if (value.length < minLength) {
      errors.push(`${fieldName}长度不能少于${minLength}个字符`)
    }
    
    if (value.length > maxLength) {
      errors.push(`${fieldName}长度不能超过${maxLength}个字符`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证数字范围
   */
  static validateNumberRange(
    value: number,
    min: number = -Infinity,
    max: number = Infinity,
    fieldName: string = '数值'
  ): ValidationResult {
    const errors: string[] = []
    
    if (isNaN(value)) {
      errors.push(`${fieldName}必须是有效数字`)
      return { isValid: false, errors }
    }
    
    if (value < min) {
      errors.push(`${fieldName}不能小于${min}`)
    }
    
    if (value > max) {
      errors.push(`${fieldName}不能大于${max}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证必填字段
   */
  static validateRequired(
    value: unknown,
    fieldName: string = '字段'
  ): ValidationResult {
    const errors: string[] = []
    
    if (value === null || value === undefined) {
      errors.push(`${fieldName}是必填项`)
    } else if (typeof value === 'string' && value.trim() === '') {
      errors.push(`${fieldName}不能为空`)
    } else if (Array.isArray(value) && value.length === 0) {
      errors.push(`${fieldName}不能为空`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 组合多个验证结果
   */
  static combineValidations(...validations: ValidationResult[]): ValidationResult {
    const allErrors = validations.flatMap(v => v.errors)
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    }
  }
}

/**
 * 验证文件并抛出错误（如果验证失败）
 */
export function validateFileOrThrow(
  file: File,
  options?: FileValidationOptions
): void {
  const validation = Validator.validateFile(file, options)
  if (!validation.isValid) {
    throw createAppError(
      validation.errors.join('; '),
      ErrorType.VALIDATION,
      'FILE_VALIDATION_ERROR',
      { file: file.name, errors: validation.errors }
    )
  }
}

/**
 * 验证文件列表并抛出错误（如果验证失败）
 */
export function validateFilesOrThrow(
  files: FileList | File[],
  options?: FileValidationOptions
): void {
  const validation = Validator.validateFiles(files, options)
  if (!validation.isValid) {
    throw createAppError(
      validation.errors.join('; '),
      ErrorType.VALIDATION,
      'FILES_VALIDATION_ERROR',
      { fileCount: files.length, errors: validation.errors }
    )
  }
}

/**
 * 验证URL并抛出错误（如果验证失败）
 */
export function validateUrlOrThrow(url: string): void {
  const validation = Validator.validateUrl(url)
  if (!validation.isValid) {
    throw createAppError(
      validation.errors.join('; '),
      ErrorType.VALIDATION,
      'URL_VALIDATION_ERROR',
      { url, errors: validation.errors }
    )
  }
}

// 导出验证器实例
// Validator类已在上面导出