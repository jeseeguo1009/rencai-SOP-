# SOP管理系统 Supabase 升级 - 迁移说明

## 升级总结

SOP管理系统已从一个纯前端、基于内存存储的Vue 3 SPA升级为完整的全栈应用，集成了Supabase后端。

### 升级前后对比

| 功能 | 升级前 | 升级后 |
|------|------|------|
| **认证方式** | 简单的name+empId本地验证 | Supabase Auth（邮箱/密码） |
| **数据存储** | sessionStorage + 内存对象 | PostgreSQL数据库 |
| **数据持久化** | 否（F5刷新即丢失） | 是（永久存储） |
| **用户隔离** | 无 | Row Level Security策略 |
| **多设备访问** | 不支持 | 支持 |
| **权限管理** | 硬编码在前端 | 数据库级别RLS策略 |
| **扩展性** | 有限（仅前端） | 完整（前后端分离） |
| **线上部署** | 困难 | 容易（无需后端服务器） |

## 代码变更详情

### 1. CDN脚本替换

**删除:**
```html
<script src="https://cdn.jsdelivr.net/npm/dexie@3.2.4/dist/dexie.min.js"></script>
```

**添加:**
```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>
```

### 2. 数据库初始化替换

**升级前** (Dexie IndexedDB):
```javascript
const db = new Dexie('sop_system');
db.version(1).stores({
    users: 'id, empId',
    courseProgress: '[userId+courseId], userId',
    // ... 其他表
});
```

**升级后** (Supabase PostgreSQL):
```javascript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

### 3. 认证系统重构

#### Login组件变更

**升级前:**
- 输入: name + empId + role选择
- 存储: sessionStorage中的简单对象
- 验证: 前端本地验证（无密码）

**升级后:**
- 输入: email + password
- 验证: Supabase Auth服务器端验证
- 存储: Supabase session（secure）
- 支持: 多设备登录，自动session续期

#### 新增Registration组件
- 邮箱唯一性验证
- 密码强度要求（6位最少）
- 自动创建users表记录
- role_level选择

### 4. 全局认证状态管理

**新增全局状态:**
```javascript
const currentUser = ref(null);           // Supabase Auth user
const userProfile = ref(null);           // 从users表获取的用户信息
const isSupabaseConfigured = computed(() => ...);

async function initAuth() { /* 初始化认证 */ }
// supabase.auth.onAuthStateChange(...) // 监听认证变化
```

### 5. 路由守卫更新

**升级前:**
```javascript
const isAuthenticated = !!sessionStorage.getItem('currentUser');
```

**升级后:**
```javascript
const isAuthenticated = !!currentUser.value;
```

### 6. 组件中的用户信息访问

**升级前:**
```javascript
const userRole = computed(() => {
    const user = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
    return user.role || 'trainee';
});
```

**升级后:**
```javascript
const userRole = computed(() => {
    return userProfile.value?.role || 'trainee';
});
```

### 7. 登出函数重构

**升级前:**
```javascript
const handleLogout = () => {
    sessionStorage.removeItem('currentUser');
    router.push('/');
};
```

**升级后:**
```javascript
const handleLogout = async () => {
    await supabase.auth.signOut();  // 服务器端登出
    currentUser.value = null;
    userProfile.value = null;
    router.push('/');
};
```

### 8. UI增强 - Supabase连接状态指示器

新增状态指示器在顶部导航栏：
- 绿色圆点 + "已连接" = Supabase配置正确
- 红色圆点 + "未配置" = SUPABASE_URL未配置或错误

### 9. AppLayout组件更新

移除了本地currentUser computed property，改用全局userProfile

新增supabaseStatus状态显示

## 文件结构

```
SOP管理系统/
├── index.html                 # 主应用（已升级）
├── setup.sql                  # Supabase初始化脚本
├── SUPABASE_SETUP.md         # Supabase配置指南（新增）
└── MIGRATION_NOTES.md        # 本文件
```

## 保持不变的部分

以下部分在升级中保持完全不变：

### 1. CSS样式
- 所有color variables（--primary, --accent等）
- 布局样式（sidebar, topbar, main-content）
- 组件样式（card, button, form等）
- 响应式设计

### 2. 课程数据
COURSES常量完全保留，包含7门课程的定义

### 3. 考试试题
EXAMS常量完全保留，包含5个级别的考试题库

### 4. 任务定义
TASKS常量完全保留，包含14个实操任务

### 5. 页面布局
- Login页面布局
- Dashboard布局
- 侧边栏导航结构
- 顶部导航栏

### 6. 路由配置
- 路由路径（/dashboard, /courses, /exam等）
- 元数据（requiresAuth）
- 嵌套路由结构

### 7. Vue Router配置
- createRouter / createWebHashHistory
- router.beforeEach守卫

### 8. Chart.js集成
- Chart.js加载和使用方式
- 图表配置参数

## 待完成的集成工作

以下组件需要进一步开发，将硬编码的测试数据替换为Supabase查询：

### Dashboard组件
```javascript
// 待完成：替换为Supabase查询
// 获取统计数据：用户总数、在培人数等
// 获取图表数据：学习进度分布、活跃度趋势
```

### Courses组件
```javascript
// 待完成：
// const { data } = await supabase
//     .from('course_progress')
//     .select('*')
//     .eq('user_id', userProfile.value.id);
```

### Exam组件
```javascript
// 待完成：
// 保存考试记录到exam_records表
// 查询历史考试成绩
```

### Tasks组件
```javascript
// 待完成：
// 提交任务：插入task_submissions
// 查询待评分任务（mentor）
// 查询个人任务完成情况（trainee）
```

### Mentor组件
```javascript
// 待完成：
// 创建/更新mentor_logs
// 查询学员进度
```

### KPI组件
```javascript
// 待完成：
// 保存KPI记录到kpi_records
// 读取历史KPI评分
```

### Evaluation组件
```javascript
// 待完成：
// 创建evaluation记录
// Admin审批流程
```

### Analytics组件
```javascript
// 待完成：
// 聚合查询各表数据
// 生成报表
```

## 数据操作模式

未来在组件中操作数据时，应使用以下模式：

### 查询
```javascript
const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('column', value);

