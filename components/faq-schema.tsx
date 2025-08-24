"use client"

import { useState, useEffect } from "react"

interface FAQItem {
  question: string
  answer: string
}

interface FAQSchemaProps {
  faqs?: FAQItem[]
  language?: 'zh' | 'en'
}

export default function FAQSchema({ faqs, language: propLanguage }: FAQSchemaProps) {
  const [language, setLanguage] = useState<'zh' | 'en'>('en')

  useEffect(() => {
    if (propLanguage) {
      setLanguage(propLanguage)
    } else {
      // 从localStorage获取语言设置
      const savedLanguage = localStorage.getItem('language') as 'zh' | 'en'
      if (savedLanguage) {
        setLanguage(savedLanguage)
      }
    }
  }, [propLanguage])

  // 默认FAQ数据
  const defaultFAQs: Record<string, FAQItem[]> = {
    zh: [
      {
        question: "PDF转图片工具是否免费使用？",
        answer: "是的，我们的PDF转图片工具完全免费使用，无需注册账户，无使用次数限制。"
      },
      {
        question: "支持哪些输出格式？",
        answer: "我们支持PNG、JPEG、GIF、TIFF、BMP等多种图片格式输出，满足不同需求。"
      },
      {
        question: "是否支持批量处理？",
        answer: "是的，我们支持批量处理多个PDF文件，大大提高工作效率。"
      },
      {
        question: "文件安全性如何保障？",
        answer: "所有处理都在您的浏览器中进行，文件不会上传到服务器，完全保护您的隐私安全。"
      },
      {
        question: "是否支持OCR文字识别？",
        answer: "是的，我们提供OCR文字识别功能，可以提取PDF中的文字内容，支持中英文识别。"
      },
      {
        question: "可以添加水印吗？",
        answer: "可以，我们支持添加自定义文字水印，可以设置位置、透明度等参数。"
      }
    ],
    en: [
      {
        question: "Is the PDF to image converter free to use?",
        answer: "Yes, our PDF to image converter is completely free to use, no registration required, and no usage limits."
      },
      {
        question: "What output formats are supported?",
        answer: "We support multiple image formats including PNG, JPEG, GIF, TIFF, BMP to meet different needs."
      },
      {
        question: "Does it support batch processing?",
        answer: "Yes, we support batch processing of multiple PDF files, greatly improving work efficiency."
      },
      {
        question: "How is file security ensured?",
        answer: "All processing is done in your browser, files are not uploaded to servers, completely protecting your privacy."
      },
      {
        question: "Does it support OCR text recognition?",
        answer: "Yes, we provide OCR text recognition functionality to extract text content from PDFs, supporting both Chinese and English."
      },
      {
        question: "Can I add watermarks?",
        answer: "Yes, we support adding custom text watermarks with configurable position, opacity and other parameters."
      }
    ]
  }

  const faqData = faqs || defaultFAQs[language] || defaultFAQs.en

  // 生成FAQ结构化数据
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  )
}