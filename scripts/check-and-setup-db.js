const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// 从环境变量读取Supabase配置
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  // 缺少Supabase配置信息
  // 请确保.env.local文件中包含:
  // - NEXT_PUBLIC_SUPABASE_URL
  // - SUPABASE_SERVICE_ROLE_KEY
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAndSetupDatabase() {
  try {
    // 检查数据库状态
    
    // 检查user_quotas表是否存在
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_quotas')
    
    if (tableError) {
      // 检查表失败
      return
    }
    
    const userQuotasExists = tables && tables.length > 0
    // user_quotas表状态检查
    
    // 检查触发器是否存在
    const { data: triggers, error: triggerError } = await supabase
      .rpc('check_trigger_exists', { trigger_name: 'on_auth_user_created' })
      .single()
    
    if (triggerError && !triggerError.message.includes('function check_trigger_exists')) {
      // 检查触发器失败
    }
    
    // 如果表不存在或需要重新创建，执行脚本
    if (!userQuotasExists) {
      // 开始执行数据库脚本
      
      const sqlScript = fs.readFileSync(path.join(__dirname, '004_create_user_quota_table_safe.sql'), 'utf8')
      
      // 分割SQL脚本为多个语句
      const statements = sqlScript
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      
      for (const statement of statements) {
        if (statement.includes('SELECT ') && statement.includes('result')) {
          // 跳过结果显示语句
          continue
        }
        
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_statement: statement })
          if (error && !error.message.includes('already exists')) {
            // SQL语句执行警告
          }
        } catch (err) {
          // 尝试直接执行
          const { error } = await supabase.from('_').select('*').limit(0)
          // 忽略某些预期的错误
        }
      }
      
      // 数据库脚本执行完成
    }
    
    // 验证设置
    // 验证数据库设置
    
    // 检查表结构
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'user_quotas')
    
    if (columnError) {
      // 检查表结构失败
    } else if (columns) {
      // user_quotas表结构检查完成
    }
    
    // 数据库检查完成
     // 下一步:
     // 1. 确保用户注册时会自动创建额度记录
     // 2. 测试新用户注册流程
     // 3. 验证额度显示和扣除功能
    
  } catch (error) {
    // 数据库检查失败
  }
}

checkAndSetupDatabase()