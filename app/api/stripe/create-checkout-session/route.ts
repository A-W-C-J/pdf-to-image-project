import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCheckoutSession, SUBSCRIPTION_PLANS, type SubscriptionPlanKey } from '@/lib/stripe/stripe-client'
import { z } from 'zod'

const createCheckoutSchema = z.object({
  planKey: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional()
})

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: '请先登录后再订阅',
        code: 'UNAUTHORIZED'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 验证请求数据
    const body = await request.json()
    const validation = createCheckoutSchema.safeParse(body)
    
    if (!validation.success) {
      return new Response(JSON.stringify({ 
        error: '请求参数无效',
        details: validation.error.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { planKey, successUrl, cancelUrl } = validation.data

    // 检查用户是否已有活跃订阅
    const { data: existingSubscription } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString())
      .single()

    if (existingSubscription) {
      return new Response(JSON.stringify({ 
        error: '您已有活跃的订阅，请先取消现有订阅后再订阅新计划',
        code: 'EXISTING_SUBSCRIPTION'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 获取用户邮箱
    const userEmail = user.email
    if (!userEmail) {
      return new Response(JSON.stringify({ 
        error: '用户邮箱信息缺失',
        code: 'MISSING_EMAIL'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 构建默认的成功和取消URL
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const defaultSuccessUrl = `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`
    const defaultCancelUrl = `${baseUrl}/subscription/cancel`

    // 创建Stripe Checkout会话
    const session = await createCheckoutSession({
      planKey: planKey as SubscriptionPlanKey,
      userId: user.id,
      userEmail,
      successUrl: successUrl || defaultSuccessUrl,
      cancelUrl: cancelUrl || defaultCancelUrl
    })

    return new Response(JSON.stringify({ 
      sessionId: session.id,
      url: session.url,
      planInfo: SUBSCRIPTION_PLANS[planKey as SubscriptionPlanKey]
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('创建Stripe Checkout会话失败:', error)
    
    return new Response(JSON.stringify({ 
      error: '创建支付会话失败，请稍后重试',
      details: error instanceof Error ? error.message : '未知错误'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}