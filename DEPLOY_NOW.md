# 立即上线手册

当前项目已经完成本地预检，并且运行时配置已注入。现在只需要按下面顺序执行，就可以进入正式上线。

## 1. 先执行数据库脚本

在 Supabase 的 SQL Editor 中执行：

1. [setup.sql](/Users/guojiangwei/人才SOP/setup.sql)
2. 如需演示数据，再执行 [seed_data.sql](/Users/guojiangwei/人才SOP/seed_data.sql)
3. 在 Supabase Auth 创建 `admin@company.com` 后，执行 [bootstrap_admin.sql](/Users/guojiangwei/人才SOP/bootstrap_admin.sql)

如果你想按更细的顺序执行，直接参考 [SUPABASE_GO_LIVE_SQL.md](/Users/guojiangwei/人才SOP/SUPABASE_GO_LIVE_SQL.md)。

执行完成后，建议至少确认这些表已创建成功：

- `users`
- `course_catalog`
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

## 2. 确认当前发布准备状态

在项目目录运行：

```bash
node preflight-check.js
```

如果需要重新生成发布记录，运行：

```bash
RELEASE_TARGET=production node prepare-release.js
```

当前发布结果会写入：

- [release-manifest.json](/Users/guojiangwei/人才SOP/release-manifest.json)
- `release-history/`

## 3. 发布到 Netlify

推荐直接走你当前已经在用的 Netlify 项目。

发布要求：

- Publish directory: `.`
- Build command: 留空
- 使用仓库内 [netlify.toml](/Users/guojiangwei/人才SOP/netlify.toml)

关键点：

- [runtime-config.js](/Users/guojiangwei/人才SOP/runtime-config.js) 必须跟本次发布一起上线
- `runtime-config.js` 已配置 `no-store`，避免旧缓存覆盖新配置

## 4. 发布后立即做烟雾检查

部署完成后，在项目目录运行：

```bash
node post-deploy-smoke.js https://你的站点地址
```

通过标准：

- 首页可访问
- 首页已引用 `runtime-config.js`
- 页面不再显示“系统尚未完成上线配置”
- `runtime-config.js` 可访问
- `runtime-config.js` 已包含真实 Supabase 配置

## 5. 上线后第一轮联调

按这个顺序验证：

1. 管理员登录
2. 员工注册 / 登录
3. 员工学习课程并提交任务
4. 员工参加考试并产生 `exam_records`
5. 导师查看带教跟踪 / KPI
6. 管理员查看系统诊断、通知中心、审批中心

## 6. 如果上线后仍看到保护页

优先检查这 3 件事：

1. Netlify 当前发布是否包含最新的 [runtime-config.js](/Users/guojiangwei/人才SOP/runtime-config.js)
2. `runtime-config.js` 是否被旧缓存命中
3. 线上拿到的 `SUPABASE_URL` / `SUPABASE_ANON_KEY` 是否仍是占位值
