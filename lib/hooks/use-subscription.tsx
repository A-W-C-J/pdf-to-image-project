'use client'

import { useEffect, useState } from 'react'
import { useAuth } from './use-auth'
import { createClient } from '@/lib/supabase/client'

export interface UserSubscription {
  hasActiveSubscription: boolean
  subscriptionPlanName: string | null
  planType: 'free' | 'basic' | 'pro' | 'enterprise'
  conversionsRemaining: number
  currentPeriodEnd: Date | null
  loading: boolean
}

export function useSubscription() {
  const { user, isAuthenticated } = useAuth()
  const [subscription, setSubscription] = useState<UserSubscription>({
    hasActiveSubscription: false,
    subscriptionPlanName: null,
    planType: 'free',
    conversionsRemaining: 0,
    currentPeriodEnd: null,
    loading: true,
  })

  const supabase = createClient()

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setSubscription({
        hasActiveSubscription: false,
        subscriptionPlanName: null,
        planType: 'free',
        conversionsRemaining: 0,
        currentPeriodEnd: null,
        loading: false,
      })
      return
    }

    const fetchSubscriptionStatus = async () => {
      try {
        // 调用数据库函数检查订阅状态
        const { data, error } = await supabase
          .rpc('check_user_subscription_status', { user_uuid: user.id })
          .single()

        if (error) {
          console.error('检查订阅状态失败:', error)
          setSubscription(prev => ({ ...prev, loading: false }))
          return
        }

        const {
          has_active_subscription: hasActiveSubscription,
          subscription_plan_name: subscriptionPlanName,
          conversions_remaining: conversionsRemaining,
          current_period_end: currentPeriodEnd
        } = data as {
          has_active_subscription: boolean
          subscription_plan_name: string | null
          conversions_remaining: number
          current_period_end: string | null
        }

        // 根据订阅计划名称确定计划类型
        let planType: 'free' | 'basic' | 'pro' | 'enterprise' = 'free'
        if (hasActiveSubscription && subscriptionPlanName) {
          const planName = subscriptionPlanName.toLowerCase()
          if (planName.includes('基础') || planName.includes('basic')) {
            planType = 'basic'
          } else if (planName.includes('专业') || planName.includes('professional') || planName.includes('pro')) {
            planType = 'pro'
          } else if (planName.includes('企业') || planName.includes('enterprise')) {
            planType = 'enterprise'
          }
        }

        setSubscription({
          hasActiveSubscription,
          subscriptionPlanName,
          planType,
          conversionsRemaining,
          currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
          loading: false,
        })
      } catch (error) {
        console.error('获取订阅状态异常:', error)
        setSubscription(prev => ({ ...prev, loading: false }))
      }
    }

    fetchSubscriptionStatus()
  }, [user, isAuthenticated, supabase])

  // 获取计划显示名称
  const getPlanDisplayName = () => {
    switch (subscription.planType) {
      case 'basic':
        return 'Basic'
      case 'pro':
        return 'Pro'
      case 'enterprise':
        return 'Enterprise'
      default:
        return 'Free'
    }
  }

  // 获取计划颜色
  const getPlanColor = () => {
    switch (subscription.planType) {
      case 'basic':
        return 'text-blue-600 bg-blue-100'
      case 'pro':
        return 'text-purple-600 bg-purple-100'
      case 'enterprise':
        return 'text-amber-600 bg-amber-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return {
    ...subscription,
    getPlanDisplayName,
    getPlanColor,
  }
}