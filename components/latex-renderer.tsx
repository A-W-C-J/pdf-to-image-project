'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useTheme } from 'next-themes'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface LatexRendererProps {
  content: string
  className?: string
}

export function LatexRenderer({ content, className = '' }: LatexRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && theme === 'dark'

  useEffect(() => {
    if (containerRef.current && content) {
      try {
        // Clear previous content
        containerRef.current.innerHTML = ''
        
        // Split content by lines and render each line
        const lines = content.split('\n')
        
        lines.forEach((line) => {
          const lineDiv = document.createElement('div')
          lineDiv.className = 'mb-2'
          
          if (line.trim()) {
            try {
              // Try to render as display math (block)
              katex.render(line.trim(), lineDiv, {
                displayMode: true,
                throwOnError: false,
                errorColor: '#cc0000',
                strict: false
              })
            } catch {
              // If rendering fails, show as plain text
              lineDiv.textContent = line
              lineDiv.className += ' text-gray-600 font-mono text-sm'
            }
          } else {
            // Empty line
            lineDiv.innerHTML = '&nbsp;'
          }
          
          containerRef.current?.appendChild(lineDiv)
        })
      } catch (error) {
        console.error('LaTeX rendering error:', error)
        if (containerRef.current) {
          containerRef.current.innerHTML = `<pre class="text-gray-600 font-mono text-sm whitespace-pre-wrap">${content}</pre>`
        }
      }
    }
  }, [content])

  return (
    <div 
      ref={containerRef} 
      className={`latex-content overflow-auto max-h-96 p-4 border rounded-lg ${isDark ? 'bg-gray-900 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'} ${className}`}
    />
  )
}

export default LatexRenderer