'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Coins, CreditCard, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n'
import Breadcrumb from '@/components/breadcrumb'

interface StripePrice {
  id: string
  unit_amount: number | null
  currency: string
  type: string
  recurring: any
  metadata: Record<string, string>
}

interface StripeProduct {
  id: string
  name: string
  description: string | null
  images: string[]
  metadata: Record<string, string>
  marketing_features: Array<{ name: string }>
  prices: StripePrice[]
}

export default function TopupPage() {
  const { user, isAuthenticated, loading } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [userQuota, setUserQuota] = useState<number | null>(null)
  const [isLoadingQuota, setIsLoadingQuota] = useState(false)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [products, setProducts] = useState<StripeProduct[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)

  // 获取用户额度
  const fetchUserQuota = async () => {
    if (!user?.id) return
    
    try {
      setIsLoadingQuota(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .rpc('get_user_quota', { p_user_id: user.id })
      
      if (error) {
        console.error('Failed to fetch user quota:', error)
        setUserQuota(0)
        return
      }
      
      // data是数组，如果用户没有额度记录则为空数组
      // 取第一条记录的remaining_quota，如果没有记录则默认为0
      const remainingQuota = data && data.length > 0 ? data[0].remaining_quota : 0
      setUserQuota(remainingQuota)
    } catch (error) {
      console.error('Failed to fetch user quota:', error)
      setUserQuota(0)
    } finally {
      setIsLoadingQuota(false)
    }
  }

  // 获取Stripe产品信息
  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true)
      const response = await fetch('/api/stripe/products')
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || '获取产品信息失败')
      }
      
      setProducts(data.products || [])
    } catch (error) {
      console.error('获取产品信息失败:', error)
      toast.error('获取产品信息失败')
    } finally {
      setIsLoadingProducts(false)
    }
  }

  // 处理支付
  const handlePayment = async (priceId: string) => {
    if (!user?.id) {
      toast.error(t('pleaseLogin'))
      return
    }

    try {
      setIsProcessingPayment(true)
      
      // 调用创建支付会话的API
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || t('createPaymentSessionFailed'))
      }

      // 重定向到Stripe支付页面
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(t('noPaymentUrl'))
      }
    } catch (error) {
      console.error('支付处理失败:', error)
      toast.error(error instanceof Error ? error.message : t('paymentProcessingFailed'))
    } finally {
      setIsProcessingPayment(false)
    }
  }

  useEffect(() => {
    // 等待认证状态加载完成
    if (loading) {
      return
    }
    
    if (!isAuthenticated) {
      router.push('/')
      return
    }
    
    if (user?.id) {
      fetchUserQuota()
    }
    
    // 加载产品信息
    fetchProducts()
  }, [loading, isAuthenticated, user?.id, router])

  // 显示加载状态
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('loading') || '加载中...'}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Breadcrumb />


      {/* 当前额度显示 */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            {t('currentQuota')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t('remainingPages')}</span>
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {isLoadingQuota ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `${userQuota || 0} ${t('pages')}`
              )}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 充值套餐 */}
      {isLoadingProducts ? (
        <Card className="border-2 border-primary">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">{t('loadingProducts') || '加载产品信息中...'}</span>
          </CardContent>
        </Card>
      ) : products.length > 0 ? (
        <div className="space-y-6">
          {products.map((product, index) => {
            const oneTimePrice = product.prices.find(price => price.type === 'one_time')
            if (!oneTimePrice) return null
            
            return (
              <Card key={product.id} className={index === 0 ? "border-2 border-primary" : "border"}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{product.name}</CardTitle>
                      <CardDescription className="mt-2">
                        {product.description || t('oneTimePurchase')}
                      </CardDescription>
                    </div>
                    {index === 0 && (
                      <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                        {t('recommended')}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 价格 */}
                  <div className="text-center">
                    <div className="text-3xl font-bold">
                      {oneTimePrice.currency === 'cny' ? '¥' : '$'}
                      {((oneTimePrice.unit_amount || 0) / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">{t('oneTimePayment')}</div>
                  </div>

                  {/* 功能列表 */}
                  <div className="space-y-3">
                    {product.marketing_features.length > 0 ? (
                      product.marketing_features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-green-500" />
                          <span>{feature.name}</span>
                        </div>
                      ))
                    ) : (
                      // 默认功能列表（如果Stripe产品没有设置营销功能）
                      <>
                        <div className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-green-500" />
                          <span>{product.metadata.CONV_COUNT ? `${product.metadata.CONV_COUNT}次转换额度` : t('pdfConversionQuota')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-green-500" />
                          <span>{t('lifetimeAccess')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-green-500" />
                          <span>{t('professionalFeatures')}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <Check className="h-5 w-5 text-green-500" />
                          <span>{t('prioritySupport')}</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 购买按钮 */}
                  <Button 
                    className="w-full h-12 text-lg" 
                    onClick={() => handlePayment(oneTimePrice.id)}
                    disabled={isProcessingPayment}
                  >
                    {isProcessingPayment ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('processing')}
                      </>
                    ) : (
                      <>
                        <CreditCard className="mr-2 h-5 w-5" />
                        {t('buyNow')}
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-center text-muted-foreground">
                    {t('securePayment')}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-2 border-primary">
          <CardContent className="flex items-center justify-center py-12">
            <span>{t('noAvailablePackages') || '暂无可用的充值套餐'}</span>
          </CardContent>
        </Card>
      )}

      {/* 说明信息 */}
      <div className="mt-8 text-left text-sm text-muted-foreground">
        <p>{t('freeFeatureNote')}</p>
        <p>{t('quotaFeatureNote')}</p>
        <p>{t('permanentNote')}</p>
      </div>
    </div>
  )
}