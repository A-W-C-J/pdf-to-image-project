'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle } from 'lucide-react'
import { SUBSCRIPTION_PLANS } from '@/lib/stripe/stripe-client'
import { useAuth } from '@/lib/hooks/use-auth'
import { toast } from 'sonner'

interface SubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  feature?: string
}

export function SubscriptionModal({ open, onOpenChange, feature = 'PDF转换功能' }: SubscriptionModalProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<number>(2) // 默认选择年度订阅（索引2）

  const handleSubscribe = async () => {
    if (!user) {
      router.push('/auth/login?redirect=' + encodeURIComponent(window.location.pathname))
      return
    }

    setIsLoading(true)
    try {
      const selectedPlanData = plans[selectedPlan]
      
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          planKey: selectedPlanData.key.toUpperCase(),
          successUrl: `${window.location.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: window.location.origin
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建支付会话失败')
      }

      // 关闭弹窗并重定向到Stripe Checkout
      onOpenChange(false)
      window.location.href = data.url
    } catch (error) {
      console.error('订阅失败:', error)
      toast.error(error instanceof Error ? error.message : '订阅失败，请稍后重试')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  const plans = Object.entries(SUBSCRIPTION_PLANS).map(([key, plan]) => ({
    key,
    name: plan.name,
    price: `¥${(plan.amount / 100).toFixed(0)}`,
    period: plan.interval === 'year' ? '/年' : ('intervalCount' in plan && plan.intervalCount === 3) ? '/3个月' : '/月',
    features: plan.features,
    popular: key === 'YEARLY',
    badge: key === 'QUARTERLY' ? '节省8%' : key === 'YEARLY' ? '节省14%' : undefined
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            订阅付费计划
          </DialogTitle>
          <DialogDescription className="text-base">
            您需要订阅付费计划才能使用{feature}。选择适合您的计划开始使用高级功能。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {plans.map((plan, index) => (
            <div
              key={index}
              onClick={() => setSelectedPlan(index)}
              className={`relative rounded-lg border p-4 transition-colors cursor-pointer ${
                selectedPlan === index
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                  : plan.popular
                  ? 'border-primary bg-primary/5 hover:bg-primary/10'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-4 bg-primary text-primary-foreground">
                  推荐
                </Badge>
              )}
              {plan.badge && !plan.popular && (
                <Badge className="absolute -top-2 left-4 bg-green-500 text-white">
                  {plan.badge}
                </Badge>
              )}
              {plan.badge && plan.popular && (
                <Badge className="absolute -top-2 left-16 bg-green-500 text-white">
                  {plan.badge}
                </Badge>
              )}
              {selectedPlan === index && (
                <div className="absolute -top-2 right-4">
                  <Badge className="bg-green-500 text-white">
                    已选择
                  </Badge>
                </div>
              )}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{plan.name}</h3>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground ml-1">{plan.period}</span>
                  </div>
                </div>
              </div>
              <ul className="space-y-2">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto"
          >
            稍后再说
          </Button>
          <Button
            onClick={handleSubscribe}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? '创建支付会话中...' : '立即订阅'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default SubscriptionModal