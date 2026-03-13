# 代码参考指南

## 全局变量和函数

### Supabase客户端
```javascript
// Supabase客户端实例
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 使用示例
const { data } = await supabase.from('users').select('*');
```

### 认证状态

```javascript
// 当前登录用户（来自Supabase Auth）
const currentUser = ref(null);
// 结构: { id, email, user_metadata, ... }

// 当前用户资料（来自users表）
const userProfile = ref(null);
// 结构: { id, auth_id, email, name, emp_id, role, role_level, mentor_id, ... }

// Supabase是否配置正确
const isSupabaseConfigured = computed(() => SUPABASE_URL !== 'YOUR_SUPABASE_URL');

// 当前是否已认证
const isAuthenticated = computed(() => !!currentUser.value);

// 当前用户角色
const userRole = computed(() => userProfile.value?.role || 'trainee');
```

### 初始化函数

```javascript
// 初始化认证状态（从localStorage恢复session）
async function initAuth() {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser.value = session.user;
            const { data } = await supabase
                .from('users')
                .select('*')
                .eq('auth_id', session.user.id)
                .single();
            userProfile.value = data;
        }
    } catch (error) {
        console.error('Auth initialization error:', error);
    }
}
```

## 常用API调用

### 认证

#### 登录
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
    email: 'user@example.com',
    password: 'password123'
});

if (error) {
    console.error('Login error:', error.message);
} else {
    currentUser.value = data.user;
    // 获取用户资料
    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('auth_id', data.user.id)
        .single();
    userProfile.value = profile;
}
```

#### 注册
```javascript
const { data, error } = await supabase.auth.signUp({
    email: 'newuser@example.com',
    password: 'securepassword123'
});

if (error) {
    console.error('Signup error:', error.message);
} else {
    // 在users表中创建用户资料
    const { error: dbError } = await supabase
        .from('users')
        .insert([{
            auth_id: data.user.id,
            email: 'newuser@example.com',
            name: '张三',
            emp_id: 'EMP001',
            role_level: 'assistant',
            role: 'trainee'
        }]);
}
```

#### 登出
```javascript
await supabase.auth.signOut();
currentUser.value = null;
userProfile.value = null;
```

#### 获取当前Session
```javascript
const { data: { session } } = await supabase.auth.getSession();
if (session) {
    console.log('User logged in:', session.user.email);
}
```

#### 监听认证状态变化
```javascript
const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        console.log('User signed in:', session.user);
    } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
    }
});

// 如需停止监听
// data.subscription.unsubscribe();
```

### 数据查询

#### 基本查询
```javascript
// 查询所有课程进度
const { data, error } = await supabase
    .from('course_progress')
    .select('*');

// 带条件查询
const { data, error } = await supabase
    .from('course_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'completed');

// 查询单条记录
const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
```

#### 条件过滤器
```javascript
// 等于
.eq('role', 'admin')

// 不等于
.neq('status', 'inactive')

// 大于 / 小于
.gt('score', 60)
.lt('score', 100)

// 大于等于 / 小于等于
.gte('score', 60)
.lte('score', 100)

// 包含（用于数组）
.contains('tags', ['important'])

// Like（模糊搜索）
.like('name', '%张%')

// IN（在列表中）
.in('role', ['admin', 'mentor'])
```

#### 排序和分页
```javascript
// 排序
.order('created_at', { ascending: false })  // 降序
.order('score', { ascending: true })        // 升序

// 限制和偏移
.limit(10)              // 返回前10条
.range(0, 9)            // 返回第0-9条（10条总数）
```

#### 关联查询（外键）
```javascript
// 查询带关联用户信息的mentor_logs
const { data } = await supabase
    .from('mentor_logs')
    .select(`
        *,
        mentor:mentor_id(id, name, emp_id),
        trainee:trainee_id(id, name, emp_id)
    `);
```

#### 计数查询
```javascript
// 获取符合条件的记录总数
const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'trainee');

console.log('Total trainees:', count);
```

### 数据修改

#### 插入（Insert）
```javascript
const { data, error } = await supabase
    .from('exam_records')
    .insert([{
        user_id: userId,
        role_level: 'assistant',
        score: 85,
        raw_score: 17,
        raw_total: 20,
        time_used: 1200
    }]);

if (error) {
    console.error('Insert error:', error.message);
} else {
    console.log('Inserted:', data);
}
```

#### 更新（Update）
```javascript
const { data, error } = await supabase
    .from('course_progress')
    .update({
        status: 'completed',
        complete_time: new Date().toISOString()
    })
    .eq('id', progressId);
