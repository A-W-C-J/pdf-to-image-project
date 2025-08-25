import { type NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { verifyWebhookSignature } from '@/lib/stripe/stripe-client'
import { createClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

// Extended Stripe types to include missing properties
interface ExtendedSubscription extends Stripe.Subscription {
  current_period_start: number
  current_period_end: number
  cancel_at_period_end: boolean
}

interface ExtendedInvoice extends Stripe.Invoice {
  subscription: string
  payment_intent: string
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

if (!webhookSecret) {
  throw new Error('STRIPE_WEBHOOK_SECRET is required')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header')
      return new Response('Missing stripe-signature header', { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = verifyWebhookSignature(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Webhook signature verification failed', { status: 400 })
    }

    console.log('Received Stripe webhook event:', event.type)

    // 处理不同类型的事件
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response('Webhook processed successfully', { status: 200 })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response('Webhook processing failed', { status: 500 })
  }
}

/**
 * 处理结账会话完成事件
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    const userId = session.client_reference_id || session.metadata?.userId
    const planKey = session.metadata?.planKey

    if (!userId) {
      console.error('No user ID found in checkout session')
      return
    }

    console.log(`Checkout completed for user ${userId}, plan: ${planKey}`)

    // 如果是订阅模式，订阅信息会在 customer.subscription.created 事件中处理
    if (session.mode === 'subscription') {
      console.log('Subscription checkout completed, waiting for subscription.created event')
      return
    }

    // 处理一次性支付（如果有的话）
    // 这里可以添加一次性支付的处理逻辑
  } catch (error) {
    console.error('Error handling checkout session completed:', error)
  }
}

/**
 * 处理订阅创建事件
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    const userId = subscription.metadata?.userId
    const planKey = subscription.metadata?.planKey

    if (!userId) {
      console.error('No user ID found in subscription metadata')
      return
    }

    console.log(`Creating subscription for user ${userId}, plan: ${planKey}`)

    const supabase = await createClient()
    const extendedSubscription = subscription as ExtendedSubscription

    // 获取订阅计划信息
    const { data: subscriptionPlan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('stripe_price_id', subscription.items.data[0].price.id)
      .single()

    if (!subscriptionPlan) {
      console.error(`No subscription plan found for price ID: ${subscription.items.data[0].price.id}`)
      return
    }

    // 创建用户订阅记录
    const { error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        subscription_plan_id: subscriptionPlan.id,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        status: subscription.status,
        current_period_start: new Date(extendedSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(extendedSubscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: extendedSubscription.cancel_at_period_end
      })

    if (subscriptionError) {
      console.error('Error creating user subscription:', subscriptionError)
      return
    }

    console.log(`Subscription created successfully for user ${userId}`)
  } catch (error) {
    console.error('Error handling subscription created:', error)
  }
}

/**
 * 处理订阅更新事件
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription updated:', subscription.id)
  
  try {
    const supabase = await createClient()
    const extendedSubscription = subscription as ExtendedSubscription
    
    // 更新用户订阅记录
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: subscription.status,
        current_period_start: new Date(extendedSubscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(extendedSubscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: extendedSubscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Error updating subscription:', error)
      return
    }

    console.log(`Subscription ${subscription.id} updated successfully`)
  } catch (error) {
    console.error('Error handling subscription updated:', error)
  }
}

/**
 * 处理订阅删除事件
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const supabase = await createClient()

    // 更新订阅状态为已取消
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.id)

    if (error) {
      console.error('Error canceling subscription:', error)
      return
    }

    console.log(`Subscription ${subscription.id} canceled successfully`)
  } catch (error) {
    console.error('Error handling subscription deleted:', error)
  }
}

/**
 * 处理发票支付成功事件
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    const extendedInvoice = invoice as ExtendedInvoice
    const subscriptionId = extendedInvoice.subscription
    
    if (!subscriptionId) {
      console.log('Invoice not related to subscription, skipping')
      return
    }

    const supabase = await createClient()

    // 获取用户订阅信息
    const { data: userSubscription } = await supabase
      .from('user_subscriptions')
      .select('user_id, subscription_plan_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (!userSubscription) {
      console.error(`No user subscription found for Stripe subscription: ${subscriptionId}`)
      return
    }

    // 记录支付记录
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userSubscription.user_id,
        subscription_plan_id: userSubscription.subscription_plan_id,
        stripe_payment_intent_id: extendedInvoice.payment_intent,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_paid,
        currency: invoice.currency,
        status: 'succeeded',
        payment_method: 'stripe'
      })

    if (paymentError) {
      console.error('Error recording payment:', paymentError)
      return
    }

    console.log(`Payment recorded successfully for invoice ${invoice.id}`)
  } catch (error) {
    console.error('Error handling invoice payment succeeded:', error)
  }
}

/**
 * 处理发票支付失败事件
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const extendedInvoice = invoice as ExtendedInvoice
    const subscriptionId = extendedInvoice.subscription
    
    if (!subscriptionId) {
      console.log('Invoice not related to subscription, skipping')
      return
    }

    const supabase = await createClient()

    // 获取用户订阅信息
    const { data: userSubscription } = await supabase
      .from('user_subscriptions')
      .select('user_id, subscription_plan_id')
      .eq('stripe_subscription_id', subscriptionId)
      .single()

    if (!userSubscription) {
      console.error(`No user subscription found for Stripe subscription: ${subscriptionId}`)
      return
    }

    // 记录失败的支付记录
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: userSubscription.user_id,
        subscription_plan_id: userSubscription.subscription_plan_id,
        stripe_payment_intent_id: extendedInvoice.payment_intent,
        stripe_invoice_id: invoice.id,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        payment_method: 'stripe',
        error_message: 'Payment failed'
      })

    if (paymentError) {
      console.error('Error recording failed payment:', paymentError)
      return
    }

    console.log(`Failed payment recorded for invoice ${invoice.id}`)
  } catch (error) {
    console.error('Error handling invoice payment failed:', error)
  }
}