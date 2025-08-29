'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { AuthButton } from './auth-modal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User, LogOut, CreditCard, Coins } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export function UserMenu() {
  const { user, isAuthenticated, signOut, getDisplayName, getAvatarUrl } = useAuth()
  const { t } = useLanguage()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [userQuota, setUserQuota] = useState<number | null>(null)
  const [isLoadingQuota, setIsLoadingQuota] = useState(false)

  // 获取用户额度
  const fetchUserQuota = useCallback(async () => {
    console.log('=== 用户菜单：开始获取用户额度 ===')
    console.log('用户ID:', user?.id)
    console.log('当前时间:', new Date().toISOString())
    
    if (!user?.id) {
      console.log('❌ 用户ID不存在，无法获取额度')
      return
    }
    
    try {
      setIsLoadingQuota(true)
      console.log('正在创建 Supabase 客户端...')
      const supabase = createClient()
      console.log('✅ Supabase 客户端创建成功')
      
      console.log('正在调用 get_user_quota 函数...')
      console.log('参数: p_user_id =', user.id)
      
      const { data, error } = await supabase
        .rpc('get_user_quota', { p_user_id: user.id })
      
      console.log('get_user_quota 返回结果:')
      console.log('- data:', data)
      console.log('- error:', error)
      
      if (error) {
        console.error('❌ 获取用户额度失败:', error)
        console.log('错误详情:', JSON.stringify(error, null, 2))
        setUserQuota(0)
        return
      }
      
      const remainingQuota = data && data.length > 0 ? data[0].remaining_quota : 0
      console.log('解析的剩余额度:', remainingQuota)
      console.log('数据详情:', JSON.stringify(data, null, 2))
      
      setUserQuota(remainingQuota)
      console.log('✅ 用户额度设置成功:', remainingQuota)
    } catch (error) {
      console.error('❌ 获取用户额度时发生异常:', error)
      console.log('异常堆栈:', error instanceof Error ? error.stack : 'No stack trace')
      setUserQuota(0)
    } finally {
      setIsLoadingQuota(false)
      console.log('=== 用户菜单：额度获取完成 ===')
    }
  }, [user?.id])

  // 监听用户变化，获取额度
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchUserQuota()
    } else {
      setUserQuota(null)
    }
  }, [isAuthenticated, user?.id, fetchUserQuota, setUserQuota])

  // 定期刷新额度（每30秒）
  useEffect(() => {
    if (!isAuthenticated) return
    
    const interval = setInterval(() => {
      fetchUserQuota()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [isAuthenticated, fetchUserQuota])

  if (!isAuthenticated) {
    return <AuthButton />
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true)
      await signOut()
      toast.success(t('logoutSuccess'))
    } catch (error) {
      console.error('Sign out error:', error)
      toast.error(t('logoutFailed'))
    } finally {
      setIsSigningOut(false)
    }
  }

  const displayName = getDisplayName()
  const avatarUrl = getAvatarUrl()
  const userEmail = user?.email

  return (
    <div className="flex items-center gap-3">
      {/* 额度显示 */}
      {isAuthenticated && (
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-muted-foreground" />
          <Badge variant="secondary" className="text-xs">
            {isLoadingQuota ? '...' : `${userQuota || 0} ${t('pages')}`}
          </Badge>
        </div>
      )}
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={avatarUrl || undefined} alt={displayName || t('userAvatar')} />
              <AvatarFallback>
                {displayName ? displayName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
      
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {displayName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {userEmail}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Coins className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {t('remainingQuota')}: {isLoadingQuota ? t('loading') : `${userQuota || 0} ${t('pages')}`}
                </span>
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          <Link href="/topup">
            <DropdownMenuItem className="cursor-pointer">
              <CreditCard className="mr-2 h-4 w-4" />
              <span>{t('topup')}</span>
            </DropdownMenuItem>
          </Link>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem
            className="cursor-pointer text-red-600 focus:text-red-600"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>{isSigningOut ? t('loggingOut') : t('logout')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}