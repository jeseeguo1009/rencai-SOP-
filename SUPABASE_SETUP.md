# SOP管理系统 - Supabase 升级指南

## 概述
SOP管理系统已升级为使用Supabase作为后端数据库和认证系统，替代之前的本地内存存储。

## 主要改动

### 1. 认证系统
- **替换前**: 使用简单的name+empId本地验证，数据存储在sessionStorage
- **替换后**: 使用Supabase Auth，支持邮箱/密码注册和登录
  - 自动验证邮箱和密码
  - 支持session管理
  - 登出时清除认证状态

### 2. 数据存储
- **替换前**: 所有数据存储在Vue响应式对象中（内存）
- **替换后**: 数据存储在Supabase PostgreSQL数据库中
  - 持久化存储
  - 支持Row Level Security（RLS）策略
  - 支持多用户并发操作

### 3. 新增功能
- 用户注册页面（self-service）
- Supabase连接状态指示器
- 完整的用户权限管理

## 前置条件

1. **创建Supabase账户**
   - 访问 https://supabase.com
   - 注册免费账户

2. **创建新项目**
   - 在Supabase仪表板中创建新项目
   - 选择PostgreSQL数据库
   - 记录下你的 Project URL 和 Anon Key

## 安装步骤

### Step 1: 数据库初始化

1. 在Supabase中打开 SQL Editor
2. 复制 `setup.sql` 文件的全部内容
3. 粘贴到SQL编辑器中运行
4. 等待脚本完成（应该没有错误）

```bash
# setup.sql 包含以下内容：
# - 8个数据表的创建
# - 索引和行级安全(RLS)策略
# - 默认管理员用户
```

### Step 2: 配置 index.html

打开 `app-config.js` 文件，找到以下部分：

```javascript
// ===== SUPABASE 配置 =====
window.APP_CONFIG = window.APP_CONFIG || {
  SUPABASE_URL: 'YOUR_SUPABASE_URL', // 例: https://xxxxx.supabase.co
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY'
};
```

替换为你的Supabase项目信息：
- `SUPABASE_URL`: 从Supabase Settings > API > Project Settings 中复制
- `SUPABASE_ANON_KEY`: 从Supabase Settings > API > Project Settings 中的 anon key 复制

示例：
```javascript
window.APP_CONFIG = window.APP_CONFIG || {
  SUPABASE_URL: 'https://abcdefghijklmnop.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
};
```

### Step 3: 创建管理员账户

1. 在Supabase Authentication中手动创建第一个用户
   - Email: admin@company.com
   - Password: 自定义密码

2. 登录系统后，你就可以添加其他用户了

### Step 4: 验证

1. 打开 index.html 文件（在浏览器中打开）
2. 检查右上角的连接状态指示器：
   - 绿色圆点 = 已连接到Supabase ✓
   - 红色圆点 = 未配置或连接失败 ✗

3. 使用 admin@company.com 和密码登录
4. 验证可以进入仪表盘

## 用户操作流程

### 首次用户注册
1. 在登录页面点击"首次注册？"
2. 填写邮箱、密码、姓名、工号和岗位级别
3. 点击"注 册"
4. 返回登录页面用邮箱和密码登录

### 登出
1. 点击右上角用户名附近的"登出"按钮
2. 自动返回登录页面
3. Supabase session自动清除

## 数据表结构

### users（用户表）
```sql
id (UUID)                  -- 用户唯一ID
auth_id (UUID)            -- 关联到 Supabase Auth
email (TEXT)              -- 邮箱地址
name (TEXT)               -- 姓名
emp_id (TEXT)             -- 工号
role (TEXT)               -- 角色：admin/mentor/trainee
role_level (TEXT)         -- 岗位级别：intern/assistant/specialist/lead/manager
mentor_id (UUID)          -- 指导人ID
join_date (TIMESTAMP)     -- 入职日期
status (TEXT)             -- 状态：active/inactive/converted
```

### course_progress（课程进度表）
```sql
id (BIGINT)
user_id (UUID)
course_id (INT)
status (TEXT)             -- not_started/in_progress/completed
start_time (TIMESTAMP)
complete_time (TIMESTAMP)
```

### exam_records（考试记录表）
```sql
id (BIGINT)
user_id (UUID)
role_level (TEXT)         -- 考试级别
score (INT)               -- 最终分数
raw_score (INT)           -- 原始分数
raw_total (INT)           -- 满分
details (JSONB)           -- 答题详情JSON
time_used (INT)           -- 耗时（秒）
created_at (TIMESTAMP)
```

### task_submissions（任务提交表）
```sql
id (BIGINT)
user_id (UUID)
course_id (INT)
task_id (INT)
content (TEXT)            -- 提交内容
score (INT)               -- 评分
scorer_id (UUID)          -- 评分人ID
scorer_name (TEXT)        -- 评分人名字
status (TEXT)             -- pending/submitted/scored
submit_time (TIMESTAMP)
score_time (TIMESTAMP)
```

### mentor_logs（带教记录表）
```sql
id (BIGINT)
week_num (INT)            -- 第几周
mentor_id (UUID)          -- 带教人ID
trainee_id (UUID)         -- 新人ID
mentor_content (TEXT)     -- 带教内容
trainee_content (TEXT)    -- 新人反馈
mentor_feedback (TEXT)    -- 带教意见
mentor_signed_at (TIMESTAMP)
trainee_signed_at (TIMESTAMP)
```

