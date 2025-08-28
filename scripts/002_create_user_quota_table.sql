-- 创建用户PDF转换额度表
CREATE TABLE IF NOT EXISTS public.user_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_quota INTEGER NOT NULL DEFAULT 0,
  used_quota INTEGER NOT NULL DEFAULT 0,
  remaining_quota INTEGER GENERATED ALWAYS AS (total_quota - used_quota) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_user_quotas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_quotas_updated_at 
    BEFORE UPDATE ON public.user_quotas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_quotas_updated_at();

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_quotas_user_id ON public.user_quotas(user_id);
CREATE INDEX IF NOT EXISTS idx_user_quotas_remaining ON public.user_quotas(remaining_quota);

-- 启用行级安全策略
ALTER TABLE public.user_quotas ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略：用户只能查看和修改自己的额度记录
CREATE POLICY "Users can view own quota" ON public.user_quotas
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own quota" ON public.user_quotas
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quota" ON public.user_quotas
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建支付记录表
CREATE TABLE IF NOT EXISTS public.payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_session_id TEXT,
  amount INTEGER NOT NULL, -- 金额（分为单位）
  currency TEXT NOT NULL DEFAULT 'usd',
  quota_purchased INTEGER NOT NULL, -- 购买的额度数量
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed, refunded
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建支付记录更新时间触发器
CREATE TRIGGER update_payment_records_updated_at 
    BEFORE UPDATE ON public.payment_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_user_quotas_updated_at();

-- 创建支付记录索引
CREATE INDEX IF NOT EXISTS idx_payment_records_user_id ON public.payment_records(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_stripe_payment_intent ON public.payment_records(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_status ON public.payment_records(status);

-- 启用支付记录行级安全策略
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- 创建支付记录RLS策略
CREATE POLICY "Users can view own payment records" ON public.payment_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage payment records" ON public.payment_records
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- 创建函数：为新用户初始化额度记录
CREATE OR REPLACE FUNCTION public.initialize_user_quota()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_quotas (user_id, total_quota, used_quota)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：用户注册时自动初始化额度
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.initialize_user_quota();

-- 创建函数：增加用户额度
CREATE OR REPLACE FUNCTION public.add_user_quota(
  p_user_id UUID,
  p_quota_amount INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.user_quotas 
  SET total_quota = total_quota + p_quota_amount
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_quotas (user_id, total_quota, used_quota)
    VALUES (p_user_id, p_quota_amount, 0);
  END IF;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：消耗用户额度
CREATE OR REPLACE FUNCTION public.consume_user_quota(
  p_user_id UUID,
  p_quota_amount INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_remaining INTEGER;
BEGIN
  -- 检查剩余额度
  SELECT remaining_quota INTO current_remaining
  FROM public.user_quotas
  WHERE user_id = p_user_id;
  
  IF NOT FOUND OR current_remaining < p_quota_amount THEN
    RETURN FALSE;
  END IF;
  
  -- 扣除额度
  UPDATE public.user_quotas 
  SET used_quota = used_quota + p_quota_amount
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：获取用户额度信息
CREATE OR REPLACE FUNCTION public.get_user_quota(p_user_id UUID)
RETURNS TABLE(
  total_quota INTEGER,
  used_quota INTEGER,
  remaining_quota INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT uq.total_quota, uq.used_quota, uq.remaining_quota
  FROM public.user_quotas uq
  WHERE uq.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.user_quotas IS '用户PDF转换额度表';
COMMENT ON COLUMN public.user_quotas.total_quota IS '总额度';
COMMENT ON COLUMN public.user_quotas.used_quota IS '已使用额度';
COMMENT ON COLUMN public.user_quotas.remaining_quota IS '剩余额度（计算列）';

COMMENT ON TABLE public.payment_records IS '支付记录表';
COMMENT ON COLUMN public.payment_records.quota_purchased IS '购买的额度数量';
COMMENT ON COLUMN public.payment_records.amount IS '支付金额（分为单位）';