import { createClient } from '@/lib/supabase/server'

export interface SubscriptionStatus {
  hasActiveSubscription: boolean
  subscriptionPlanName: string | null
  conversionsRemaining: number
  currentPeriodEnd: Date | null
  canConvert: boolean
  message?: string
}

export interface ConversionUsageParams {
  conversionType: string
  fileName?: string
  fileSize?: number
  pagesCount?: number
  success?: boolean
  errorMessage?: string
  processingTimeMs?: number
}

/**
 * 检查用户订阅状态和转换权限
 */
export async function checkUserSubscription(userId: string): Promise<SubscriptionStatus> {
  try {
    const supabase = await createClient()
    
    // 调用数据库函数检查订阅状态
    const { data, error } = await supabase
      .rpc('check_user_subscription_status', { user_uuid: userId })
      .single()
    
    if (error) {
      console.error('检查订阅状态失败:', error)
      return {
        hasActiveSubscription: false,
        subscriptionPlanName: null,
        conversionsRemaining: 0,
        currentPeriodEnd: null,
        canConvert: false,
        message: '无法验证订阅状态'
      }
    }

    const {
      has_active_subscription: hasActiveSubscription,
      subscription_plan_name: subscriptionPlanName,
      conversions_remaining: conversionsRemaining,
      current_period_end: currentPeriodEnd
    } = data as {
      has_active_subscription: boolean
      subscription_plan_name: string | null
      conversions_remaining: number
      current_period_end: string | null
    }

    // 判断是否可以转换
    const canConvert = hasActiveSubscription && (conversionsRemaining > 0 || conversionsRemaining === -1)
    
    let message: string | undefined
    if (!hasActiveSubscription) {
      message = '您需要订阅付费计划才能使用PDF转换功能'
    } else if (conversionsRemaining === 0) {
      message = '本月转换次数已用完，请升级订阅计划或等待下月重置'
    }

    return {
      hasActiveSubscription,
      subscriptionPlanName,
      conversionsRemaining,
      currentPeriodEnd: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
      canConvert,
      message
    }
  } catch (error) {
    console.error('检查订阅状态异常:', error)
    return {
      hasActiveSubscription: false,
      subscriptionPlanName: null,
      conversionsRemaining: 0,
      currentPeriodEnd: null,
      canConvert: false,
      message: '系统错误，请稍后重试'
    }
  }
}

/**
 * 记录转换使用情况
 */
export async function recordConversionUsage(
  userId: string,
  params: ConversionUsageParams
): Promise<string | null> {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .rpc('record_conversion_usage', {
        user_uuid: userId,
        conversion_type_param: params.conversionType,
        file_name_param: params.fileName || null,
        file_size_param: params.fileSize || null,
        pages_count_param: params.pagesCount || null,
        success_param: params.success ?? true,
        error_message_param: params.errorMessage || null,
        processing_time_ms_param: params.processingTimeMs || null
      })
    
    if (error) {
      console.error('记录转换使用失败:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('记录转换使用异常:', error)
    return null
  }
}

/**
 * 获取用户订阅计划列表
 */
export async function getSubscriptionPlans() {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true })
    
    if (error) {
      console.error('获取订阅计划失败:', error)
      return []
    }
    
    return data || []
  } catch (error) {
    console.error('获取订阅计划异常:', error)
    return []
  }
}

/**
 * 获取用户当前订阅信息
 */
export async function getUserSubscription(userId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_plans (
          name,
          name_en,
          description,
          description_en,
          features,
          features_en,
          max_conversions_per_month
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .gt('current_period_end', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 是没有找到记录的错误
      console.error('获取用户订阅失败:', error)
      return null
    }
    
    return data
  } catch (error) {
    console.error('获取用户订阅异常:', error)
    return null
  }
}

/**
 * 检查转换类型是否需要订阅
 */
export function isConversionTypeRequiresSubscription(conversionType: string): boolean {
  // 定义需要订阅的转换类型
  const subscriptionRequiredTypes = [
    'pdf_to_word',
    'pdf_to_docx',
    'pdf_to_markdown',
    'pdf_to_latex',
    'pdf_to_tex'
  ]
  
  return subscriptionRequiredTypes.includes(conversionType)
}

/**
 * 创建订阅检查中间件
 */
export async function createSubscriptionMiddleware(
  userId: string,
  conversionType: string
): Promise<{ allowed: boolean; status: SubscriptionStatus }> {
  // 检查是否需要订阅
  if (!isConversionTypeRequiresSubscription(conversionType)) {
    return {
      allowed: true,
      status: {
        hasActiveSubscription: true,
        subscriptionPlanName: 'Free',
        conversionsRemaining: -1,
        currentPeriodEnd: null,
        canConvert: true
      }
    }
  }
  
  // 检查用户订阅状态
  const status = await checkUserSubscription(userId)
  
  return {
    allowed: status.canConvert,
    status
  }
}