-- 订阅计划表
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  description TEXT,
  description_en TEXT,
  price_monthly DECIMAL(10,2),
  price_quarterly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  stripe_price_id_monthly VARCHAR(255),
  stripe_price_id_quarterly VARCHAR(255),
  stripe_price_id_yearly VARCHAR(255),
  stripe_product_id VARCHAR(255),
  features JSONB DEFAULT '[]'::jsonb,
  features_en JSONB DEFAULT '[]'::jsonb,
  max_conversions_per_month INTEGER DEFAULT -1, -- -1 表示无限制
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 用户订阅表
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'inactive', -- active, inactive, canceled, past_due
  billing_cycle VARCHAR(20) NOT NULL, -- monthly, quarterly, yearly
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  conversions_used_this_month INTEGER DEFAULT 0,
  last_conversion_reset TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, subscription_plan_id)
);

-- 支付记录表
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_subscription_id UUID REFERENCES user_subscriptions(id),
  stripe_payment_intent_id VARCHAR(255) UNIQUE,
  stripe_invoice_id VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL, -- succeeded, pending, failed, canceled
  payment_method VARCHAR(50), -- card, alipay, wechat_pay
  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 转换使用记录表
CREATE TABLE IF NOT EXISTS conversion_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_subscription_id UUID REFERENCES user_subscriptions(id),
  conversion_type VARCHAR(50) NOT NULL, -- pdf_to_word, pdf_to_markdown, pdf_to_latex, pdf_to_docx
  file_name VARCHAR(255),
  file_size BIGINT,
  pages_count INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id ON user_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment_intent_id ON payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_conversion_usage_user_id ON conversion_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_usage_created_at ON conversion_usage(created_at);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为相关表添加更新时间触发器
CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON subscription_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON user_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 插入默认订阅计划
INSERT INTO subscription_plans (name, name_en, description, description_en, price_monthly, price_quarterly, price_yearly, features, features_en, max_conversions_per_month) VALUES
('基础版', 'Basic Plan', '适合个人用户的基础PDF转换服务', 'Basic PDF conversion service for individual users', 9.99, 26.99, 99.99, '["每月50次转换", "支持PDF转Word/Markdown/LaTeX", "基础技术支持"]'::jsonb, '["50 conversions per month", "PDF to Word/Markdown/LaTeX", "Basic technical support"]'::jsonb, 50),
('专业版', 'Professional Plan', '适合专业用户和小团队的高级PDF处理服务', 'Advanced PDF processing service for professionals and small teams', 19.99, 53.99, 199.99, '["每月200次转换", "支持所有转换格式", "优先技术支持", "批量处理"]'::jsonb, '["200 conversions per month", "All conversion formats", "Priority technical support", "Batch processing"]'::jsonb, 200),
('企业版', 'Enterprise Plan', '适合大型团队和企业的无限制PDF处理服务', 'Unlimited PDF processing service for large teams and enterprises', 49.99, 134.99, 499.99, '["无限次转换", "支持所有功能", "专属技术支持", "API访问", "自定义集成"]'::jsonb, '["Unlimited conversions", "All features included", "Dedicated technical support", "API access", "Custom integrations"]'::jsonb, -1)
ON CONFLICT DO NOTHING;

-- 创建RLS策略
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversion_usage ENABLE ROW LEVEL SECURITY;

-- 订阅计划表的RLS策略（所有人可读）
CREATE POLICY "subscription_plans_select_policy" ON subscription_plans FOR SELECT USING (true);

-- 用户订阅表的RLS策略（用户只能访问自己的订阅）
CREATE POLICY "user_subscriptions_select_policy" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_subscriptions_insert_policy" ON user_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_subscriptions_update_policy" ON user_subscriptions FOR UPDATE USING (auth.uid() = user_id);

-- 支付记录表的RLS策略（用户只能访问自己的支付记录）
CREATE POLICY "payments_select_policy" ON payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "payments_insert_policy" ON payments FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 转换使用记录表的RLS策略（用户只能访问自己的使用记录）
CREATE POLICY "conversion_usage_select_policy" ON conversion_usage FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "conversion_usage_insert_policy" ON conversion_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建函数：检查用户订阅状态
CREATE OR REPLACE FUNCTION check_user_subscription_status(user_uuid UUID)
RETURNS TABLE(
  has_active_subscription BOOLEAN,
  subscription_plan_name TEXT,
  conversions_remaining INTEGER,
  current_period_end TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  subscription_record RECORD;
  plan_record RECORD;
  conversions_used INTEGER;
BEGIN
  -- 获取用户的活跃订阅
  SELECT * INTO subscription_record
  FROM user_subscriptions us
  WHERE us.user_id = user_uuid
    AND us.status = 'active'
    AND us.current_period_end > NOW()
  ORDER BY us.created_at DESC
  LIMIT 1;

  -- 如果没有活跃订阅
  IF subscription_record IS NULL THEN
    RETURN QUERY SELECT false, NULL::TEXT, 0, NULL::TIMESTAMP WITH TIME ZONE;
    RETURN;
  END IF;

  -- 获取订阅计划信息
  SELECT * INTO plan_record
  FROM subscription_plans sp
  WHERE sp.id = subscription_record.subscription_plan_id;

  -- 如果是无限制计划
  IF plan_record.max_conversions_per_month = -1 THEN
    RETURN QUERY SELECT true, plan_record.name, -1, subscription_record.current_period_end;
    RETURN;
  END IF;

  -- 计算本月已使用的转换次数
  SELECT COUNT(*) INTO conversions_used
  FROM conversion_usage cu
  WHERE cu.user_id = user_uuid
    AND cu.success = true
    AND cu.created_at >= date_trunc('month', NOW());

  -- 返回结果
  RETURN QUERY SELECT 
    true,
    plan_record.name,
    GREATEST(0, plan_record.max_conversions_per_month - conversions_used),
    subscription_record.current_period_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：记录转换使用
CREATE OR REPLACE FUNCTION record_conversion_usage(
  user_uuid UUID,
  conversion_type_param TEXT,
  file_name_param TEXT DEFAULT NULL,
  file_size_param BIGINT DEFAULT NULL,
  pages_count_param INTEGER DEFAULT NULL,
  success_param BOOLEAN DEFAULT true,
  error_message_param TEXT DEFAULT NULL,
  processing_time_ms_param INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  usage_id UUID;
  subscription_id UUID;
BEGIN
  -- 获取用户的活跃订阅ID
  SELECT us.id INTO subscription_id
  FROM user_subscriptions us
  WHERE us.user_id = user_uuid
    AND us.status = 'active'
    AND us.current_period_end > NOW()
  ORDER BY us.created_at DESC
  LIMIT 1;

  -- 插入使用记录
  INSERT INTO conversion_usage (
    user_id,
    user_subscription_id,
    conversion_type,
    file_name,
    file_size,
    pages_count,
    success,
    error_message,
    processing_time_ms
  ) VALUES (
    user_uuid,
    subscription_id,
    conversion_type_param,
    file_name_param,
    file_size_param,
    pages_count_param,
    success_param,
    error_message_param,
    processing_time_ms_param
  ) RETURNING id INTO usage_id;

  RETURN usage_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;