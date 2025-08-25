import Stripe from 'stripe'

// 在开发环境中，如果没有设置 Stripe 密钥，使用测试密钥或跳过初始化
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_key_for_development'

// 调试信息：检查环境变量
console.log('Environment Debug Info:', {
  NODE_ENV: process.env.NODE_ENV,
  STRIPE_SECRET_KEY_EXISTS: !!process.env.STRIPE_SECRET_KEY,
  STRIPE_SECRET_KEY_PREFIX: process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) + '...' : 'undefined'
})

// 验证生产环境的 Stripe 配置
if (process.env.NODE_ENV === 'production') {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      'STRIPE_SECRET_KEY is required in production environment. ' +
      'Please set the STRIPE_SECRET_KEY environment variable with a valid Stripe secret key.'
    )
  }
  
  if (!process.env.STRIPE_SECRET_KEY.startsWith('sk_live_') && !process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    throw new Error(
      'Invalid STRIPE_SECRET_KEY format. ' +
      'Stripe secret keys should start with "sk_live_" or "sk_test_".'
    )
  }
  
  // 在生产环境中警告使用测试密钥
  if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    console.warn(
      'WARNING: Using Stripe test key in production environment. ' +
      'Please use a live key (sk_live_*) for production.'
    )
  }
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2025-07-30.basil',
  typescript: true
})

// 订阅计划配置
export const SUBSCRIPTION_PLANS = {
  MONTHLY: {
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_test_monthly_dummy',
    name: 'PDF转换专业版 - 月度订阅',
    nameEn: 'PDF Converter Pro - Monthly',
    interval: 'month' as const,
    amount: 2900, // 29元
    currency: 'cny',
    features: [
      '每月无限次转换次数',
      '支持转换为Word、Markdown、LaTeX格式'
    ],
    featuresEn: [
      'Unlimited conversions per month',
      'Convert to Word, Markdown, LaTeX formats'
    ]
  },
  QUARTERLY: {
    priceId: process.env.STRIPE_QUARTERLY_PRICE_ID || 'price_test_quarterly_dummy',
    name: 'PDF转换专业版 - 季度订阅',
    nameEn: 'PDF Converter Pro - Quarterly',
    interval: 'month' as const,
    intervalCount: 3,
    amount: 7900, // 79元 (节省8%)
    currency: 'cny',
    features: [
      '每月无限次转换次数',
      '支持转换为Word、Markdown、LaTeX格式',
      '季度订阅享8%优惠'
    ],
    featuresEn: [
      'Unlimited conversions per month',
      'Convert to Word, Markdown, LaTeX formats',
      '8% discount for quarterly subscription'
    ]
  },
  YEARLY: {
    priceId: process.env.STRIPE_YEARLY_PRICE_ID || 'price_test_yearly_dummy',
    name: 'PDF转换专业版 - 年度订阅',
    nameEn: 'PDF Converter Pro - Yearly',
    interval: 'year' as const,
    amount: 29900, // 299元 (节省14%)
    currency: 'cny',
    features: [
      '每月无限次转换次数',
      '支持转换为Word、Markdown、LaTeX格式',
      '年度订阅享14%优惠'
    ],
    featuresEn: [
      'Unlimited conversions per month',
      'Convert to Word, Markdown, LaTeX formats',
      '14% discount for yearly subscription'
    ]
  }
} as const

export type SubscriptionPlanKey = keyof typeof SUBSCRIPTION_PLANS

/**
 * 创建Stripe Checkout会话
 */
export async function createCheckoutSession({
  planKey,
  userId,
  userEmail,
  successUrl,
  cancelUrl
}: {
  planKey: SubscriptionPlanKey
  userId: string
  userEmail: string
  successUrl: string
  cancelUrl: string
}) {
  const plan = SUBSCRIPTION_PLANS[planKey]
  
  if (!plan.priceId) {
    throw new Error(`Price ID not configured for plan: ${planKey}`)
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: plan.priceId,
        quantity: 1
      }
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: userEmail,
    client_reference_id: userId,
    metadata: {
      userId,
      planKey,
      planName: plan.name
    },
    subscription_data: {
      metadata: {
        userId,
        planKey,
        planName: plan.name
      }
    },
    allow_promotion_codes: true,
    billing_address_collection: 'auto'
  })

  return session
}

/**
 * 创建客户门户会话
 */
export async function createCustomerPortalSession({
  customerId,
  returnUrl
}: {
  customerId: string
  returnUrl: string
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl
  })

  return session
}

/**
 * 获取订阅信息
 */
export async function getSubscription(subscriptionId: string) {
  return await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method', 'customer']
  })
}

/**
 * 取消订阅
 */
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true
  })
}

/**
 * 恢复订阅
 */
export async function resumeSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false
  })
}

/**
 * 验证Webhook签名
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
) {
  return stripe.webhooks.constructEvent(payload, signature, secret)
}

/**
 * 获取客户信息
 */
export async function getCustomer(customerId: string) {
  return await stripe.customers.retrieve(customerId)
}

/**
 * 创建或获取客户
 */
export async function createOrGetCustomer({
  email,
  userId,
  name
}: {
  email: string
  userId: string
  name?: string
}) {
  // 先尝试查找现有客户
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1
  })

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0]
  }

  // 创建新客户
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      userId
    }
  })
}