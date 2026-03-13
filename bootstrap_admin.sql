-- ============================================
-- 首个管理员绑定脚本
-- 使用场景：
-- 1. 已在 Supabase Auth 中创建管理员邮箱
-- 2. 需要把该邮箱绑定为系统管理员
-- ============================================

INSERT INTO users (auth_id, email, name, emp_id, role, role_level, status)
SELECT
  au.id,
  au.email,
  '系统管理员',
  'ADMIN001',
  'admin',
  'manager',
  'active'
FROM auth.users AS au
WHERE au.email = 'admin@company.com'
ON CONFLICT (email) DO UPDATE
SET
  auth_id = EXCLUDED.auth_id,
  role = 'admin',
  role_level = 'manager',
  status = 'active';

-- 执行完成后，可在 public.users 中确认：
-- 1. admin@company.com 已存在
-- 2. auth_id 已成功绑定
-- 3. role = admin
