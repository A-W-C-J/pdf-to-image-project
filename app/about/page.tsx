"use client"



import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Code, Users, Zap } from "lucide-react"
import { LanguageSwitcher } from "@/components/language-switcher"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { useLanguage } from "@/lib/i18n"
import Breadcrumb from "@/components/breadcrumb"

export default function AboutPage() {
  const { language, setLanguage } = useLanguage()

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="fixed top-4 right-4 z-10 flex flex-col sm:flex-row gap-2">
        <ThemeSwitcher language={language} />
        <LanguageSwitcher currentLanguage={language} onLanguageChange={setLanguage} />
      </div>



      <div className="max-w-4xl mx-auto pt-16 sm:pt-8">
        <div className="mb-6">
          <Breadcrumb />
        </div>
        <div className="space-y-6">
          <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">{language === "zh" ? "关于我们" : "About Us"}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {language === "zh"
              ? "我们致力于为用户提供高质量、免费的PDF处理工具，让文档转换变得简单高效。"
              : "We are dedicated to providing high-quality, free PDF processing tools that make document conversion simple and efficient."}
          </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                {language === "zh" ? "开源技术" : "Open Source"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {language === "zh"
                  ? "基于现代Web技术构建，完全开源透明，让每个人都能了解工具的工作原理。"
                  : "Built with modern web technologies, completely open source and transparent, allowing everyone to understand how the tool works."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                {language === "zh" ? "高性能" : "High Performance"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {language === "zh"
                  ? "采用PDF.js引擎，纯前端处理，无需上传文件到服务器，保护您的隐私安全。"
                  : "Powered by PDF.js engine with pure frontend processing, no need to upload files to servers, protecting your privacy."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {language === "zh" ? "用户至上" : "User First"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {language === "zh"
                  ? "持续优化用户体验，根据用户反馈不断改进功能，让工具更好用。"
                  : "Continuously optimizing user experience, constantly improving features based on user feedback to make tools better."}
              </p>
            </CardContent>
          </Card>
          </div>

          <Card>
          <CardHeader>
            <CardTitle>{language === "zh" ? "技术架构" : "Technical Architecture"}</CardTitle>
            <CardDescription>
              {language === "zh"
                ? "了解我们的技术选型和开发理念"
                : "Learn about our technology choices and development philosophy"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">{language === "zh" ? "前端技术栈" : "Frontend Stack"}</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Next.js 14 - {language === "zh" ? "现代React框架" : "Modern React Framework"}</li>
                  <li>• TypeScript - {language === "zh" ? "类型安全" : "Type Safety"}</li>
                  <li>• Tailwind CSS - {language === "zh" ? "原子化CSS" : "Atomic CSS"}</li>
                  <li>• PDF.js - {language === "zh" ? "PDF处理引擎" : "PDF Processing Engine"}</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">{language === "zh" ? "核心特性" : "Core Features"}</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• {language === "zh" ? "纯前端处理" : "Pure Frontend Processing"}</li>
                  <li>• {language === "zh" ? "批量转换" : "Batch Conversion"}</li>
                  <li>• {language === "zh" ? "水印支持" : "Watermark Support"}</li>
                  <li>• {language === "zh" ? "多格式输出" : "Multiple Format Output"}</li>
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold mb-1">{language === "zh" ? "开源项目" : "Open Source Project"}</h3>
                  <p className="text-sm text-muted-foreground">
                    {language === "zh"
                      ? "我们的代码完全开源，欢迎查看、学习和贡献。通过开源，我们希望推动PDF处理技术的发展，让更多开发者受益。"
                      : "Our code is completely open source, welcome to view, learn and contribute. Through open source, we hope to promote the development of PDF processing technology and benefit more developers."}
                  </p>
                </div>
                <a
                  href="https://github.com/A-W-C-J/pdf-to-image-project"
                  target="_blank"
                  rel="dofollow noopener noreferrer"
                  className="flex-shrink-0"
                >
                  <Button className="flex items-center gap-2">
                    <Github className="h-4 w-4" />
                    {language === "zh" ? "查看源码" : "View Source"}
                  </Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === "zh" ? "联系我们" : "Contact Us"}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {language === "zh"
                  ? "如果您有任何问题、建议或想要贡献代码，欢迎通过GitHub Issues与我们联系。我们重视每一个用户的反馈，并会认真考虑每一个改进建议。"
                  : "If you have any questions, suggestions, or want to contribute code, please feel free to contact us through GitHub Issues. We value every user's feedback and will seriously consider every improvement suggestion."}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
