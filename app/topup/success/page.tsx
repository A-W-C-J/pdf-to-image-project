'use client'

import { useState, useEffect, Suspense, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Coins, ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLanguage } from '@/lib/i18n'
import Link from 'next/link'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const { t } = useLanguage()
  const [userQuota, setUserQuota] = useState<number | null>(null)
  const [isLoadingQuota, setIsLoadingQuota] = useState(true)
  const sessionId = searchParams.get('session_id')

  // 获取用户额度
  const fetchUserQuota = useCallback(async () => {
    // 支付成功页面：开始获取用户额度
    // 用户ID检查
    // Session ID检查
    
    if (!user?.id) {
      // 用户ID不存在，无法获取额度
      return
    }
    
    try {
      // 正在创建 Supabase 客户端
      const supabase = createClient()
      // Supabase 客户端创建成功
      
      // 正在调用 get_user_quota 函数
      // 参数检查
      
      const { data, error } = await supabase
        .rpc('get_user_quota', { p_user_id: user.id })
      
      // get_user_quota 返回结果
      // data检查
      // error检查
      
      if (error) {
        // 获取用户额度失败
        // 错误详情
        setUserQuota(0)
        return
      }
      
      const remainingQuota = data && data.length > 0 ? data[0].remaining_quota : 0
      // 解析的剩余额度
      // 数据详情
      
      setUserQuota(remainingQuota)
      // 用户额度设置成功
    } catch (error) {
      // 获取用户额度时发生异常
      // 异常堆栈
      setUserQuota(0)
    } finally {
      setIsLoadingQuota(false)
      // 支付成功页面：额度获取完成
    }
  }, [user?.id, sessionId])

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/')
      return
    }
    
    if (user?.id) {
      // 延迟获取额度，确保webhook已处理
      setTimeout(() => {
        fetchUserQuota()
      }, 2000)
    }
  }, [isAuthenticated, user?.id, router, fetchUserQuota])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="text-center mb-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2 text-green-600">{t('paymentSuccess')}</h1>
        <p className="text-muted-foreground">{t('paymentSuccessDesc')}</p>
      </div>

      {/* 支付信息 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-center">{t('purchaseDetails')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('orderNumber')}</span>
            <span className="font-mono text-sm">{sessionId || t('processing')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('purchasedPlan')}</span>
            <span className="font-semibold">{t('professionalPlan')}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('quotaReceived')}</span>
            <Badge className="bg-green-100 text-green-800">+100 {t('pages')}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('paymentAmount')}</span>
            <span className="font-semibold text-lg">¥29.9</span>
          </div>
        </CardContent>
      </Card>

      {/* 当前额度 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            {t('currentTotalQuota')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            {isLoadingQuota ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>{t('updatingQuota')}</span>
              </div>
            ) : (
              <div className="text-3xl font-bold text-green-600">
                {userQuota || 0} {t('pages')}
              </div>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {t('availableForPdfConversion')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 操作按钮 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="flex-1">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToHome')}
          </Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link href="/topup">
            {t('continueTopup')}
          </Link>
        </Button>
      </div>

      {/* 提示信息 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">{t('usageTips')}</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>{t('quotaChargedTip')}</li>
          <li>{t('quotaPermanentTip')}</li>
          <li>{t('quotaConsumptionTip')}</li>
          <li>{t('freeFeatureTip')}</li>
        </ul>
      </div>
    </div>
  )
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center mb-8">
          <Loader2 className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
          <h1 className="text-3xl font-bold mb-2">Loading...</h1>
          <p className="text-muted-foreground">Please wait while we load your payment details.</p>
        </div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  )
}