if (error) console.error('查询错误:', error);
else console.log('数据:', data);
```

### 插入
```javascript
const { data, error } = await supabase
    .from('table_name')
    .insert([{ column1: value1, column2: value2 }]);

if (error) console.error('插入错误:', error);
```

### 更新
```javascript
const { data, error } = await supabase
    .from('table_name')
    .update({ column: new_value })
    .eq('id', record_id);
```

### Upsert（有则更新，无则插入）
```javascript
const { data, error } = await supabase
    .from('table_name')
    .upsert({ id: some_id, column: value });
```

### 删除
```javascript
const { data, error } = await supabase
    .from('table_name')
    .delete()
    .eq('id', record_id);
```

## 错误处理建议

添加错误处理到所有数据操作：

```javascript
try {
    const { data, error } = await supabase.from('table').select('*');

    if (error) {
        console.error('数据库错误:', error.message);
        // 显示用户友好的错误提示
        errorMessage.value = '无法加载数据，请稍后重试';
        return;
    }

    // 处理数据
    dataList.value = data;
} catch (err) {
    console.error('未知错误:', err);
    errorMessage.value = '发生错误，请刷新页面重试';
}
```

## 测试检查清单

部署前请验证以下功能：

- [ ] Supabase配置正确（绿色状态指示器）
- [ ] 新用户注册成功
- [ ] 已注册用户可以登录
- [ ] 登出功能正常
- [ ] 路由守卫正确（未登录无法访问/dashboard）
- [ ] Dashboard页面可以加载
- [ ] 侧边栏导航显示正确
- [ ] 用户信息正确显示
- [ ] 浏览器控制台无JavaScript错误

## 迁移后的优势

1. **数据持久化** - 用户数据永久保存
2. **安全认证** - 使用行业标准的加密密码存储
3. **实时协作** - 支持多用户同时在线
4. **权限隔离** - 数据库级别的RLS保护用户隐私
5. **可扩展性** - 易于添加新功能和表
6. **离线支持** - 可以后续集成Service Worker离线功能
7. **分析能力** - 数据库数据便于分析和报表生成

## 注意事项

1. **浏览器要求** - 需要支持localStorage和fetch API的现代浏览器
2. **网络依赖** - 系统必须连接到互联网
3. **CORS配置** - 如需自定义域名，需在Supabase配置CORS
4. **密钥安全** - SUPABASE_ANON_KEY在前端暴露但功能受限，应配合RLS使用
5. **费用** - Supabase有免费层和付费层，超过配额会影响服务

## 回滚计划

如需回滚到旧版本：

1. 恢复原来的index.html备份
2. 所有数据仍在Supabase中保存（可以迁移到其他系统）
3. 但无法在旧的内存系统中恢复（旧系统无持久化）

## 版本号

- **升级前版本**: 1.0 (纯前端)
- **升级后版本**: 2.0 (Supabase集成)
- **当前状态**: 2.0 Beta（认证集成完成，数据操作待集成）

## 相关文档

- SUPABASE_SETUP.md - 详细的Supabase配置指南
- setup.sql - Supabase数据库初始化脚本
- 官方文档: https://supabase.com/docs/guides/getting-started

## 支持与反馈

如有问题或建议，请：
1. 查看浏览器Console（F12）的错误信息
2. 检查Supabase仪表板的Logs
3. 参考SUPABASE_SETUP.md中的FAQ
4. 检查数据库SQL日志
