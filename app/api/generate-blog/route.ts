import { type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { topic, language, generateTopicOnly } = await request.json()

    if (!topic) {
      return new Response(JSON.stringify({ error: "请提供创作主题" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "DeepSeek API密钥未配置" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      })
    }

    const prompt = generateTopicOnly 
      ? `你是一位专业的SEO博客写作专家，负责为https://www.pdf2img.top/生成博客主题。请根据以下网站特性生成一个有价值的、教程向的、利他的博客主题：

网站核心功能：
• PDF转DOCX、MD、TEX等多种格式
• PDF转PNG、JPEG、TIFF、GIF、WEBP等多种格式
• 批量文档转换
• 文档合并
• 文档分割
• OCR文字识别技术
• AI智能文档总结
• 文档水印和安全保护
• GIF动画生成
• 可搜索PDF创建
• 页面合并和分割
• 密码保护和权限管理

请生成一个与以上功能相关的、教程向的、利他的博客主题，要求：
1. 适合SEO优化，能吸引目标用户
2. 语言：${language === 'zh' ? '中文' : '英文'}

只返回主题标题，不要其他内容。

参考方向：${topic}` // 使用网站相关的提示词生成主题
      : `你是一位专业的博客写作专家，精通SEO优化，当前负责对https://www.pdf2img.top/进行博文创作以求长尾词SEO优化，该网站的核心特性为：
• PDF转DOCX、MD、TEX等多种格式
• PDF转PNG、JPEG、TIFF、GIF、WEBP等多种格式
• 批量转换
• OCR文字识别
• AI智能总结
• 水印支持
• 多格式输出
• GIF动画生成
• 可搜索PDF生成
• 页面合并
• 密码保护支持。
请根据以下要求创作一篇博客文章：

主题：${topic}
语言：${language}

请生成以下内容：
1. 一个吸引人的标题（适合SEO）
2. 一个简洁的摘要（100-150字）
3. 详细的文章内容（至少1000字，包含小标题）
4. 5-8个相关标签
5. 8-12个SEO关键词

请以JSON格式返回，只能包含以下字段：
- title: 文章标题
- excerpt: 文章摘要
- content: 文章内容，Markdown格式
- tags: 标签数组
- seo_keywords: SEO关键词数组

确保内容专业、有价值，并且针对搜索引擎优化。`

    // 创建流式响应
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages: [
                {
                  role: "user",
                  content: prompt,
                },
              ],
              temperature: 0.7,
              max_tokens: 4000,
              stream: true, // 启用流式输出
            }),
          })

          if (!response.ok) {
            throw new Error(`DeepSeek API错误: ${response.status}`)
          }

          const reader = response.body?.getReader()
          if (!reader) {
            throw new Error("无法获取响应流")
          }

          let accumulatedContent = ""
          const decoder = new TextDecoder()

          // 发送开始事件
          controller.enqueue(`data: ${JSON.stringify({ type: "start", message: "开始生成内容..." })}\n\n`)

          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const chunk = decoder.decode(value, { stream: true })
            const lines = chunk.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6)
                if (data === '[DONE]') {
                  // 流结束，处理完整内容
                  if (generateTopicOnly) {
                    // 仅生成主题时，直接返回清理后的文本
                    const cleanTopic = accumulatedContent.trim().replace(/^["']|["']$/g, '').split('\n')[0]
                    controller.enqueue(`data: ${JSON.stringify({ type: "complete", topic: cleanTopic })}\n\n`)
                  } else {
                    // 生成完整博客时，解析JSON
                    try {
                      let blogData
                      try {
                        // 提取JSON部分（可能包含在代码块中）
                        const jsonMatch = accumulatedContent.match(/```json\n([\s\S]*?)\n```/) || accumulatedContent.match(/\{[\s\S]*\}/)
                        const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : accumulatedContent
                        blogData = JSON.parse(jsonString)
                      } catch (parseError) {
                        // 如果解析失败，尝试从文本中提取信息
                        // JSON解析失败，尝试文本解析
                        blogData = {
                          title: `${topic}完整指南`,
                          excerpt: `关于${topic}的专业介绍和实践指南，涵盖核心概念、最佳实践和实际应用案例。`,
                          content: accumulatedContent,
                          tags: [topic, "技术", "教程", "最佳实践"],
                          seo_keywords: [`${topic}教程`, `${topic}指南`, `${topic}最佳实践`, "技术文档"],
                        }
                      }

                      // 确保数组字段存在
                      blogData.tags = Array.isArray(blogData.tags) ? blogData.tags : []
                      blogData.seo_keywords = Array.isArray(blogData.seo_keywords) ? blogData.seo_keywords : []

                      // 发送完成事件
                      controller.enqueue(`data: ${JSON.stringify({ type: "complete", data: blogData })}\n\n`)
                    } catch {
                      controller.enqueue(`data: ${JSON.stringify({ type: "error", message: "内容解析失败" })}\n\n`)
                    }
                  }
                  controller.close()
                  return
                }

                try {
                  const parsed = JSON.parse(data)
                  const content = parsed.choices?.[0]?.delta?.content
                  if (content) {
                    accumulatedContent += content
                    // 发送流式内容
                    controller.enqueue(`data: ${JSON.stringify({ type: "content", content: content })}\n\n`)
                  }
                } catch {
                  // 忽略解析错误，继续处理下一行
                }
              }
            }
          }
        } catch (error: unknown) {
          // 流式生成错误
          controller.enqueue(`data: ${JSON.stringify({ type: "error", message: error instanceof Error ? error.message : "AI生成失败" })}\n\n`)
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })
  } catch (error: unknown) {
    // AI生成错误
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "AI生成失败" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
