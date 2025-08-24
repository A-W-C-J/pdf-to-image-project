'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新state以显示错误UI
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // 调用自定义错误处理函数
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // 在生产环境中，可以将错误发送到错误监控服务
    if (process.env.NODE_ENV === 'production') {
      // 例如：发送到Sentry、LogRocket等
      // errorReportingService.captureException(error, { extra: errorInfo })
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-xl font-semibold text-red-600 dark:text-red-400">
                出现了一个错误
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center text-sm text-muted-foreground">
                <p>抱歉，应用程序遇到了一个意外错误。</p>
                <p>请尝试刷新页面或返回首页。</p>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4 rounded border p-2 text-xs">
                  <summary className="cursor-pointer font-medium text-red-600">
                    错误详情 (开发模式)
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>错误信息:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-words bg-gray-100 p-2 dark:bg-gray-800">
                        {this.state.error.message}
                      </pre>
                    </div>
                    <div>
                      <strong>错误堆栈:</strong>
                      <pre className="mt-1 whitespace-pre-wrap break-words bg-gray-100 p-2 text-xs dark:bg-gray-800">
                        {this.state.error.stack}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>组件堆栈:</strong>
                        <pre className="mt-1 whitespace-pre-wrap break-words bg-gray-100 p-2 text-xs dark:bg-gray-800">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
              
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button 
                  onClick={this.handleRetry} 
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重试
                </Button>
                <Button 
                  asChild 
                  variant="outline" 
                  className="flex-1"
                >
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    返回首页
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// 高阶组件版本，用于函数组件
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

// Hook版本，用于在函数组件中处理异步错误
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null)
  
  const resetError = React.useCallback(() => {
    setError(null)
  }, [])
  
  const handleError = React.useCallback((error: Error) => {
    console.error('Async error caught:', error)
    setError(error)
    
    // 在生产环境中发送错误报告
    if (process.env.NODE_ENV === 'production') {
      // errorReportingService.captureException(error)
    }
  }, [])
  
  // 如果有错误，抛出它以便ErrorBoundary捕获
  React.useEffect(() => {
    if (error) {
      throw error
    }
  }, [error])
  
  return { handleError, resetError }
}