### kpi_records（KPI考核表）
```sql
id (BIGINT)
user_id (UUID)
period (TEXT)             -- 考核周期
items (JSONB)             -- KPI项目详情
total_score (NUMERIC)     -- 总分
grade (TEXT)              -- 等级
```

### evaluations（转正评估表）
```sql
id (BIGINT)
user_id (UUID)
course_pct (NUMERIC)      -- 课程完成度
exam_score (INT)          -- 考试成绩
task_score (NUMERIC)      -- 任务成绩
mentor_score (NUMERIC)    -- 带教评分
kpi_score (NUMERIC)       -- KPI评分
total_score (NUMERIC)     -- 总分
mentor_comment (TEXT)
admin_decision (TEXT)     -- approved/delayed/rejected
admin_comment (TEXT)
status (TEXT)             -- pending/mentor_reviewed/admin_reviewed/completed
```

### notifications（通知表）
```sql
id (BIGINT)
user_id (UUID)
type (TEXT)               -- 通知类型
title (TEXT)
content (TEXT)
read (BOOLEAN)
created_at (TIMESTAMP)
```

## Row Level Security (RLS) 策略

系统实现了完整的RLS策略，确保用户只能访问自己的数据：

- **Admin** (管理员)
  - 可以查看和管理所有用户的数据
  - 可以批准/拒绝转正评估

- **Mentor** (带教人)
  - 可以查看指派给自己的新人的数据
  - 可以评分任务和填写带教记录
  - 可以完成评估审核

- **Trainee** (新人)
  - 只能查看自己的数据
  - 可以提交任务和参加考试
  - 可以查看自己的评估结果

## API调用示例

以下是在组件中如何调用Supabase API的示例：

### 查询数据
```javascript
// 获取当前用户的课程进度
const { data } = await supabase
    .from('course_progress')
    .select('*')
    .eq('user_id', userProfile.value.id);
```

### 插入数据
```javascript
// 提交任务
await supabase
    .from('task_submissions')
    .insert([{
        user_id: userProfile.value.id,
        course_id: courseId,
        task_id: taskId,
        content: submissionText,
        status: 'submitted',
        submit_time: new Date().toISOString()
    }]);
```

### 更新数据
```javascript
// 更新课程进度
await supabase
    .from('course_progress')
    .update({ status: 'completed', complete_time: new Date().toISOString() })
    .eq('user_id', userProfile.value.id)
    .eq('course_id', courseId);
```

### Upsert（插入或更新）
```javascript
// 保存或更新KPI记录
await supabase
    .from('kpi_records')
    .upsert({
        user_id: userProfile.value.id,
        period: '2024年3月',
        items: kpiItemsJson,
        total_score: totalScore,
        grade: grade
    });
```

## 常见问题

### Q: 我看到"未配置"的红点连接状态
**A**: 需要在 `app-config.js` 中填入SUPABASE_URL和SUPABASE_ANON_KEY

### Q: 登录时提示"登录失败"
**A**: 检查以下几点：
1. Supabase配置是否正确
2. 邮箱和密码是否正确
3. 浏览器控制台是否有错误信息（F12打开）

### Q: 新注册的用户无法登录
**A**:
1. 检查Supabase Authentication中是否存在该用户
2. 确认邮箱和密码输入正确
3. 检查users表中是否存在对应的用户记录

### Q: 某些功能显示"暂无权限"
**A**: 这是RLS策略在保护数据。检查：
1. 用户的role和role_level是否正确设置
2. mentor_id是否正确关联
3. 考试/任务是否在对应的user_id下

### Q: 可以离线使用系统吗？
**A**: 不可以。系统现在依赖Supabase，需要网络连接。

## 迁移注意事项

### 旧数据（如果有）
- 旧系统使用的sessionStorage和localStorage数据已废弃
- 需要重新导入或在Supabase中创建数据

### 浏览器兼容性
- 支持所有现代浏览器（Chrome, Firefox, Safari, Edge）
- 不支持IE 11及更低版本

### 性能考虑
- 数据库查询有延迟，首次加载可能较慢
- 建议使用实时订阅进行大量数据操作
- 考虑添加缓存机制提升用户体验

## 后续开发

### 已完成
- ✓ 认证系统整合
- ✓ 用户管理
- ✓ 注册页面
- ✓ 连接状态指示器
- ✓ RLS策略配置

### 待完成（需要进一步开发）
- Dashboard统计数据与Supabase整合
- 课程进度查询与更新
- 考试成绩保存与查询
- 任务提交与评分流程
- 带教记录管理
- KPI考核记录
- 转正评估流程
- 数据分析报表

### 建议的改进
1. 添加错误处理和用户提示
2. 实现数据缓存机制
3. 添加实时订阅（Supabase Realtime）
4. 性能优化和分页加载
5. 审计日志记录

## 技术支持

如有问题，请检查：
1. Supabase官方文档：https://supabase.com/docs
2. 浏览器控制台错误信息（F12）
3. Supabase仪表板中的Logs标签
4. 数据库SQL日志

## 版本信息

- Vue 3.x
- Vue Router 4.x
- Supabase JS Client v2.x
- Chart.js 4.x
- PostgreSQL (Supabase)
