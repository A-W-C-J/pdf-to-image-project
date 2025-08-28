-- 修复 consume_user_quota 函数参数冲突问题
-- 先删除现有函数的所有版本，然后重新创建

-- 删除现有的 consume_user_quota 函数（可能存在的所有版本）
DROP FUNCTION IF EXISTS public.consume_user_quota(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.consume_user_quota(p_user_id UUID, p_quota_amount INTEGER);
DROP FUNCTION IF EXISTS public.consume_user_quota(p_user_id UUID, p_pages_count INTEGER);

-- 重新创建函数：消耗用户额度（支持按页数计算）
CREATE OR REPLACE FUNCTION public.consume_user_quota(
  p_user_id UUID,
  p_pages_count INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_remaining INTEGER;
BEGIN
  -- 检查剩余额度
  SELECT remaining_quota INTO current_remaining
  FROM public.user_quotas
  WHERE user_id = p_user_id;
  
  IF NOT FOUND OR current_remaining < p_pages_count THEN
    RETURN FALSE;
  END IF;
  
  -- 扣除额度（按页数）
  UPDATE public.user_quotas 
  SET used_quota = used_quota + p_pages_count
  WHERE user_id = p_user_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.consume_user_quota(UUID, INTEGER) IS '消耗用户额度，参数为用户ID和PDF页数';