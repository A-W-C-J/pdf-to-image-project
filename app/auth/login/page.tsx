'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { language } = useLanguage()
  const [loading, setLoading] = useState(true)
  
  const redirectTo = searchParams.get('redirect') || '/'

  useEffect(() => {
    // 检查用户是否已登录
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        router.push(redirectTo)
        return
      }
      setLoading(false)
    }

    checkUser()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          router.push(redirectTo)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router, redirectTo])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* 返回按钮 */}
        <div className="flex items-center">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回首页
            </Link>
          </Button>
        </div>

        {/* 登录卡片 */}
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {language === 'zh' ? '登录账户' : 'Sign In'}
            </CardTitle>
            <CardDescription>
              {language === 'zh' 
                ? '登录后可使用PDF转文档等高级功能' 
                : 'Sign in to access advanced features like PDF conversion'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Auth
              supabaseClient={supabase}
              view="sign_in"
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: 'hsl(var(--primary))',
                      brandAccent: 'hsl(var(--primary))',
                      brandButtonText: 'hsl(var(--primary-foreground))',
                      defaultButtonBackground: 'hsl(var(--secondary))',
                      defaultButtonBackgroundHover: 'hsl(var(--secondary))',
                      defaultButtonBorder: 'hsl(var(--border))',
                      defaultButtonText: 'hsl(var(--secondary-foreground))',
                      dividerBackground: 'hsl(var(--border))',
                      inputBackground: 'hsl(var(--background))',
                      inputBorder: 'hsl(var(--border))',
                      inputBorderHover: 'hsl(var(--ring))',
                      inputBorderFocus: 'hsl(var(--ring))',
                      inputText: 'hsl(var(--foreground))',
                      inputLabelText: 'hsl(var(--foreground))',
                      inputPlaceholder: 'hsl(var(--muted-foreground))',
                      messageText: 'hsl(var(--foreground))',
                      messageTextDanger: 'hsl(var(--destructive))',
                      anchorTextColor: 'hsl(var(--primary))',
                      anchorTextHoverColor: 'hsl(var(--primary))',
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
                
                // 在生产环境中使用固定的生产域名，开发环境使用当前origin
                const isProduction = window.location.hostname !== 'localhost'
                const origin = isProduction ? 'https://www.pdf2img.top' : window.location.origin
                
                return `${origin}/auth/callback`
              })()}
            />
            
            <div className="flex justify-center mt-4">
              <Button variant="link" asChild>
                <Link href="/auth/register">
                  {language === 'zh' ? '没有账户？注册' : 'Don\'t have an account? Sign up'}
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}