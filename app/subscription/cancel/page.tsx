'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, XCircle, ArrowLeft, MessageCircle } from 'lucide-react'
import Link from 'next/link'

export default function SubscriptionCancelPage() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  const checkUser = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/auth/login')
        return
      }
      
      setUser(user)
      setLoading(false)
    } catch (error) {
      console.error('获取用户信息失败:', error)
      router.push('/auth/login')
    }
  }, [router, supabase])

  useEffect(() => {
    checkUser()
  }, [router, checkUser])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* 取消消息 */}
        <Card className="border-orange-200 bg-orange-50 mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-orange-100 p-3">
                <XCircle className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-orange-800 text-2xl">
              订阅已取消
            </CardTitle>
            <CardDescription className="text-orange-700">
              您已取消了订阅流程，没有产生任何费用
            </CardDescription>
          </CardHeader>
        </Card>

        {/* 说明信息 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>发生了什么？</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-muted-foreground">
                您在支付过程中取消了订阅，这完全没有问题。没有从您的账户扣除任何费用。
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">您仍然可以：</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• 继续使用免费的PDF转图片功能</li>
                  <li>• 随时重新订阅专业版</li>
                  <li>• 查看我们的功能介绍</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 为什么选择我们 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>为什么选择PDF转换专业版？</CardTitle>
            <CardDescription>
              也许这些功能能够帮助您重新考虑
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">多格式转换</h4>
                  <p className="text-sm text-muted-foreground">
                    支持PDF转Word、Excel、PowerPoint等多种格式
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">高质量转换</h4>
                  <p className="text-sm text-muted-foreground">
                    保持原始格式和布局，确保转换质量
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">批量处理</h4>
                  <p className="text-sm text-muted-foreground">
                    一次性处理多个文件，提高工作效率
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">无限制使用</h4>
                  <p className="text-sm text-muted-foreground">
                    每月大量转换次数，满足各种使用需求
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-3">
              <Button asChild size="lg">
                <Link href="/subscription">
                  重新订阅专业版
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  返回首页
                </Link>
              </Button>
              
              <Button variant="ghost" asChild>
                <Link href="/contact">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  联系客服
                </Link>
              </Button>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                如果您在订阅过程中遇到任何问题，请随时联系我们的客服团队
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}