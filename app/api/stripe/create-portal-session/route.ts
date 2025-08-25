import { type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createCustomerPortalSession } from '@/lib/stripe/stripe-client'
import { z } from 'zod'

const createPortalSchema = z.object({
  returnUrl: z.string().url().optional()
})

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: '请先登录后再访问订阅管理',
        code: 'UNAUTHORIZED'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 验证请求数据
    const body = await request.json()
    const validation = createPortalSchema.safeParse(body)
    
    if (!validation.success) {
      return new Response(JSON.stringify({ 
        error: '请求参数无效',
        details: validation.error.errors
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const { returnUrl } = validation.data

    // 获取用户的Stripe客户ID
    const { data: userSubscription } = await supabase
      .from('user_subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!userSubscription?.stripe_customer_id) {
      return new Response(JSON.stringify({ 
        error: '未找到订阅信息，请先订阅后再访问管理页面',
        code: 'NO_SUBSCRIPTION'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 构建默认的返回URL
    const baseUrl = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const defaultReturnUrl = `${baseUrl}/subscription`

    // 创建客户门户会话
    const session = await createCustomerPortalSession({
      customerId: userSubscription.stripe_customer_id,
      returnUrl: returnUrl || defaultReturnUrl
    })

    return new Response(JSON.stringify({ 
      url: session.url
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('创建Stripe客户门户会话失败:', error)
    
    return new Response(JSON.stringify({ 
      error: '创建订阅管理会话失败，请稍后重试',
      details: error instanceof Error ? error.message : '未知错误'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}