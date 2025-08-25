// Tab导航组件

"use client"

import React from 'react'
import { TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FileImage, FileText } from "lucide-react"

interface TabsNavigationProps {
  language: string
}

export function TabsNavigation({ language }: TabsNavigationProps) {
  return (
    <TabsList className="grid w-full grid-cols-2">
      <TabsTrigger value="pdf-to-image" className="flex items-center gap-2">
        <FileImage className="h-4 w-4" />
        {language === "zh" ? "PDF转图片 + OCR识别" : "PDF to Image + OCR"}
      </TabsTrigger>
      <TabsTrigger value="pdf-to-word" className="flex items-center gap-2 relative">
        <FileText className="h-4 w-4" />
        {language === "zh" ? "PDF转文档格式" : "PDF to Document"}
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs px-1.5 py-0.5 rounded-full font-semibold shadow-sm">
          Pro
        </span>
      </TabsTrigger>
    </TabsList>
  )
}