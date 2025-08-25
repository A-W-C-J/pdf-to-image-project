import { type NextRequest } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { createSubscriptionMiddleware, recordConversionUsage } from '@/lib/subscription/subscription-checker'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    // 验证用户身份
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: '请先登录后再使用PDF转文档功能',
        code: 'UNAUTHORIZED'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
  
      return new Response(JSON.stringify({ error: '请选择PDF文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 检查订阅状态
    const conversionType = 'pdf_to_word'
    const { allowed, status } = await createSubscriptionMiddleware(user.id, conversionType)
    
    if (!allowed) {
      return new Response(JSON.stringify({ 
        error: status.message || '需要订阅才能使用此功能',
        code: 'SUBSCRIPTION_REQUIRED',
        subscriptionStatus: status
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 验证文件类型
    if (file.type !== 'application/pdf') {
      return new Response(JSON.stringify({ error: '只支持PDF文件格式' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 验证文件大小 (最大300MB)
    const maxSize = 300 * 1024 * 1024 // 300MB
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: '文件大小不能超过300MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const apiKey = process.env.DOC2X_APIKEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'DOC2X API密钥未配置' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 创建临时文件
    const tempFileName = `${randomUUID()}.pdf`
    const tempFilePath = join(tmpdir(), tempFileName)
    
    try {
      // 保存上传的文件到临时目录
      const bytes = await file.arrayBuffer()
      const buffer = new Uint8Array(bytes)
      await writeFile(tempFilePath, buffer)

      // 调用DOC2X API进行转换
      const convertResult = await convertPdfToWord(tempFilePath, apiKey)
      
      // 记录转换使用情况
      const processingTime = Date.now() - startTime
      await recordConversionUsage(user.id, {
        conversionType,
        fileName: file.name,
        fileSize: file.size,
        success: convertResult.success,
        errorMessage: convertResult.success ? undefined : convertResult.message,
        processingTimeMs: processingTime
      })
      
      return new Response(JSON.stringify(convertResult), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } finally {
      // 清理临时文件
      try {
        await unlink(tempFilePath)
      } catch (error) {
        console.error('清理临时文件失败:', error)
      }
    }
  } catch (error) {
    console.error('PDF转Word处理错误:', error)
    
    // 根据错误类型提供不同的用户友好提示
    let userFriendlyMessage = '服务器内部错误'
    
    if (error instanceof Error) {
      const errorMessage = error.message
      
      // 网络超时或连接错误
      if (errorMessage.includes('timeout') || errorMessage.includes('abort') || errorMessage.includes('超时')) {
        userFriendlyMessage = '上传超时，请检查网络连接后重试。海外用户建议使用VPN或等待网络状态较好时重试。'
      }
      // 上传失败
      else if (errorMessage.includes('上传失败') || errorMessage.includes('upload')) {
        userFriendlyMessage = '文件上传失败，可能是网络不稳定所致。建议：1. 检查网络连接 2. 尝试压缩文件大小 3. 海外用户使用VPN后重试'
      }
      // API密钥问题
      else if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
        userFriendlyMessage = 'API密钥配置错误，请联系管理员'
      }
      // 文件太大
      else if (errorMessage.includes('413') || errorMessage.includes('large')) {
        userFriendlyMessage = '文件过大，请压缩后重试（建议小于100MB）'
      }
      // 服务器问题
      else if (errorMessage.includes('500') || errorMessage.includes('502') || errorMessage.includes('503')) {
        userFriendlyMessage = '转换服务暂时不可用，请稍后重试'
      }
      // 其他情况
      else {
        userFriendlyMessage = `转换过程中发生错误: ${errorMessage}。如果是海外用户且经常出现该问题，建议使用VPN或选择网络状态较好的时段重试。`
      }
    }
    
    // 记录失败的转换使用情况
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const formData = await request.formData()
        const file = formData.get('file') as File
        const processingTime = Date.now() - startTime
        
        await recordConversionUsage(user.id, {
          conversionType: 'pdf_to_word',
          fileName: file?.name,
          fileSize: file?.size,
          success: false,
          errorMessage: error instanceof Error ? error.message : '未知错误',
          processingTimeMs: processingTime
        })
      }
    } catch (recordError) {
      console.error('记录转换失败情况时出错:', recordError)
    }
    
    return new Response(JSON.stringify({ 
      error: userFriendlyMessage,
      isNetworkIssue: error instanceof Error && (
        error.message.includes('timeout') || 
        error.message.includes('upload') || 
        error.message.includes('上传失败')
      ),
      suggestions: [
        '检查网络连接是否稳定',
        '尝试压缩PDF文件大小',
        '海外用户建议使用VPN',
        '选择网络状态较好的时段重试'
      ]
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

interface Doc2XResponse {
  success: boolean
  message?: string
  data?: {
    uuid?: string
    url?: string
    uid?: string
    taskId?: string
    status?: string
    downloadUrl?: string
    [key: string]: unknown
  }
}

async function convertPdfToWord(filePath: string, apiKey: string) {
  try {
    // 1. 获取预上传URL（包含网络检测）
    const preuploadResponse = await getPreuploadUrl(apiKey) as Doc2XResponse
    
    if (!preuploadResponse.success || !preuploadResponse.data?.uid || !preuploadResponse.data?.url) {
      throw new Error('获取上传URL失败')
    }
    
    const { uid: uuid, url: uploadUrl, networkInfo } = preuploadResponse.data as {
      uid: string
      url: string
      networkInfo: { isOverseas: boolean; latency: number }
    }

    if (!uploadUrl) {
      throw new Error('上传URL获取失败')
    }

    // 2. 读取文件并创建File对象
    const fs = await import('fs')
    const fileBuffer = await fs.promises.readFile(filePath)
    const file = new File([fileBuffer], 'document.pdf', { type: 'application/pdf' })

    // 3. 使用智能上传策略上传文件
    console.log('开始智能上传文件...')
    await uploadFileWithOptimization(file, uploadUrl, networkInfo)
    
    // 4. 等待文件解析完成
    await waitForParseComplete(uuid, apiKey)
    
    // 5. 开始转换
    const convertResponse = await startFileConversion(uuid, apiKey)
    
    if (!convertResponse.success) {
      throw new Error('转换启动失败')
    }

    // 6. 轮询转换状态并获取结果（使用原始的uuid）
    const result = await pollConversionResult(uuid, apiKey)
    
    return {
      success: true,
      data: {
        uuid,
        downloadUrl: result.url,
        networkOptimized: networkInfo.isOverseas ? '使用海外优化策略' : '使用标准上传策略'
      }
    }
  } catch (error) {
    console.error('PDF转Word失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '转换失败'
    }
  }
}

// 网络优化配置
const NETWORK_CONFIG = {
  TIMEOUT: 60000, // 60秒超时
  RETRY_COUNT: 3, // 重试3次
  RETRY_DELAY: 2000, // 重试延迟2秒
  CHUNK_SIZE: 5 * 1024 * 1024, // 5MB分片大小
}

// 检测用户网络环境
async function detectNetworkCondition() {
  const startTime = Date.now()
  try {
    await fetch('https://www.aliyun.com/favicon.ico', { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    })
    const latency = Date.now() - startTime
    return {
      isOverseas: latency > 2000, // 延迟超过2秒认为是海外用户
      latency
    }
  } catch {
    return { isOverseas: true, latency: 9999 }
  }
}

// 获取预上传URL
async function getPreuploadUrl(apiKey: string) {
  console.log('开始获取预上传URL，API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined')
  
  // 检测网络环境
  const networkInfo = await detectNetworkCondition()
  console.log('网络环境检测:', networkInfo)
  
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), NETWORK_CONFIG.TIMEOUT)
  
  try {
    const response = await fetch('https://v2.doc2x.noedgeai.com/api/v2/parse/preupload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    })

    console.log('预上传URL响应状态:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('预上传URL请求失败:', response.status, errorText)
      throw new Error(`获取预上传URL失败: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('预上传URL响应:', result)
    
    if (result.code !== 'success') {
      console.error('预上传URL API返回错误:', result)
      throw new Error(`获取预上传URL失败: ${result.message || '未知错误'}`)
    }
    
    return {
      success: true,
      data: {
        ...result.data,
        networkInfo // 附加网络信息用于后续优化
      }
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

// 智能上传策略：根据文件大小和网络环境选择上传策略
async function uploadFileWithOptimization(file: File, uploadUrl: string, networkInfo: { isOverseas: boolean; latency: number }) {
  const fileSize = file.size
  const isLargeFile = fileSize > NETWORK_CONFIG.CHUNK_SIZE
  const isOverseas = networkInfo.isOverseas
  
  console.log(`文件大小: ${(fileSize / 1024 / 1024).toFixed(2)}MB, 海外用户: ${isOverseas}, 大文件: ${isLargeFile}`)
  
  // 海外用户或大文件使用分片上传
  if (isOverseas || isLargeFile) {
    return uploadFileWithRetry(file, uploadUrl, {
      retryCount: isOverseas ? 5 : NETWORK_CONFIG.RETRY_COUNT,
      timeout: isOverseas ? 120000 : NETWORK_CONFIG.TIMEOUT,
      chunkUpload: isLargeFile
    })
  } else {
    // 国内用户小文件直接上传
    return uploadFileWithRetry(file, uploadUrl, {
      retryCount: NETWORK_CONFIG.RETRY_COUNT,
      timeout: NETWORK_CONFIG.TIMEOUT,
      chunkUpload: false
    })
  }
}

// 带重试机制的上传函数
async function uploadFileWithRetry(file: File, uploadUrl: string, options: {
  retryCount: number
  timeout: number
  chunkUpload: boolean
}) {
  let lastError: Error | null = null
  
  for (let i = 0; i <= options.retryCount; i++) {
    try {
      console.log(`尝试上传 ${i + 1}/${options.retryCount + 1}`)
      
      if (options.chunkUpload) {
        return await uploadFileInChunks(file, uploadUrl, options.timeout)
      } else {
        return await uploadFileDirect(file, uploadUrl, options.timeout)
      }
      
    } catch (error) {
      lastError = error as Error
      console.error(`上传尝试 ${i + 1} 失败:`, error)
      
      // 最后一次尝试失败，直接抛出错误
      if (i === options.retryCount) {
        throw lastError
      }
      
      // 等待一段时间后重试，逐次增加延迟
      const delay = NETWORK_CONFIG.RETRY_DELAY * Math.pow(2, i)
      console.log(`等待 ${delay}ms 后重试...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError || new Error('上传失败')
}

// 直接上传
async function uploadFileDirect(file: File, uploadUrl: string, timeout: number) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(uploadUrl, {
      method: 'PUT', // 阿里云OSS使用PUT方法
      body: file, // 直接传文件内容
      signal: controller.signal,
      headers: {
        'Content-Type': file.type || 'application/octet-stream'
      }
    })
    
    if (!response.ok) {
      throw new Error(`上传失败: ${response.status} ${response.statusText}`)
    }
    
    console.log('文件上传成功')
    return { success: true }
    
  } finally {
    clearTimeout(timeoutId)
  }
}

// 分片上传（简化版，实际需要根据阿里云OSS的分片上传API调整）
async function uploadFileInChunks(file: File, uploadUrl: string, timeout: number) {
  console.log('开始分片上传...')
  
  // 注意：这里是简化实现，实际需要根据阿里云OSS的分片上传API进行调整
  // 目前先回退到直接上传，但用更长的超时时间
  return uploadFileDirect(file, uploadUrl, timeout * 2)
}

// 等待文件解析完成
async function waitForParseComplete(uuid: string, apiKey: string, maxAttempts = 60) {
  console.log(`开始等待文件解析完成，UUID: ${uuid}`)
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    console.log(`解析状态检查，尝试 ${attempt + 1}/${maxAttempts}`)
    
    const response = await fetch(`https://v2.doc2x.noedgeai.com/api/v2/parse/status?uid=${uuid}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    if (!response.ok) {
      console.error(`解析状态查询失败: ${response.status}`)
      throw new Error(`状态查询失败: ${response.status}`)
    }

    const result = await response.json()
    console.log(`解析状态响应:`, result)
    
    if (result.code !== 'success') {
      console.error('解析状态API返回错误:', result)
      throw new Error(`状态查询失败: ${result.message || '未知错误'}`)
    }
    
    const status = result.data?.status
    console.log(`当前解析状态: ${status}`)
    
    if (status === 'success') {
      console.log('文件解析完成')
      return result.data
    } else if (status === 'failed') {
      console.error('文件解析失败')
      throw new Error('文件解析失败')
    }
    
    // 等待2秒后重试
    console.log('等待2秒后重试...')
    await new Promise(resolve => setTimeout(resolve, 2000))
  }
  
  console.error('文件解析超时')
  throw new Error('文件解析超时')
}

// 开始文件转换
async function startFileConversion(uuid: string, apiKey: string) {
  const requestBody = {
    uid: uuid,
    to: 'docx',
    formula_mode: 'normal'
  }
  
  console.log('开始文件转换，请求参数:', requestBody)
  console.log('API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined')
  
  const response = await fetch('https://v2.doc2x.noedgeai.com/api/v2/convert/parse', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  console.log('文件转换响应状态:', response.status)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('文件转换请求失败:', response.status, errorText)
    throw new Error(`转换启动失败: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  console.log('文件转换响应:', result)
  
  if (result.code !== 'success') {
    console.error('文件转换API返回错误:', result)
    throw new Error(`转换启动失败: ${result.message || '未知错误'}`)
  }
  
  return {
    success: true,
    data: result.data
  }
}

async function pollConversionResult(convertUid: string, apiKey: string, maxAttempts = 60) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetch(`https://v2.doc2x.noedgeai.com/api/v2/convert/parse/result?uid=${convertUid}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })

      if (!response.ok) {
        throw new Error(`转换结果查询失败: ${response.status}`)
      }

      const result = await response.json()
      
      if (result.code !== 'success') {
        throw new Error(`转换结果查询失败: ${result.message || '未知错误'}`)
      }
      
      const status = result.data?.status
      
      if (status === 'success') {
        return result.data
      } else if (status === 'failed') {
        throw new Error('转换失败')
      }
      
      // 等待3秒后重试
      await new Promise(resolve => setTimeout(resolve, 3000))
    } catch (error) {
      if (attempt === maxAttempts - 1) {
        throw error
      }
      // 等待3秒后重试
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }
  
  throw new Error('转换超时')
}