-- ============================================
-- 新人入职SOP管理系统 - Supabase 数据库初始化脚本
-- 在 Supabase SQL Editor 中运行此脚本
-- ============================================

-- 1. 用户表
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  emp_id TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'trainee' CHECK (role IN ('admin', 'mentor', 'trainee')),
  role_level TEXT DEFAULT 'intern' CHECK (role_level IN ('intern','assistant','specialist','lead','manager')),
  mentor_id UUID REFERENCES users(id),
  join_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','converted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. 课程目录表
CREATE TABLE IF NOT EXISTS course_catalog (
  id INT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  topics JSONB NOT NULL DEFAULT '[]',
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. 考试题库表
CREATE TABLE IF NOT EXISTS exam_question_bank (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  role_name TEXT NOT NULL,
  question_order INT NOT NULL,
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  correct_index INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(role_name, question_order)
);

-- 4. 任务目录表
CREATE TABLE IF NOT EXISTS task_catalog (
  id INT PRIMARY KEY,
  course_id INT NOT NULL REFERENCES course_catalog(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  points INT NOT NULL DEFAULT 0,
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. 课程进度表
CREATE TABLE IF NOT EXISTS course_progress (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  course_id INT NOT NULL,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started','in_progress','completed')),
  start_time TIMESTAMP WITH TIME ZONE,
  complete_time TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- 6. 考试记录表
CREATE TABLE IF NOT EXISTS exam_records (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role_level TEXT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  raw_score INT DEFAULT 0,
  raw_total INT DEFAULT 0,
  details JSONB DEFAULT '{}',
  time_used INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. 任务提交表
CREATE TABLE IF NOT EXISTS task_submissions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  course_id INT NOT NULL,
  task_id INT NOT NULL,
  content TEXT,
  score INT,
  scorer_id UUID REFERENCES users(id),
  scorer_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','submitted','scored')),
  submit_time TIMESTAMP WITH TIME ZONE,
  score_time TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, task_id)
);

-- 8. 带教记录表
CREATE TABLE IF NOT EXISTS mentor_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  week_num INT NOT NULL,
  mentor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  trainee_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  mentor_content TEXT,
  trainee_content TEXT,
  mentor_feedback TEXT,
  mentor_signed_at TIMESTAMP WITH TIME ZONE,
  trainee_signed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(week_num, trainee_id)
);

-- 9. KPI考核记录表
CREATE TABLE IF NOT EXISTS kpi_records (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_score NUMERIC(5,2) DEFAULT 0,
  grade TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, period)
);

-- 10. 转正评估表
CREATE TABLE IF NOT EXISTS evaluations (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  course_pct NUMERIC(5,2) DEFAULT 0,
  exam_score INT DEFAULT 0,
  task_score NUMERIC(5,2) DEFAULT 0,
  mentor_score NUMERIC(5,2) DEFAULT 0,
  kpi_score NUMERIC(5,2) DEFAULT 0,
  total_score NUMERIC(5,2) DEFAULT 0,
  mentor_comment TEXT,
  admin_decision TEXT CHECK (admin_decision IN ('approved','delayed','rejected')),
  admin_comment TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','mentor_reviewed','admin_reviewed','completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 11. 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  content TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 12. 人才配岗与筛选流程表
CREATE TABLE IF NOT EXISTS talent_workflow_cases (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  mentor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  candidate_name TEXT NOT NULL,
  source_channel TEXT,
  target_role TEXT,
  current_stage TEXT NOT NULL DEFAULT 'screening',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','on_hold','completed','archived')),
  screening_notes TEXT,
  training_plan TEXT,
  placement_notes TEXT,
  screening_score NUMERIC(5,2) DEFAULT 0,
  archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 13. 课件版本库
CREATE TABLE IF NOT EXISTS courseware_library (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  course_id INT REFERENCES course_catalog(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL DEFAULT 'document',
  version TEXT NOT NULL DEFAULT 'v1.0',
  summary TEXT,
  content_url TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 14. 历史归档表
CREATE TABLE IF NOT EXISTS archive_records (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  archive_type TEXT NOT NULL,
  ref_table TEXT NOT NULL,
  ref_id TEXT NOT NULL,
  title TEXT NOT NULL,
  snapshot JSONB NOT NULL DEFAULT '{}',
  archived_by UUID REFERENCES users(id) ON DELETE SET NULL,
  archived_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 15. 试运行台账
CREATE TABLE IF NOT EXISTS pilot_runs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  scope TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','running','review','completed')),
  findings TEXT,
  metrics JSONB NOT NULL DEFAULT '{}',
  next_action TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 16. 审批留痕表
CREATE TABLE IF NOT EXISTS approval_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  ref_table TEXT NOT NULL,
  ref_id TEXT,
  detail JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_course_catalog_sort ON course_catalog(sort_order);
CREATE INDEX IF NOT EXISTS idx_exam_question_bank_role_order ON exam_question_bank(role_name, question_order);
CREATE INDEX IF NOT EXISTS idx_task_catalog_course_sort ON task_catalog(course_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_course_progress_user ON course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_records_user ON exam_records(user_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_user ON task_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_talent_workflow_cases_status ON talent_workflow_cases(status, current_stage);
CREATE INDEX IF NOT EXISTS idx_courseware_library_course ON courseware_library(course_id, published);
CREATE INDEX IF NOT EXISTS idx_archive_records_type_time ON archive_records(archive_type, archived_at);
CREATE INDEX IF NOT EXISTS idx_pilot_runs_status ON pilot_runs(status, created_at);
CREATE INDEX IF NOT EXISTS idx_approval_logs_module_time ON approval_logs(module, created_at);
CREATE INDEX IF NOT EXISTS idx_approval_logs_target_user ON approval_logs(target_user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_mentor_logs_trainee ON mentor_logs(trainee_id);
CREATE INDEX IF NOT EXISTS idx_mentor_logs_mentor ON mentor_logs(mentor_id);
CREATE INDEX IF NOT EXISTS idx_kpi_records_user ON kpi_records(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_user ON evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_users_auth ON users(auth_id);

-- ============================================
-- Row Level Security (RLS)
-- ============================================

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_question_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentor_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kpi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_workflow_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE courseware_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE archive_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pilot_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_logs ENABLE ROW LEVEL SECURITY;

-- 辅助函数：获取当前用户角色
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
  SELECT role FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 辅助函数：获取当前用户ID
CREATE OR REPLACE FUNCTION get_user_id()
RETURNS UUID AS $$
  SELECT id FROM users WHERE auth_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- users 表策略
CREATE POLICY "admin_all_users" ON users FOR ALL
  USING (get_user_role() = 'admin');
CREATE POLICY "users_read_self" ON users FOR SELECT
  USING (auth_id = auth.uid());
CREATE POLICY "mentor_read_trainees" ON users FOR SELECT
  USING (get_user_role() = 'mentor' AND mentor_id = get_user_id());

-- 目录表策略
CREATE POLICY "catalog_read_all_courses" ON course_catalog FOR SELECT
  USING (true);
CREATE POLICY "catalog_admin_manage_courses" ON course_catalog FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "catalog_read_all_exam_questions" ON exam_question_bank FOR SELECT
  USING (true);
CREATE POLICY "catalog_admin_manage_exam_questions" ON exam_question_bank FOR ALL
  USING (get_user_role() = 'admin');

CREATE POLICY "catalog_read_all_tasks" ON task_catalog FOR SELECT
  USING (true);
CREATE POLICY "catalog_admin_manage_tasks" ON task_catalog FOR ALL
  USING (get_user_role() = 'admin');

-- 人才流程表策略
CREATE POLICY "admin_all_talent_workflow" ON talent_workflow_cases FOR ALL
  USING (get_user_role() = 'admin');
CREATE POLICY "mentor_manage_talent_workflow" ON talent_workflow_cases FOR ALL
  USING (mentor_id = get_user_id());
CREATE POLICY "user_read_own_talent_workflow" ON talent_workflow_cases FOR SELECT
  USING (user_id = get_user_id());

-- 课件表策略
CREATE POLICY "courseware_read_all" ON courseware_library FOR SELECT
  USING (true);
CREATE POLICY "courseware_admin_manage" ON courseware_library FOR ALL
  USING (get_user_role() = 'admin');

-- 归档表策略
CREATE POLICY "archive_admin_all" ON archive_records FOR ALL
  USING (get_user_role() = 'admin');
CREATE POLICY "archive_mentor_read" ON archive_records FOR SELECT
  USING (get_user_role() = 'mentor');

-- 试运行表策略
CREATE POLICY "pilot_admin_all" ON pilot_runs FOR ALL
  USING (get_user_role() = 'admin');
CREATE POLICY "pilot_mentor_read" ON pilot_runs FOR SELECT
  USING (get_user_role() = 'mentor');

-- approval_logs 表策略
CREATE POLICY "approval_logs_admin_all" ON approval_logs FOR ALL
  USING (get_user_role() = 'admin');
CREATE POLICY "approval_logs_mentor_manage" ON approval_logs FOR ALL
  USING (get_user_role() = 'mentor');
CREATE POLICY "approval_logs_user_read_own" ON approval_logs FOR SELECT
  USING (target_user_id = get_user_id());

-- course_progress 表策略
CREATE POLICY "admin_all_progress" ON course_progress FOR ALL
  USING (get_user_role() = 'admin');
CREATE POLICY "user_own_progress" ON course_progress FOR ALL
  USING (user_id = get_user_id());
CREATE POLICY "mentor_read_trainee_progress" ON course_progress FOR SELECT
  USING (get_user_role() = 'mentor' AND user_id IN (
    SELECT id FROM users WHERE mentor_id = get_user_id()
  ));

-- exam_records 表策略
CREATE POLICY "admin_all_exams" ON exam_records FOR ALL
  USING (get_user_role() = 'admin');
CREATE POLICY "user_own_exams" ON exam_records FOR ALL
  USING (user_id = get_user_id());
CREATE POLICY "mentor_read_trainee_exams" ON exam_records FOR SELECT
  USING (get_user_role() = 'mentor' AND user_id IN (
    SELECT id FROM users WHERE mentor_id = get_user_id()
  ));

-- task_submissions 表策略
CREATE POLICY "admin_all_tasks" ON task_submissions FOR ALL
  USING (get_user_role() = 'admin');
CREATE POLICY "user_own_tasks" ON task_submissions FOR ALL
  USING (user_id = get_user_id());
CREATE POLICY "mentor_manage_trainee_tasks" ON task_submissions FOR ALL
  USING (get_user_role() = 'mentor' AND user_id IN (
    SELECT id FROM users WHERE mentor_id = get_user_id()
  ));

-- mentor_logs 表策略
CREATE POLICY "admin_all_logs" ON mentor_logs FOR ALL
  USING (get_user_role() = 'admin');
CREATE POLICY "mentor_own_logs" ON mentor_logs FOR ALL
  USING (mentor_id = get_user_id());
CREATE POLICY "trainee_own_logs" ON mentor_logs FOR ALL
  USING (trainee_id = get_user_id());

-- kpi_records 表策略
CREATE POLICY "admin_all_kpi" ON kpi_records FOR ALL
  USING (get_user_role() = 'admin');
CREATE POLICY "user_own_kpi" ON kpi_records FOR SELECT
  USING (user_id = get_user_id());
CREATE POLICY "mentor_manage_kpi" ON kpi_records FOR ALL
  USING (get_user_role() = 'mentor' AND user_id IN (
    SELECT id FROM users WHERE mentor_id = get_user_id()
  ));

-- evaluations 表策略
CREATE POLICY "admin_all_eval" ON evaluations FOR ALL
  USING (get_user_role() = 'admin');
CREATE POLICY "mentor_manage_eval" ON evaluations FOR ALL
  USING (get_user_role() = 'mentor' AND user_id IN (
    SELECT id FROM users WHERE mentor_id = get_user_id()
  ));
CREATE POLICY "user_read_eval" ON evaluations FOR SELECT
  USING (user_id = get_user_id());

-- notifications 表策略
CREATE POLICY "user_own_notifications" ON notifications FOR ALL
  USING (user_id = get_user_id());
CREATE POLICY "admin_all_notifications" ON notifications FOR ALL
  USING (get_user_role() = 'admin');

-- ============================================
-- 创建默认管理员（注册后手动更新auth_id）
-- 运行后需要在 Supabase Auth 中创建对应邮箱的用户
-- ============================================
INSERT INTO users (email, name, emp_id, role, role_level, status)
VALUES ('admin@company.com', '系统管理员', 'ADMIN001', 'admin', 'manager', 'active')
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- 完成提示
-- ============================================
-- 脚本执行完成！
-- 下一步：
-- 1. 在 Supabase Auth > Users 中创建管理员账号（邮箱: admin@company.com）
-- 2. 用管理员账号登录系统后，可以添加其他用户
-- 3. 将 Project URL 和 anon key 填入 index.html 的配置区
