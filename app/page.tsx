"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, FileImage, Upload, X } from "lucide-react"

interface ConvertedImage {
  dataUrl: string
  pageNumber: number
  type: string
}

export default function PDFConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [scale, setScale] = useState(2.0)
  const [format, setFormat] = useState("image/png")
  const [isConverting, setIsConverting] = useState(false)
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([])
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
      setError("")
      setConvertedImages([])
      setProgress(0)
      setStatus("")
    } else {
      setError("请选择有效的PDF文件")
    }
  }

  const convertPDF = async () => {
    if (!selectedFile) return

    setIsConverting(true)
    setError("")
    setConvertedImages([])
    setProgress(0)
    setStatus("正在加载PDF.js...")

    try {
      const pdfjsLib = await import("pdfjs-dist")

      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`

      console.log("[v0] PDF.js version:", pdfjsLib.version)
      console.log("[v0] Worker source set to:", pdfjsLib.GlobalWorkerOptions.workerSrc)

      setStatus("正在读取PDF文件...")
      const arrayBuffer = await selectedFile.arrayBuffer()

      setStatus("正在解析PDF文档...")
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
      })
      const pdfDocument = await loadingTask.promise

      const totalPages = pdfDocument.numPages
      setStatus(`共 ${totalPages} 页，开始转换...`)

      const images: ConvertedImage[] = []

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        setStatus(`正在转换第 ${pageNumber}/${totalPages} 页...`)
        setProgress(((pageNumber - 1) / totalPages) * 100)

        const page = await pdfDocument.getPage(pageNumber)
        const viewport = page.getViewport({ scale })

        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")!
        canvas.height = viewport.height
        canvas.width = viewport.width

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        }

        await page.render(renderContext).promise

        const imageDataUrl = canvas.toDataURL(format, format === "image/jpeg" ? 0.9 : undefined)

        images.push({
          dataUrl: imageDataUrl,
          pageNumber,
          type: format,
        })
      }

      setConvertedImages(images)
      setProgress(100)
      setStatus(`转换完成！共生成 ${totalPages} 张图片`)
    } catch (err) {
      console.error("PDF转换错误:", err)
      setError(`转换失败: ${err instanceof Error ? err.message : "未知错误"}`)
    } finally {
      setIsConverting(false)
    }
  }

  const downloadSingle = (image: ConvertedImage) => {
    const link = document.createElement("a")
    link.href = image.dataUrl
    const extension = format === "image/png" ? "png" : "jpg"
    link.download = `page_${image.pageNumber}.${extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadAll = async () => {
    if (convertedImages.length === 0) return

    setStatus("正在创建ZIP包...")

    try {
      // 动态导入JSZip
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()
      const extension = format === "image/png" ? "png" : "jpg"

      convertedImages.forEach((image) => {
        const base64Data = image.dataUrl.split(",")[1]
        zip.file(`page_${image.pageNumber}.${extension}`, base64Data, { base64: true })
      })

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const downloadUrl = URL.createObjectURL(zipBlob)

      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = "converted_pdf_images.zip"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(downloadUrl)

      setStatus("下载已开始！")
    } catch (err) {
      setError(`下载失败: ${err instanceof Error ? err.message : "未知错误"}`)
    }
  }

  const clearAll = () => {
    setSelectedFile(null)
    setConvertedImages([])
    setProgress(0)
    setStatus("")
    setError("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">PDF转图片工具</h1>
          <p className="text-muted-foreground">基于PDF.js的纯前端解决方案，支持批量转换和下载</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              文件上传与设置
            </CardTitle>
            <CardDescription>选择PDF文件并配置转换参数</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-input">选择PDF文件</Label>
              <Input
                ref={fileInputRef}
                id="file-input"
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                disabled={isConverting}
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  已选择: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scale">缩放比例 (影响清晰度)</Label>
                <Input
                  id="scale"
                  type="number"
                  min="1.0"
                  max="5.0"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(Number.parseFloat(e.target.value))}
                  disabled={isConverting}
                />
                <p className="text-xs text-muted-foreground">1.0 = 72DPI, 2.0 = 144DPI, 3.0 = 216DPI</p>
              </div>

              <div className="space-y-2">
                <Label>输出格式</Label>
                <Select value={format} onValueChange={setFormat} disabled={isConverting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image/png">PNG (无损)</SelectItem>
                    <SelectItem value="image/jpeg">JPEG (压缩)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={convertPDF} disabled={!selectedFile || isConverting} className="flex-1">
                {isConverting ? "转换中..." : "开始转换"}
              </Button>
              {(selectedFile || convertedImages.length > 0) && (
                <Button variant="outline" onClick={clearAll} disabled={isConverting}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {(status || error) && (
          <Card>
            <CardContent className="pt-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {status && !error && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">{status}</p>
                  {isConverting && <Progress value={progress} className="w-full" />}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {convertedImages.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  转换结果 ({convertedImages.length} 张图片)
                </span>
                <Button onClick={downloadAll} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  下载全部 (ZIP)
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {convertedImages.map((image) => (
                  <div key={image.pageNumber} className="space-y-2">
                    <div className="relative group">
                      <img
                        src={image.dataUrl || "/placeholder.svg"}
                        alt={`第 ${image.pageNumber} 页`}
                        className="w-full h-auto border rounded-lg shadow-sm"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button size="sm" onClick={() => downloadSingle(image)} className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          下载
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-center text-muted-foreground">第 {image.pageNumber} 页</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
