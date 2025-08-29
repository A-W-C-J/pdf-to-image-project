'use client'

import { useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  })
  
  const supabase = createClient()

  useEffect(() => {
    // 获取初始会话
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        // Error getting session
      }
      
      setAuthState({
        user: session?.user ?? null,
        session,
        loading: false,
      })
    }

    getInitialSession()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // Auth state changed
        
        setAuthState({
          user: session?.user ?? null,
          session,
          loading: false,
        })
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  // 登出函数
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        // Error signing out
        throw error
      }
    } catch (error) {
      // Sign out error
      throw error
    }
  }

  // 检查用户是否有特定权限
  const hasPermission = (permission: string) => {
    if (!authState.user) return false
    
    // 这里可以根据用户的角色或订阅状态来判断权限
    // 目前简单地检查用户是否已登录
    switch (permission) {
      case 'pdf-to-document':
        return true // 登录用户都可以使用PDF转文档功能
      case 'batch-processing':
        return true // 登录用户都可以使用批量处理
      case 'cloud-storage':
        return true // 登录用户都可以使用云端存储
      default:
        return false
    }
  }

  // 获取用户显示名称
  const getDisplayName = () => {
    if (!authState.user) return null
    
    return (
      authState.user.user_metadata?.full_name ||
      authState.user.user_metadata?.name ||
      authState.user.email?.split('@')[0] ||
      '用户'
    )
  }

  // 获取用户头像
  const getAvatarUrl = () => {
    if (!authState.user) return null
    
    return (
      authState.user.user_metadata?.avatar_url ||
      authState.user.user_metadata?.picture ||
      null
    )
  }

  return {
    ...authState,
    signOut,
    hasPermission,
    getDisplayName,
    getAvatarUrl,
    isAuthenticated: !!authState.user,
  }
}