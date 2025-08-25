# Stripe 配置验证修复

## 问题描述

之前的 `STRIPE_SECRET_KEY` 验证逻辑在客户端和服务端都会执行，但 `STRIPE_SECRET_KEY` 只在服务端可用，导致客户端总是抛出错误。

## 解决方案

### 1. 环境检测验证

添加了 `typeof window === 'undefined'` 检测，确保验证逻辑只在服务端执行：

```typescript
// 服务端环境检测：只在服务端验证 Stripe 配置
const isServerSide = typeof window === 'undefined'

if (isServerSide && process.env.NODE_ENV === 'production') {
  // 验证逻辑
}
```

### 2. 专用验证函数

新增 `validateStripeConfig()` 函数，专门用于服务端配置验证：

```typescript
export function validateStripeConfig() {
  // 确保只在服务端执行
  if (typeof window !== 'undefined') {
    throw new Error('validateStripeConfig should only be called on the server side')
  }
  
  // 验证逻辑...
}
```

## 使用方法

### 在 API 路由中验证

```typescript
// app/api/stripe/example/route.ts
import { validateStripeConfig } from '@/lib/stripe/stripe-client'

export async function POST() {
  // 验证 Stripe 配置
  try {
    validateStripeConfig()
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
  
  // 继续处理...
}
```

### 在服务端组件中验证

```typescript
// app/admin/stripe-config/page.tsx
import { validateStripeConfig } from '@/lib/stripe/stripe-client'

export default function StripeConfigPage() {
  const config = validateStripeConfig()
  
  return (
    <div>
      <h1>Stripe 配置状态</h1>
      <p>环境: {config.environment}</p>
      <p>密钥类型: {config.keyType}</p>
    </div>
  )
}
```

## 优势

1. **客户端安全**: 验证逻辑不会在客户端执行
2. **灵活性**: 可以按需在特定 API 路由中验证
3. **调试友好**: 提供详细的配置状态信息
4. **生产安全**: 严格验证生产环境配置

## 注意事项

- `validateStripeConfig()` 只能在服务端调用
- 生产环境会严格检查密钥格式和类型
- 使用测试密钥时会显示警告信息