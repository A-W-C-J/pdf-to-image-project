import { type NextRequest } from 'next/server'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
// 移除 pdfjs-dist 导入以避免服务器端兼容性问题

export async function POST(request: NextRequest) {
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
    const pageCountParam = formData.get('pageCount') as string

    if (!file) {
  
      return new Response(JSON.stringify({ error: '请选择PDF文件' }), {
        status: 400,
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

    // 使用客户端传递的页数，如果没有则使用文件大小估算
    let pdfPageCount = 1
    if (pageCountParam && !isNaN(parseInt(pageCountParam))) {
      pdfPageCount = parseInt(pageCountParam)
      console.log('使用客户端传递的页数:', pdfPageCount)
    } else {
      // 如果客户端没有传递页数，使用文件大小估算作为备用方案
      const fileSizeKB = file.size / 1024
      if (fileSizeKB < 500) {
        pdfPageCount = Math.max(1, Math.round(fileSizeKB / 50))
      } else if (fileSizeKB < 2000) {
        pdfPageCount = Math.max(1, Math.round(fileSizeKB / 80))
      } else {
        pdfPageCount = Math.max(1, Math.round(fileSizeKB / 120))
      }
      console.log('使用文件大小估算页数:', pdfPageCount)
    }

    const bytes = await file.arrayBuffer()
    
    // 检查用户剩余额度
    const { data: quotaData, error: quotaError } = await supabase
      .rpc('get_user_quota', { p_user_id: user.id })
    
    if (quotaError) {
      console.error('获取用户额度失败:', quotaError)
      return new Response(JSON.stringify({ 
        error: '获取用户额度失败',
        code: 'QUOTA_CHECK_FAILED'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // quotaData是数组，如果用户没有额度记录则为空数组
    // 取第一条记录的remaining_quota，如果没有记录则默认为0
    const remainingQuota = quotaData && quotaData.length > 0 ? quotaData[0].remaining_quota : 0
    
    if (remainingQuota < pdfPageCount) {
      return new Response(JSON.stringify({ 
        error: `额度不足！当前剩余额度：${remainingQuota}页，需要：${pdfPageCount}页。请前往充值。`,
        code: 'INSUFFICIENT_QUOTA',
        data: {
          required: pdfPageCount,
          remaining: remainingQuota,
          shortfall: pdfPageCount - remainingQuota
        }
      }), {
        status: 402, // Payment Required
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
      const buffer = new Uint8Array(bytes)
      await writeFile(tempFilePath, buffer)

      // 调用DOC2X API进行转换
      const convertResult = await convertPdfToWord(tempFilePath, apiKey)
      
      // 如果转换成功，扣除相应额度
      if (convertResult.success) {
        const { error: consumeError } = await supabase
          .rpc('consume_user_quota', { 
            p_user_id: user.id, 
            p_pages_count: pdfPageCount 
          })
        
        if (consumeError) {
          console.error('扣除用户额度失败:', consumeError)
          // 注意：这里转换已经成功，但额度扣除失败
          // 可以选择记录日志但仍然返回成功结果
        }
      }
      
      return new Response(JSON.stringify({
        ...convertResult,
        pagesProcessed: pdfPageCount,
        quotaConsumed: convertResult.success ? pdfPageCount : 0
      }), {
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
    return new Response(JSON.stringify({ error: '服务器内部错误' }), {
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
    // 1. 获取预上传URL
    const preuploadResponse = await getPreuploadUrl(apiKey) as Doc2XResponse
    
    if (!preuploadResponse.success || !preuploadResponse.data?.uid || !preuploadResponse.data?.url) {
      throw new Error('获取上传URL失败')
    }
    
    const { uid: uuid, url: uploadUrl } = preuploadResponse.data

    if (!uploadUrl) {
      throw new Error('上传URL获取失败')
    }

    // 2. 上传文件到获取的URL
    await uploadFileToUrl(filePath, uploadUrl)
    
    // 3. 等待文件解析完成
    await waitForParseComplete(uuid, apiKey)
    
    // 4. 开始转换
    const convertResponse = await startFileConversion(uuid, apiKey)
    
    if (!convertResponse.success) {
      throw new Error('转换启动失败')
    }

    // 5. 轮询转换状态并获取结果（使用原始的uuid）
    const result = await pollConversionResult(uuid, apiKey)
    
    return {
      success: true,
      data: {
        uuid,
        downloadUrl: result.url
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

// 获取预上传URL
async function getPreuploadUrl(apiKey: string) {
  console.log('开始获取预上传URL，API Key:', apiKey ? `${apiKey.substring(0, 10)}...` : 'undefined')
  
  const response = await fetch('https://v2.doc2x.noedgeai.com/api/v2/parse/preupload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
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
    data: result.data
  }
}

// 上传文件到指定URL
async function uploadFileToUrl(filePath: string, uploadUrl: string) {
  const fs = await import('fs')
  const fileBuffer = await fs.promises.readFile(filePath)
  
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: fileBuffer
  })
  
  if (!response.ok) {
    throw new Error(`文件上传失败: ${response.status}`)
  }
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