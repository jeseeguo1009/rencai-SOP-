const SUPPORT_HIDDEN_TITLE_PATTERNS = ['仓库装箱单'];

const isSupportPlaceholderOnlyText = (value) => {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    return /^[{}]+$/.test(trimmed);
};

const countSuspiciousRows = (rows, fields) => {
    if (!Array.isArray(rows) || !Array.isArray(fields)) return 0;
    return rows.filter((item) => fields.some((field) => {
        const text = typeof item[field] === 'string' ? item[field].trim() : '';
        if (!text) return false;
        return SUPPORT_HIDDEN_TITLE_PATTERNS.some((keyword) => text.includes(keyword)) || isSupportPlaceholderOnlyText(text);
    })).length;
};

window.AppSupportViews = {
    createResourcesView(context) {
        const {
            ref,
            computed,
            fallbackResources
        } = context;

        return {
            template: `
                <div>
                    <h1 style="margin-bottom: 20px;">资源中心</h1>

                    <div style="margin-bottom: 30px;">
                        <div class="flex" style="margin-bottom: 15px;">
                            <input type="text" class="form-input" v-model="searchQuery" placeholder="搜索FAQ、模板、链接..." style="flex: 1;">
                            <button class="btn btn-primary" style="margin-left: 10px;">搜索</button>
                        </div>
                    </div>

                    <div class="grid" style="grid-template-columns: repeat(3, 1fr);">
                        <div class="card" @click="currentTab = 'faq'" style="cursor: pointer; border: 2px solid" :style="{ borderColor: currentTab === 'faq' ? 'var(--accent)' : 'var(--border)' }">
                            <div style="font-size: 24px; margin-bottom: 10px;">❓</div>
                            <div style="font-weight: 600; margin-bottom: 5px;">FAQ知识库</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">23条常见问题</div>
                        </div>
                        <div class="card" @click="currentTab = 'template'" style="cursor: pointer; border: 2px solid" :style="{ borderColor: currentTab === 'template' ? 'var(--accent)' : 'var(--border)' }">
                            <div style="font-size: 24px; margin-bottom: 10px;">📋</div>
                            <div style="font-weight: 600; margin-bottom: 5px;">工作模板</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">15个常用模板</div>
                        </div>
                        <div class="card" @click="currentTab = 'link'" style="cursor: pointer; border: 2px solid" :style="{ borderColor: currentTab === 'link' ? 'var(--accent)' : 'var(--border)' }">
                            <div style="font-size: 24px; margin-bottom: 10px;">🔗</div>
                            <div style="font-weight: 600; margin-bottom: 5px;">常用链接</div>
                            <div style="font-size: 12px; color: var(--text-secondary);">18条快速导航</div>
                        </div>
                    </div>

                    <div v-if="currentTab === 'faq'" class="card" style="margin-top: 20px;">
                        <div class="card-title">FAQ知识库</div>
                        <div style="padding: 20px;">
                            <div v-for="(faq, index) in filteredFAQ" :key="index" style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid var(--border);">
                                <h3 style="margin-bottom: 10px; cursor: pointer; color: var(--accent);" @click="faq.expanded = !faq.expanded">
                                    {{ faq.expanded ? '▼' : '▶' }} {{ faq.question }}
                                </h3>
                                <p v-if="faq.expanded" style="color: var(--text-secondary); line-height: 1.8;">{{ faq.answer }}</p>
                            </div>
                        </div>
                    </div>

                    <div v-else-if="currentTab === 'template'" class="card" style="margin-top: 20px;">
                        <div class="card-title">工作模板下载</div>
                        <table class="table" style="margin-top: 15px;">
                            <thead>
                                <tr>
                                    <th>模板名称</th>
                                    <th>分类</th>
                                    <th>下载</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>日报模板</td>
                                    <td>报表</td>
                                    <td><a href="#" style="color: var(--accent);">下载</a></td>
                                </tr>
                                <tr>
                                    <td>周报模板</td>
                                    <td>报表</td>
                                    <td><a href="#" style="color: var(--accent);">下载</a></td>
                                </tr>
                                <tr>
                                    <td>月报模板</td>
                                    <td>报表</td>
                                    <td><a href="#" style="color: var(--accent);">下载</a></td>
                                </tr>
                                <tr>
                                    <td>客户档案模板</td>
                                    <td>客户管理</td>
                                    <td><a href="#" style="color: var(--accent);">下载</a></td>
                                </tr>
                                <tr>
                                    <td>销售计划模板</td>
                                    <td>销售管理</td>
                                    <td><a href="#" style="color: var(--accent);">下载</a></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div v-else-if="currentTab === 'link'" class="card" style="margin-top: 20px;">
                        <div class="card-title">常用链接</div>
                        <div style="padding: 20px;">
                            <div v-for="link in links" :key="link.id" style="margin-bottom: 15px;">
                                <a :href="link.url" target="_blank" style="color: var(--accent); font-weight: 600; text-decoration: none;">
                                    {{ link.name }} →
                                </a>
                                <p style="font-size: 12px; color: var(--text-secondary); margin-top: 5px;">{{ link.description }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            setup() {
                const currentTab = ref('faq');
                const searchQuery = ref('');
                const faqItems = ref(fallbackResources.faqItems.map((item) => ({ ...item })));
                const links = ref(fallbackResources.links.map((item) => ({ ...item })));

                const filteredFAQ = computed(() => {
                    if (!searchQuery.value) return faqItems.value;
                    return faqItems.value.filter((item) =>
                        item.question.includes(searchQuery.value) || item.answer.includes(searchQuery.value)
                    );
                });

                return {
                    currentTab,
                    searchQuery,
                    faqItems,
                    links,
                    filteredFAQ
                };
            }
        };
    },

    createAnalyticsView(context) {
        const {
            ref,
            reactive,
            watch,
            onUnmounted,
            catalogState,
            isSupabaseConfigured,
            DatabaseService,
            supabase,
            toDateInputValue,
            Chart
        } = context;

        const backupTableConfigs = [
            { table: 'users', mode: 'merge', keepId: true, upsertOptions: { onConflict: 'id' } },
            { table: 'course_catalog', mode: 'merge', keepId: true, upsertOptions: { onConflict: 'id' } },
            { table: 'task_catalog', mode: 'merge', keepId: true, upsertOptions: { onConflict: 'id' } },
            { table: 'exam_question_bank', mode: 'merge', keepId: false, upsertOptions: { onConflict: 'role_name,question_order' } },
            { table: 'course_progress', mode: 'merge', keepId: false, upsertOptions: { onConflict: 'user_id,course_id' } },
            { table: 'task_submissions', mode: 'merge', keepId: false, upsertOptions: { onConflict: 'user_id,task_id' } },
            { table: 'mentor_logs', mode: 'merge', keepId: false, upsertOptions: { onConflict: 'week_num,trainee_id' } },
            { table: 'kpi_records', mode: 'merge', keepId: false, upsertOptions: { onConflict: 'user_id,period' } },
            { table: 'exam_records', mode: 'append', keepId: false },
            { table: 'evaluations', mode: 'append', keepId: false },
            { table: 'talent_workflow_cases', mode: 'append', keepId: false },
            { table: 'courseware_library', mode: 'append', keepId: false },
            { table: 'archive_records', mode: 'append', keepId: false },
            { table: 'pilot_runs', mode: 'append', keepId: false },
            { table: 'notifications', mode: 'append', keepId: false },
            { table: 'approval_logs', mode: 'append', keepId: false }
        ];

        return {
            template: `
                <div>
                    <h1 style="margin-bottom: 20px;">数据分析与报表</h1>

                    <div class="grid">
                        <div class="stat-card">
                            <div class="stat-card-label">总在培人数</div>
                            <div class="stat-card-value">{{ summary.totalTrainees }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">平均课程完成率</div>
                            <div class="stat-card-value">{{ summary.avgCourseCompletion }}%</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">平均考试成绩</div>
                            <div class="stat-card-value">{{ summary.avgExamScore }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">本月转正人数</div>
                            <div class="stat-card-value">{{ summary.completedEvaluations }}</div>
                        </div>
                    </div>

                    <div class="grid">
                        <div class="card">
                            <div class="card-title">团队学习进度总览</div>
                            <canvas id="progressOverviewChart"></canvas>
                        </div>
                        <div class="card">
                            <div class="card-title">考试成绩分布</div>
                            <canvas id="scoreDistributionChart"></canvas>
                        </div>
                    </div>

                    <div class="grid">
                        <div class="card">
                            <div class="card-title">课程完成率排名</div>
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>学员</th>
                                        <th>课程完成</th>
                                        <th>考试成绩</th>
                                        <th>任务完成</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="row in rankingRows" :key="row.name">
                                        <td>{{ row.name }}</td>
                                        <td>{{ row.courseCompleted }}/{{ catalogState.courses.length }}</td>
                                        <td>{{ row.examScore }}</td>
                                        <td>{{ row.taskCompleted }}/{{ catalogState.tasks.length }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="card">
                            <div class="card-title">月度转正统计</div>
                            <canvas id="confirmationChart"></canvas>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">数据导入导出</div>
                        <div style="padding: 20px;">
                            <div class="flex gap-10" style="margin-bottom: 15px;">
                                <button class="btn btn-secondary" :disabled="backupBusy" @click="exportBackup">{{ backupBusy ? '处理中...' : '📥 导出数据为JSON' }}</button>
                                <button class="btn btn-secondary" :disabled="backupBusy || !isSupabaseConfigured" @click="triggerImport">{{ backupBusy ? '处理中...' : '📤 从JSON导入数据' }}</button>
                                <input ref="importInput" type="file" accept="application/json" style="display: none;" @change="handleImportFile">
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary);">
                                💡 提示：定期导出数据可作为备份，当前已覆盖目录、学习过程、通知消息和审批留痕；导入会优先合并目录与过程数据，并追加历史记录类数据。
                            </div>
                            <div v-if="backupMessage" style="font-size: 12px; color: var(--accent); margin-top: 10px;">
                                {{ backupMessage }}
                            </div>
                        </div>
                    </div>
                </div>
            `,
            setup() {
                const summary = reactive({
                    totalTrainees: 24,
                    avgCourseCompletion: 85,
                    avgExamScore: 88,
                    completedEvaluations: 3
                });
                const rankingRows = ref([
                    { name: '张三', courseCompleted: 7, examScore: 92, taskCompleted: 14 },
                    { name: '李四', courseCompleted: 6, examScore: 88, taskCompleted: 12 },
                    { name: '王五', courseCompleted: 5, examScore: 85, taskCompleted: 10 }
                ]);
                const chartState = reactive({
                    progressLabels: catalogState.courses.map((course) => `第${course.id}课`),
                    progressData: catalogState.courses.map(() => 0),
                    scoreBuckets: [0, 0, 0, 0],
                    confirmationLabels: ['近五月'],
                    confirmationData: [0]
                });
                const importInput = ref(null);
                const backupBusy = ref(false);
                const backupMessage = ref('');
                let progressOverviewChart = null;
                let scoreDistributionChart = null;
                let confirmationChart = null;

                const sanitizeRows = (rows, keepId) => rows.map((row) => {
                    if (keepId) return { ...row };
                    const { id, ...rest } = row;
                    return rest;
                });

                const exportBackup = async () => {
                    backupBusy.value = true;
                    backupMessage.value = '';

                    try {
                        let payload;
                        if (!isSupabaseConfigured.value) {
                            payload = {
                                exported_at: new Date().toISOString(),
                                source: 'local',
                                catalog: catalogState,
                                analytics: {
                                    summary: { ...summary },
                                    rankingRows: rankingRows.value
                                }
                            };
                        } else {
                            const tableEntries = await Promise.all(
                                backupTableConfigs.map(async (config) => {
                                    const rows = await DatabaseService.list(supabase, config.table, {
                                        select: '*'
                                    });
                                    return [config.table, rows];
                                })
                            );
                            payload = {
                                exported_at: new Date().toISOString(),
                                source: 'supabase',
                                tables: Object.fromEntries(tableEntries)
                            };
                        }

                        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `sop-backup-${new Date().toISOString().slice(0, 10)}.json`;
                        link.click();
                        URL.revokeObjectURL(url);
                        backupMessage.value = '备份文件已生成，可用于手工归档或恢复。';
                    } catch (error) {
                        console.error('Backup export error:', error);
                        backupMessage.value = `导出失败：${error.message || '请检查数据权限'}`;
                    } finally {
                        backupBusy.value = false;
                    }
                };

                const triggerImport = () => {
                    if (!isSupabaseConfigured.value || backupBusy.value) return;
                    importInput.value?.click();
                };

                const handleImportFile = async (event) => {
                    const file = event.target.files && event.target.files[0];
                    if (!file) return;

                    backupBusy.value = true;
                    backupMessage.value = '';

                    try {
                        const text = await file.text();
                        const payload = JSON.parse(text);
                        const tables = payload.tables || {};

                        for (const config of backupTableConfigs) {
                            const rawRows = Array.isArray(tables[config.table]) ? tables[config.table] : [];
                            if (!rawRows.length) continue;

                            const rows = sanitizeRows(rawRows, config.keepId);
                            if (config.mode === 'merge') {
                                await DatabaseService.upsert(supabase, config.table, rows, {
                                    upsertOptions: config.upsertOptions || {}
                                });
                            } else {
                                await DatabaseService.insert(supabase, config.table, rows);
                            }
                        }

                        backupMessage.value = '导入完成：目录和过程数据已合并，历史记录类数据已追加。';
                        await loadAnalytics();
                    } catch (error) {
                        console.error('Backup import error:', error);
                        backupMessage.value = `导入失败：${error.message || '请确认文件格式和数据权限'}`;
                    } finally {
                        if (importInput.value) {
                            importInput.value.value = '';
                        }
                        backupBusy.value = false;
                    }
                };

                const renderCharts = () => {
                    setTimeout(() => {
                        if (progressOverviewChart) progressOverviewChart.destroy();
                        if (scoreDistributionChart) scoreDistributionChart.destroy();
                        if (confirmationChart) confirmationChart.destroy();

                        const progressCanvas = document.getElementById('progressOverviewChart');
                        if (progressCanvas) {
                            progressOverviewChart = new Chart(progressCanvas, {
                                type: 'bar',
                                data: {
                                    labels: chartState.progressLabels,
                                    datasets: [{
                                        label: '完成人数',
                                        data: chartState.progressData,
                                        backgroundColor: '#FF6B35'
                                    }]
                                },
                                options: { responsive: true, plugins: { legend: { display: false } } }
                            });
                        }

                        const scoreCanvas = document.getElementById('scoreDistributionChart');
                        if (scoreCanvas) {
                            scoreDistributionChart = new Chart(scoreCanvas, {
                                type: 'bar',
                                data: {
                                    labels: ['60以下', '60-79', '80-89', '90以上'],
                                    datasets: [{
                                        label: '人数',
                                        data: chartState.scoreBuckets,
                                        backgroundColor: '#4DD8E8'
                                    }]
                                },
                                options: { responsive: true, plugins: { legend: { display: false } } }
                            });
                        }

                        const confirmationCanvas = document.getElementById('confirmationChart');
                        if (confirmationCanvas) {
                            confirmationChart = new Chart(confirmationCanvas, {
                                type: 'line',
                                data: {
                                    labels: chartState.confirmationLabels,
                                    datasets: [{
                                        label: '转正人数',
                                        data: chartState.confirmationData,
                                        borderColor: '#52c41a',
                                        backgroundColor: 'rgba(82, 196, 26, 0.1)',
                                        tension: 0.4
                                    }]
                                },
                                options: { responsive: true, plugins: { legend: { display: false } } }
                            });
                        }
                    }, 100);
                };

                const loadAnalytics = async () => {
                    if (!isSupabaseConfigured.value) {
                        renderCharts();
                        return;
                    }

                    try {
                        const trainees = await DatabaseService.list(supabase, 'users', {
                            select: 'id, name',
                            filters: [{ type: 'eq', column: 'role', value: 'trainee' }]
                        });
                        summary.totalTrainees = trainees.length;

                        if (!trainees.length) {
                            renderCharts();
                            return;
                        }

                        const traineeIds = trainees.map((row) => row.id);
                        const [progressRows, examRows, taskRows, evalRows] = await Promise.all([
                            DatabaseService.list(supabase, 'course_progress', {
                                select: 'user_id, course_id, status',
                                filters: [{ type: 'in', column: 'user_id', value: traineeIds }]
                            }),
                            DatabaseService.list(supabase, 'exam_records', {
                                select: 'user_id, score, created_at',
                                filters: [{ type: 'in', column: 'user_id', value: traineeIds }]
                            }),
                            DatabaseService.list(supabase, 'task_submissions', {
                                select: 'user_id, status',
                                filters: [{ type: 'in', column: 'user_id', value: traineeIds }]
                            }),
                            DatabaseService.list(supabase, 'evaluations', {
                                select: 'status, created_at',
                                filters: [{ type: 'order', column: 'created_at', ascending: true }]
                            })
                        ]);

                        const completedProgress = progressRows.filter((row) => row.status === 'completed');
                        summary.avgCourseCompletion = Math.round((completedProgress.length / Math.max(trainees.length * Math.max(catalogState.courses.length, 1), 1)) * 100);

                        const latestExamMap = new Map();
                        examRows
                            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                            .forEach((row) => {
                                if (!latestExamMap.has(row.user_id)) latestExamMap.set(row.user_id, row.score);
                            });
                        const latestScores = Array.from(latestExamMap.values());
                        summary.avgExamScore = latestScores.length ? Math.round(latestScores.reduce((sum, score) => sum + score, 0) / latestScores.length) : 0;
                        summary.completedEvaluations = evalRows.filter((row) => row.status === 'completed' || row.status === 'admin_reviewed').length;

                        chartState.progressLabels = catalogState.courses.map((course) => `第${course.id}课`);
                        chartState.progressData = catalogState.courses.map((course) =>
                            completedProgress.filter((row) => row.course_id === course.id).length
                        );
                        chartState.scoreBuckets = [
                            latestScores.filter((score) => score < 60).length,
                            latestScores.filter((score) => score >= 60 && score < 80).length,
                            latestScores.filter((score) => score >= 80 && score < 90).length,
                            latestScores.filter((score) => score >= 90).length
                        ];

                        const monthBuckets = {};
                        evalRows.forEach((row) => {
                            const month = toDateInputValue(row.created_at).slice(0, 7);
                            monthBuckets[month] = (monthBuckets[month] || 0) + 1;
                        });
                        chartState.confirmationLabels = Object.keys(monthBuckets).length ? Object.keys(monthBuckets) : ['近五月'];
                        chartState.confirmationData = Object.values(monthBuckets).length ? Object.values(monthBuckets) : [summary.completedEvaluations];

                        rankingRows.value = trainees.map((trainee) => ({
                            name: trainee.name,
                            courseCompleted: completedProgress.filter((row) => row.user_id === trainee.id).length,
                            examScore: latestExamMap.get(trainee.id) || 0,
                            taskCompleted: taskRows.filter((row) => row.user_id === trainee.id && row.status === 'scored').length
                        })).sort((a, b) => b.courseCompleted - a.courseCompleted || b.examScore - a.examScore).slice(0, 10);
                    } catch (error) {
                        console.error('Analytics load error:', error);
                    } finally {
                        renderCharts();
                    }
                };

                watch(
                    () => [isSupabaseConfigured.value, catalogState.courses.length, catalogState.tasks.length],
                    loadAnalytics,
                    { immediate: true }
                );

                onUnmounted(() => {
                    if (progressOverviewChart) progressOverviewChart.destroy();
                    if (scoreDistributionChart) scoreDistributionChart.destroy();
                    if (confirmationChart) confirmationChart.destroy();
                });

                return { summary, rankingRows, catalogState, isSupabaseConfigured, importInput, backupBusy, backupMessage, exportBackup, triggerImport, handleImportFile };
            }
        };
    },

    createNotificationsView(context) {
        const {
            ref,
            computed,
            watch,
            onMounted,
            onUnmounted,
            useRouter,
            userProfile,
            isSupabaseConfigured,
            DatabaseService,
            supabase,
            toDateInputValue
        } = context;

        return {
            template: `
                <div>
                    <div class="flex-between" style="margin-bottom: 20px;">
                        <div>
                            <h1>通知中心</h1>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">查看审批提醒、系统消息和流程通知</div>
                        </div>
                        <div class="flex gap-10">
                            <button class="btn btn-secondary" @click="markAllRead" :disabled="!canMarkAll">全部标记已读</button>
                        </div>
                    </div>

                    <div class="grid">
                        <div class="stat-card">
                            <div class="stat-card-label">消息总数</div>
                            <div class="stat-card-value">{{ notifications.length }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">未读消息</div>
                            <div class="stat-card-value">{{ unreadCount }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">审批相关</div>
                            <div class="stat-card-value">{{ approvalCount }}</div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">消息筛选</div>
                        <div style="padding: 20px;" class="flex gap-10">
                            <select class="form-select" v-model="selectedType" style="max-width: 220px;">
                                <option value="">全部类型</option>
                                <option value="approval">审批提醒</option>
                                <option value="workflow">流程更新</option>
                                <option value="mentor">带教跟进</option>
                                <option value="kpi">KPI更新</option>
                                <option value="courseware">课件更新</option>
                            </select>
                            <select class="form-select" v-model="selectedReadStatus" style="max-width: 180px;">
                                <option value="">全部状态</option>
                                <option value="unread">仅未读</option>
                                <option value="read">仅已读</option>
                            </select>
                            <input class="form-input" v-model="searchText" placeholder="搜索标题、内容、动作建议..." style="max-width: 360px;">
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">消息列表</div>
                        <div style="padding: 20px;">
                            <div v-for="item in filteredNotifications" :key="item.id" style="padding: 16px 0; border-bottom: 1px solid var(--border);">
                                <div class="flex-between" style="align-items: flex-start; gap: 16px;">
                                    <div style="flex: 1;">
                                        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
                                            <span class="badge" :class="item.read ? 'badge-info' : 'badge-warning'">{{ item.read ? '已读' : '未读' }}</span>
                                            <span class="badge badge-info">{{ item.typeLabel }}</span>
                                            <span style="font-weight: 600;">{{ item.title }}</span>
                                        </div>
                                        <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.8;">{{ item.content }}</div>
                                        <div style="font-size: 12px; color: var(--accent); margin-top: 6px;">{{ item.actionHint }}</div>
                                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 8px;">{{ item.created_at }}</div>
                                    </div>
                                    <div class="flex gap-10">
                                        <button v-if="item.route" class="btn btn-text" @click="openNotification(item)">前往处理</button>
                                        <button v-if="!item.read" class="btn btn-text" @click="markRead(item)">标记已读</button>
                                    </div>
                                </div>
                            </div>
                            <div v-if="!filteredNotifications.length" style="text-align: center; color: var(--text-secondary); padding: 20px 0;">
                                当前筛选条件下暂无通知
                            </div>
                        </div>
                    </div>
                </div>
            `,
            setup() {
                const router = useRouter();
                const notifications = ref([]);
                const selectedType = ref('');
                const selectedReadStatus = ref('');
                const searchText = ref('');
                let refreshTimer = null;
                const typeLabels = {
                    approval: '审批提醒',
                    workflow: '流程更新',
                    mentor: '带教跟进',
                    kpi: 'KPI更新',
                    courseware: '课件更新'
                };
                const resolveNotificationRoute = (item) => {
                    if (item.route) return item.route;
                    if (item.type === 'approval') return '/evaluation';
                    if (item.type === 'workflow') return '/workflow';
                    if (item.type === 'mentor') return '/mentor';
                    if (item.type === 'kpi') return '/kpi';
                    if (item.type === 'courseware') return '/courseware';
                    return '';
                };
                const resolveActionHint = (item) => {
                    if (item.type === 'approval') return '建议进入转正评估页完成审批或复核。';
                    if (item.type === 'workflow') return '建议进入人才流程页确认当前阶段和下一步安排。';
                    if (item.type === 'mentor') return '建议进入带教跟踪页查看本周记录与反馈。';
                    if (item.type === 'kpi') return '建议进入 KPI 页面确认目标、得分和后续动作。';
                    if (item.type === 'courseware') return '建议进入课件版本库查看最新资料并同步学习计划。';
                    return '建议进入对应页面查看详情。';
                };
                const fallback = [
                    { id: 1, title: '转正评估状态已更新', content: '张三的转正评估已提交，请及时审批。', type: 'approval', read: false, created_at: '2026-03-12', route: '/evaluation', typeLabel: typeLabels.approval, actionHint: resolveActionHint({ type: 'approval' }) },
                    { id: 2, title: '人才流程已归档', content: '王五的人才培养流程已进入归档阶段。', type: 'workflow', read: true, created_at: '2026-03-11', route: '/workflow', typeLabel: typeLabels.workflow, actionHint: resolveActionHint({ type: 'workflow' }) }
                ];

                const loadNotifications = async () => {
                    if (!isSupabaseConfigured.value || !userProfile.value) {
                        notifications.value = fallback;
                        return;
                    }

                    try {
                        const rows = await DatabaseService.list(supabase, 'notifications', {
                            select: '*',
                            filters: [
                                { type: 'eq', column: 'user_id', value: userProfile.value.id },
                                { type: 'order', column: 'created_at', ascending: false }
                            ]
                        });
                        notifications.value = rows.length ? rows.map((row) => ({
                            ...row,
                            created_at: toDateInputValue(row.created_at),
                            route: resolveNotificationRoute(row),
                            typeLabel: typeLabels[row.type] || '系统通知',
                            actionHint: resolveActionHint(row)
                        })) : fallback;
                    } catch (error) {
                        console.error('Notifications load error:', error);
                        notifications.value = fallback;
                    }
                };
                const emitAppDataRefresh = () => {
                    window.dispatchEvent(new CustomEvent('app-data-refresh'));
                };

                const markRead = async (item, notifyTopbar = true) => {
                    item.read = true;
                    if (!isSupabaseConfigured.value) {
                        if (notifyTopbar) emitAppDataRefresh();
                        return;
                    }
                    try {
                        await DatabaseService.upsert(supabase, 'notifications', [{
                            id: item.id,
                            user_id: item.user_id,
                            type: item.type,
                            title: item.title,
                            content: item.content,
                            read: true
                        }], {
                            upsertOptions: { onConflict: 'id' }
                        });
                        if (notifyTopbar) emitAppDataRefresh();
                    } catch (error) {
                        console.error('Notification mark read error:', error);
                    }
                };

                const markAllRead = async () => {
                    for (const item of notifications.value.filter((entry) => !entry.read)) {
                        await markRead(item, false);
                    }
                    emitAppDataRefresh();
                };
                const openNotification = async (item) => {
                    if (!item.read) {
                        await markRead(item);
                    }
                    if (item.route) {
                        router.push(item.route);
                    }
                };

                const unreadCount = computed(() => notifications.value.filter((item) => !item.read).length);
                const approvalCount = computed(() => notifications.value.filter((item) => item.type === 'approval').length);
                const canMarkAll = computed(() => unreadCount.value > 0);
                const filteredNotifications = computed(() => notifications.value.filter((item) => {
                    const typeMatch = !selectedType.value || item.type === selectedType.value;
                    const readMatch = !selectedReadStatus.value
                        || (selectedReadStatus.value === 'read' && item.read)
                        || (selectedReadStatus.value === 'unread' && !item.read);
                    const query = searchText.value.trim();
                    const searchMatch = !query || `${item.title || ''} ${item.content || ''} ${item.actionHint || ''}`.includes(query);
                    return typeMatch && readMatch && searchMatch;
                }));
                const refreshNotificationsOnFocus = () => {
                    loadNotifications();
                };
                const refreshNotificationsOnVisible = () => {
                    if (document.visibilityState === 'visible') {
                        loadNotifications();
                    }
                };
                const refreshNotificationsOnDataUpdate = () => {
                    loadNotifications();
                };

                watch(() => [isSupabaseConfigured.value, userProfile.value?.id], loadNotifications, { immediate: true });
                onMounted(() => {
                    refreshTimer = setInterval(loadNotifications, 30000);
                    window.addEventListener('focus', refreshNotificationsOnFocus);
                    window.addEventListener('app-data-refresh', refreshNotificationsOnDataUpdate);
                    document.addEventListener('visibilitychange', refreshNotificationsOnVisible);
                });
                onUnmounted(() => {
                    if (refreshTimer) clearInterval(refreshTimer);
                    window.removeEventListener('focus', refreshNotificationsOnFocus);
                    window.removeEventListener('app-data-refresh', refreshNotificationsOnDataUpdate);
                    document.removeEventListener('visibilitychange', refreshNotificationsOnVisible);
                });

                return {
                    notifications,
                    selectedType,
                    selectedReadStatus,
                    searchText,
                    unreadCount,
                    approvalCount,
                    canMarkAll,
                    filteredNotifications,
                    markRead,
                    markAllRead,
                    openNotification
                };
            }
        };
    },

    createApprovalCenterView(context) {
        const {
            ref,
            computed,
            watch,
            onMounted,
            onUnmounted,
            useRouter,
            userProfile,
            isSupabaseConfigured,
            DatabaseService,
            supabase,
            toDateInputValue
        } = context;

        return {
            template: `
                <div>
                    <div class="flex-between" style="margin-bottom: 20px;">
                        <div>
                            <h1>审批中心</h1>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">集中查看评估、带教、KPI 和人才流程动作</div>
                        </div>
                        <button class="btn btn-secondary" @click="exportLogs">导出当前筛选</button>
                    </div>

                    <div class="grid" style="grid-template-columns: repeat(4, minmax(0, 1fr));">
                        <div class="stat-card">
                            <div class="stat-card-label">日志总数</div>
                            <div class="stat-card-value">{{ filteredLogs.length }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">转正评估</div>
                            <div class="stat-card-value">{{ summary.evaluation }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">人才流程</div>
                            <div class="stat-card-value">{{ summary.workflow }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">带教/KPI</div>
                            <div class="stat-card-value">{{ summary.mentor + summary.kpi }}</div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">筛选</div>
                        <div style="padding: 20px;" class="flex gap-10">
                            <select class="form-select" v-model="selectedModule" style="max-width: 220px;">
                                <option value="">全部模块</option>
                                <option value="evaluation">转正评估</option>
                                <option value="talent_workflow">人才流程</option>
                                <option value="mentor">带教跟踪</option>
                                <option value="kpi">KPI考核</option>
                                <option value="courseware">课件发布</option>
                                <option value="pilot_run">试运行</option>
                            </select>
                            <input class="form-input" v-model="searchText" placeholder="搜索执行人、摘要、对象..." style="max-width: 320px;">
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">审批日志</div>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>时间</th>
                                    <th>模块</th>
                                    <th>动作</th>
                                    <th>执行人</th>
                                    <th>摘要</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in filteredLogs" :key="item.id">
                                    <td>{{ item.created_at }}</td>
                                    <td><span class="badge badge-info">{{ item.moduleLabel }}</span></td>
                                    <td>{{ item.actionLabel }}</td>
                                    <td>{{ item.actorName }}</td>
                                    <td>{{ item.summary }}</td>
                                    <td><button v-if="item.route" class="btn btn-text" @click="openLog(item)">查看</button></td>
                                </tr>
                            </tbody>
                        </table>
                        <div v-if="!filteredLogs.length" style="padding: 20px; color: var(--text-secondary);">当前筛选条件下没有审批日志</div>
                    </div>
                </div>
            `,
            setup() {
                const router = useRouter();
                const approvalLogs = ref([]);
                const selectedModule = ref('');
                const searchText = ref('');
                let refreshTimer = null;
                const moduleLabels = {
                    evaluation: '转正评估',
                    talent_workflow: '人才流程',
                    mentor: '带教跟踪',
                    kpi: 'KPI考核',
                    courseware: '课件发布',
                    pilot_run: '试运行'
                };
                const routeByModule = {
                    evaluation: '/evaluation',
                    talent_workflow: '/workflow',
                    mentor: '/mentor',
                    kpi: '/kpi',
                    courseware: '/courseware',
                    pilot_run: '/pilot'
                };
                const actionLabels = {
                    submitted: '提交评估',
                    approved: '审批通过',
                    delayed: '延期转正',
                    rejected: '驳回',
                    created: '新建流程',
                    stage_advanced: '推进阶段',
                    archived: '归档',
                    weekly_log_saved: '保存周记录',
                    kpi_saved: '保存KPI',
                    published: '发布课件',
                    pilot_created: '新建试运行',
                    pilot_started: '开始试运行',
                    pilot_completed: '完成试运行',
                    pilot_updated: '更新试运行结果'
                };
                const fallback = [
                    { id: 1, module: 'evaluation', action: 'submitted', actorName: '管理员', summary: '推荐转正，综合评分 91', created_at: '2026-03-13', route: '/evaluation' },
                    { id: 2, module: 'talent_workflow', action: 'stage_advanced', actorName: '导师', summary: '流程已推进到培养中', created_at: '2026-03-12', route: '/workflow' }
                ];

                const loadApprovalLogs = async () => {
                    if (!isSupabaseConfigured.value || !userProfile.value) {
                        approvalLogs.value = fallback.map((item) => ({
                            ...item,
                            moduleLabel: moduleLabels[item.module] || item.module,
                            actionLabel: actionLabels[item.action] || item.action
                        }));
                        return;
                    }

                    try {
                        const rows = await DatabaseService.list(supabase, 'approval_logs', {
                            select: '*',
                            filters: [{ type: 'order', column: 'created_at', ascending: false }]
                        });
                        approvalLogs.value = rows.map((row) => ({
                            ...row,
                            created_at: toDateInputValue(row.created_at),
                            moduleLabel: moduleLabels[row.module] || row.module,
                            actionLabel: actionLabels[row.action] || row.action,
                            actorName: row.detail?.actor_name || '系统',
                            summary: row.detail?.summary || row.detail?.candidate_name || row.detail?.trainee_name || '流程动作已记录',
                            route: routeByModule[row.module] || ''
                        }));
                    } catch (error) {
                        console.error('Approval center load error:', error);
                        approvalLogs.value = fallback.map((item) => ({
                            ...item,
                            moduleLabel: moduleLabels[item.module] || item.module,
                            actionLabel: actionLabels[item.action] || item.action
                        }));
                    }
                };

                const filteredLogs = computed(() => approvalLogs.value.filter((item) => {
                    const moduleMatch = !selectedModule.value || item.module === selectedModule.value;
                    const text = searchText.value.trim();
                    const searchMatch = !text || `${item.actorName} ${item.summary} ${item.moduleLabel}`.includes(text);
                    return moduleMatch && searchMatch;
                }));
                const summary = computed(() => ({
                    evaluation: approvalLogs.value.filter((item) => item.module === 'evaluation').length,
                    workflow: approvalLogs.value.filter((item) => item.module === 'talent_workflow').length,
                    mentor: approvalLogs.value.filter((item) => item.module === 'mentor').length,
                    kpi: approvalLogs.value.filter((item) => item.module === 'kpi').length
                }));
                const openLog = (item) => {
                    if (item.route) router.push(item.route);
                };
                const exportLogs = () => {
                    const payload = {
                        exported_at: new Date().toISOString(),
                        total: filteredLogs.value.length,
                        module: selectedModule.value || 'all',
                        search: searchText.value || '',
                        records: filteredLogs.value
                    };
                    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `approval-logs-${new Date().toISOString().slice(0, 10)}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                };
                const refreshApprovalsOnFocus = () => {
                    loadApprovalLogs();
                };
                const refreshApprovalsOnVisible = () => {
                    if (document.visibilityState === 'visible') {
                        loadApprovalLogs();
                    }
                };
                const refreshApprovalsOnDataUpdate = () => {
                    loadApprovalLogs();
                };

                watch(() => [isSupabaseConfigured.value, userProfile.value?.id], loadApprovalLogs, { immediate: true });
                onMounted(() => {
                    refreshTimer = setInterval(loadApprovalLogs, 30000);
                    window.addEventListener('focus', refreshApprovalsOnFocus);
                    window.addEventListener('app-data-refresh', refreshApprovalsOnDataUpdate);
                    document.addEventListener('visibilitychange', refreshApprovalsOnVisible);
                });
                onUnmounted(() => {
                    if (refreshTimer) clearInterval(refreshTimer);
                    window.removeEventListener('focus', refreshApprovalsOnFocus);
                    window.removeEventListener('app-data-refresh', refreshApprovalsOnDataUpdate);
                    document.removeEventListener('visibilitychange', refreshApprovalsOnVisible);
                });

                return {
                    selectedModule,
                    searchText,
                    filteredLogs,
                    summary,
                    openLog,
                    exportLogs
                };
            }
        };
    },

    createSystemHealthView(context) {
        const {
            ref,
            reactive,
            computed,
            watch,
            onMounted,
            onUnmounted,
            useRouter,
            catalogState,
            userProfile,
            isSupabaseConfigured,
            DatabaseService,
            supabase
        } = context;

        return {
            template: `
                <div>
                    <div class="flex-between" style="margin-bottom: 20px;">
                        <div>
                            <h1>系统诊断</h1>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">集中查看配置来源、目录状态、核心表数据量和试运行前阻塞项</div>
                        </div>
                        <div class="flex gap-10">
                            <button class="btn btn-secondary" @click="loadDiagnostics">刷新诊断</button>
                            <button class="btn btn-secondary" @click="exportSuspiciousReport">导出异常专项</button>
                            <button class="btn btn-secondary" @click="exportReport">导出报告</button>
                        </div>
                    </div>

                    <div class="grid">
                        <div class="stat-card">
                            <div class="stat-card-label">整体状态</div>
                            <div class="stat-card-value" style="font-size: 24px;">{{ summary.ready ? '基本就绪' : '待处理' }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">通过项</div>
                            <div class="stat-card-value">{{ summary.passCount }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">阻塞项</div>
                            <div class="stat-card-value">{{ summary.failCount }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">配置来源</div>
                            <div class="stat-card-value" style="font-size: 18px;">{{ configSourceText }}</div>
                        </div>
                        <div class="stat-card" style="cursor: pointer;" @click="onlySuspiciousModules = false">
                            <div class="stat-card-label">异常治理</div>
                            <div class="stat-card-value" style="font-size: 20px;">{{ suspiciousProgress.percent }}%</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">
                                点击查看全部异常治理模块
                            </div>
                        </div>
                        <div class="stat-card" :style="suspiciousProgress.pendingModules > 0 ? { cursor: 'pointer' } : null" @click="suspiciousProgress.pendingModules > 0 && (onlySuspiciousModules = true)">
                            <div class="stat-card-label">待清理模块</div>
                            <div class="stat-card-value" style="font-size: 20px;">{{ suspiciousProgress.pendingModules }}</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">
                                {{ suspiciousProgress.pendingModules > 0 ? '点击仅查看待清理模块' : '当前没有待清理模块' }}
                            </div>
                        </div>
                        <div class="stat-card" :style="!manualReviewStatus.ok ? { cursor: 'pointer' } : null" @click="!manualReviewStatus.ok && refreshSuspiciousScan()">
                            <div class="stat-card-label">人工确认</div>
                            <div class="stat-card-value" style="font-size: 18px;">{{ manualReviewStatus.label }}</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">
                                {{ manualReviewStatus.ok ? '当前结果已人工确认' : '点击执行人工复查' }}
                            </div>
                        </div>
                        <div class="stat-card" :style="topSuspiciousModule ? { cursor: 'pointer' } : null" @click="topSuspiciousModule && openSuspiciousModule(topSuspiciousModule.route)">
                            <div class="stat-card-label">优先模块</div>
                            <div class="stat-card-value" style="font-size: 18px;">{{ topSuspiciousModule ? topSuspiciousModule.label : '无' }}</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">
                                {{ topSuspiciousModule ? '点击直达处理页' : '当前无异常模块' }}
                            </div>
                        </div>
                        <div class="stat-card" :style="!manualReviewStatus.ok ? { cursor: 'pointer' } : null" @click="!manualReviewStatus.ok && refreshSuspiciousScan()">
                            <div class="stat-card-label">最近人工复查</div>
                            <div class="stat-card-value" style="font-size: 16px;">{{ lastManualSuspiciousReviewAt || '暂无' }}</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">
                                {{ lastManualSuspiciousReviewer || '点击补一次人工复查' }}
                            </div>
                        </div>
                        <div class="stat-card" :style="suspiciousDeltaStatus.actionable ? { cursor: 'pointer' } : null" @click="handleSuspiciousDeltaClick">
                            <div class="stat-card-label">异常变化</div>
                            <div class="stat-card-value" style="font-size: 16px;">{{ suspiciousDeltaStatus.label }}</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">
                                {{ suspiciousDeltaStatus.detail }}
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">下一步动作</div>
                        <div style="padding: 20px;" class="flex-between">
                            <div>
                                <div style="margin-bottom: 8px;">
                                    <span class="badge" :class="nextActionMeta.badgeClass">{{ nextActionMeta.label }}</span>
                                </div>
                                <div style="color: var(--text-secondary);">
                                {{ nextActionSummary }}
                                </div>
                            </div>
                            <div class="flex gap-10">
                                <button class="btn btn-primary" @click="runNextAction">{{ nextActionMeta.buttonText }}</button>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">关键检查项</div>
                        <div style="padding: 20px;">
                            <div v-for="item in checks" :key="item.label" style="padding: 14px 0; border-bottom: 1px solid var(--border);">
                                <div class="flex-between" style="align-items: center; gap: 16px;">
                                    <div>
                                        <div style="font-weight: 600;">{{ item.label }}</div>
                                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">{{ item.detail }}</div>
                                    </div>
                                    <span class="badge" :class="item.ok ? 'badge-success' : 'badge-warning'">{{ item.ok ? '通过' : '待处理' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">最近发布准备</div>
                        <div style="padding: 20px;">
                            <div v-if="releaseSummary.loaded">
                                <div class="flex-between" style="margin-bottom: 14px; align-items: center;">
                                    <div>
                                        <div style="font-weight: 600;">{{ releaseSummary.target || '未命名环境' }}</div>
                                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">{{ releaseSummary.generatedAt || '暂无时间' }}</div>
                                    </div>
                                    <span class="badge" :class="releaseSummary.preflightPassed ? 'badge-success' : 'badge-warning'">{{ releaseSummary.preflightPassed ? '预检通过' : '预检未通过' }}</span>
                                </div>
                                <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.8;">
                                    <div>运行时配置：{{ releaseSummary.runtimeGenerated ? '已生成' : '未生成' }}</div>
                                    <div>失败项数量：{{ releaseSummary.failedChecks.length }}</div>
                                </div>
                                <div v-if="releaseSummary.blockers.length" style="margin-top: 14px;">
                                    <div style="font-weight: 600; margin-bottom: 8px;">关键阻塞项</div>
                                    <div v-for="item in releaseSummary.blockers" :key="item.title" style="padding: 10px 0; border-top: 1px solid var(--border);">
                                        <div style="font-weight: 600;">{{ item.title }}</div>
                                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">{{ item.detail }}</div>
                                    </div>
                                </div>
                                <div v-if="releaseSummary.nextSteps.length" style="margin-top: 14px;">
                                    <div style="font-weight: 600; margin-bottom: 8px;">建议下一步</div>
                                    <div v-for="(item, index) in releaseSummary.nextSteps" :key="item" style="padding: 8px 0; border-top: 1px solid var(--border); font-size: 12px; color: var(--text-secondary);">
                                        {{ index + 1 }}. {{ item }}
                                    </div>
                                </div>
                                <div v-if="releaseSummary.suggestedCommand" style="margin-top: 14px; padding: 12px 14px; border-radius: 10px; background: #fafafa; border: 1px solid var(--border);">
                                    <div style="font-weight: 600; margin-bottom: 8px;">推荐命令</div>
                                    <code style="font-size: 12px; white-space: pre-wrap; word-break: break-all;">{{ releaseSummary.suggestedCommand }}</code>
                                </div>
                                <div v-if="releaseSummary.failedChecks.length" style="margin-top: 14px;">
                                    <div v-for="item in releaseSummary.failedChecks" :key="item.title" style="padding: 10px 0; border-top: 1px solid var(--border);">
                                        <div style="font-weight: 600;">{{ item.title }}</div>
                                        <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">{{ item.detail }}</div>
                                    </div>
                                </div>
                            </div>
                            <div v-else style="color: var(--text-secondary);">尚未发现发布准备记录，请先执行发布准备脚本生成最新清单。</div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">核心数据量</div>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>数据表</th>
                                    <th>数量</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in metrics" :key="item.label">
                                    <td>{{ item.label }}</td>
                                    <td>{{ item.value }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="card">
                        <div class="card-title">异常内容明细</div>
                        <div style="padding: 0 20px 12px;">
                            <div style="margin-bottom: 12px; font-size: 13px; color: var(--text-secondary);">
                                清理进度：{{ suspiciousProgress.cleanedModules }}/{{ suspiciousProgress.totalModules }} 个模块正常，完成度 {{ suspiciousProgress.percent }}%
                            </div>
                            <div style="margin-bottom: 12px; font-size: 12px; color: var(--text-secondary);">
                                最近复查时间：{{ lastSuspiciousScanAt || '尚未扫描' }}<span v-if="lastSuspiciousScanMode"> · {{ lastSuspiciousScanMode }}</span>
                            </div>
                            <div style="margin-bottom: 12px; font-size: 12px; color: var(--text-secondary);">
                                最近手动复查：{{ lastManualSuspiciousReviewAt || '尚未手动复查' }}
                            </div>
                            <div style="margin-bottom: 12px; font-size: 12px; color: var(--text-secondary);">
                                最近手动复查人：{{ lastManualSuspiciousReviewer || '暂无记录' }}
                            </div>
                            <div style="margin-bottom: 12px;">
                                <span class="badge" :class="manualReviewStatus.ok ? 'badge-success' : 'badge-warning'">
                                    {{ manualReviewStatus.label }}
                                </span>
                                <span style="font-size: 12px; color: var(--text-secondary); margin-left: 8px;">{{ manualReviewStatus.detail }}</span>
                            </div>
                            <div v-if="showSuspiciousCompletion" style="margin-bottom: 12px; padding: 12px 14px; border-radius: 10px; background: rgba(82, 196, 26, 0.12); color: var(--text-primary);">
                                异常内容清理已完成，当前四个运营模块都未再检测到可疑展示记录，可以继续做联调和上线前复核。
                            </div>
                            <div v-if="topSuspiciousModule" style="margin-bottom: 12px; padding: 12px 14px; border-radius: 10px; background: rgba(250, 173, 20, 0.12); color: var(--text-primary);">
                                <div>优先处理建议：先检查“{{ topSuspiciousModule.label }}”，当前检测到 {{ topSuspiciousModule.value }} 条可疑记录。</div>
                                <div style="margin-top: 10px;">
                                    <button class="btn btn-text" @click="openSuspiciousModule(topSuspiciousModule.route)">立即处理</button>
                                    <button class="btn btn-text" @click="refreshSuspiciousScan">处理后复查</button>
                                </div>
                            </div>
                            <div style="margin-bottom: 12px; padding: 12px 14px; border-radius: 10px; background: rgba(24, 144, 255, 0.08); color: var(--text-primary);">
                                <div>{{ suspiciousViewSummary }}</div>
                                <div style="margin-top: 10px;">
                                    <button v-if="onlySuspiciousModules" class="btn btn-text" @click="onlySuspiciousModules = false">查看全部模块</button>
                                    <button v-else-if="suspiciousProgress.pendingModules > 0" class="btn btn-text" @click="onlySuspiciousModules = true">仅看待清理模块</button>
                                    <button class="btn btn-text" @click="resetSuspiciousFilters">恢复默认视图</button>
                                </div>
                            </div>
                            <label style="display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); cursor: pointer;">
                                <input type="checkbox" v-model="onlySuspiciousModules">
                                仅显示有异常的模块
                            </label>
                            <button class="btn btn-text" style="margin-left: 12px;" @click="resetSuspiciousFilters">重置筛选</button>
                            <div style="margin-top: 12px; font-size: 12px; color: var(--text-secondary);">
                                {{ filteredSuspiciousCountSummary }}
                            </div>
                            <div style="margin-top: 8px; font-size: 12px; color: var(--text-secondary);">
                                {{ suspiciousDeltaSummary }}
                            </div>
                        </div>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>模块</th>
                                    <th>状态</th>
                                    <th>可疑记录</th>
                                    <th>处理建议</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in filteredSuspiciousModules" :key="item.label">
                                    <td>{{ item.label }}</td>
                                    <td>
                                        <span class="badge" :class="Number(item.value) > 0 ? 'badge-warning' : 'badge-success'">
                                            {{ Number(item.value) > 0 ? '待清理' : '正常' }}
                                        </span>
                                    </td>
                                    <td>{{ item.value }}</td>
                                    <td>{{ item.hint }}</td>
                                    <td>
                                        <button class="btn btn-text" @click="openSuspiciousModule(item.route)">{{ Number(item.value) > 0 ? '前往处理' : '前往复查' }}</button>
                                    </td>
                                </tr>
                                <tr v-if="!filteredSuspiciousModules.length">
                                    <td colspan="5" style="padding: 18px 16px; color: var(--text-secondary);">
                                        当前筛选下没有待清理模块，说明异常记录已经清空。可以切回查看全部模块，或直接做一次人工复查确认结果。
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="card">
                        <div class="card-title">上线建议</div>
                        <div style="padding: 20px; color: var(--text-secondary); line-height: 1.8;">
                            <div v-for="item in recommendations" :key="item">{{ item }}</div>
                        </div>
                    </div>
                </div>
            `,
            setup() {
                const router = useRouter();
                const checks = ref([]);
                const metrics = ref([]);
                const summary = reactive({
                    ready: false,
                    passCount: 0,
                    failCount: 0
                });
                const suspiciousRecordCount = ref(0);
                const previousSuspiciousRecordCount = ref(null);
                const suspiciousModules = ref([]);
                const onlySuspiciousModules = ref(false);
                const lastSuspiciousScanAt = ref('');
                const lastSuspiciousScanMode = ref('');
                const lastManualSuspiciousReviewAt = ref('');
                const lastManualSuspiciousReviewer = ref('');
                const releaseSummary = reactive({
                    loaded: false,
                    target: '',
                    generatedAt: '',
                    preflightPassed: false,
                    runtimeGenerated: false,
                    blockers: [],
                    nextSteps: [],
                    suggestedCommand: '',
                    failedChecks: []
                });
                let refreshTimer = null;
                const configSourceText = computed(() => (window.APP_CONFIG_META?.sources || ['defaults']).join(' + '));
                const openSuspiciousModule = (path) => {
                    if (path) router.push(path);
                };
                const refreshSuspiciousScan = async () => {
                    await loadDiagnostics('manual');
                    lastManualSuspiciousReviewAt.value = lastSuspiciousScanAt.value;
                    lastManualSuspiciousReviewer.value = userProfile.value?.name || userProfile.value?.email || '当前用户';
                };
                const resetSuspiciousFilters = () => {
                    onlySuspiciousModules.value = false;
                };
                const topSuspiciousModule = computed(() => suspiciousModules.value.find((item) => Number(item.value) > 0) || null);
                const suspiciousProgress = computed(() => {
                    const totalModules = suspiciousModules.value.length;
                    const cleanedModules = suspiciousModules.value.filter((item) => Number(item.value) === 0).length;
                    const pendingModules = suspiciousModules.value.filter((item) => Number(item.value) > 0).length;
                    const percent = totalModules ? Math.round((cleanedModules / totalModules) * 100) : 0;
                    return {
                        totalModules,
                        cleanedModules,
                        pendingModules,
                        percent
                    };
                });
                const manualReviewStatus = computed(() => {
                    if (!lastManualSuspiciousReviewAt.value) {
                        return {
                            ok: false,
                            label: '待人工确认',
                            detail: '当前异常扫描结果还没有人工复查记录。'
                        };
                    }
                    if (lastSuspiciousScanMode.value === 'manual') {
                        return {
                            ok: true,
                            label: '已人工确认',
                            detail: `最近一次结果已由 ${lastManualSuspiciousReviewer.value || '当前用户'} 手动复查。`
                        };
                    }
                    return {
                        ok: false,
                        label: '待再次确认',
                        detail: '最近结果来自自动刷新，如有改动建议再做一次人工复查。'
                    };
                });
                const nextActionSummary = computed(() => {
                    if (previousSuspiciousRecordCount.value !== null) {
                        const delta = suspiciousRecordCount.value - previousSuspiciousRecordCount.value;
                        if (delta > 0) {
                            return `异常数量较上一轮新增 ${delta} 条，建议先切到待清理模块，优先复查最近导入和业务写入。`;
                        }
                        if (delta < 0 && topSuspiciousModule.value) {
                            return `异常数量较上一轮减少 ${Math.abs(delta)} 条，治理在改善，继续优先处理 ${topSuspiciousModule.value.label}。`;
                        }
                    }
                    if (topSuspiciousModule.value) {
                        return `优先处理 ${topSuspiciousModule.value.label}，当前还有 ${topSuspiciousModule.value.value} 条可疑记录待清理。`;
                    }
                    if (!manualReviewStatus.value.ok) {
                        return '异常记录已基本清空，但仍建议做一次人工复查，确认当前结果可作为上线前依据。';
                    }
                    return '异常治理与人工确认已基本到位，可以继续做角色联调、权限验证和上线前复核。';
                });
                const nextActionMeta = computed(() => {
                    if (previousSuspiciousRecordCount.value !== null) {
                        const delta = suspiciousRecordCount.value - previousSuspiciousRecordCount.value;
                        if (delta > 0) {
                            return { label: '异常新增', badgeClass: 'badge-warning', buttonText: '查看待清理模块', action: 'show_pending' };
                        }
                        if (delta < 0 && topSuspiciousModule.value) {
                            return { label: '治理改善', badgeClass: 'badge-success', buttonText: '继续处理优先模块', action: 'open_priority' };
                        }
                    }
                    if (topSuspiciousModule.value) {
                        return { label: '优先处理', badgeClass: 'badge-warning', buttonText: '处理优先模块', action: 'open_priority' };
                    }
                    if (!manualReviewStatus.value.ok) {
                        return { label: '待人工确认', badgeClass: 'badge-warning', buttonText: '立即人工复查', action: 'refresh' };
                    }
                    return { label: '继续复核', badgeClass: 'badge-success', buttonText: '继续复核', action: 'reload' };
                });
                const runNextAction = () => {
                    if (nextActionMeta.value.action === 'show_pending') {
                        onlySuspiciousModules.value = true;
                        return;
                    }
                    if (nextActionMeta.value.action === 'open_priority' && topSuspiciousModule.value) {
                        openSuspiciousModule(topSuspiciousModule.value.route);
                        return;
                    }
                    if (nextActionMeta.value.action === 'refresh') {
                        refreshSuspiciousScan();
                        return;
                    }
                    loadDiagnostics();
                };
                const showSuspiciousCompletion = computed(() =>
                    suspiciousProgress.value.totalModules > 0 &&
                    suspiciousProgress.value.cleanedModules === suspiciousProgress.value.totalModules
                );
                const filteredSuspiciousModules = computed(() => {
                    const rows = suspiciousModules.value.slice().sort((a, b) => Number(b.value || 0) - Number(a.value || 0));
                    if (!onlySuspiciousModules.value) return rows;
                    return rows.filter((item) => Number(item.value) > 0);
                });
                const suspiciousViewSummary = computed(() => {
                    if (onlySuspiciousModules.value) {
                        return `当前排查视图：仅显示待清理模块，已聚焦 ${filteredSuspiciousModules.value.length} 个模块。`;
                    }
                    return `当前排查视图：显示全部模块，正在总览 ${suspiciousModules.value.length} 个治理模块。`;
                });
                const filteredSuspiciousCountSummary = computed(() => {
                    if (onlySuspiciousModules.value) {
                        const hiddenCleanModules = Math.max(suspiciousModules.value.length - filteredSuspiciousModules.value.length, 0);
                        return `当前表格结果：显示 ${filteredSuspiciousModules.value.length} / ${suspiciousModules.value.length} 个模块，仅保留待清理项，已隐藏 ${hiddenCleanModules} 个正常模块。`;
                    }
                    return `当前表格结果：显示全部 ${suspiciousModules.value.length} 个治理模块。`;
                });
                const suspiciousDeltaSummary = computed(() => {
                    if (previousSuspiciousRecordCount.value === null) {
                        return '异常变化追踪：当前还没有可对比的上一轮扫描结果。';
                    }
                    const delta = suspiciousRecordCount.value - previousSuspiciousRecordCount.value;
                    if (delta < 0) {
                        return `异常变化追踪：较上一轮减少 ${Math.abs(delta)} 条，治理结果在改善。`;
                    }
                    if (delta > 0) {
                        return `异常变化追踪：较上一轮新增 ${delta} 条，建议复查最近导入或业务写入。`;
                    }
                    return '异常变化追踪：与上一轮持平，当前没有新的异常增减。';
                });
                const suspiciousDeltaStatus = computed(() => {
                    if (previousSuspiciousRecordCount.value === null) {
                        return {
                            label: '暂无基线',
                            detail: '点击做一次复查，建立对比基线',
                            actionable: true,
                            action: 'refresh'
                        };
                    }
                    const delta = suspiciousRecordCount.value - previousSuspiciousRecordCount.value;
                    if (delta < 0) {
                        return {
                            label: `减少 ${Math.abs(delta)}`,
                            detail: '较上一轮异常数量下降，点击查看全部模块',
                            actionable: true,
                            action: 'show_all'
                        };
                    }
                    if (delta > 0) {
                        return {
                            label: `新增 ${delta}`,
                            detail: '较上一轮异常数量上升，点击只看待清理模块',
                            actionable: true,
                            action: 'show_pending'
                        };
                    }
                    return {
                        label: '无变化',
                        detail: !manualReviewStatus.value.ok
                            ? '与上一轮持平，点击再做一次人工复查'
                            : '与上一轮持平，点击查看全部模块',
                        actionable: true,
                        action: !manualReviewStatus.value.ok ? 'refresh' : 'show_all'
                    };
                });
                const handleSuspiciousDeltaClick = () => {
                    if (!suspiciousDeltaStatus.value.actionable) return;
                    if (suspiciousDeltaStatus.value.action === 'show_pending') {
                        onlySuspiciousModules.value = true;
                        return;
                    }
                    if (suspiciousDeltaStatus.value.action === 'show_all') {
                        onlySuspiciousModules.value = false;
                        return;
                    }
                    if (suspiciousDeltaStatus.value.action === 'refresh') {
                        refreshSuspiciousScan();
                    }
                };
                const recommendations = computed(() => {
                    const list = [];
                    if (!isSupabaseConfigured.value) {
                        list.push('先完成 Supabase 真实配置注入，再执行一次预检。');
                    }
                    if (releaseSummary.loaded && !releaseSummary.preflightPassed) {
                        if (releaseSummary.nextSteps.length) {
                            releaseSummary.nextSteps.forEach((item) => list.push(item));
                        }
                        const hasConfigFailure = releaseSummary.failedChecks.some((item) =>
                            item.title.includes('Supabase URL 已配置') || item.title.includes('Supabase Anon Key 已配置')
                        );
                        if (hasConfigFailure) {
                            list.push('最近一次发布准备失败原因仍是 Supabase 配置缺失，优先生成有效的 runtime-config.js 或更新 app-config.js。');
                        } else if (releaseSummary.failedChecks.length) {
                            list.push(`最近一次发布准备还有 ${releaseSummary.failedChecks.length} 个失败项，建议先在系统诊断页逐项处理后再重跑 prepare-release.js。`);
                        }
                    }
                    if (releaseSummary.loaded && releaseSummary.preflightPassed && !releaseSummary.runtimeGenerated) {
                        list.push('最近一次预检虽然通过，但未记录运行时配置生成步骤，正式发版前建议重新执行 prepare-release.js 留存发布记录。');
                    }
                    if (catalogState.source !== 'supabase') {
                        list.push('正式上线前建议把课程、任务和题库目录切到 Supabase 数据源。');
                    }
                    if (summary.failCount === 0) {
                        list.push('当前没有明显阻塞项，可以继续进行云端部署与联调。');
                    }
                    if (suspiciousRecordCount.value > 0) {
                        list.push(`系统诊断检测到 ${suspiciousRecordCount.value} 条可疑展示记录，建议在正式上线前清理对应业务数据。`);
                        const priorityItem = suspiciousModules.value.find((item) => Number(item.value) > 0);
                        if (priorityItem) {
                            list.push(`建议优先检查 ${priorityItem.label}，再回头复查其他运营页面。`);
                        }
                        if (!lastManualSuspiciousReviewAt.value) {
                            list.push('完成清理动作后，建议点一次“处理后复查”，留下最新的人工复查时间。');
                        }
                    } else if (showSuspiciousCompletion.value) {
                        list.push('异常内容扫描已清零，可以继续做角色联调、权限验证和上线前最终复核。');
                    }
                    if (!list.length) {
                        list.push('继续补充真实业务数据后再进行小范围试运行。');
                    }
                    return list;
                });

                const loadDiagnostics = async (mode = 'auto') => {
                    const nextChecks = [];
                    const nextMetrics = [];
                    const currentSuspiciousCount = suspiciousRecordCount.value;
                    lastSuspiciousScanAt.value = new Date().toLocaleString('zh-CN', { hour12: false });
                    lastSuspiciousScanMode.value = mode === 'manual' ? '手动复查' : '自动刷新';

                    nextChecks.push({
                        label: '当前登录角色',
                        detail: userProfile.value?.role ? `当前用户角色为 ${userProfile.value.role}` : '尚未识别当前用户角色',
                        ok: Boolean(userProfile.value?.role)
                    });
                    nextChecks.push({
                        label: 'Supabase 配置',
                        detail: isSupabaseConfigured.value
                            ? `已连接真实配置，来源：${configSourceText.value}`
                            : `仍使用占位配置，来源：${configSourceText.value}`,
                        ok: isSupabaseConfigured.value
                    });
                    nextChecks.push({
                        label: '目录数据来源',
                        detail: catalogState.source === 'supabase'
                            ? '课程、任务、题库当前已优先走 Supabase'
                            : '当前仍在使用本地兜底目录数据',
                        ok: catalogState.source === 'supabase'
                    });

                    if (!isSupabaseConfigured.value) {
                        metrics.value = [
                            { label: '用户数', value: '-' },
                            { label: '课件版本', value: '-' },
                            { label: '试运行台账', value: '-' },
                            { label: '通知消息', value: '-' },
                            { label: '审批留痕', value: '-' },
                            { label: '可疑展示记录', value: '-' }
                        ];
                        suspiciousModules.value = [
                            { label: '人才流程', value: '-', hint: '待连接 Supabase 后检查', route: { path: '/talent-workflow', query: { issue: 'suspicious', source: 'system-health' } } },
                            { label: '课件版本库', value: '-', hint: '待连接 Supabase 后检查', route: { path: '/courseware', query: { issue: 'suspicious', source: 'system-health' } } },
                            { label: '历史归档中心', value: '-', hint: '待连接 Supabase 后检查', route: { path: '/archives', query: { issue: 'suspicious', source: 'system-health' } } },
                            { label: '试运行台账', value: '-', hint: '待连接 Supabase 后检查', route: { path: '/pilot', query: { issue: 'suspicious', source: 'system-health' } } }
                        ];
                        suspiciousRecordCount.value = 0;
                        previousSuspiciousRecordCount.value = currentSuspiciousCount;
                        checks.value = nextChecks;
                        summary.passCount = nextChecks.filter((item) => item.ok).length;
                        summary.failCount = nextChecks.filter((item) => !item.ok).length;
                        summary.ready = summary.failCount === 0;
                        return;
                    }

                    try {
                        const [userCount, coursewareCount, pilotCount, notificationCount, approvalCount, workflowRows, coursewareRows, archiveRows, pilotRows] = await Promise.all([
                            DatabaseService.count(supabase, 'users'),
                            DatabaseService.count(supabase, 'courseware_library'),
                            DatabaseService.count(supabase, 'pilot_runs'),
                            DatabaseService.count(supabase, 'notifications'),
                            DatabaseService.count(supabase, 'approval_logs'),
                            DatabaseService.list(supabase, 'talent_workflow_cases', { select: 'candidate_name' }),
                            DatabaseService.list(supabase, 'courseware_library', { select: 'title' }),
                            DatabaseService.list(supabase, 'archive_records', { select: 'title' }),
                            DatabaseService.list(supabase, 'pilot_runs', { select: 'name' })
                        ]);
                        const workflowSuspicious = countSuspiciousRows(workflowRows, ['candidate_name']);
                        const coursewareSuspicious = countSuspiciousRows(coursewareRows, ['title']);
                        const archiveSuspicious = countSuspiciousRows(archiveRows, ['title']);
                        const pilotSuspicious = countSuspiciousRows(pilotRows, ['name']);
                        suspiciousRecordCount.value =
                            workflowSuspicious +
                            coursewareSuspicious +
                            archiveSuspicious +
                            pilotSuspicious;
                        previousSuspiciousRecordCount.value = currentSuspiciousCount;
                        suspiciousModules.value = [
                            { label: '人才流程', value: workflowSuspicious, hint: workflowSuspicious ? '进入人才配岗与筛选页核对候选人名称' : '未发现异常', route: { path: '/talent-workflow', query: { issue: 'suspicious', source: 'system-health' } } },
                            { label: '课件版本库', value: coursewareSuspicious, hint: coursewareSuspicious ? '进入课件版本库检查课件标题和摘要' : '未发现异常', route: { path: '/courseware', query: { issue: 'suspicious', source: 'system-health' } } },
                            { label: '历史归档中心', value: archiveSuspicious, hint: archiveSuspicious ? '进入历史归档中心核对归档标题与快照' : '未发现异常', route: { path: '/archives', query: { issue: 'suspicious', source: 'system-health' } } },
                            { label: '试运行台账', value: pilotSuspicious, hint: pilotSuspicious ? '进入试运行台账检查名称和结果记录' : '未发现异常', route: { path: '/pilot', query: { issue: 'suspicious', source: 'system-health' } } }
                        ];
                        nextMetrics.push(
                            { label: '用户数', value: userCount },
                            { label: '课件版本', value: coursewareCount },
                            { label: '试运行台账', value: pilotCount },
                            { label: '通知消息', value: notificationCount },
                            { label: '审批留痕', value: approvalCount },
                            { label: '可疑展示记录', value: suspiciousRecordCount.value }
                        );
                        nextChecks.push(
                            {
                                label: '基础数据',
                                detail: `当前用户 ${userCount} 个，课件版本 ${coursewareCount} 条`,
                                ok: userCount > 0 && coursewareCount > 0
                            },
                            {
                                label: '试运行与留痕',
                                detail: `当前试运行 ${pilotCount} 条，通知 ${notificationCount} 条，审批 ${approvalCount} 条`,
                                ok: pilotCount > 0 && notificationCount > 0 && approvalCount > 0
                            },
                            {
                                label: '异常内容扫描',
                                detail: suspiciousRecordCount.value > 0
                                    ? `检测到 ${suspiciousRecordCount.value} 条可疑展示记录，建议清理后再上线`
                                    : '当前未发现“仓库装箱单”或仅含占位符的异常展示记录',
                                ok: suspiciousRecordCount.value === 0
                            }
                        );
                    } catch (error) {
                        previousSuspiciousRecordCount.value = currentSuspiciousCount;
                        suspiciousRecordCount.value = 0;
                        suspiciousModules.value = [
                            { label: '人才流程', value: '-', hint: '读取失败', route: { path: '/talent-workflow', query: { issue: 'suspicious', source: 'system-health' } } },
                            { label: '课件版本库', value: '-', hint: '读取失败', route: { path: '/courseware', query: { issue: 'suspicious', source: 'system-health' } } },
                            { label: '历史归档中心', value: '-', hint: '读取失败', route: { path: '/archives', query: { issue: 'suspicious', source: 'system-health' } } },
                            { label: '试运行台账', value: '-', hint: '读取失败', route: { path: '/pilot', query: { issue: 'suspicious', source: 'system-health' } } }
                        ];
                        nextChecks.push({
                            label: '数据库读取',
                            detail: `诊断读取失败：${error.message || '请检查权限和表结构'}`,
                            ok: false
                        });
                    }

                    metrics.value = nextMetrics;
                    checks.value = nextChecks;
                    summary.passCount = nextChecks.filter((item) => item.ok).length;
                    summary.failCount = nextChecks.filter((item) => !item.ok).length;
                    summary.ready = summary.failCount === 0;
                };
                const loadReleaseSummary = async () => {
                    try {
                        const response = await fetch(`./release-manifest.json?t=${Date.now()}`, { cache: 'no-store' });
                        if (!response.ok) {
                            throw new Error(`manifest status ${response.status}`);
                        }
                        const manifest = await response.json();
                        releaseSummary.loaded = true;
                        releaseSummary.target = manifest.release_target || '';
                        releaseSummary.generatedAt = manifest.generated_at || '';
                        releaseSummary.preflightPassed = Boolean(manifest.preflight_passed);
                        releaseSummary.runtimeGenerated = Boolean(manifest.runtime_config_generated);
                        releaseSummary.blockers = Array.isArray(manifest.blockers) ? manifest.blockers : [];
                        releaseSummary.nextSteps = Array.isArray(manifest.next_steps) ? manifest.next_steps : [];
                        releaseSummary.suggestedCommand = manifest.suggested_command || '';
                        releaseSummary.failedChecks = Array.isArray(manifest.failed_checks) ? manifest.failed_checks : [];
                    } catch (error) {
                        releaseSummary.loaded = false;
                        releaseSummary.target = '';
                        releaseSummary.generatedAt = '';
                        releaseSummary.preflightPassed = false;
                        releaseSummary.runtimeGenerated = false;
                        releaseSummary.blockers = [];
                        releaseSummary.nextSteps = [];
                        releaseSummary.suggestedCommand = '';
                        releaseSummary.failedChecks = [];
                    }
                };

                const exportReport = () => {
                    const payload = {
                        exported_at: new Date().toISOString(),
                        config_sources: window.APP_CONFIG_META?.sources || ['defaults'],
                        ready: summary.ready,
                        pass_count: summary.passCount,
                        fail_count: summary.failCount,
                        checks: checks.value,
                        metrics: metrics.value,
                        suspicious_progress: suspiciousProgress.value,
                        manual_review_status: manualReviewStatus.value,
                        last_scanned_at: lastSuspiciousScanAt.value,
                        last_scan_mode: lastSuspiciousScanMode.value,
                        last_manual_review_at: lastManualSuspiciousReviewAt.value,
                        last_manual_reviewer: lastManualSuspiciousReviewer.value,
                        next_action_meta: nextActionMeta.value,
                        next_action_summary: nextActionSummary.value,
                        suspicious_view_summary: suspiciousViewSummary.value,
                        filtered_count_summary: filteredSuspiciousCountSummary.value,
                        suspicious_delta_summary: suspiciousDeltaSummary.value,
                        suspicious_modules: suspiciousModules.value,
                        release_summary: {
                            loaded: releaseSummary.loaded,
                            target: releaseSummary.target,
                            generated_at: releaseSummary.generatedAt,
                            preflight_passed: releaseSummary.preflightPassed,
                            runtime_generated: releaseSummary.runtimeGenerated,
                            blockers: releaseSummary.blockers,
                            next_steps: releaseSummary.nextSteps,
                            suggested_command: releaseSummary.suggestedCommand,
                            failed_checks: releaseSummary.failedChecks
                        },
                        recommendations: recommendations.value
                    };
                    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `system-health-${new Date().toISOString().slice(0, 10)}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                };
                const exportSuspiciousReport = () => {
                    const payload = {
                        exported_at: new Date().toISOString(),
                        total_suspicious_records: suspiciousRecordCount.value,
                        last_scanned_at: lastSuspiciousScanAt.value,
                        last_scan_mode: lastSuspiciousScanMode.value,
                        last_manual_review_at: lastManualSuspiciousReviewAt.value,
                        last_manual_reviewer: lastManualSuspiciousReviewer.value,
                        next_action_meta: nextActionMeta.value,
                        next_action_summary: nextActionSummary.value,
                        suspicious_view_summary: suspiciousViewSummary.value,
                        filtered_count_summary: filteredSuspiciousCountSummary.value,
                        suspicious_delta_summary: suspiciousDeltaSummary.value,
                        summary: summary.ready ? '当前整体诊断基本就绪' : '当前仍有待处理项',
                        priority_module: topSuspiciousModule.value ? {
                            label: topSuspiciousModule.value.label,
                            value: topSuspiciousModule.value.value,
                            route: topSuspiciousModule.value.route?.path || '',
                            query: topSuspiciousModule.value.route?.query || {}
                        } : null,
                        modules: suspiciousModules.value.map((item) => ({
                            label: item.label,
                            value: item.value,
                            hint: item.hint,
                            route: item.route?.path || '',
                            query: item.route?.query || {}
                        })),
                        recommendations: recommendations.value.filter((item) => item.includes('可疑展示记录') || item.includes('优先检查')),
                        release_target: releaseSummary.target || '',
                        config_sources: window.APP_CONFIG_META?.sources || ['defaults']
                    };
                    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `suspicious-content-report-${new Date().toISOString().slice(0, 10)}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                };

                const refreshOnDataUpdate = () => {
                    loadDiagnostics();
                    loadReleaseSummary();
                };

                watch(
                    () => [isSupabaseConfigured.value, userProfile.value?.id, catalogState.source],
                    () => {
                        loadDiagnostics();
                        loadReleaseSummary();
                    },
                    { immediate: true }
                );
                onMounted(() => {
                    refreshTimer = setInterval(loadDiagnostics, 30000);
                    loadReleaseSummary();
                    window.addEventListener('app-data-refresh', refreshOnDataUpdate);
                });
                onUnmounted(() => {
                    if (refreshTimer) clearInterval(refreshTimer);
                    window.removeEventListener('app-data-refresh', refreshOnDataUpdate);
                });

                return {
                    checks,
                    metrics,
                    onlySuspiciousModules,
                    lastSuspiciousScanAt,
                    lastSuspiciousScanMode,
                    lastManualSuspiciousReviewAt,
                    lastManualSuspiciousReviewer,
                    suspiciousModules,
                    topSuspiciousModule,
                    suspiciousProgress,
                    manualReviewStatus,
                    nextActionMeta,
                    nextActionSummary,
                    runNextAction,
                    showSuspiciousCompletion,
                    filteredSuspiciousModules,
                    suspiciousViewSummary,
                    filteredSuspiciousCountSummary,
                    suspiciousDeltaSummary,
                    suspiciousDeltaStatus,
                    handleSuspiciousDeltaClick,
                    summary,
                    releaseSummary,
                    configSourceText,
                    recommendations,
                    loadDiagnostics,
                    exportReport,
                    exportSuspiciousReport,
                    openSuspiciousModule,
                    refreshSuspiciousScan,
                    resetSuspiciousFilters
                };
            }
        };
    }
};