```

#### Upsert（有则更新，无则插入）
```javascript
const { data, error } = await supabase
    .from('kpi_records')
    .upsert({
        user_id: userId,
        period: '2024年3月',
        items: [/* KPI items */],
        total_score: 95.5,
        grade: 'A'
    });
```

#### 删除（Delete）
```javascript
const { error } = await supabase
    .from('task_submissions')
    .delete()
    .eq('id', submissionId);
```

### 批量操作

#### 批量插入
```javascript
const records = [
    { user_id: user1, course_id: 1, status: 'completed' },
    { user_id: user2, course_id: 1, status: 'in_progress' },
    { user_id: user3, course_id: 1, status: 'not_started' }
];

const { data, error } = await supabase
    .from('course_progress')
    .insert(records);
```

#### 批量更新
```javascript
// 使用update + or条件实现批量更新
const { error } = await supabase
    .from('users')
    .update({ status: 'active' })
    .in('id', [userId1, userId2, userId3]);
```

## 组件集成示例

### Dashboard组件 - 加载统计数据
```javascript
const loadStats = async () => {
    try {
        // 获取总用户数
        const { count: totalUsers } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });

        // 获取在培人数
        const { count: inTraining } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active');

        // 获取当前用户的考试成绩
        const { data: exams } = await supabase
            .from('exam_records')
            .select('score')
            .eq('user_id', userProfile.value.id)
            .order('created_at', { ascending: false })
            .limit(1);

        stats.value = {
            totalUsers,
            inTraining,
            myExamScore: exams[0]?.score || null
        };
    } catch (error) {
        console.error('Error loading stats:', error);
    }
};

onMounted(() => {
    loadStats();
});
```

### Courses组件 - 加载课程进度
```javascript
const loadCourseProgress = async () => {
    try {
        const { data } = await supabase
            .from('course_progress')
            .select('*')
            .eq('user_id', userProfile.value.id);

        // 将数据映射到courseProgressMap
        data.forEach(progress => {
            courseProgressMap[progress.course_id] = progress;
        });
    } catch (error) {
        console.error('Error loading course progress:', error);
    }
};

const markCourseComplete = async (courseId) => {
    try {
        const existing = courseProgressMap[courseId];

        if (existing) {
            // 更新现有记录
            await supabase
                .from('course_progress')
                .update({
                    status: 'completed',
                    complete_time: new Date().toISOString()
                })
                .eq('id', existing.id);
        } else {
            // 创建新记录
            await supabase
                .from('course_progress')
                .insert([{
                    user_id: userProfile.value.id,
                    course_id: courseId,
                    status: 'completed',
                    complete_time: new Date().toISOString()
                }]);
        }

        // 重新加载
        await loadCourseProgress();
    } catch (error) {
        console.error('Error updating course progress:', error);
    }
};
```

### Exam组件 - 保存考试成绩
```javascript
const submitExam = async () => {
    try {
        const { error } = await supabase
            .from('exam_records')
            .insert([{
                user_id: userProfile.value.id,
                role_level: userProfile.value.role_level,
                score: finalScore.value,
                raw_score: correctCount.value,
                raw_total: EXAMS[userProfile.value.role_level].length,
                details: JSON.stringify(answers.value),
                time_used: timeSpent.value
            }]);

        if (error) throw error;

        alert(`考试成绩: ${finalScore.value}分`);
        router.push('/dashboard');
    } catch (error) {
        console.error('Error submitting exam:', error);
    }
};
```

### Tasks组件 - 提交和评分任务
```javascript
const submitTask = async (taskId, content) => {
    try {
        await supabase
            .from('task_submissions')
            .upsert({
                user_id: userProfile.value.id,
                task_id: taskId,
                content: content,
                status: 'submitted',
                submit_time: new Date().toISOString()
            });

        alert('任务提交成功！');
    } catch (error) {
        console.error('Error submitting task:', error);
    }
};

const scoreTask = async (submissionId, score, comment) => {
    try {
        await supabase
            .from('task_submissions')
            .update({
                score: score,
                scorer_id: userProfile.value.id,
                scorer_name: userProfile.value.name,
                status: 'scored',
                score_time: new Date().toISOString()
            })
            .eq('id', submissionId);

        alert('评分完成！');
    } catch (error) {
        console.error('Error scoring task:', error);
    }
};
```

### Mentor组件 - 带教跟踪
```javascript
const saveMentorLog = async (weekNum, content, feedback) => {
    try {
        await supabase
            .from('mentor_logs')
            .upsert({
                week_num: weekNum,
                mentor_id: userProfile.value.id,
                trainee_id: selectedTraineeId.value,
                mentor_content: content,
                mentor_feedback: feedback,
                mentor_signed_at: new Date().toISOString()
            });

        alert('跟踪记录已保存！');
    } catch (error) {
        console.error('Error saving mentor log:', error);
    }
};

