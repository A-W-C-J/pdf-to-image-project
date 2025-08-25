// 文件上传组件

"use client"

import React from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload } from "lucide-react"

interface FileUploadAreaProps {
  selectedFile: File | null
  selectedFiles: File[]
  isBatchMode: boolean
  isDragging: boolean
  isConverting: boolean
  fileInputRef: React.RefObject<HTMLInputElement | null>
  language: string
  t: (key: string) => string
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => void
  onDragEnter: (event: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void
}

export function FileUploadArea({
  selectedFile,
  selectedFiles,
  isBatchMode,
  isDragging,
  isConverting,
  fileInputRef,
  language,
  t,
  onFileSelect,
  onDragEnter,
  onDragLeave,
  onDragOver,
  onDrop
}: FileUploadAreaProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
        isDragging ? "border-primary bg-muted" : "border-border"
      }`}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      role="button"
      tabIndex={0}
      aria-label={language === "zh" ? "拖拽PDF文件到此处或点击选择文件" : "Drag PDF files here or click to select files"}
      aria-describedby="file-upload-description"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          fileInputRef.current?.click()
        }
      }}
    >
      <Label
        htmlFor="file-input"
        className="flex cursor-pointer flex-col items-center gap-2 text-muted-foreground"
      >
        <Upload className="h-8 w-8" aria-hidden="true" />
        <span>{t("dragDrop")}</span>
      </Label>
      <div id="file-upload-description" className="sr-only">
        {language === "zh" 
          ? `支持PDF格式文件。${isBatchMode ? '可选择多个文件进行批量处理。' : '单文件模式，一次只能选择一个文件。'}` 
          : `Supports PDF format files. ${isBatchMode ? 'Multiple files can be selected for batch processing.' : 'Single file mode, only one file can be selected at a time.'}`
        }
      </div>
      <Input
        ref={fileInputRef}
        id="file-input"
        type="file"
        accept="application/pdf"
        multiple={isBatchMode}
        onChange={onFileSelect}
        disabled={isConverting}
        className="sr-only"
        aria-label={language === "zh" ? "选择PDF文件" : "Select PDF files"}
      />
      {!isBatchMode && selectedFile && (
        <p className="text-sm text-muted-foreground">
          {t("selected")}: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
        </p>
      )}
      
      {isBatchMode && selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {language === "zh" ? `已选择 ${selectedFiles.length} 个文件` : `${selectedFiles.length} files selected`}
          </p>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                <span className="truncate flex-1">{file.name}</span>
                <span className="ml-2 whitespace-nowrap">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface UrlInputAreaProps {
  pdfUrl: string
  isConverting: boolean
  error: string
  t: (key: string) => string
  onUrlChange: (url: string) => void
}

export function UrlInputArea({
  pdfUrl,
  isConverting,
  error,
  t,
  onUrlChange
}: UrlInputAreaProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="pdf-url">{t("pdfUrl")}</Label>
      <Input
        id="pdf-url"
        type="url"
        placeholder={t("pdfUrlPlaceholder")}
        value={pdfUrl}
        onChange={(e) => onUrlChange(e.target.value)}
        disabled={isConverting}
        aria-describedby="pdf-url-description"
        aria-invalid={error ? "true" : "false"}
      />
      <p id="pdf-url-description" className="text-xs text-muted-foreground">{t("pdfUrlDesc")}</p>
      {pdfUrl.trim() && (
        <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
          {t("urlReady")}: {pdfUrl}
        </p>
      )}
    </div>
  )
}