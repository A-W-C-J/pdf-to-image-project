import { type NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { topic, language } = await request.json()

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

    const prompt = `你是一位专业的博客写作专家，精通SEO优化。请根据以下要求创作一篇博客文章：

主题：${topic}
语言：${language}

请生成以下内容：
1. 一个吸引人的标题（适合SEO）
2. 一个简洁的摘要（100-150字）
3. 详细的文章内容（至少1000字，包含小标题、代码示例等）
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
                  try {
                    let blogData
                    try {
                      // 提取JSON部分（可能包含在代码块中）
                      const jsonMatch = accumulatedContent.match(/```json\n([\s\S]*?)\n```/) || accumulatedContent.match(/\{[\s\S]*\}/)
                      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : accumulatedContent
                      blogData = JSON.parse(jsonString)
                    } catch (parseError) {
                      // 如果解析失败，尝试从文本中提取信息
                      console.error("JSON解析失败，尝试文本解析:", parseError)
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
                  } catch (error) {
                    controller.enqueue(`data: ${JSON.stringify({ type: "error", message: "内容解析失败" })}\n\n`)
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
                } catch (e) {
                  // 忽略解析错误，继续处理下一行
                }
              }
            }
          }
        } catch (error: any) {
          console.error("流式生成错误:", error)
          controller.enqueue(`data: ${JSON.stringify({ type: "error", message: error.message || "AI生成失败" })}\n\n`)
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
  } catch (error: any) {
    console.error("AI生成错误:", error)
    return new Response(JSON.stringify({ error: error.message || "AI生成失败" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    })
  }
}
