import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 获取用户额度信息
export async function GET() {
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

    // 获取用户额度信息
    const { data: quotaData, error: quotaError } = await supabase
      .rpc('get_user_quota', { p_user_id: user.id })

    if (quotaError) {
      console.error('获取用户额度失败:', quotaError)
      return NextResponse.json(
        { error: '获取用户额度失败' },
        { status: 500 }
      )
    }

    // 如果用户没有额度记录，返回默认值
    const quota = quotaData?.[0] || {
      total_quota: 0,
      used_quota: 0,
      remaining_quota: 0
    }

    return NextResponse.json({
      totalQuota: quota.total_quota,
      usedQuota: quota.used_quota,
      remainingQuota: quota.remaining_quota
    })
  } catch (error) {
    console.error('获取用户额度异常:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 消耗用户额度
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

    const { quotaAmount } = await request.json()
    
    if (!quotaAmount || quotaAmount <= 0) {
      return NextResponse.json(
        { error: '无效的额度数量' },
        { status: 400 }
      )
    }

    // 消耗用户额度
    const { data: success, error: consumeError } = await supabase
      .rpc('consume_user_quota', {
        p_user_id: user.id,
        p_pages_count: quotaAmount
      })

    if (consumeError) {
      console.error('消耗用户额度失败:', consumeError)
      return NextResponse.json(
        { error: '消耗用户额度失败' },
        { status: 500 }
      )
    }

    if (!success) {
      return NextResponse.json(
        { error: '额度不足' },
        { status: 400 }
      )
    }

    // 获取更新后的额度信息
    const { data: quotaData } = await supabase
      .rpc('get_user_quota', { p_user_id: user.id })

    const quota = quotaData?.[0] || {
      total_quota: 0,
      used_quota: 0,
      remaining_quota: 0
    }

    return NextResponse.json({
      success: true,
      totalQuota: quota.total_quota,
      usedQuota: quota.used_quota,
      remainingQuota: quota.remaining_quota
    })
  } catch (error) {
    console.error('消耗用户额度异常:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}