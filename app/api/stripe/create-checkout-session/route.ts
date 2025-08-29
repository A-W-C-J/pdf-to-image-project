import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // 验证用户身份
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '用户未登录' },
        { status: 401 }
      )
    }

    const { priceId } = await request.json()
    
    if (!priceId) {
      return NextResponse.json(
        { error: '缺少价格ID' },
        { status: 400 }
      )
    }

    // 创建Stripe Checkout会话
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/topup/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/topup/cancel`,
      metadata: {
        userId: user.id
      },
      customer_email: user.email || undefined,
      // 确保 webhook 包含 line_items 和产品信息
      expand: ['line_items.data.price.product']
    })

    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    })
  } catch (error) {
    console.error('创建支付会话失败:', error)
    return NextResponse.json(
      { error: '创建支付会话失败' },
      { status: 500 }
    )
  }
}