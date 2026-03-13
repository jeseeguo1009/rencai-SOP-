# 快速开始指南

## 5分钟快速部署

### 前置条件
- 一个Supabase账户（免费）
- 任何现代浏览器
- 文本编辑器

### Step 1: 创建Supabase项目 (2分钟)

1. 访问 https://supabase.com
2. 使用Google/GitHub账号登录
3. 点击"New Project"
4. 选择一个Organization，输入项目名称
5. 设置数据库密码
6. 点击"Create new project"并等待初始化完成

### Step 2: 获取API凭证 (1分钟)

1. 在Supabase仪表板中，进入 **Settings > API**
2. 复制以下信息：
   - **Project URL** (用于SUPABASE_URL)
   - **anon public** key (用于SUPABASE_ANON_KEY)

### Step 3: 初始化数据库 (1分钟)

1. 在Supabase中，打开 **SQL Editor**
2. 新建一个Query
3. 复制并粘贴 `setup.sql` 文件的全部内容
4. 点击运行（Run）
5. 等待执行完成，应该看到"Success"

### Step 4: 配置应用 (30秒)

1. 打开 `app-config.js` 文件（用文本编辑器）
2. 找到以下内容：
```javascript
window.APP_CONFIG = window.APP_CONFIG || {
    SUPABASE_URL: 'YOUR_SUPABASE_URL',
    SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY'
};
```

3. 替换为你的API凭证：
```javascript
window.APP_CONFIG = window.APP_CONFIG || {
    SUPABASE_URL: 'https://xxxxx.supabase.co',
    SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI...'
};
```

4. 保存文件

### Step 5: 创建管理员账号 (30秒)

1. 在Supabase仪表板中，进入 **Authentication > Users**
2. 点击"Invite"或"Add user"
3. 填写：
   - Email: admin@company.com
   - Password: 自定义安全密码
4. 点击"Send invite"或创建用户

### Step 6: 启动应用 (30秒)

1. 在浏览器中打开 `index.html` 文件
2. 你应该看到登录页面
3. 检查右上角的连接状态指示器（绿色圆点表示已连接）
4. 用 admin@company.com 和密码登录
5. 成功！

---

## 常用操作

### 添加新用户

**方式1：用户自助注册（推荐）**
1. 在登录页面点击"首次注册？"
2. 填写邮箱、密码、姓名、工号和岗位
3. 点击"注 册"

**方式2：Admin添加用户**
1. 在Supabase仪表板中，进入 **Authentication > Users**
2. 点击"Invite"或"Add user"
3. 输入邮箱和密码
4. 邮件邀请用户或直接创建

### 设置指导人

1. 在Supabase仪表板中，进入 **Database > Tables > public > users**
2. 找到需要设置指导人的用户
3. 在"mentor_id"列中填入指导人的UUID

### 查看用户数据

1. 在Supabase仪表板中，进入 **Database > Tables**
2. 选择相应的表查看数据：
   - `users` - 用户信息
   - `course_progress` - 课程进度
   - `exam_records` - 考试成绩
   - `task_submissions` - 任务提交
   - 等等

### 修改用户角色

1. 在Supabase中打开users表
2. 找到用户记录
3. 修改"role"列（admin/mentor/trainee）
4. 用户刷新页面后生效

---

## 常见问题

### 显示"未配置"连接状态

**原因**: SUPABASE_URL或SUPABASE_ANON_KEY未正确配置

**解决**:
1. 在 `app-config.js` 中检查配置
2. 确保不是'YOUR_SUPABASE_URL'和'YOUR_SUPABASE_ANON_KEY'
3. 从Supabase Settings > API重新复制凭证
4. 保存文件并刷新浏览器

### 登录时提示错误

**可能原因和解决**:

| 错误 | 原因 | 解决 |
|------|------|------|
| "登录失败" | 邮箱或密码错误 | 检查邮箱和密码是否正确 |
| "登录失败" | Supabase配置错误 | 检查SUPABASE_URL和KEY是否正确 |
| "登录失败" | 网络问题 | 检查互联网连接，看浏览器Console(F12) |
| "用户不存在" | 邮箱未注册 | 先注册或由Admin邀请 |

### 注册成功后无法登录

**解决**:
1. 确认Supabase Authentication中存在该用户
2. 确认邮箱和密码输入正确
3. 等待1分钟后重试（Supabase有缓存）
4. 清除浏览器缓存（Ctrl+Shift+Delete）

### 无法看到指派给我的学员

**解决**:
1. 确认你的user record中的"mentor_id"已正确设置
2. 确认学员的"mentor_id"指向了你的user ID
3. 刷新页面
4. 检查浏览器Console中的错误

### 数据没有保存

**可能原因**:
1. 网络连接中断
2. Supabase session过期
3. RLS策略阻止了操作

**解决**:
1. 检查浏览器Console（F12）的错误
2. 确保已登录（右上角有用户信息）
3. 尝试刷新页面重新登录

---

## 开发提示

### 查看实时日志

在Supabase仪表板中：
1. 进入 **Logs** 标签
2. 实时查看所有数据库操作
3. 帮助排查问题

### 导出数据

在Supabase中：
1. 进入 **Database > Tables**
2. 选择表 > 点击"..."菜单
3. 选择"Export as CSV"或"Export as JSON"

### 备份数据

定期备份Supabase数据：
1. 进入 **Settings > Backups**
2. 配置自动备份
3. 或手动导出重要数据

---

## 下一步

部署成功后：

1. **读取详细文档**
   - 参考 `SUPABASE_SETUP.md` 了解完整配置
   - 参考 `MIGRATION_NOTES.md` 了解技术细节

2. **完成数据集成** (需要开发)
   - Dashboard统计数据
   - 课程进度同步
   - 考试成绩保存
   - 任务评分流程
   - 等等

3. **配置权限策略** (可选)
   - 微调RLS策略
   - 设置审计日志
   - 配置备份策略

4. **生产部署**
   - 迁移到正式Supabase项目（如果开发用了免费层）
   - 配置自定义域名
   - 设置监控告警

---

## 技术支持

### 官方资源
- Supabase官方文档: https://supabase.com/docs
- Vue 3文档: https://vuejs.org
- Vue Router文档: https://router.vuejs.org

### 调试步骤
1. 打开浏览器开发者工具（F12）
2. 查看Console标签中的错误信息
3. 查看Network标签中的API调用
4. 检查Supabase仪表板的Logs

### 更新 Supabase JS Client

如需更新到最新版本，修改index.html中的脚本标签：

```html
<!-- 当前版本（v2） -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>

<!-- 如需更新，修改版本号 -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@latest/dist/umd/supabase.min.js"></script>
```

---

## 成功标志

如果你看到以下现象，说明部署成功了：

✓ 登录页面正常显示
✓ 右上角显示绿色"已连接"指示器
✓ 可以用邮箱和密码登录
✓ 登录后可以进入Dashboard
✓ 右上角显示用户名
✓ 点击登出可以安全退出
✓ 数据在多个标签页中同步（可选，需要Realtime集成）

---

## 需要帮助？

1. **检查日志**: 浏览器Console（F12）和Supabase Logs
2. **查看文档**:
   - SUPABASE_SETUP.md 详细配置
   - MIGRATION_NOTES.md 技术细节
3. **重新检查凭证**: 确保从Supabase复制的值正确无误
4. **清除缓存**: Ctrl+Shift+Delete清除浏览器数据后重试
5. **重新部署**: 关闭浏览器，重新打开index.html

祝你使用愉快！
