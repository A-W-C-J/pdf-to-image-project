'use client'

import React from 'react'
import styles from './button-stylus.module.styl'
import { cn } from '@/lib/utils'

interface ButtonStylusProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function ButtonStylus({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonStylusProps) {
  return (
    <button
      className={cn(
        styles.button,
        styles[variant],
        styles[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}