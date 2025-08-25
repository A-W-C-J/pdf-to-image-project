'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Home } from 'lucide-react'
import { useLanguage } from '@/lib/i18n'

export default function AuthCodeErrorPage() {
  const router = useRouter()
  const { t } = useLanguage()

  useEffect(() => {
    // Auto redirect to home after 10 seconds
    const timer = setTimeout(() => {
      router.push('/')
    }, 10000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-semibold">
            {t('authError')}
          </CardTitle>
          <CardDescription>
            {t('authErrorDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground text-center">
            {t('autoRedirectMessage')}
          </div>
          <Button 
            onClick={() => router.push('/')} 
            className="w-full"
            variant="default"
          >
            <Home className="mr-2 h-4 w-4" />
            {t('backToHome')}
          </Button>
          <Button 
            onClick={() => router.push('/')} 
            className="w-full"
            variant="outline"
          >
            {t('tryAgain')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}