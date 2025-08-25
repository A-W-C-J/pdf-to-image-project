'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, Loader2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface SubscriptionInfo {
  id: string
  status: string
  plan_name: string
  current_period_end: string
  current_period_start: string
  subscription_plans: {
    name: string
    features: string[]
  }
}

export default function SubscriptionSuccessPage() {
  const [loading, setLoading] = useState(true)
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  const verifySubscription = async () => {
    try {
      // 等待几秒钟让webhook处理完成
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const response = await fetch('/api/subscription/status')
      if (response.ok) {
        const data = await response.json()
        setSubscriptionInfo(data.subscription)
      } else {
        toast.error('验证订阅状态失败')
      }
    } catch (error) {
      console.error('验证订阅失败:', error)
      toast.error('验证订阅状态失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sessionId) {
      verifySubscription()
    } else {
      setLoading(false)
    }
  }, [sessionId, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">正在验证您的订阅...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!sessionId) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">无效的访问</h1>
          <p className="text-muted-foreground mb-6">未找到有效的支付会话信息</p>
          <Button asChild>
            <Link href="/subscription">返回订阅页面</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* 成功消息 */}
        <Card className="border-green-200 bg-green-50 mb-6">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-green-800 text-2xl">
              订阅成功！
            </CardTitle>
            <CardDescription className="text-green-700">
              感谢您订阅PDF转换专业版，现在您可以享受全部功能了
            </CardDescription>
          </CardHeader>
        </Card>

        {/* 订阅详情 */}
        {subscriptionInfo && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>订阅详情</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">订阅计划</p>
                  <p className="font-semibold">{subscriptionInfo.subscription_plans.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">状态</p>
                  <p className="font-semibold text-green-600">已激活</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">开始日期</p>
                  <p className="font-semibold">
                    {new Date(subscriptionInfo.current_period_start).toLocaleDateString('zh-CN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">下次续费</p>
                  <p className="font-semibold">
                    {new Date(subscriptionInfo.current_period_end).toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">包含功能</p>
                <ul className="space-y-1">
                  {subscriptionInfo.subscription_plans.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 下一步操作 */}
        <Card>
          <CardHeader>
            <CardTitle>开始使用</CardTitle>
            <CardDescription>
              现在您可以使用所有PDF转换功能了
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <Button asChild className="justify-between">
                <Link href="/">
                  开始转换PDF
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="justify-between">
                <Link href="/subscription">
                  管理订阅
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-2">
              <p>💡 <strong>小贴士：</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>您的转换次数将在每个计费周期开始时重置</li>
                <li>可以随时在订阅管理页面查看使用情况</li>
                <li>如有任何问题，请联系我们的客服团队</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}