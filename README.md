# SOP管理系统 - Supabase升级版本

**版本**: 2.0 (Supabase集成版)
**更新日期**: 2024年3月7日
**状态**: Beta（认证系统完成，数据操作集成进行中）

## 项目概述

新人入职SOP管理系统是一个全流程数字化管理平台，用于管理员、带教人和新人的训练、考核、评估全周期。

本版本已升级为使用Supabase作为后端，提供了企业级的认证、数据存储和权限管理功能。

## 核心功能

### 已完成实现
- ✓ **Supabase认证集成** - 邮箱/密码登录和注册
- ✓ **用户管理** - 支持admin/mentor/trainee三种角色
- ✓ **Session管理** - 自动session恢复和登出
- ✓ **权限隔离** - Row Level Security (RLS)数据库策略
- ✓ **连接状态指示** - 实时显示Supabase连接状态
- ✓ **用户界面** - 完整的登录/注册/仪表盘界面

### 已保留功能
- 7门课程内容和课程管理界面
- 5个级别的在线考试题库（实习生/助理/专员/组长/主管）
- 14个实操任务定义
- 完整的UI设计和布局
- Chart.js数据可视化集成
- Vue Router导航

### 待完成的数据集成
- Dashboard统计数据查询（目前使用mock数据）
- 课程进度保存和查询
- 考试成绩保存和查询
- 任务提交和评分流程
- 带教跟踪记录
- KPI考核管理
- 转正评估流程
- 数据分析报表

## 快速开始

### 最快5分钟部署方案

1. **创建Supabase账户** (2分钟)
   - 访问 https://supabase.com
   - 注册免费账户

2. **初始化数据库** (1分钟)
   - 在Supabase中运行 `setup.sql` 脚本
   - 自动创建8个数据表和RLS策略

3. **配置应用** (30秒)
   - 编辑 `app-config.js`
   - 填入 SUPABASE_URL 和 SUPABASE_ANON_KEY

4. **创建管理员** (30秒)
   - 在Supabase中创建 admin@company.com 用户

5. **启动应用** (30秒)
   - 在浏览器打开 index.html
   - 用管理员账号登录

**详细步骤参考**: `QUICK_START.md`

## 文件说明

### 核心文件
- **index.html** (2748行, 137KB) - 主应用文件，包含所有Vue组件和逻辑
- **setup.sql** (242行) - Supabase数据库初始化脚本

### 文档文件
- **README.md** - 本文件，项目概述
- **QUICK_START.md** - 5分钟快速开始指南
- **SUPABASE_SETUP.md** - 详细的Supabase配置和使用指南
- **MIGRATION_NOTES.md** - 升级迁移说明和技术细节
- **CODE_REFERENCE.md** - 代码参考和API调用示例

## 系统架构

```
┌─────────────────────────────────────┐
│   前端 (index.html)                 │
│   Vue 3 + Vue Router + Chart.js    │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│   Supabase JS Client                │
│   (认证 + 数据库访问)               │
└──────────────────┬──────────────────┘
                   │
        ┌──────────┴──────────┐
        ▼                     ▼
┌──────────────┐      ┌──────────────────┐
│ Supabase Auth│      │ PostgreSQL DB    │
│ (用户认证)   │      │ (数据存储)       │
└──────────────┘      └──────────────────┘
```

## 数据表结构

系统包含8个主要数据表：

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `users` | 用户信息 | auth_id, email, name, emp_id, role, role_level |
| `course_progress` | 课程进度 | user_id, course_id, status, complete_time |
| `exam_records` | 考试成绩 | user_id, role_level, score, details, time_used |
| `task_submissions` | 任务提交 | user_id, task_id, content, score, status |
| `mentor_logs` | 带教记录 | mentor_id, trainee_id, week_num, content, feedback |
| `kpi_records` | KPI考核 | user_id, period, items, total_score, grade |
| `evaluations` | 转正评估 | user_id, course_pct, exam_score, task_score, total_score |
| `notifications` | 通知消息 | user_id, type, title, content, read |

详细字段定义参考 `setup.sql` 或 `SUPABASE_SETUP.md`

## 用户角色和权限

### Admin (管理员)
- 查看和管理所有用户
- 批准/拒绝转正评估
- 管理所有用户的数据

### Mentor (带教人)
- 查看指派给自己的学员
- 填写带教记录
- 评分学员任务
- 完成学员评估

### Trainee (新人)
- 查看个人信息和进度
- 完成课程和任务
- 参加在线考试
- 查看个人评估结果

权限由Supabase的Row Level Security (RLS)策略在数据库级别强制执行。

## 部署建议

### 开发环境
- 使用Supabase免费层（Free Tier）
- 可以处理小规模测试和演示

### 生产环境建议
1. **升级至Pro或Enterprise计划**
   - 获得SLA保证和优先支持

2. **启用备份**
   - 在Supabase Settings中配置自动备份

3. **配置自定义域名** (可选)
   - 提升专业性和可控性

4. **启用日志和监控**
   - 使用Supabase的Logs功能
   - 配置性能警告

5. **安全加固**
   - 更新RLS策略
   - 启用VPC（企业计划）
   - 定期安全审计

## 开发指南

### 本地开发
```bash
# 1. 用编辑器打开 index.html
# 2. 修改代码
# 3. 在浏览器中刷新预览
# 无需npm、webpack或构建步骤！
```

### 添加新功能的步骤

1. **在Supabase中创建新表** (如需要)
   - 设计表结构
   - 配置RLS策略

2. **在组件中添加API调用**
   ```javascript
   const { data } = await supabase.from('table').select('*');
   ```

3. **绑定到UI**
   ```html
   <div v-for="item in data" :key="item.id">{{ item.name }}</div>
   ```

