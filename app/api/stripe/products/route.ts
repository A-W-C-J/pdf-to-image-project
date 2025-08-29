import { NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil'
})

export async function GET() {
  try {
    // 获取所有活跃的产品
    const products = await stripe.products.list({
      active: true,
      expand: ['data.default_price']
    })

    // 获取所有价格信息
    const prices = await stripe.prices.list({
      active: true,
      expand: ['data.product']
    })

    // 组合产品和价格信息
    const productsWithPrices = products.data.map(product => {
      // 找到该产品的所有价格
      const productPrices = prices.data.filter(price => 
        typeof price.product === 'object' ? price.product.id === product.id : price.product === product.id
      )

      return {
        id: product.id,
        name: product.name,
        description: product.description,
        images: product.images,
        metadata: product.metadata,
        marketing_features: product.marketing_features || [],
        prices: productPrices.map(price => ({
          id: price.id,
          unit_amount: price.unit_amount,
          currency: price.currency,
          type: price.type,
          recurring: price.recurring,
          metadata: price.metadata
        }))
      }
    })

    return NextResponse.json({
      products: productsWithPrices
    })
  } catch (error) {
    console.error('获取Stripe产品信息失败:', error)
    return NextResponse.json(
      { error: '获取产品信息失败' },
      { status: 500 }
    )
  }
}