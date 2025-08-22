"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Download, FileImage, Upload, X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { translations, type Language, type TranslationKey } from "@/lib/i18n"

interface ConvertedImage {
  dataUrl: string
  pageNumber: number
  type: string
}

export default function PDFConverter() {
  const [language, setLanguage] = useState<Language>("zh")
  const [theme, setTheme] = useState<"light" | "dark">("light")
  const t = (key: TranslationKey): string => translations[language][key]

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [scale, setScale] = useState(3.0)
  const [format, setFormat] = useState("image/png")
  const [isConverting, setIsConverting] = useState(false)
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([])
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("")
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [enableWatermark, setEnableWatermark] = useState(false)
  const [watermarkText, setWatermarkText] = useState("WATERMARK")
  const [watermarkPosition, setWatermarkPosition] = useState("center")
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.3)

  const applyWatermark = (canvas: HTMLCanvasElement, text: string, position: string, opacity: number) => {
    const context = canvas.getContext("2d")!
    const canvasWidth = canvas.width
    const canvasHeight = canvas.height

    context.save()

    context.globalAlpha = opacity
    context.fillStyle = "#000000"
    context.font = `${Math.max(canvasWidth, canvasHeight) / 20}px Arial`
    context.textAlign = "center"
    context.textBaseline = "middle"

    let x = canvasWidth / 2
    let y = canvasHeight / 2

    switch (position) {
      case "top-left":
        x = canvasWidth * 0.2
        y = canvasHeight * 0.1
        break
      case "top-right":
        x = canvasWidth * 0.8
        y = canvasHeight * 0.1
        break
      case "bottom-left":
        x = canvasWidth * 0.2
        y = canvasHeight * 0.9
        break
      case "bottom-right":
        x = canvasWidth * 0.8
        y = canvasHeight * 0.9
        break
      case "center":
      default:
        x = canvasWidth / 2
        y = canvasHeight / 2
        break
    }

    context.translate(x, y)
    context.rotate(-Math.PI / 6)
    context.fillText(text, 0, 0)

    context.restore()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement> | React.DragEvent<HTMLDivElement>) => {
    let file: File | undefined | null = null
    if ("dataTransfer" in event) {
      file = event.dataTransfer.files?.[0]
    } else {
      file = event.target.files?.[0]
    }

    if (file && file.type === "application/pdf") {
      setSelectedFile(file)
      setError("")
      setConvertedImages([])
      setProgress(0)
      setStatus("")
    } else {
      setError(t("selectValidPdf"))
    }
    setIsDragging(false)
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    handleFileSelect(e)
  }

  const convertPDF = async () => {
    if (!selectedFile) return

    setIsConverting(true)
    setError("")
    setConvertedImages([])
    setProgress(0)
    setStatus(t("loadingPdfjs"))

    try {
      const pdfjsLib = await import("pdfjs-dist")

      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

      console.log("[v0] PDF.js version:", pdfjsLib.version)
      console.log("[v0] Worker source set to:", pdfjsLib.GlobalWorkerOptions.workerSrc)

      setStatus(t("readingPdf"))
      const arrayBuffer = await selectedFile.arrayBuffer()

      setStatus(t("parsingPdf"))
      const loadingTask = pdfjsLib.getDocument({
        data: arrayBuffer,
      })
      const pdfDocument = await loadingTask.promise

      const totalPages = pdfDocument.numPages
      setStatus(`${t("totalPages")} ${totalPages} ${t("startConverting")}`)

      const images: ConvertedImage[] = []

      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        setStatus(`${t("convertingPage")} ${pageNumber}/${totalPages} ${t("pageUnit")}...`)
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

        if (enableWatermark && watermarkText.trim()) {
          applyWatermark(canvas, watermarkText, watermarkPosition, watermarkOpacity)
        }

        const imageDataUrl = canvas.toDataURL(format, format === "image/jpeg" ? 0.9 : undefined)

        images.push({
          dataUrl: imageDataUrl,
          pageNumber,
          type: format,
        })
      }

      setConvertedImages(images)
      setProgress(100)
      setStatus(`${t("convertComplete")} ${totalPages} ${t("images")}`)
    } catch (err) {
      console.error("PDF转换错误:", err)
      setError(`${t("convertFailed")}: ${err instanceof Error ? err.message : t("unknownError")}`)
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

    setStatus(t("creatingZip"))

    try {
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

      setStatus(t("downloadStarted"))
    } catch (err) {
      setError(`${t("downloadFailed")}: ${err instanceof Error ? err.message : t("unknownError")}`)
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
      <div className="fixed top-4 right-4 z-10 flex gap-2">
        <ThemeSwitcher currentTheme={theme} onThemeChange={setTheme} language={language} />
        <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
          <p className="text-sm text-muted-foreground">{t("privacy")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              {t("fileUpload")}
            </CardTitle>
            <CardDescription>{t("fileUploadDesc")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`flex flex-col items-center justify-center space-y-4 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                isDragging ? "border-primary bg-muted" : "border-border"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Label
                htmlFor="file-input"
                className="flex cursor-pointer flex-col items-center gap-2 text-muted-foreground"
              >
                <Upload className="h-8 w-8" />
                <span>{t("dragDrop")}</span>
              </Label>
              <Input
                ref={fileInputRef}
                id="file-input"
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                disabled={isConverting}
                className="sr-only"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  {t("selected")}: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="scale">{t("scale")}</Label>
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
                <p className="text-xs text-muted-foreground">{t("scaleDesc")}</p>
              </div>

              <div className="space-y-2">
                <Label>{t("outputFormat")}</Label>
                <Select value={format} onValueChange={setFormat} disabled={isConverting}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image/png">{t("pngFormat")}</SelectItem>
                    <SelectItem value="image/jpeg">{t("jpegFormat")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="enable-watermark"
                  checked={enableWatermark}
                  onCheckedChange={(checked) => setEnableWatermark(checked as boolean)}
                  disabled={isConverting}
                />
                <Label htmlFor="enable-watermark" className="text-sm font-medium">
                  {t("addWatermark")}
                </Label>
              </div>

              {enableWatermark && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="watermark-text">{t("watermarkText")}</Label>
                    <Input
                      id="watermark-text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      disabled={isConverting}
                      placeholder={t("watermarkTextPlaceholder")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{t("watermarkPosition")}</Label>
                    <Select value={watermarkPosition} onValueChange={setWatermarkPosition} disabled={isConverting}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="center">{t("center")}</SelectItem>
                        <SelectItem value="top-left">{t("topLeft")}</SelectItem>
                        <SelectItem value="top-right">{t("topRight")}</SelectItem>
                        <SelectItem value="bottom-left">{t("bottomLeft")}</SelectItem>
                        <SelectItem value="bottom-right">{t("bottomRight")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="watermark-opacity">
                      {t("opacity")} ({Math.round(watermarkOpacity * 100)}%)
                    </Label>
                    <Input
                      id="watermark-opacity"
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.1"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(Number.parseFloat(e.target.value))}
                      disabled={isConverting}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={convertPDF} disabled={!selectedFile || isConverting} className="flex-1">
                {isConverting ? t("converting") : t("startConvert")}
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
                  {t("convertResult")} ({convertedImages.length} {t("images")})
                </span>
                <Button onClick={downloadAll} className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {t("downloadAll")}
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
                        alt={`${t("page")} ${image.pageNumber} ${t("pageUnit")}`}
                        className="w-full h-auto border rounded-lg shadow-sm"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button size="sm" onClick={() => downloadSingle(image)} className="flex items-center gap-1">
                          <Download className="h-3 w-3" />
                          {t("download")}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-center text-muted-foreground">
                      {t("page")} {image.pageNumber} {t("pageUnit")}
                    </p>
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
