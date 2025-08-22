import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { topic, language } = await request.json()

    if (!topic) {
      return NextResponse.json({ error: "请提供创作主题" }, { status: 400 })
    }

    const apiKey = process.env.DEEPSEEK_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: "DeepSeek API密钥未配置" }, { status: 500 })
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

请以JSON格式返回，包含以下字段：
- title: 文章标题
- excerpt: 文章摘要
- content: 文章内容（支持Markdown格式）
- tags: 标签数组
- seo_keywords: SEO关键词数组

确保内容专业、有价值，并且针对搜索引擎优化。`

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
      }),
    })

    if (!response.ok) {
      throw new Error(`DeepSeek API错误: ${response.status}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content

    if (!content) {
      throw new Error("DeepSeek返回内容为空")
    }

    // 尝试解析JSON响应
    let blogData
    try {
      // 提取JSON部分（可能包含在代码块中）
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || content.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content
      blogData = JSON.parse(jsonString)
    } catch (parseError) {
      // 如果解析失败，尝试从文本中提取信息
      console.error("JSON解析失败，尝试文本解析:", parseError)

      // 简单的文本解析作为后备方案
      const lines = content.split("\n")
      blogData = {
        title: `${topic}完整指南`,
        excerpt: `关于${topic}的专业介绍和实践指南，涵盖核心概念、最佳实践和实际应用案例。`,
        content: content,
        tags: [topic, "技术", "教程", "最佳实践"],
        seo_keywords: [`${topic}教程`, `${topic}指南`, `${topic}最佳实践`, "技术文档"],
      }
    }

    // 验证必要字段
    if (!blogData.title || !blogData.content) {
      throw new Error("生成的内容缺少必要字段")
    }

    // 确保数组字段存在
    blogData.tags = Array.isArray(blogData.tags) ? blogData.tags : []
    blogData.seo_keywords = Array.isArray(blogData.seo_keywords) ? blogData.seo_keywords : []

    return NextResponse.json(blogData)
  } catch (error: any) {
    console.error("AI生成错误:", error)
    return NextResponse.json({ error: error.message || "AI生成失败" }, { status: 500 })
  }
}
