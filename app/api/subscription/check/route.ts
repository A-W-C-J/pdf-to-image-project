import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    // 验证用户身份
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return new Response(JSON.stringify({ 
        error: '请先登录后再检查订阅状态',
        code: 'UNAUTHORIZED',
        hasActiveSubscription: false
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 检查用户订阅状态
    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (
          name,
          max_conversions_per_month,
          features
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subscriptionError && subscriptionError.code !== 'PGRST116') {
      console.error('订阅查询错误:', subscriptionError)
      return new Response(JSON.stringify({ 
        error: '查询订阅状态失败',
        hasActiveSubscription: false
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const hasActiveSubscription = !!subscription

    if (!hasActiveSubscription) {
      return new Response(JSON.stringify({
        hasActiveSubscription: false,
        subscriptionPlanName: null,
        conversionsRemaining: 0,
        currentPeriodEnd: null,
        canConvert: false,
        message: '您需要订阅付费计划才能使用PDF转换功能'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // 获取当前周期的转换使用情况
    const { data: usageData, error: usageError } = await supabase
      .from('conversion_usage')
      .select('conversion_type')
      .eq('user_id', user.id)
      .gte('created_at', subscription.current_period_start)
      .lte('created_at', subscription.current_period_end)
      .eq('success', true)

    if (usageError) {
      console.error('使用情况查询错误:', usageError)
    }

    const conversionsUsed = usageData?.length || 0
    const monthlyLimit = subscription.subscription_plans?.max_conversions_per_month || 0
    const conversionsRemaining = monthlyLimit === -1 ? -1 : Math.max(0, monthlyLimit - conversionsUsed)
    const canConvert = conversionsRemaining > 0 || conversionsRemaining === -1

    return new Response(JSON.stringify({
      hasActiveSubscription: true,
      subscriptionPlanName: subscription.subscription_plans?.name,
      conversionsRemaining,
      currentPeriodEnd: subscription.current_period_end,
      canConvert,
      message: canConvert 
        ? (conversionsRemaining === -1 ? '您拥有无限制转换权限' : `您还可以转换 ${conversionsRemaining} 个文件`) 
        : '本月转换次数已用完，请升级订阅或等待下个周期'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('检查订阅状态失败:', error)
    
    return new Response(JSON.stringify({ 
      error: '检查订阅状态失败，请稍后重试',
      hasActiveSubscription: false,
      details: error instanceof Error ? error.message : '未知错误'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}