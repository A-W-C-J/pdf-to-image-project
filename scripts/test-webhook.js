const fs = require('fs')
const path = require('path')

// 手动加载.env.local文件
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '')
      process.env[key.trim()] = value
    }
  })
}

// 环境变量加载完成
// NEXT_PUBLIC_SUPABASE_URL检查
// SUPABASE_SERVICE_ROLE_KEY检查
// STRIPE_WEBHOOK_SECRET检查

// 模拟webhook测试
async function testWebhook() {
  // 开始测试 Webhook 处理
  
  // 模拟的Stripe checkout session数据
  const mockSession = {
    id: 'cs_test_' + Date.now(),
    object: 'checkout.session',
    payment_status: 'paid',
    payment_intent: 'pi_test_' + Date.now(),
    amount_total: 2990, // ¥29.9
    currency: 'cny',
    metadata: {
      userId: '00000000-0000-0000-0000-000000000001' // 测试用户ID
    }
  }
  
  // 模拟的 Session 数据准备完成
  
  try {
    // 发送POST请求到webhook端点
    const response = await fetch('http://localhost:3001/api/stripe/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature' // 这里需要真实的签名，但我们先测试基本流程
      },
      body: JSON.stringify({
        id: 'evt_test_' + Date.now(),
        object: 'event',
        type: 'checkout.session.completed',
        data: {
          object: mockSession
        }
      })
    })
    
    // Webhook 响应状态检查
    const responseText = await response.text()
    // Webhook 响应内容检查
    
    if (response.ok) {
      // Webhook 调用成功
    } else {
      // Webhook 调用失败
    }
    
  } catch (error) {
     // 测试 Webhook 时发生错误
   }
}

// 测试数据库连接和函数
async function testDatabaseConnection() {
  // 测试数据库连接
  
  try {
    const { createClient } = require('@supabase/supabase-js')
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      // Supabase 环境变量未正确配置
      return
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // 测试连接
    // 正在测试数据库连接
    const { data, error } = await supabase
      .from('user_quotas')
      .select('count')
      .limit(1)
    
    if (error) {
      // 数据库连接失败
    } else {
      // 数据库连接成功
    }
    
    // 测试用户额度函数
    const testUserId = '00000000-0000-0000-0000-000000000001'
    // 正在测试 get_user_quota 函数
    
    const { data: quotaData, error: quotaError } = await supabase
      .rpc('get_user_quota', { p_user_id: testUserId })
    
    if (quotaError) {
      // get_user_quota 函数调用失败
    } else {
      // get_user_quota 函数调用成功
   // 返回数据检查完成
    }
    
  } catch (error) {
     // 测试数据库连接时发生错误
   }
}

// 运行所有测试
async function runTests() {
  // 开始运行支付流程测试
  // 当前时间记录
  
  await testDatabaseConnection()
  
  // 等待一下再测试webhook
  // 等待2秒后测试webhook
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  await testWebhook()
  
  // 所有测试完成
}

// 运行测试
runTests().catch(error => {
  // 测试运行失败
  process.exit(1)
})