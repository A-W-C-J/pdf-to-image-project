'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CheckCircle, Loader2, Crown, Zap, Shield, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/stripe-client'

interface UserSubscription {
  id: string
  status: string
  current_period_end: string
  cancel_at_period_end: boolean
  subscription_plans: {
    name: string
    name_en: string
    description: string
    features: string[]
    max_conversions_per_month: number
  }
}

interface User {
  id: string
  email?: string
}

export default function SubscriptionPage() {
  const [user, setUser] = useState<User | null>(null)
  const [userSubscription, setUserSubscription] = useState<UserSubscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [managingSubscription, setManagingSubscription] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const checkUser = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        router.push('/auth/login?redirect=/subscription')
        return
      }

      setUser(user)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/auth/login?redirect=/subscription')
    } finally {
      setLoading(false)
    }
  }, [router, supabase])

  useEffect(() => {
    checkUser()
  }, [router, checkUser])

  useEffect(() => {
    if (user) {
      fetchUserSubscription()
    }
  }, [user])

  const fetchUserSubscription = async () => {
    if (!user) return
    
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          subscription_plans (
            name,
            name_en,
            description,
            features,
            max_conversions_per_month
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gt('current_period_end', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('获取订阅信息失败:', error)
        return
      }

      setUserSubscription(data)
    } catch (error) {
      console.error('获取订阅信息异常:', error)
    }
  }

  const handleSubscribe = async (planKey: string) => {
    if (!user) {
      router.push('/auth/login?redirect=/subscription')
      return
    }

    setSubscribing(planKey)

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planKey,
          successUrl: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/subscription`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建支付会话失败')
      }

      // 重定向到Stripe Checkout
      window.location.href = data.url
    } catch (error) {
      console.error('订阅失败:', error)
      toast.error(error instanceof Error ? error.message : '订阅失败，请稍后重试')
      setSubscribing(null)
    }
  }

  const handleManageSubscription = async () => {
    if (!user) return

    setManagingSubscription(true)

    try {
      const response = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/subscription`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建管理会话失败')
      }

      // 重定向到Stripe客户门户
      window.location.href = data.url
    } catch (error) {
      console.error('管理订阅失败:', error)
      toast.error(error instanceof Error ? error.message : '管理订阅失败，请稍后重试')
      setManagingSubscription(false)
    }
  }

  const formatPrice = (amount: number) => {
    return `¥${(amount / 100).toFixed(0)}`
  }

  const getPlanIcon = (planKey: string) => {
    switch (planKey) {
      case 'MONTHLY':
        return <Zap className="h-6 w-6" />
      case 'QUARTERLY':
        return <Shield className="h-6 w-6" />
      case 'YEARLY':
        return <Crown className="h-6 w-6" />
      default:
        return <Clock className="h-6 w-6" />
    }
  }

  const getPlanBadge = (planKey: string) => {
    switch (planKey) {
      case 'QUARTERLY':
        return <Badge variant="secondary">节省8%</Badge>
      case 'YEARLY':
        return <Badge variant="default">节省14%</Badge>
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">选择您的订阅计划</h1>
        <p className="text-muted-foreground text-lg">
          解锁PDF转换的全部功能，提升您的工作效率
        </p>
      </div>

      {/* 当前订阅状态 */}
      {userSubscription && (
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <CardTitle className="text-green-800">当前订阅</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{userSubscription.subscription_plans.name}</p>
                <p className="text-sm text-muted-foreground">
                  有效期至: {new Date(userSubscription.current_period_end).toLocaleDateString('zh-CN')}
                </p>
                {userSubscription.cancel_at_period_end && (
                  <p className="text-sm text-orange-600 mt-1">
                    订阅将在期末自动取消
                  </p>
                )}
              </div>
              <Button 
                onClick={handleManageSubscription}
                disabled={managingSubscription}
                variant="outline"
              >
                {managingSubscription ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                管理订阅
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 订阅计划 */}
      <div className="grid md:grid-cols-3 gap-6">
        {Object.entries(SUBSCRIPTION_PLANS).map(([planKey, plan]) => {
          const isCurrentPlan = userSubscription?.subscription_plans.name === plan.name
          const isPopular = planKey === 'YEARLY'
          
          return (
            <Card 
              key={planKey} 
              className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''} ${isCurrentPlan ? 'border-green-500' : ''}`}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    最受欢迎
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-2">
                  {getPlanIcon(planKey)}
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                  {plan.name}
                  {getPlanBadge(planKey)}
                </CardTitle>
                <CardDescription>{plan.nameEn}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold">{formatPrice(plan.amount)}</span>
                  <span className="text-muted-foreground">/{plan.interval === 'year' ? '年' : '月'}</span>
                </div>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                {isCurrentPlan ? (
                  <Button className="w-full" disabled>
                    当前计划
                  </Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleSubscribe(planKey)}
                    disabled={subscribing === planKey || !!userSubscription}
                    variant={isPopular ? 'default' : 'outline'}
                  >
                    {subscribing === planKey ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {userSubscription ? '切换计划' : '立即订阅'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <Separator className="my-8" />

      {/* 常见问题 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">常见问题</h2>
        <div className="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
          <div>
            <h3 className="font-semibold mb-2">可以随时取消订阅吗？</h3>
            <p className="text-muted-foreground text-sm">
              是的，您可以随时取消订阅。取消后，您仍可以使用服务直到当前计费周期结束。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">支持哪些支付方式？</h3>
            <p className="text-muted-foreground text-sm">
              我们支持所有主要的信用卡和借记卡，包括Visa、Mastercard、American Express等。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">转换次数如何计算？</h3>
            <p className="text-muted-foreground text-sm">
              每次成功的PDF转换都会计入您的月度配额。失败的转换不会消耗次数。
            </p>
          </div>
          <div>
            <h3 className="font-semibold mb-2">可以升级或降级计划吗？</h3>
            <p className="text-muted-foreground text-sm">
              可以，您可以随时通过订阅管理页面更改您的计划。费用将按比例调整。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}