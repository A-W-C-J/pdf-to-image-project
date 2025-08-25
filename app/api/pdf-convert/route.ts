import { type NextRequest } from 'next/server'
import { writeFile, unlink, mkdir } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { randomUUID } from 'crypto'
import { existsSync } from 'fs'
import AdmZip from 'adm-zip'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: '请先登录后再使用PDF转换功能',
        code: 'UNAUTHORIZED'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const format = formData.get('format') as string || 'docx'
    const formulaMode = formData.get('formulaMode') as string || 'normal'

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

    // 验证格式参数
    const supportedFormats = ['docx', 'md', 'tex']
    if (!supportedFormats.includes(format)) {
      return new Response(JSON.stringify({ error: `不支持的格式: ${format}。支持的格式: ${supportedFormats.join(', ')}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 验证公式模式参数
    const supportedFormulaModes = ['normal', 'dollar']
    if (!supportedFormulaModes.includes(formulaMode)) {
      return new Response(JSON.stringify({ error: `不支持的公式模式: ${formulaMode}。支持的模式: ${supportedFormulaModes.join(', ')}` }), {
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
      const buffer = Buffer.from(bytes)
      await writeFile(tempFilePath, buffer)

      // 调用转换函数
      const result = await convertPdfToFile(tempFilePath, apiKey, format, formulaMode)
      
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    } finally {
      // 清理临时文件
      try {
        await unlink(tempFilePath)
      } catch (error) {
        console.warn('清理临时文件失败:', error)
      }
    }
  } catch (error) {
    console.error('PDF转换错误:', error)
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : '转换失败，请稍后重试' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}



async function convertPdfToFile(filePath: string, apiKey: string, format: string, formulaMode: string) {
  try {
    // 1. 获取预上传URL
    const preuploadData = await getPreuploadUrl(apiKey)
    const { url: uploadUrl, uid: uuid } = preuploadData
    
    console.log('获取到预上传URL和UUID:', { uploadUrl: uploadUrl ? 'OK' : 'MISSING', uuid })
    
    // 2. 上传文件
    await uploadFileToUrl(filePath, uploadUrl)
    console.log('文件上传完成')
    
    // 3. 等待解析完成
    await waitForParseComplete(uuid, apiKey)
    console.log('文件解析完成')
    
    // 4. 启动转换
    await startFileConversion(uuid, apiKey, format, formulaMode)
    console.log('转换启动成功')
    
    // 5. 轮询转换结果
    const finalResult = await pollConversionResult(uuid, apiKey)
    console.log('转换完成，获取到最终结果')
    
    // 6. 如果是MD、TEX或DOCX格式，需要下载并解压压缩包提取内容
    if ((format === 'md' || format === 'tex' || format === 'docx') && finalResult.url) {
      try {
        let content
        if (format === 'md') {
          content = await extractMarkdownFromZip(finalResult.url, uuid)
        } else if (format === 'tex') {
          content = await extractTexFromZip(finalResult.url, uuid)
        } else if (format === 'docx') {
          content = await extractDocxFromZip(finalResult.url, uuid)
        }
        return {
          success: true,
          data: {
            downloadUrl: finalResult.url,
            format: format,
            formulaMode: formulaMode,
            uuid: uuid,
            previewContent: content
          }
        }
      } catch (error) {
        console.error(`提取${format.toUpperCase()}内容失败:`, error)
        // 如果提取失败，仍然返回下载URL
      }
    }
    
    return {
      success: true,
      data: {
        downloadUrl: finalResult.url,
        format: format,
        formulaMode: formulaMode,
        uuid: uuid
      }
    }
  } catch (error) {
    console.error('PDF转换过程中出错:', error)
    throw error
  }
}

async function getPreuploadUrl(apiKey: string) {
  console.log('正在获取预上传URL...')
  
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
    console.error('获取预上传URL失败:', response.status, errorText)
    throw new Error(`获取预上传URL失败: ${response.status} - ${errorText}`)
  }

  const result = await response.json()
  console.log('预上传URL响应:', result)
  
  if (result.code !== 'success') {
    console.error('预上传URL API返回错误:', result)
    throw new Error(`获取预上传URL失败: ${result.message || '未知错误'}`)
  }
  
  return result.data
}

async function uploadFileToUrl(filePath: string, uploadUrl: string) {
  console.log('正在上传文件到:', uploadUrl)
  
  const fs = await import('fs')
  const fileStream = fs.createReadStream(filePath)
  
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    body: fileStream as unknown as ReadableStream,
    duplex: 'half'
  } as RequestInit)
  
  console.log('文件上传响应状态:', response.status)
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('文件上传失败:', response.status, errorText)
    throw new Error(`文件上传失败: ${response.status} - ${errorText}`)
  }
}

async function waitForParseComplete(uuid: string, apiKey: string, maxAttempts = 60) {
  console.log('等待文件解析完成，UUID:', uuid)
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`检查解析状态，第 ${attempt}/${maxAttempts} 次尝试`)
    
    const response = await fetch(`https://v2.doc2x.noedgeai.com/api/v2/parse/status?uid=${uuid}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('检查解析状态失败:', response.status, errorText)
      throw new Error(`检查解析状态失败: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('解析状态响应:', result)
    
    if (result.code !== 'success') {
      console.error('解析状态API返回错误:', result)
      throw new Error(`检查解析状态失败: ${result.message || '未知错误'}`)
    }
    
    const status = result.data?.status
    
    if (status === 'success') {
      console.log('文件解析成功完成')
      return result.data
    } else if (status === 'failed') {
      console.error('文件解析失败:', result.data)
      throw new Error(`文件解析失败: ${result.data?.detail || '未知错误'}`)
    } else if (status === 'processing') {
      const progress = result.data?.progress || 0
      console.log(`文件解析中，进度: ${progress}%`)
      
      // 等待3秒后重试
      await new Promise(resolve => setTimeout(resolve, 3000))
    } else {
      console.warn('未知的解析状态:', status)
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }
  
  throw new Error(`文件解析超时，已尝试 ${maxAttempts} 次`)
}

async function startFileConversion(uuid: string, apiKey: string, format: string, formulaMode: string) {
  const requestBody = {
    uid: uuid,
    to: format,
    formula_mode: formulaMode
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
  console.log('开始轮询转换结果，UID:', convertUid)
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`检查转换状态，第 ${attempt}/${maxAttempts} 次尝试`)
    
    const response = await fetch(`https://v2.doc2x.noedgeai.com/api/v2/convert/parse/result?uid=${convertUid}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('检查转换状态失败:', response.status, errorText)
      throw new Error(`检查转换状态失败: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('转换状态响应:', result)
    
    if (result.code !== 'success') {
      console.error('转换状态API返回错误:', result)
      throw new Error(`检查转换状态失败: ${result.message || '未知错误'}`)
    }
    
    const status = result.data?.status
    
    if (status === 'success') {
      console.log('文件转换成功完成')
      return result.data
    } else if (status === 'failed') {
      console.error('文件转换失败:', result.data)
      throw new Error(`文件转换失败: ${result.data?.detail || '未知错误'}`)
    } else if (status === 'processing') {
      console.log('文件转换中...')
      
      // 等待3秒后重试
      await new Promise(resolve => setTimeout(resolve, 3000))
    } else {
      console.warn('未知的转换状态:', status)
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }
  
  throw new Error(`文件转换超时，已尝试 ${maxAttempts} 次`)
}

// 处理图片资源的解压和管理
async function extractAssetsFromZip(zipUrl: string, uuid: string): Promise<{ assetUrls: Map<string, string>, extractDir: string }> {
  const tempDir = tmpdir()
  const zipPath = join(tempDir, `temp_${randomUUID()}.zip`)
  const extractDir = join(tempDir, 'pdf-assets', uuid)
  const assetUrls = new Map<string, string>()
  
  try {
    // 下载压缩包
    const response = await fetch(zipUrl)
    if (!response.ok) {
      throw new Error(`下载压缩包失败: ${response.status}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    await writeFile(zipPath, Buffer.from(arrayBuffer))
    
    // 创建解压目录
    if (!existsSync(extractDir)) {
      await mkdir(extractDir, { recursive: true })
    }
    
    // 解压所有文件
    const zip = new AdmZip(zipPath)
    const entries = zip.getEntries()
    
    console.log('压缩包中的文件:', entries.map(entry => entry.entryName))
    
    // 解压所有文件并记录图片资源
    for (const entry of entries) {
      if (!entry.isDirectory) {
        const entryPath = join(extractDir, entry.entryName)
        const entryDir = join(extractDir, entry.entryName.split('/').slice(0, -1).join('/'))
        
        // 创建目录结构
        if (!existsSync(entryDir)) {
          await mkdir(entryDir, { recursive: true })
        }
        
        // 写入文件
        await writeFile(entryPath, entry.getData())
        
        // 如果是图片文件，记录URL映射
        const fileName = entry.entryName.toLowerCase()
        if (fileName.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) {
          const assetUrl = `/api/assets/${uuid}/${entry.entryName}`
          assetUrls.set(entry.entryName, assetUrl)
          console.log('注册图片资源:', entry.entryName, '->', assetUrl)
        }
      }
    }
    
    return { assetUrls, extractDir }
    
  } catch (error) {
    console.error('解压资源文件时出错:', error)
    throw error
  } finally {
    // 清理临时压缩包
    try {
      await unlink(zipPath)
    } catch (cleanupError) {
      console.warn('清理临时压缩包失败:', cleanupError)
    }
  }
}

async function extractMarkdownFromZip(zipUrl: string, uuid: string): Promise<string> {
  try {
    console.log('开始处理Markdown压缩包:', zipUrl)
    
    // 解压所有资源文件
    const { assetUrls } = await extractAssetsFromZip(zipUrl, uuid)
    
    // 查找Markdown文件
    const zip = new AdmZip(Buffer.from(await (await fetch(zipUrl)).arrayBuffer()))
    const entries = zip.getEntries()
    
    const markdownEntry = entries.find(entry => 
      entry.entryName === 'output.md' || 
      entry.entryName.endsWith('/output.md') ||
      entry.entryName.endsWith('.md')
    )
    
    if (!markdownEntry) {
      throw new Error('在压缩包中未找到Markdown文件')
    }
    
    console.log('找到Markdown文件:', markdownEntry.entryName)
    
    // 读取Markdown内容
    let content = markdownEntry.getData().toString('utf8')
    console.log('Markdown内容长度:', content.length)
    
    // 替换图片路径为API URL
    for (const [originalPath, assetUrl] of assetUrls) {
      // 处理各种可能的图片引用格式
      const patterns = [
        new RegExp(`!\\[([^\\]]*)\\]\\(${originalPath.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\)`, 'g'),
        new RegExp(`!\\[([^\\]]*)\\]\\(\\./${originalPath.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\)`, 'g'),
        new RegExp(`src="${originalPath.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}"`, 'g'),
        new RegExp(`src="\\./${originalPath.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}"`, 'g')
      ]
      
      patterns.forEach(pattern => {
        if (pattern.source.includes('!\\[')) {
          content = content.replace(pattern, `![$1](${assetUrl})`)
        } else {
          content = content.replace(pattern, `src="${assetUrl}"`)
        }
      })
    }
    
    console.log('图片路径替换完成，处理了', assetUrls.size, '个图片资源')
    
    return content
    
  } catch (error) {
    console.error('解压Markdown文件时出错:', error)
    throw error
  }
}

async function extractTexFromZip(zipUrl: string, uuid: string): Promise<string> {
  try {
    console.log('开始处理TEX压缩包:', zipUrl)
    
    // 解压所有资源文件
    const { assetUrls } = await extractAssetsFromZip(zipUrl, uuid)
    
    // 查找TEX文件
    const zip = new AdmZip(Buffer.from(await (await fetch(zipUrl)).arrayBuffer()))
    const entries = zip.getEntries()
    
    console.log('压缩包中的文件:', entries.map(entry => entry.entryName))
    
    // 查找.tex文件（可能是output.tex或其他.tex文件）
    const texEntry = entries.find(entry => 
      entry.entryName === 'output.tex' || 
      entry.entryName.endsWith('/output.tex') ||
      entry.entryName.endsWith('.tex')
    )
    
    if (!texEntry) {
      throw new Error('在压缩包中未找到TEX文件')
    }
    
    console.log('找到TEX文件:', texEntry.entryName)
    
    // 读取TEX内容
    let content = texEntry.getData().toString('utf8')
    console.log('TEX内容长度:', content.length)
    
    // 替换图片路径为API URL
    for (const [originalPath, assetUrl] of assetUrls) {
      // 处理LaTeX中的图片引用格式
      const patterns = [
        // \includegraphics{path}
        new RegExp(`\\\\includegraphics(\\[[^\\]]*\\])?\\{${originalPath.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\}`, 'g'),
        // \includegraphics{./path}
        new RegExp(`\\\\includegraphics(\\[[^\\]]*\\])?\\{\\./${originalPath.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}\\}`, 'g'),
        // \graphicspath or other direct references
        new RegExp(`${originalPath.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&')}`, 'g')
      ]
      
      patterns.forEach((pattern, index) => {
        if (index < 2) {
          // For \includegraphics commands, replace with the asset URL
          content = content.replace(pattern, (match, options) => {
            return `\\includegraphics${options || ''}{${assetUrl}}`
          })
        } else {
          // For direct path references, be more careful to avoid false positives
          const lines = content.split('\n')
          content = lines.map(line => {
            if (line.includes('\\includegraphics') || line.includes('\\graphicspath')) {
              return line.replace(pattern, assetUrl)
            }
            return line
          }).join('\n')
        }
      })
    }
    
    console.log('TEX图片路径替换完成，处理了', assetUrls.size, '个图片资源')
    
    return content
    
  } catch (error) {
    console.error('解压TEX文件时出错:', error)
    throw error
  }
}

// 清理过期的资源文件（超过24小时的文件）
async function cleanupExpiredAssets() {
  try {
    const assetsDir = join(tmpdir(), 'pdf-assets')
    if (!existsSync(assetsDir)) {
      return
    }
    
    const { readdir, stat, rm } = await import('fs/promises')
    const entries = await readdir(assetsDir)
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24小时
    
    for (const entry of entries) {
      const entryPath = join(assetsDir, entry)
      try {
        const stats = await stat(entryPath)
        if (now - stats.mtime.getTime() > maxAge) {
          await rm(entryPath, { recursive: true, force: true })
          console.log('清理过期资源目录:', entry)
        }
      } catch (error) {
        console.warn('清理资源目录失败:', entry, error)
      }
    }
  } catch (error) {
    console.warn('清理过期资源时出错:', error)
  }
}

// 从ZIP文件中提取DOCX内容
async function extractDocxFromZip(zipUrl: string, uuid: string): Promise<ArrayBuffer> {
  console.log('开始从ZIP文件提取DOCX内容:', zipUrl)
  
  try {
    // 1. 下载ZIP文件
    const response = await fetch(zipUrl)
    if (!response.ok) {
      throw new Error(`下载ZIP文件失败: ${response.status}`)
    }
    
    const zipBuffer = await response.arrayBuffer()
    const zip = new AdmZip(Buffer.from(zipBuffer))
    
    // 2. 查找DOCX文件
    const entries = zip.getEntries()
    const docxEntry = entries.find(entry => 
      entry.entryName.toLowerCase().endsWith('.docx') && 
      !entry.entryName.startsWith('__MACOSX/')
    )
    
    if (!docxEntry) {
      throw new Error('ZIP文件中未找到DOCX文件')
    }
    
    console.log('找到DOCX文件:', docxEntry.entryName)
    
    // 3. 提取DOCX文件内容
    const docxBuffer = docxEntry.getData()
    
    // 4. 解压所有资源文件（图片等）
    await extractAssetsFromZip(zipUrl, uuid)
    
    console.log('DOCX内容提取完成')
    return docxBuffer.buffer.slice(docxBuffer.byteOffset, docxBuffer.byteOffset + docxBuffer.byteLength)
    
  } catch (error) {
    console.error('提取DOCX内容失败:', error)
    throw new Error(`提取DOCX内容失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

// 在每次处理请求时执行清理（异步，不阻塞主流程）
setImmediate(() => {
  cleanupExpiredAssets().catch(error => {
    console.warn('后台清理任务失败:', error)
  })
})