# Stripe 支付系统配置指南

本项目已集成 Stripe 支付系统，支持订阅功能。为了正常使用支付功能，您需要在 Stripe Dashboard 中配置产品和价格。

## 1. 创建 Stripe 账户

1. 访问 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 注册或登录您的 Stripe 账户
3. 完成账户验证（如果需要）

## 2. 获取 API 密钥

1. 在 Stripe Dashboard 中，导航到 **开发者** > **API 密钥**
2. 复制以下密钥：
   - **可发布密钥** (pk_test_...)
   - **密钥** (sk_test_...)

## 3. 创建产品和价格

### 3.1 创建产品

1. 在 Stripe Dashboard 中，导航到 **产品目录** > **产品**
2. 点击 **+ 添加产品**
3. 填写产品信息：
   - **名称**: PDF转换专业版
   - **描述**: 专业的PDF转换服务，支持转换为Word、Markdown、LaTeX格式

### 3.2 创建价格

为同一个产品创建三个不同的价格：

#### 月度订阅
- **价格模式**: 标准定价
- **价格**: ¥29.00 CNY
- **计费周期**: 月度
- **价格 ID**: 复制生成的价格 ID (price_xxx)

#### 季度订阅
- **价格模式**: 标准定价
- **价格**: ¥79.00 CNY
- **计费周期**: 每 3 个月
- **价格 ID**: 复制生成的价格 ID (price_xxx)

#### 年度订阅
- **价格模式**: 标准定价
- **价格**: ¥299.00 CNY
- **计费周期**: 年度
- **价格 ID**: 复制生成的价格 ID (price_xxx)

## 4. 配置环境变量

在项目根目录的 `.env.local` 文件中，更新以下配置：

```env
# Stripe API 密钥
STRIPE_SECRET_KEY="sk_test_your_actual_secret_key_here"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_actual_publishable_key_here"

# Stripe 价格 ID
STRIPE_MONTHLY_PRICE_ID="price_your_actual_monthly_price_id"
STRIPE_QUARTERLY_PRICE_ID="price_your_actual_quarterly_price_id"
STRIPE_YEARLY_PRICE_ID="price_your_actual_yearly_price_id"
```

## 5. 配置 Webhook

1. 在 Stripe Dashboard 中，导航到 **开发者** > **Webhooks**
2. 点击 **+ 添加端点**
3. 配置 Webhook：
   - **端点 URL**: `https://your-domain.com/api/webhooks/stripe`
   - **监听事件**: 选择以下事件
     - `checkout.session.completed`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
4. 复制 **签名密钥** (whsec_xxx)
5. 在 `.env.local` 中更新：
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_your_actual_webhook_secret"
   ```

## 6. 测试支付功能

### 6.1 测试卡号

Stripe 提供了测试卡号用于开发环境测试：

- **成功支付**: 4242 4242 4242 4242
- **需要验证**: 4000 0025 0000 3155
- **被拒绝**: 4000 0000 0000 0002

### 6.2 测试流程

1. 启动开发服务器：`pnpm dev`
2. 访问 `http://localhost:3000`
3. 点击订阅按钮
4. 使用测试卡号完成支付
5. 验证订阅状态是否正确更新

## 7. 生产环境部署

在生产环境中：

1. 将测试密钥替换为生产密钥 (sk_live_... 和 pk_live_...)
2. 更新 Webhook 端点 URL 为生产域名
3. 确保所有价格 ID 都是生产环境的价格 ID

## 故障排除

### 常见错误

1. **Price ID not configured**: 检查 `.env.local` 中的价格 ID 是否正确
2. **Invalid API key**: 检查 Stripe 密钥是否正确复制
3. **Webhook signature verification failed**: 检查 Webhook 密钥是否正确

### 调试技巧

1. 查看 Stripe Dashboard 中的日志
2. 检查浏览器开发者工具的网络请求
3. 查看服务器控制台输出

## 支持

如果遇到问题，请参考：
- [Stripe 官方文档](https://stripe.com/docs)
- [Stripe API 参考](https://stripe.com/docs/api)
- [Next.js Stripe 集成指南](https://stripe.com/docs/payments/checkout/how-checkout-works)