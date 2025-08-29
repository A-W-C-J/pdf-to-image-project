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
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing Stripe signature' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

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
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Webhook handler failed' },
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
      // Error: Missing userId in session metadata
      return
    }

    let priceId: string | undefined
    let product: Stripe.Product | string | Stripe.DeletedProduct | null | undefined
    let convCount = 0

    if (session.line_items?.data?.length > 0) {
      const lineItem = session.line_items.data[0]
      priceId = lineItem.price?.id
      product = lineItem.price?.product
      if (typeof product === 'object' && product?.metadata) {
        convCount = parseInt(product.metadata.CONV_COUNT || '0')
      }
    }

    if (!priceId || convCount <= 0) {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ['data.price.product']
      })
      priceId = lineItems.data[0]?.price?.id
      if (!priceId) {
        // Error: Could not retrieve price ID
        return
      }
      const price = lineItems.data[0]?.price
      if (price && typeof price.product === 'object') {
        product = price.product
        convCount = parseInt(product.metadata?.CONV_COUNT || '0')
      } else {
        const retrievedPrice = await stripe.prices.retrieve(priceId)
        const retrievedProduct = await stripe.products.retrieve(
          retrievedPrice.product as string
        )
        product = retrievedProduct
        convCount = parseInt(product.metadata?.CONV_COUNT || '0')
      }
    }

    if (convCount <= 0) {
      // Error: Invalid CONV_COUNT in product metadata
      return
    }

    const paymentRecord = {
      user_id: userId,
      stripe_payment_intent_id: session.payment_intent,
      stripe_session_id: session.id,
      amount: session.amount_total,
      currency: session.currency,
      quota_purchased: convCount,
      status: 'completed',
      metadata: {
        product_id: typeof product === 'object' ? product?.id : null,
        price_id: priceId,
        session_id: session.id
      }
    }

    const { error: paymentError } = await supabase
      .from('payment_records')
      .insert(paymentRecord)

    if (paymentError) {
      // Failed to record payment
      return
    }

    const { error: quotaError } = await supabase.rpc('add_user_quota', {
      p_user_id: userId,
      p_quota_amount: convCount
    })

    if (quotaError) {
      // Failed to add user quota
    }
  } catch (error) {
    // handleSuccessfulPayment function error
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
      // Failed to update payment record
    }
  } catch (error) {
    // updatePaymentRecord exception
  }
}