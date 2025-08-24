'use client'

import { useEffect, useState } from 'react'
import mammoth from 'mammoth'

interface DocxRendererProps {
  content: ArrayBuffer
  className?: string
}

export function DocxRenderer({ content, className = '' }: DocxRendererProps) {
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const convertDocxToHtml = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const result = await mammoth.convertToHtml({ arrayBuffer: content })
        setHtmlContent(result.value)
        
        // 如果有警告信息，可以在控制台输出
        if (result.messages.length > 0) {
          console.warn('DOCX conversion warnings:', result.messages)
        }
      } catch (err) {
        console.error('Error converting DOCX:', err)
        setError('无法解析DOCX文档')
      } finally {
        setIsLoading(false)
      }
    }

    if (content) {
      convertDocxToHtml()
    }
  }, [content])

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">正在解析DOCX文档...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className={`docx-content ${className}`}>
      <style jsx>{`
        .docx-content {
          font-family: 'Times New Roman', serif;
          line-height: 1.6;
          color: #333;
          background: white;
          padding: 2rem;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          max-width: 100%;
          overflow-x: auto;
        }
        
        .docx-content :global(h1) {
          font-size: 2rem;
          font-weight: bold;
          margin: 1.5rem 0 1rem 0;
          color: #1a1a1a;
          border-bottom: 2px solid #e5e5e5;
          padding-bottom: 0.5rem;
        }
        
        .docx-content :global(h2) {
          font-size: 1.5rem;
          font-weight: bold;
          margin: 1.25rem 0 0.75rem 0;
          color: #2a2a2a;
        }
        
        .docx-content :global(h3) {
          font-size: 1.25rem;
          font-weight: bold;
          margin: 1rem 0 0.5rem 0;
          color: #3a3a3a;
        }
        
        .docx-content :global(p) {
          margin: 0.75rem 0;
          text-align: justify;
        }
        
        .docx-content :global(ul), .docx-content :global(ol) {
          margin: 0.75rem 0;
          padding-left: 2rem;
        }
        
        .docx-content :global(li) {
          margin: 0.25rem 0;
        }
        
        .docx-content :global(table) {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          background: white;
        }
        
        .docx-content :global(th), .docx-content :global(td) {
          border: 1px solid #ddd;
          padding: 0.75rem;
          text-align: left;
        }
        
        .docx-content :global(th) {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        
        .docx-content :global(tr:nth-child(even)) {
          background-color: #f9f9f9;
        }
        
        .docx-content :global(img) {
          max-width: 100%;
          height: auto;
          margin: 1rem 0;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .docx-content :global(blockquote) {
          border-left: 4px solid #e5e5e5;
          margin: 1rem 0;
          padding: 0.5rem 0 0.5rem 1rem;
          background-color: #f8f9fa;
          font-style: italic;
        }
        
        .docx-content :global(code) {
          background-color: #f1f3f4;
          padding: 0.125rem 0.25rem;
          border-radius: 3px;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
        }
        
        .docx-content :global(pre) {
          background-color: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 4px;
          padding: 1rem;
          overflow-x: auto;
          margin: 1rem 0;
        }
        
        .docx-content :global(pre code) {
          background: none;
          padding: 0;
        }
        
        .docx-content :global(strong), .docx-content :global(b) {
          font-weight: bold;
        }
        
        .docx-content :global(em), .docx-content :global(i) {
          font-style: italic;
        }
        
        .docx-content :global(u) {
          text-decoration: underline;
        }
        
        .docx-content :global(a) {
          color: #0066cc;
          text-decoration: none;
        }
        
        .docx-content :global(a:hover) {
          text-decoration: underline;
        }
        
        @media (max-width: 768px) {
          .docx-content {
            padding: 1rem;
            font-size: 0.9rem;
          }
          
          .docx-content :global(h1) {
            font-size: 1.5rem;
          }
          
          .docx-content :global(h2) {
            font-size: 1.25rem;
          }
          
          .docx-content :global(h3) {
            font-size: 1.1rem;
          }
        }
        
        @media (prefers-color-scheme: dark) {
          .docx-content {
            background: #1a1a1a;
            color: #e5e5e5;
          }
          
          .docx-content :global(h1) {
            color: #f0f0f0;
            border-bottom-color: #404040;
          }
          
          .docx-content :global(h2) {
            color: #e8e8e8;
          }
          
          .docx-content :global(h3) {
            color: #d8d8d8;
          }
          
          .docx-content :global(th) {
            background-color: #2a2a2a;
          }
          
          .docx-content :global(tr:nth-child(even)) {
            background-color: #252525;
          }
          
          .docx-content :global(td), .docx-content :global(th) {
            border-color: #404040;
          }
          
          .docx-content :global(blockquote) {
            border-left-color: #404040;
            background-color: #2a2a2a;
          }
          
          .docx-content :global(code) {
            background-color: #2a2a2a;
          }
          
          .docx-content :global(pre) {
            background-color: #2a2a2a;
            border-color: #404040;
          }
        }
      `}</style>
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
    </div>
  )
}

export default DocxRenderer