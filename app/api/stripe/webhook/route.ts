import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  console.log('\n🔔 收到 Stripe Webhook 请求')
  console.log('时间:', new Date().toISOString())
  
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')
    
    console.log('请求体长度:', body.length)
    console.log('Stripe 签名存在:', !!signature)

    if (!signature) {
      console.error('❌ 错误: 缺少Stripe签名')
      return NextResponse.json(
        { error: '缺少Stripe签名' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
      console.log('✅ Webhook 签名验证成功')
      console.log('事件类型:', event.type)
      console.log('事件ID:', event.id)
    } catch (err) {
      console.error('❌ Webhook签名验证失败:', err)
      return NextResponse.json(
        { error: 'Webhook签名验证失败' },
        { status: 400 }
      )
    }

    console.log('正在创建 Supabase 服务客户端...')
    const supabase = createServiceClient()
    console.log('✅ Supabase 服务客户端创建成功')

    console.log('\n📋 开始处理事件:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        console.log('🛒 处理 checkout.session.completed 事件')
        const session = event.data.object as Stripe.Checkout.Session
        
        if (session.payment_status === 'paid') {
          console.log('✅ 支付状态为已支付，开始处理成功支付')
          await handleSuccessfulPayment(session, supabase)
        } else {
          console.log('⚠️ 支付状态不是已支付:', session.payment_status)
        }
        break
      }
      
      case 'payment_intent.succeeded': {
        console.log('💳 处理 payment_intent.succeeded 事件')
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await updatePaymentRecord(paymentIntent, 'completed', supabase)
        break
      }
      
      case 'payment_intent.payment_failed': {
        console.log('❌ 处理 payment_intent.payment_failed 事件')
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await updatePaymentRecord(paymentIntent, 'failed', supabase)
        break
      }
      
      default:
        console.log(`⚠️ 未处理的事件类型: ${event.type}`)
    }

    console.log('✅ Webhook 处理完成\n')
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('❌ Webhook处理失败:', error)
    console.log('错误堆栈:', error instanceof Error ? error.stack : 'No stack trace')
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
  console.log('=== 开始处理支付成功事件 ===')
  console.log('Session ID:', session.id)
  console.log('Session 完整信息:', JSON.stringify(session, null, 2))
  
  try {
    // 获取用户ID
    const userId = session.metadata?.userId
    console.log('从 session metadata 获取的 userId:', userId)
    
    if (!userId) {
      console.error('❌ 错误: session metadata 中没有 userId')
      console.log('Session metadata:', session.metadata)
      return
    }

    console.log('✅ 用户ID验证通过:', userId)

    // 检查 session 是否包含 line_items（通过 expand 参数获取）
    console.log('检查 session 中的 line_items...')
    console.log('Session line_items:', session.line_items)
    
    let priceId: string | undefined
    let product: Stripe.Product | string | Stripe.DeletedProduct | null | undefined
    let convCount = 0
    
    if (session.line_items && session.line_items.data && session.line_items.data.length > 0) {
      console.log('✅ 从 session 中找到 line_items')
      const lineItem = session.line_items.data[0]
      console.log('Line item 详情:', JSON.stringify(lineItem, null, 2))
      
      priceId = lineItem.price?.id
      product = lineItem.price?.product
      
      if (typeof product === 'object' && product.metadata) {
        console.log('✅ 从 line_item 中获取产品信息')
        console.log('产品 metadata:', product.metadata)
        convCount = parseInt(product.metadata?.CONV_COUNT || '0')
      }
    }
    
    // 如果 session 中没有 line_items，回退到 API 调用
    if (!priceId || convCount <= 0) {
      console.log('⚠️ Session 中缺少 line_items，回退到 API 调用')
      console.log('正在获取 line items...')
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product']
      })
      console.log('Line items 数量:', lineItems.data.length)
      console.log('Line items 详情:', JSON.stringify(lineItems.data, null, 2))
      
      priceId = lineItems.data[0]?.price?.id
      console.log('获取的 price ID:', priceId)
      
      if (!priceId) {
        console.error('❌ 错误: 无法获取价格ID')
        return
      }

      // 获取产品信息
      const price = lineItems.data[0]?.price
      if (price && typeof price.product === 'object') {
        product = price.product
        console.log('产品信息:', JSON.stringify(product, null, 2))
        console.log('产品 metadata:', product.metadata)
        convCount = parseInt(product.metadata?.CONV_COUNT || '0')
      } else {
        console.log('正在获取产品信息...')
        const retrievedPrice = await stripe.prices.retrieve(priceId)
        const retrievedProduct = await stripe.products.retrieve(retrievedPrice.product as string)
        product = retrievedProduct
        console.log('产品信息:', JSON.stringify(product, null, 2))
        console.log('产品 metadata:', product.metadata)
        convCount = parseInt(product.metadata?.CONV_COUNT || '0')
      }
    }
    
    console.log('✅ 价格ID验证通过:', priceId)
    console.log('从产品 metadata 解析的 CONV_COUNT:', convCount)
    
    if (convCount <= 0) {
      console.error('❌ 错误: 产品元数据中缺少有效的CONV_COUNT:', convCount)
      console.log('产品 metadata 完整信息:', product.metadata)
      return
    }

    console.log('✅ CONV_COUNT 验证通过:', convCount)

    // 记录支付信息
    console.log('正在插入支付记录到数据库...')
    const paymentRecord = {
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
    }
    
    console.log('准备插入的支付记录:', JSON.stringify(paymentRecord, null, 2))
    
    const { data: insertData, error: paymentError } = await supabase
      .from('payment_records')
      .insert(paymentRecord)
      .select()

    if (paymentError) {
      console.error('❌ 记录支付信息失败:', paymentError)
      console.log('错误详情:', JSON.stringify(paymentError, null, 2))
      return
    }

    console.log('✅ 支付记录插入成功:', insertData)

    // 增加用户额度
    console.log('正在调用 add_user_quota 函数...')
    console.log('参数: p_user_id =', userId, ', p_quota_amount =', convCount)
    
    const { data: quotaData, error: quotaError } = await supabase
      .rpc('add_user_quota', {
        p_user_id: userId,
        p_quota_amount: convCount
      })

    if (quotaError) {
      console.error('❌ 调用 add_user_quota 函数失败:', quotaError)
      console.log('错误详情:', JSON.stringify(quotaError, null, 2))
      return
    }

    console.log('✅ add_user_quota 函数调用成功')
    console.log('返回数据:', quotaData)
    
    // 验证额度是否真的增加了
    console.log('正在验证用户额度是否增加...')
    const { data: currentQuota, error: getQuotaError } = await supabase
      .rpc('get_user_quota', { p_user_id: userId })
    
    if (getQuotaError) {
      console.error('❌ 获取用户当前额度失败:', getQuotaError)
    } else {
      console.log('✅ 用户当前额度信息:', currentQuota)
    }

    console.log(`🎉 成功为用户 ${userId} 增加了 ${convCount} 页额度`)
    console.log('=== 支付处理完成 ===')
  } catch (error) {
    console.error('❌ handleSuccessfulPayment 函数执行出错:', error)
    console.log('错误堆栈:', error instanceof Error ? error.stack : 'No stack trace')
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