'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { XCircle, ArrowLeft, CreditCard } from 'lucide-react'
import Link from 'next/link'

export default function PaymentCancelPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
      return
    }
  }, [isAuthenticated, router])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <XCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2 text-orange-600">支付已取消</h1>
        <p className="text-muted-foreground">您已取消了本次支付，可以随时重新购买</p>
      </div>

      {/* 信息卡片 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-center">支付状态</CardTitle>
          <CardDescription className="text-center">
            本次支付已被取消，没有产生任何费用
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="p-4 bg-orange-50 rounded-lg">
            <p className="text-orange-800 text-sm">
              如果您在支付过程中遇到了问题，请联系我们的客服支持
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild variant="outline" className="flex-1">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回首页
          </Link>
        </Button>
        <Button asChild className="flex-1">
          <Link href="/topup">
            <CreditCard className="mr-2 h-4 w-4" />
            重新购买
          </Link>
        </Button>
      </div>

      {/* 帮助信息 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">需要帮助？</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• 如果支付页面加载异常，请尝试刷新页面</li>
          <li>• 确保您的银行卡支持在线支付</li>
          <li>• 检查网络连接是否稳定</li>
          <li>• 如果问题持续存在，请联系客服</li>
        </ul>
      </div>

      {/* 产品优势提醒 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">为什么选择我们？</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 100页PDF转换额度，满足长期使用需求</li>
          <li>• 一次购买，终身有效，无需重复付费</li>
          <li>• 专业功能解锁，提升工作效率</li>
          <li>• 安全支付保障，数据隐私保护</li>
        </ul>
      </div>
    </div>
  )
}