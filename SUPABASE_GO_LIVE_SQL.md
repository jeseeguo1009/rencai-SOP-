# Supabase 上线 SQL 执行顺序

这份说明用于正式上线前，在 Supabase SQL Editor 中按顺序执行数据库脚本。

## 执行顺序

1. 执行 [setup.sql](/Users/guojiangwei/人才SOP/setup.sql)
2. 如需演示数据或首轮试运行数据，再执行 [seed_data.sql](/Users/guojiangwei/人才SOP/seed_data.sql)

## 第一步：执行 setup.sql

在 Supabase 项目的 SQL Editor 中：

1. 新建一个 SQL 查询
2. 粘贴 [setup.sql](/Users/guojiangwei/人才SOP/setup.sql) 全部内容
3. 执行脚本

执行成功后，至少确认这些对象已经存在：

- `users`
- `course_catalog`
- `exam_question_bank`
- `task_catalog`
- `course_progress`
- `exam_records`
- `task_submissions`
- `mentor_logs`
- `kpi_records`
- `evaluations`
- `notifications`
- `talent_workflow_cases`
- `courseware_library`
- `archive_records`
- `pilot_runs`
- `approval_logs`

同时确认这些表已经启用 RLS：

- `notifications`
- `courseware_library`
- `archive_records`
- `pilot_runs`
- `approval_logs`

## 第二步：按需执行 seed_data.sql

如果你希望上线后立刻看到课程目录、任务目录、题库示例、试运行示例数据，再执行 [seed_data.sql](/Users/guojiangwei/人才SOP/seed_data.sql)。

适合执行 `seed_data.sql` 的场景：

- 先做内部演示
- 先做首轮试运行
- 需要快速验证页面是否有数据

如果你准备直接使用真实业务数据，可以暂时不执行 `seed_data.sql`。

## 第三步：绑定首个管理员

在 Supabase Auth 中先创建管理员邮箱后，再在 SQL Editor 中执行 [bootstrap_admin.sql](/Users/guojiangwei/人才SOP/bootstrap_admin.sql)。

建议流程：

1. 在 Supabase Auth > Users 中创建 `admin@company.com`
2. 回到 SQL Editor 执行 [bootstrap_admin.sql](/Users/guojiangwei/人才SOP/bootstrap_admin.sql)
3. 到 `public.users` 确认：
   - `email = admin@company.com`
   - `auth_id` 已绑定
   - `role = admin`

## 执行后建议检查

SQL 执行完成后，建议最少检查以下 4 类结果：

1. `course_catalog` 是否已有课程
2. `task_catalog` 是否已有任务
3. `exam_question_bank` 是否已有题库
4. `courseware_library` / `pilot_runs` / `archive_records` 是否已出现示例记录
5. `admin@company.com` 是否已在 `public.users` 中绑定为管理员

## 执行完成后的下一步

1. 回到项目目录执行 `node preflight-check.js`
2. 如需重新沉淀发布记录，执行 `RELEASE_TARGET=production node prepare-release.js`
3. 发布到 Netlify 后，再执行 `node post-deploy-smoke.js https://你的站点地址`
