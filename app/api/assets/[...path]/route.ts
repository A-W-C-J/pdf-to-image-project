import { type NextRequest } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import { existsSync } from 'fs'

// 处理图片资源请求
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path
    
    if (!path || path.length === 0) {
      return new Response('路径参数缺失', { status: 400 })
    }
    
    // 构建文件路径
    const filePath = join(tmpdir(), 'pdf-assets', ...path)
    
    // 检查文件是否存在
    if (!existsSync(filePath)) {
      return new Response('文件不存在', { status: 404 })
    }
    
    // 读取文件
    const fileBuffer = await readFile(filePath)
    
    // 根据文件扩展名设置Content-Type
    const ext = path[path.length - 1].split('.').pop()?.toLowerCase()
    let contentType = 'application/octet-stream'
    
    switch (ext) {
      case 'png':
        contentType = 'image/png'
        break
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg'
        break
      case 'gif':
        contentType = 'image/gif'
        break
      case 'svg':
        contentType = 'image/svg+xml'
        break
      case 'webp':
        contentType = 'image/webp'
        break
      default:
        contentType = 'application/octet-stream'
    }
    
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600' // 缓存1小时
      }
    })
  } catch (error) {
    // 读取资源文件失败
    return new Response('服务器内部错误', { status: 500 })
  }
}