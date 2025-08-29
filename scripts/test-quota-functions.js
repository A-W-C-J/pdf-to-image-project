const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 手动加载.env.local文件
const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim()
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=')
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim()
        // 移除引号
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        process.env[key.trim()] = value
      }
    }
  })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('请确保.env.local文件中包含:')
  console.error('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testQuotaFunctions() {
  console.log('开始测试用户额度函数...')
  
  // 测试用户ID（可以是任何有效的UUID）
  const testUserId = '00000000-0000-0000-0000-000000000001'
  
  try {
    // 1. 测试获取用户额度（初始状态）
    console.log('\n1. 测试获取用户额度（初始状态）')
    const { data: initialQuota, error: getError1 } = await supabase
      .rpc('get_user_quota', { p_user_id: testUserId })
    
    if (getError1) {
      console.error('获取初始额度失败:', getError1)
    } else {
      console.log('初始额度:', initialQuota)
    }
    
    // 2. 测试增加用户额度
    console.log('\n2. 测试增加用户额度（增加100页）')
    const { data: addResult, error: addError } = await supabase
      .rpc('add_user_quota', {
        p_user_id: testUserId,
        p_quota_amount: 100
      })
    
    if (addError) {
      console.error('增加额度失败:', addError)
    } else {
      console.log('增加额度结果:', addResult)
    }
    
    // 3. 再次获取用户额度（验证增加是否成功）
    console.log('\n3. 验证额度增加是否成功')
    const { data: updatedQuota, error: getError2 } = await supabase
      .rpc('get_user_quota', { p_user_id: testUserId })
    
    if (getError2) {
      console.error('获取更新后额度失败:', getError2)
    } else {
      console.log('更新后额度:', updatedQuota)
    }
    
    // 4. 测试消耗用户额度
    console.log('\n4. 测试消耗用户额度（消耗10页）')
    const { data: consumeResult, error: consumeError } = await supabase
      .rpc('consume_user_quota', {
        p_user_id: testUserId,
        p_quota_amount: 10
      })
    
    if (consumeError) {
      console.error('消耗额度失败:', consumeError)
    } else {
      console.log('消耗额度结果:', consumeResult)
    }
    
    // 5. 最终获取用户额度
    console.log('\n5. 最终额度状态')
    const { data: finalQuota, error: getError3 } = await supabase
      .rpc('get_user_quota', { p_user_id: testUserId })
    
    if (getError3) {
      console.error('获取最终额度失败:', getError3)
    } else {
      console.log('最终额度:', finalQuota)
    }
    
    // 6. 测试支付记录插入
    console.log('\n6. 测试支付记录插入')
    const { data: paymentRecord, error: paymentError } = await supabase
      .from('payment_records')
      .insert({
        user_id: testUserId,
        stripe_payment_intent_id: 'pi_test_' + Date.now(),
        stripe_session_id: 'cs_test_' + Date.now(),
        amount: 1000, // $10.00
        currency: 'usd',
        quota_purchased: 100,
        status: 'completed',
        metadata: {
          test: true,
          product_id: 'prod_test',
          price_id: 'price_test'
        }
      })
      .select()
    
    if (paymentError) {
      console.error('插入支付记录失败:', paymentError)
    } else {
      console.log('支付记录插入成功:', paymentRecord)
    }
    
    console.log('\n✅ 所有测试完成')
    
  } catch (error) {
    console.error('测试过程中发生错误:', error)
  }
}

// 运行测试
testQuotaFunctions().then(() => {
  console.log('\n测试结束')
  process.exit(0)
}).catch(error => {
  console.error('测试失败:', error)
  process.exit(1)
})