4. **测试权限控制**
   - 用不同角色的账户测试
   - 验证RLS策略生效

详细示例参考 `CODE_REFERENCE.md`

## 常见问题

### Q: 可以离线使用吗？
A: 不可以。系统依赖Supabase，需要互联网连接。可以后续集成Service Worker实现离线同步功能。

### Q: 数据安全吗？
A: 是的。所有数据都存储在Supabase的PostgreSQL中，支持：
- 传输层加密（TLS/SSL）
- 数据库级加密
- Row Level Security访问控制
- 审计日志

### Q: 能支持多少用户？
A: Supabase Free Tier可以支持约50个并发用户。对于更多用户，升级到Pro或Enterprise计划。

### Q: 考试题库怎么管理？
A: 当前考试题库（EXAMS）是在代码中硬编码的。建议：
- 移到数据库的exams表中
- 创建admin界面编辑题库
- 支持动态更新而不需重新部署

### Q: 如何导入现有数据？
A: 使用Supabase的Import功能：
1. 导出数据为CSV
2. 在Supabase中使用Import CSV功能
3. 或通过API批量插入

### Q: 支持什么浏览器？
A: 所有现代浏览器（Chrome, Firefox, Safari, Edge）。不支持IE 11。

### Q: 可以部署到云端吗？
A: 可以。这是一个纯静态SPA，可以部署到：
- GitHub Pages
- Netlify
- Vercel
- Firebase Hosting
- AWS S3 + CloudFront
- 任何静态文件服务器

只需简单地上传 index.html 和相关资源即可。

## 技术栈

- **前端**: Vue 3, Vue Router 4
- **UI**: Chart.js 4, Lucide Icons
- **后端**: Supabase (PostgreSQL + Auth)
- **认证**: Supabase Auth (邮箱/密码)
- **ORM**: Supabase JS Client v2

所有依赖都通过CDN加载，无需npm或构建流程。

## 版本历史

### v1.0 (原始版本)
- 纯前端应用
- 内存数据存储
- 简单本地认证
- 状态在刷新后丢失

### v2.0 (当前版本)
- Supabase全栈集成
- PostgreSQL持久化存储
- 企业级认证系统
- Row Level Security权限管理
- 多用户支持
- Session管理

## 后续计划

### 短期 (1-2周)
- [ ] 完成Dashboard统计数据集成
- [ ] 实现课程进度保存和查询
- [ ] 完成考试成绩存储流程
- [ ] 实现任务提交和评分

### 中期 (1个月)
- [ ] 完成所有组件的数据集成
- [ ] 实现Supabase Realtime实时更新
- [ ] 添加导出/导入功能
- [ ] 优化性能（缓存、分页）

### 长期 (3-6个月)
- [ ] 从代码中提取可编辑的数据（课程、考试等）
- [ ] 实现高级报表和分析功能
- [ ] 集成Service Worker离线功能
- [ ] 添加邮件通知
- [ ] 手机端响应式优化
- [ ] 多语言支持

## 技术支持

### 官方资源
- Supabase文档: https://supabase.com/docs
- Vue 3文档: https://vuejs.org
- PostgreSQL文档: https://www.postgresql.org/docs

### 调试建议
1. 打开浏览器开发者工具（F12）
2. 查看Console标签的错误消息
3. 检查Network标签的API请求
4. 在Supabase仪表板中查看Logs

### 获取帮助
- 查看对应文档（QUICK_START.md, SUPABASE_SETUP.md等）
- 参考CODE_REFERENCE.md中的代码示例
- 检查浏览器Console和Supabase Logs

## 许可证

本项目内部使用。不可转让或商业化。

## 更新日志

**2024年3月7日**
- ✓ 完成Supabase认证系统集成
- ✓ 实现用户登录/注册/登出功能
- ✓ 配置Row Level Security策略
- ✓ 添加连接状态指示器
- ✓ 编写完整的文档和指南
- ✓ 创建代码参考示例

---

**快速链接**
- [快速开始](QUICK_START.md) - 5分钟部署
- [配置指南](SUPABASE_SETUP.md) - 详细步骤
- [迁移说明](MIGRATION_NOTES.md) - 技术细节
- [代码参考](CODE_REFERENCE.md) - API示例

**准备好了？** → 打开 `QUICK_START.md` 开始吧！
## 上线前预检

在项目目录执行：

```bash
node preflight-check.js
```

该脚本会检查：
- `app-config.js` 是否仍为占位值
- 是否存在有效的 `runtime-config.js`
- 是否支持 `window.__APP_CONFIG__` 运行时配置覆盖
- 关键前端文件是否齐全
- `setup.sql` 是否包含核心业务表和 RLS 启用语句
- `vercel.json` 是否包含单页应用 rewrite 配置

如需把“生成运行时配置 + 预检 + 发布清单”串成一次执行，可运行：

```bash
SUPABASE_URL=... SUPABASE_ANON_KEY=... RELEASE_TARGET=production node prepare-release.js
```

执行后会输出：
- 当前最新的 [release-manifest.json](/Users/guojiangwei/人才SOP/release-manifest.json)
- 历史归档目录 `release-history/`

## 配置方式

项目支持两种 Supabase 配置方式：

1. 直接编辑 [app-config.js](/Users/guojiangwei/人才SOP/app-config.js)
2. 覆盖仓库内默认的 [runtime-config.js](/Users/guojiangwei/人才SOP/runtime-config.js)，可参考 [runtime-config.example.js](/Users/guojiangwei/人才SOP/runtime-config.example.js)
3. 用环境变量执行 `node generate-runtime-config.js` 自动生成并覆盖 [runtime-config.js](/Users/guojiangwei/人才SOP/runtime-config.js)
