'use client'

import * as React from 'react'
import * as AvatarPrimitive from '@radix-ui/react-avatar'
import { cn } from '@/lib/utils'

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image
    ref={ref}
    className={cn('aspect-square h-full w-full', className)}
    {...props}
  />
))
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white border-2 border-white dark:border-gray-800 shadow-lg ring-2 ring-blue-200 dark:ring-purple-800',
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

// 带角标的头像组件
interface AvatarWithBadgeProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  badgeText?: string
  badgeColor?: string
  showBadge?: boolean
  children: React.ReactNode
}

const AvatarWithBadge = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  AvatarWithBadgeProps
>(({ className, badgeText, badgeColor = 'text-purple-600 bg-purple-100', showBadge = false, children, ...props }, ref) => (
  <div className="relative">
    <Avatar ref={ref} className={className} {...props}>
      {children}
    </Avatar>
    {showBadge && badgeText && (
      <div
        className={cn(
          'absolute -top-1 -right-1 z-10 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold rounded-full border border-white dark:border-gray-800 shadow-sm',
          badgeColor
        )}
      >
        {badgeText}
      </div>
    )}
  </div>
))
AvatarWithBadge.displayName = 'AvatarWithBadge'

export { Avatar, AvatarImage, AvatarFallback, AvatarWithBadge }