import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: '缺少Stripe签名' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook签名验证失败:', err)
      return NextResponse.json(
        { error: 'Webhook签名验证失败' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.payment_status === 'paid') {
          await handleSuccessfulPayment(session, supabase)
        }
        break
      }
      
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await updatePaymentRecord(paymentIntent, 'completed', supabase)
        break
      }
      
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await updatePaymentRecord(paymentIntent, 'failed', supabase)
        break
      }
      
      default:
        console.log(`未处理的事件类型: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook处理失败:', error)
    return NextResponse.json(
      { error: 'Webhook处理失败' },
      { status: 500 }
    )
  }
}

async function handleSuccessfulPayment(
  session: Stripe.Checkout.Session,
  supabase: SupabaseClient
) {
  try {
    const userId = session.metadata?.userId
    
    if (!userId) {
      console.error('支付会话中缺少用户ID')
      return
    }

    // 获取价格信息以确定购买的额度
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
    const priceId = lineItems.data[0]?.price?.id
    
    if (!priceId) {
      console.error('无法获取价格ID')
      return
    }

    // 获取价格详情和元数据
    const price = await stripe.prices.retrieve(priceId)
    const product = await stripe.products.retrieve(price.product as string)
    
    const convCount = parseInt(product.metadata?.CONV_COUNT || '0')
    
    if (convCount <= 0) {
      console.error('产品元数据中缺少有效的CONV_COUNT')
      return
    }

    // 记录支付信息
    const { error: paymentError } = await supabase
      .from('payment_records')
      .insert({
        user_id: userId,
        stripe_payment_intent_id: session.payment_intent,
        stripe_session_id: session.id,
        amount: session.amount_total,
        currency: session.currency,
        quota_purchased: convCount,
        status: 'completed',
        metadata: {
          product_id: product.id,
          price_id: priceId,
          session_id: session.id
        }
      })

    if (paymentError) {
      console.error('记录支付信息失败:', paymentError)
      return
    }

    // 增加用户额度
    const { error: quotaError } = await supabase
      .rpc('add_user_quota', {
        p_user_id: userId,
        p_quota_amount: convCount
      })

    if (quotaError) {
      console.error('增加用户额度失败:', quotaError)
      return
    }

    console.log(`成功为用户 ${userId} 增加 ${convCount} 页额度`)
  } catch (error) {
    console.error('处理成功支付失败:', error)
  }
}

async function updatePaymentRecord(
  paymentIntent: Stripe.PaymentIntent,
  status: string,
  supabase: SupabaseClient
) {
  try {
    const { error } = await supabase
      .from('payment_records')
      .update({ status })
      .eq('stripe_payment_intent_id', paymentIntent.id)

    if (error) {
      console.error('更新支付记录失败:', error)
    }
  } catch (error) {
    console.error('更新支付记录异常:', error)
  }
}