const loadMentorLogs = async (traineeId) => {
    try {
        const { data } = await supabase
            .from('mentor_logs')
            .select(`
                *,
                mentor:mentor_id(name),
                trainee:trainee_id(name)
            `)
            .eq('trainee_id', traineeId)
            .order('week_num');

        mentorLogs.value = data;
    } catch (error) {
        console.error('Error loading mentor logs:', error);
    }
};
```

## 错误处理最佳实践

```javascript
async function safeDatabaseOperation(operation, errorMessage) {
    try {
        const result = await operation();

        if (result.error) {
            console.error('Database error:', result.error.message);
            throw new Error(result.error.message);
        }

        return result.data;
    } catch (error) {
        console.error(errorMessage, error);

        // 显示用户友好的错误消息
        if (error.message.includes('Row Level Security')) {
            return { error: '权限不足，无法访问该数据' };
        } else if (error.message.includes('violates unique constraint')) {
            return { error: '该记录已存在，不能重复添加' };
        } else {
            return { error: errorMessage || '操作失败，请稍后重试' };
        }
    }
}

// 使用示例
const data = await safeDatabaseOperation(
    () => supabase.from('users').select('*'),
    '无法加载用户列表'
);

if (data.error) {
    console.error(data.error);
    // 显示错误提示给用户
} else {
    // 处理数据
}
```

## 常用工具函数

### 将JSON字符串保存到JSONB字段
```javascript
const details = {
    answers: [1, 2, 0, 3, 1],
    spentTime: 1200,
    skipped: 2
};

await supabase
    .from('exam_records')
    .insert([{
        details: JSON.stringify(details)  // 转换为JSON字符串
    }]);
```

### 从JSONB字段读取JSON
```javascript
const { data } = await supabase
    .from('exam_records')
    .select('details')
    .eq('id', examId)
    .single();

const details = JSON.parse(data.details);  // 解析JSON字符串
console.log(details.answers);
```

### 生成UUID用于数据关联
```javascript
// Supabase会自动生成UUID，通常不需要手动处理
// 但如果需要在前端生成，可以使用：

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
```

### 格式化时间戳
```javascript
function formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString('zh-CN');
}

// 使用
const createdAt = formatTimestamp(record.created_at);
console.log(createdAt);  // "2024/3/7 15:30:45"
```

## 调试技巧

### 查看实时SQL日志
1. 打开Supabase仪表板
2. 进入 **Logs** 标签
3. 执行你的操作
4. 实时查看生成的SQL

### 查看浏览器网络请求
1. 打开浏览器开发者工具（F12）
2. 进入 **Network** 标签
3. 执行数据操作
4. 查看对Supabase API的请求和响应

### 添加调试日志
```javascript
// 在API调用前后添加日志
console.log('Starting query:', {
    table: 'course_progress',
    userId: userProfile.value.id
});

const { data, error } = await supabase
    .from('course_progress')
    .select('*')
    .eq('user_id', userProfile.value.id);

console.log('Query result:', { data, error });
```

## 性能优化

### 使用Realtime实时订阅（不在当前版本）
```javascript
// 注：需要在Supabase中启用Realtime，当前版本未实现
const subscription = supabase
    .from('exam_records')
    .on('*', payload => {
        console.log('New exam record:', payload.new);
    })
    .subscribe();
```

### 缓存常用查询
```javascript
const courseCache = ref(null);

const getCourses = async () => {
    if (courseCache.value) {
        return courseCache.value;
    }

    const { data } = await supabase
        .from('courses')
        .select('*');

    courseCache.value = data;
    return data;
};
```

### 批量查询优化
```javascript
// 不好的做法：循环查询
for (let userId of userIds) {
    const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId);
}

// 好的做法：一次查询所有
const { data } = await supabase
    .from('users')
    .select('*')
    .in('id', userIds);
```

## 相关文档

- Supabase文档: https://supabase.com/docs/reference/javascript
- PostgreSQL文档: https://www.postgresql.org/docs/
- Vue 3文档: https://vuejs.org/guide/introduction.html

