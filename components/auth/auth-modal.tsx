'use client'

import { useState } from 'react'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { User, LogIn } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  view?: 'sign_in' | 'sign_up'
}

export function AuthModal({ isOpen, onClose, view = 'sign_in' }: AuthModalProps) {
  const supabase = createClient()
  const { t, language } = useLanguage()
  const [authView, setAuthView] = useState<'sign_in' | 'sign_up'>(view)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {authView === 'sign_in' ? t('loginAccount') : t('registerAccount')}
          </DialogTitle>
          <DialogDescription>
            {authView === 'sign_in'
              ? t('loginDescription')
              : t('registerDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Auth
            supabaseClient={supabase}
            view={authView}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary))',
                    inputBackground: 'hsl(var(--background))',
                    inputText: 'hsl(var(--foreground))',
                    inputBorder: 'hsl(var(--border))',
                    inputBorderHover: 'hsl(var(--ring))',
                    inputBorderFocus: 'hsl(var(--ring))',
                  },
                },
              },
              className: {
                container: 'space-y-4',
                button: 'w-full px-4 py-2 rounded-md font-medium transition-colors',
                input: 'w-full px-3 py-2 border rounded-md bg-background text-foreground border-border focus:border-ring',
                label: 'text-foreground',
              },
            }}
            localization={{
              variables: language === 'zh' ? {
                sign_in: {
                  email_label: '邮箱地址',
                  password_label: '密码',
                  button_label: '登录',
                  loading_button_label: '登录中...',
                  social_provider_text: '使用 {{provider}} 登录',
                  link_text: '已有账户？点击登录',
                },
                sign_up: {
                  email_label: '邮箱地址',
                  password_label: '密码',
                  button_label: '注册',
                  loading_button_label: '注册中...',
                  social_provider_text: '使用 {{provider}} 注册',
                  link_text: '没有账户？点击注册',
                },
                magic_link: {
                  email_input_label: '邮箱地址',
                  button_label: '发送魔法链接',
                  loading_button_label: '发送中...',
                  link_text: '通过魔法链接登录',
                  confirmation_text: '请检查您的邮箱并点击链接完成登录',
                },
                forgotten_password: {
                  email_label: '邮箱地址',
                  button_label: '发送重置链接',
                  loading_button_label: '发送中...',
                  link_text: '忘记密码？',
                  confirmation_text: '请检查您的邮箱并点击链接重置密码',
                },
              } : {
                sign_in: {
                  email_label: 'Email address',
                  password_label: 'Password',
                  button_label: 'Sign in',
                  loading_button_label: 'Signing in...',
                  social_provider_text: 'Sign in with {{provider}}',
                  link_text: 'Already have an account? Sign in',
                },
                sign_up: {
                  email_label: 'Email address',
                  password_label: 'Password',
                  button_label: 'Sign up',
                  loading_button_label: 'Signing up...',
                  social_provider_text: 'Sign up with {{provider}}',
                  link_text: 'Don\'t have an account? Sign up',
                },
                magic_link: {
                  email_input_label: 'Email address',
                  button_label: 'Send magic link',
                  loading_button_label: 'Sending...',
                  link_text: 'Send a magic link email',
                  confirmation_text: 'Check your email for the magic link',
                },
                forgotten_password: {
                  email_label: 'Email address',
                  button_label: 'Send reset instructions',
                  loading_button_label: 'Sending...',
                  link_text: 'Forgot your password?',
                  confirmation_text: 'Check your email for the password reset link',
                },
              },
            }}
            providers={['google', 'github']}
            redirectTo={(() => {
              if (typeof window === 'undefined') return '/auth/callback'
              
              // 使用环境变量配置的站点URL，如果没有则使用当前origin
              const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
              const origin = siteUrl || window.location.origin
              
              return `${origin}/auth/callback`
            })()}
          />
          
          <div className="flex justify-center space-x-2 text-sm">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAuthView(authView === 'sign_in' ? 'sign_up' : 'sign_in')}
            >
              {authView === 'sign_in' ? t('noAccount') : t('hasAccount')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AuthButton() {
  const { t } = useLanguage()
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2"
      >
        <LogIn className="h-4 w-4" />
        {t('login')}
      </Button>
      
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}