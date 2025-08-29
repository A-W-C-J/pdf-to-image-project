import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || '中文'
    const limit = parseInt(searchParams.get('limit') || '10')
    
    const supabase = await createClient()
    
    // 获取热门主题（按使用次数和最近使用时间排序）
    const { data: topics, error } = await supabase
      .from('topic_history')
      .select('topic, used_count, last_used_at')
      .eq('language', language)
      .order('used_count', { ascending: false })
      .order('last_used_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      // Error fetching topic history
      return NextResponse.json({ error: '获取主题历史失败' }, { status: 500 })
    }
    
    return NextResponse.json({ topics: topics || [] })
  } catch (error) {
    // Topic history API error
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { topic, language = '中文' } = await request.json()
    
    if (!topic) {
      return NextResponse.json({ error: '主题不能为空' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // 检查主题是否已存在
    const { data: existingTopic, error: checkError } = await supabase
      .from('topic_history')
      .select('id, used_count')
      .eq('topic', topic)
      .eq('language', language)
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      // Error checking existing topic
      return NextResponse.json({ error: '检查主题失败' }, { status: 500 })
    }
    
    if (existingTopic) {
      // 更新现有主题的使用次数和最后使用时间
      const { error: updateError } = await supabase
        .from('topic_history')
        .update({
          used_count: existingTopic.used_count + 1,
          last_used_at: new Date().toISOString()
        })
        .eq('id', existingTopic.id)
      
      if (updateError) {
        // Error updating topic
        return NextResponse.json({ error: '更新主题失败' }, { status: 500 })
      }
    } else {
      // 创建新主题记录
      const { error: insertError } = await supabase
        .from('topic_history')
        .insert({
          topic,
          language,
          used_count: 1,
          last_used_at: new Date().toISOString()
        })
      
      if (insertError) {
        // Error inserting topic
        return NextResponse.json({ error: '保存主题失败' }, { status: 500 })
      }
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    // Topic history POST API error
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}