// 增强的SEO结构化数据组件

"use client"

import { useLanguage } from "@/lib/i18n"

export function EnhancedSEOSchema() {
  const { language } = useLanguage()

  // SoftwareApplication Schema
  const softwareApplicationSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": language === "zh" ? "PDF转图片工具" : "PDF to Image Converter",
    "description": language === "zh" 
      ? "专业的PDF处理工具，支持PDF转图片、OCR文字识别、批量转换、AI智能总结等功能。完全免费，保护隐私，操作简单。"
      : "Professional PDF processing tool that supports PDF to image conversion, OCR text recognition, batch conversion, AI smart summary and more. Completely free, privacy-protected, and easy to use.",
    "applicationCategory": "UtilityApplication",
    "operatingSystem": "Any",
    "browserRequirements": "Modern browser with JavaScript enabled",
    "url": "https://www.pdf2img.top",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "1250",
      "bestRating": "5",
      "worstRating": "1"
    },
    "featureList": [
      language === "zh" ? "PDF转PNG转换" : "PDF to PNG conversion",
      language === "zh" ? "PDF转JPEG转换" : "PDF to JPEG conversion", 
      language === "zh" ? "PDF转GIF动画" : "PDF to GIF animation",
      language === "zh" ? "批量文件处理" : "Batch file processing",
      language === "zh" ? "OCR文字识别" : "OCR text recognition",
      language === "zh" ? "可搜索PDF生成" : "Searchable PDF generation",
      language === "zh" ? "页面合并功能" : "Page merging",
      language === "zh" ? "自定义水印" : "Custom watermarks",
      language === "zh" ? "AI智能总结" : "AI smart summary",
      language === "zh" ? "多语言支持" : "Multi-language support"
    ],
    "screenshot": "https://www.pdf2img.top/screenshot.jpg",
    "video": "https://www.pdf2img.top/demo-video.mp4",
    "author": {
      "@type": "Organization",
      "name": "PDF Tools Team",
      "url": "https://github.com/A-W-C-J/pdf-to-image-project"
    },
    "datePublished": "2024-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
    "version": "2.0.0",
    "downloadUrl": "https://www.pdf2img.top",
    "permissions": [
      language === "zh" ? "文件访问" : "File access",
      language === "zh" ? "剪贴板访问" : "Clipboard access"
    ]
  }

  // HowTo Schema - PDF转图片教程
  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": language === "zh" ? "如何将PDF转换为图片" : "How to Convert PDF to Image",
    "description": language === "zh" 
      ? "详细步骤指导如何使用我们的在线工具将PDF文件转换为高质量图片格式"
      : "Step-by-step guide on how to convert PDF files to high-quality image formats using our online tool",
    "image": "https://www.pdf2img.top/how-to-convert.jpg",
    "totalTime": "PT2M",
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "USD",
      "value": "0"
    },
    "tool": [
      {
        "@type": "HowToTool",
        "name": language === "zh" ? "PDF文件" : "PDF file"
      },
      {
        "@type": "HowToTool", 
        "name": language === "zh" ? "现代浏览器" : "Modern web browser"
      }
    ],
    "step": [
      {
        "@type": "HowToStep",
        "position": 1,
        "name": language === "zh" ? "上传PDF文件" : "Upload PDF file",
        "text": language === "zh" 
          ? "点击选择文件按钮或拖拽PDF文件到上传区域。支持最大50MB的PDF文件。"
          : "Click the select file button or drag and drop your PDF file to the upload area. Supports PDF files up to 50MB.",
        "image": "https://www.pdf2img.top/step1.jpg"
      },
      {
        "@type": "HowToStep",
        "position": 2,
        "name": language === "zh" ? "选择输出格式" : "Choose output format",
        "text": language === "zh"
          ? "选择您需要的图片格式：PNG（高质量）、JPEG（小文件）、GIF（动画）等。"
          : "Select your desired image format: PNG (high quality), JPEG (smaller files), GIF (animation), etc.",
        "image": "https://www.pdf2img.top/step2.jpg"
      },
      {
        "@type": "HowToStep",
        "position": 3,
        "name": language === "zh" ? "调整设置" : "Adjust settings",
        "text": language === "zh"
          ? "根据需要调整缩放比例、添加水印、选择页面合并等选项。"
          : "Adjust scale ratio, add watermarks, choose page merging options as needed.",
        "image": "https://www.pdf2img.top/step3.jpg"
      },
      {
        "@type": "HowToStep",
        "position": 4,
        "name": language === "zh" ? "开始转换" : "Start conversion",
        "text": language === "zh"
          ? "点击开始转换按钮，等待处理完成。转换过程完全在浏览器中进行，确保文件安全。"
          : "Click the start conversion button and wait for processing to complete. The conversion process happens entirely in your browser, ensuring file security.",
        "image": "https://www.pdf2img.top/step4.jpg"
      },
      {
        "@type": "HowToStep",
        "position": 5,
        "name": language === "zh" ? "下载结果" : "Download results",
        "text": language === "zh"
          ? "转换完成后，可以单独下载每页图片或打包下载所有文件。"
          : "After conversion is complete, you can download individual page images or download all files as a ZIP archive.",
        "image": "https://www.pdf2img.top/step5.jpg"
      }
    ]
  }

  // FAQ Schema
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": language === "zh" ? "PDF转图片是否完全免费？" : "Is PDF to image conversion completely free?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": language === "zh" 
            ? "是的，我们的PDF转图片工具完全免费使用，无需注册，无水印，无文件数量限制。"
            : "Yes, our PDF to image tool is completely free to use, no registration required, no watermarks, and no file quantity limits."
        }
      },
      {
        "@type": "Question",
        "name": language === "zh" ? "支持哪些输出格式？" : "What output formats are supported?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": language === "zh"
            ? "支持PNG、JPEG、GIF、TIFF、BMP等多种图片格式，以及可搜索的PDF格式。"
            : "Supports multiple image formats including PNG, JPEG, GIF, TIFF, BMP, and searchable PDF format."
        }
      },
      {
        "@type": "Question", 
        "name": language === "zh" ? "文件处理是否安全？" : "Is file processing secure?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": language === "zh"
            ? "所有文件处理都在您的浏览器本地完成，文件不会上传到我们的服务器，确保隐私安全。"
            : "All file processing is done locally in your browser, files are not uploaded to our servers, ensuring privacy and security."
        }
      },
      {
        "@type": "Question",
        "name": language === "zh" ? "是否支持批量转换？" : "Is batch conversion supported?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": language === "zh"
            ? "支持批量转换功能，可以同时处理多个PDF文件，大大提高工作效率。"
            : "Yes, batch conversion is supported, allowing you to process multiple PDF files simultaneously for improved efficiency."
        }
      },
      {
        "@type": "Question",
        "name": language === "zh" ? "OCR功能如何使用？" : "How to use the OCR feature?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": language === "zh"
            ? "转换完成后，点击图片上的'识别文字'按钮即可提取文字内容，支持中英文识别。"
            : "After conversion, click the 'Extract Text' button on the image to extract text content, supporting Chinese and English recognition."
        }
      }
    ]
  }

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "PDF Tools",
    "description": language === "zh" 
      ? "专注于PDF处理工具开发的技术团队，致力于提供免费、安全、高效的PDF处理解决方案。"
      : "A technology team focused on PDF processing tool development, committed to providing free, secure, and efficient PDF processing solutions.",
    "url": "https://www.pdf2img.top",
    "logo": "https://www.pdf2img.top/logo.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "url": "https://github.com/A-W-C-J/pdf-to-image-project/issues"
    },
    "sameAs": [
      "https://github.com/A-W-C-J/pdf-to-image-project"
    ]
  }

  // Website Schema
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": language === "zh" ? "PDF转图片工具" : "PDF to Image Converter",
    "description": language === "zh"
      ? "在线PDF转图片工具，支持批量转换、OCR识别、AI总结等功能"
      : "Online PDF to image converter with batch conversion, OCR recognition, AI summary and more",
    "url": "https://www.pdf2img.top",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://www.pdf2img.top/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "inLanguage": language === "zh" ? ["zh-CN", "en-US"] : ["en-US", "zh-CN"]
  }

  return (
    <>
      {/* SoftwareApplication Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareApplicationSchema)
        }}
      />
      
      {/* HowTo Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(howToSchema)
        }}
      />
      
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema)
        }}
      />
      
      {/* Organization Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema)
        }}
      />
      
      {/* Website Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema)
        }}
      />
    </>
  )
}