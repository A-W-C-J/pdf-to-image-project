# OAuth 配置指南

## 问题描述

如果您在生产环境中遇到 Google/GitHub 登录后被重定向到 `http://localhost:3000/` 而不是您的生产域名的问题，这是因为 Supabase 的 OAuth 重定向 URL 配置不正确。

## 解决方案

### 步骤 1：配置 Supabase OAuth 重定向 URL

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 登录您的账户并选择您的项目
3. 在左侧导航栏中，点击 **"Authentication"**
4. 点击 **"URL Configuration"** 标签
5. 在 **"Redirect URLs"** 部分，添加以下 URL：
   ```
   https://www.pdf2img.top/auth/callback
   http://localhost:3000/auth/callback
   ```
6. 点击 **"Save"** 保存配置

### 步骤 2：配置 Google OAuth

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 选择您的项目或创建新项目
3. 启用 Google+ API
4. 转到 **"Credentials"** > **"OAuth 2.0 Client IDs"**
5. 编辑您的 OAuth 2.0 客户端
6. 在 **"Authorized redirect URIs"** 中添加：
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   （将 `your-project-ref` 替换为您的实际 Supabase 项目引用）

### 步骤 3：配置 GitHub OAuth

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击您的 OAuth App 或创建新的 OAuth App
3. 在 **"Authorization callback URL"** 中设置：
   ```
   https://your-project-ref.supabase.co/auth/v1/callback
   ```
   （将 `your-project-ref` 替换为您的实际 Supabase 项目引用）

### 步骤 4：验证配置

1. 部署您的应用到生产环境
2. 访问 `https://www.pdf2img.top/`
3. 尝试使用 Google 或 GitHub 登录
4. 确认登录后重定向到正确的生产域名

## 重要说明

- 确保在 Supabase 的 **"Site URL"** 设置中配置了正确的生产域名：`https://www.pdf2img.top`
- OAuth 提供商（Google/GitHub）的回调 URL 应该指向 Supabase 的认证端点，而不是您的应用域名
- 您的应用中的 `redirectTo` 参数应该指向您的应用域名的 `/auth/callback` 路径

## 常见问题

### Q: 仍然重定向到 localhost
A: 检查浏览器缓存，清除所有相关 cookies，或使用无痕模式测试。

### Q: OAuth 登录失败
A: 确保 Google/GitHub OAuth 应用的回调 URL 正确配置为 Supabase 的认证端点。

### Q: 如何找到 Supabase 项目引用
A: 在 Supabase Dashboard 的项目设置中，或者从您的 `NEXT_PUBLIC_SUPABASE_URL` 环境变量中获取。