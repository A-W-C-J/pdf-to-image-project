'use client'

import { useState } from 'react'
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
import { User, LogOut, Settings, Crown } from 'lucide-react'
import { toast } from 'sonner'
import { useLanguage } from '@/lib/i18n'

export function UserMenu() {
  const { user, isAuthenticated, signOut, getDisplayName, getAvatarUrl } = useAuth()
  const { t } = useLanguage()
  const [isSigningOut, setIsSigningOut] = useState(false)

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
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="cursor-pointer">
          <Crown className="mr-2 h-4 w-4" />
          <span>{t('advancedFeatures')}</span>
        </DropdownMenuItem>
        
        <DropdownMenuItem className="cursor-pointer">
          <Settings className="mr-2 h-4 w-4" />
          <span>{t('settings')}</span>
        </DropdownMenuItem>
        
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
  )
}