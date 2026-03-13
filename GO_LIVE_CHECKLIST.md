# 上线前核对清单

如需直接进入正式发布，优先参考 [DEPLOY_NOW.md](/Users/guojiangwei/人才SOP/DEPLOY_NOW.md)。

## 数据库

1. 按 [SUPABASE_GO_LIVE_SQL.md](/Users/guojiangwei/人才SOP/SUPABASE_GO_LIVE_SQL.md) 执行 [setup.sql](/Users/guojiangwei/人才SOP/setup.sql)
2. 如需试运行或演示数据，再执行 [seed_data.sql](/Users/guojiangwei/人才SOP/seed_data.sql)
3. 在 Supabase Auth 中创建管理员邮箱后，执行 [bootstrap_admin.sql](/Users/guojiangwei/人才SOP/bootstrap_admin.sql)
4. 确认 Supabase 中管理员账号已存在，且 `users.auth_id` 已绑定

## 配置

1. 选择一种配置方式填入真实 `SUPABASE_URL`
2. 选择一种配置方式填入真实 `SUPABASE_ANON_KEY`
3. 可直接编辑 [app-config.js](/Users/guojiangwei/人才SOP/app-config.js)，或参考 [runtime-config.example.js](/Users/guojiangwei/人才SOP/runtime-config.example.js) 覆盖 [runtime-config.js](/Users/guojiangwei/人才SOP/runtime-config.js)
4. 也可以执行 `SUPABASE_URL=... SUPABASE_ANON_KEY=... node generate-runtime-config.js` 自动生成并覆盖运行时配置
5. 执行 `node preflight-check.js`，确认本地预检无阻塞项
6. 如需形成上线记录，可执行 `RELEASE_TARGET=production node prepare-release.js` 生成 [release-manifest.json](/Users/guojiangwei/人才SOP/release-manifest.json) 与 `release-history/` 归档
7. 预检或发布清单里出现 `blockers / next_steps` 时，优先按这两项处理，不要直接跳过上线阻塞

## 上线验证

1. 登录 / 注册 / 角色权限是否正常
2. 学习进度、考试成绩、任务提交是否成功写库
3. 人才筛选、课件版本、历史归档、试运行台账是否正常显示
4. 导师周报、KPI、转正评估是否能读取和保存
5. 数据分析页是否能看到真实统计

## 部署

1. 按 [DEPLOY_WEBSITE.md](/Users/guojiangwei/人才SOP/DEPLOY_WEBSITE.md) 部署到 Netlify 或 Vercel
2. 若走 Netlify，确认 [netlify.toml](/Users/guojiangwei/人才SOP/netlify.toml) 已生效，`runtime-config.js` 不会被旧缓存覆盖
3. 绑定正式域名
4. 执行 `node post-deploy-smoke.js https://你的站点地址`，确认首页与 runtime-config.js 都已正确上线
5. 先小范围试运行，再全员开放
