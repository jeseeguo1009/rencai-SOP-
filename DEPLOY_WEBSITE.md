# 网站上线说明

当前项目已整理为可直接静态部署的单页应用，推荐优先使用你现在已经在用的 Netlify；如需，也可继续走 Vercel。

如果你现在就是要立即上线，优先直接按 [DEPLOY_NOW.md](/Users/guojiangwei/人才SOP/DEPLOY_NOW.md) 执行。

## 上线前准备

1. 在 Supabase 中执行 [setup.sql](/Users/guojiangwei/人才SOP/setup.sql)
2. 选择一种配置方式填入真实 `SUPABASE_URL` 和 `SUPABASE_ANON_KEY`
3. 方式 A：直接编辑 [app-config.js](/Users/guojiangwei/人才SOP/app-config.js)
4. 方式 B：参考 [runtime-config.example.js](/Users/guojiangwei/人才SOP/runtime-config.example.js) 覆盖仓库内默认的 [runtime-config.js](/Users/guojiangwei/人才SOP/runtime-config.js)
5. 方式 C：执行 `SUPABASE_URL=... SUPABASE_ANON_KEY=... node generate-runtime-config.js` 自动生成并覆盖 [runtime-config.js](/Users/guojiangwei/人才SOP/runtime-config.js)
6. 如需启用数据库目录数据，再按 [CATALOG_MIGRATION.md](/Users/guojiangwei/人才SOP/CATALOG_MIGRATION.md) 导入课件/题库/任务目录
7. 在项目目录执行 `node preflight-check.js`，先完成本地上线预检
8. 或执行 `SUPABASE_URL=... SUPABASE_ANON_KEY=... RELEASE_TARGET=production node prepare-release.js` 一次完成运行时配置生成、预检和发布清单输出

## Netlify 上线

1. 将当前目录上传到 GitHub
2. 在 Netlify 中导入该仓库
3. Base directory 留空，Publish directory 使用项目根目录 `.`
4. Build command 留空
5. 如果使用仓库内配置，Netlify 会自动读取 [netlify.toml](/Users/guojiangwei/人才SOP/netlify.toml)
6. 首次部署完成后，确认 `runtime-config.js` 已随当前发布一起上线
7. 访问站点首页，确认不再出现“系统尚未完成上线配置”保护页
8. 可执行 `node post-deploy-smoke.js https://你的站点地址` 做一次上线后烟雾检查

## Vercel 上线

1. 将当前目录上传到 GitHub
2. 在 Vercel 中导入该仓库
3. Framework Preset 选择 `Other`
4. Root Directory 选择项目根目录
5. 保持默认构建设置，不需要额外 build 命令
6. 部署后即可通过分配域名访问

## 上线后建议立即验证

1. 员工登录、注册、学习、考试是否正常
2. 任务提交、课程完成、考试成绩是否写入 Supabase
3. 人才筛选、课件版本、历史归档、试运行台账是否可见
4. 不同角色的菜单权限是否符合预期
5. 修改 [runtime-config.js](/Users/guojiangwei/人才SOP/runtime-config.js) 后，线上是否能拿到最新配置，确认没有旧缓存
6. 可执行 `node post-deploy-smoke.js https://你的站点地址`，确认首页可访问、runtime-config.js 可访问且未落入保护模式

## 试运行建议

- 第一阶段：只开放给管理员和导师验证流程闭环
- 第二阶段：开放首批员工进入学习与考试
- 第三阶段：开始记录人才筛选、配岗、归档历史
- 第四阶段：根据试运行台账中的问题再放量上线
