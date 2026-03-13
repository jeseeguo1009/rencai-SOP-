window.AppReviewViews = {
    createMentorView(context) {
        const { ref, reactive, watch, userProfile, isSupabaseConfigured, DatabaseService, supabase, toDateInputValue } = context;

        return {
            template: `
                <div>
                    <div class="flex-between" style="margin-bottom: 20px;">
                        <h1>带教跟踪</h1>
                        <button class="btn btn-primary" @click="showAddLog = true">+ 新建周记录</button>
                    </div>

                    <div class="grid">
                        <div v-for="log in logs" :key="log.weekNum" class="card" style="cursor: pointer;" @click="viewLog(log)">
                            <div class="flex-between" style="margin-bottom: 10px;">
                                <h3>第{{ log.weekNum }}周跟踪记录</h3>
                                <span class="badge badge-success">已签名</span>
                            </div>
                            <div style="padding: 15px 0; border-bottom: 1px solid var(--border);">
                                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 5px;">学员</div>
                                <div style="font-weight: 600;">{{ log.trainee }}</div>
                            </div>
                            <div style="padding: 15px 0;">
                                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 5px;">学习内容</div>
                                <div style="font-size: 14px;">{{ log.content }}</div>
                            </div>
                            <div style="font-size: 12px; color: var(--text-secondary);">{{ log.date }}</div>
                        </div>
                    </div>

                    <div v-if="showAddLog" class="modal" @click.self="showAddLog = false">
                        <div class="modal-content">
                            <div class="modal-header">新建周记录</div>
                            <div class="form-group">
                                <label class="form-label">选择学员</label>
                                <select class="form-select" v-model="draft.trainee_id">
                                    <option v-for="trainee in trainees" :key="trainee.id" :value="trainee.id">{{ trainee.name }}</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">本周学习内容</label>
                                <textarea v-model="draft.mentor_content" class="form-textarea" placeholder="描述本周学员的学习内容..."></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">完成情况</label>
                                <textarea v-model="draft.trainee_content" class="form-textarea" placeholder="评价学员本周的完成情况..."></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">问题反馈</label>
                                <textarea v-model="draft.problem_feedback" class="form-textarea" placeholder="记录学员遇到的问题..."></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">带教建议</label>
                                <textarea v-model="draft.mentor_feedback" class="form-textarea" placeholder="提出后续的带教建议..."></textarea>
                            </div>
                            <div class="modal-footer">
                                <button class="btn btn-text" @click="showAddLog = false">取消</button>
                                <button class="btn btn-primary" @click="saveLog">保存记录</button>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            setup() {
                const showAddLog = ref(false);
                const logs = ref([]);
                const trainees = ref([]);
                const draft = reactive({
                    trainee_id: '',
                    mentor_content: '',
                    trainee_content: '',
                    problem_feedback: '',
                    mentor_feedback: ''
                });
                const fallbackLogs = [
                    { id: 1, weekNum: 1, trainee: '张三', content: '公司简介、组织架构、岗位职责', date: '2024-01-15' },
                    { id: 2, weekNum: 2, trainee: '张三', content: '产品知识、销售流程、客户管理', date: '2024-01-22' },
                    { id: 3, weekNum: 3, trainee: '张三', content: 'ERP系统、CRM工具、数据分析', date: '2024-01-29' }
                ];
                const writeMentorLogTrace = async (row, traineeName) => {
                    if (!isSupabaseConfigured.value || !userProfile.value) return;
                    try {
                        await Promise.all([
                            DatabaseService.insert(supabase, 'approval_logs', [{
                                module: 'mentor',
                                action: 'weekly_log_saved',
                                actor_id: userProfile.value.id,
                                target_user_id: row.trainee_id,
                                ref_table: 'mentor_logs',
                                ref_id: row.id ? String(row.id) : null,
                                detail: {
                                    actor_name: userProfile.value.name || userProfile.value.email || '导师',
                                    summary: `已提交第 ${row.week_num} 周带教记录`,
                                    trainee_name: traineeName
                                }
                            }]),
                            DatabaseService.insert(supabase, 'notifications', [{
                                user_id: row.trainee_id,
                                type: 'mentor',
                                title: '新的带教周记录已生成',
                                content: `${userProfile.value.name || '导师'} 已为你提交第 ${row.week_num} 周带教记录。`
                            }])
                        ]);
                        window.dispatchEvent(new CustomEvent('app-data-refresh'));
                    } catch (error) {
                        console.error('Mentor trace write error:', error);
                    }
                };

                const loadMentorData = async () => {
                    if (!isSupabaseConfigured.value || !userProfile.value) {
                        logs.value = fallbackLogs;
                        trainees.value = [{ id: '1', name: '张三' }, { id: '2', name: '李四' }];
                        draft.trainee_id = trainees.value[0]?.id || '';
                        return;
                    }

                    try {
                        let traineeRows = [];
                        if (userProfile.value.role === 'mentor') {
                            traineeRows = await DatabaseService.list(supabase, 'users', {
                                select: 'id, name',
                                filters: [{ type: 'eq', column: 'mentor_id', value: userProfile.value.id }]
                            });
                        } else {
                            traineeRows = await DatabaseService.list(supabase, 'users', {
                                select: 'id, name',
                                filters: [{ type: 'eq', column: 'role', value: 'trainee' }]
                            });
                        }
                        trainees.value = traineeRows;
                        draft.trainee_id = draft.trainee_id || trainees.value[0]?.id || '';

                        const rows = await DatabaseService.list(supabase, 'mentor_logs', {
                            select: 'id, week_num, mentor_content, trainee_content, mentor_feedback, created_at, trainee_id',
                            filters: [{ type: 'order', column: 'created_at', ascending: false }]
                        });
                        logs.value = rows.map((row) => ({
                            id: row.id,
                            weekNum: row.week_num,
                            trainee: trainees.value.find((item) => item.id === row.trainee_id)?.name || '学员',
                            content: row.mentor_content || row.trainee_content || row.mentor_feedback || '',
                            date: toDateInputValue(row.created_at)
                        }));
                        if (!logs.value.length) logs.value = fallbackLogs;
                    } catch (error) {
                        console.error('Mentor logs load error:', error);
                        logs.value = fallbackLogs;
                    }
                };

                const viewLog = (log) => {
                    alert(`查看第${log.weekNum}周的跟踪记录`);
                };

                const saveLog = async () => {
                    if (!draft.trainee_id || !draft.mentor_content) return;
                    const row = {
                        week_num: logs.value.length + 1,
                        mentor_id: userProfile.value?.id || null,
                        trainee_id: draft.trainee_id,
                        mentor_content: draft.mentor_content,
                        trainee_content: `${draft.trainee_content}\n${draft.problem_feedback}`.trim(),
                        mentor_feedback: draft.mentor_feedback,
                        mentor_signed_at: new Date().toISOString()
                    };

                    if (isSupabaseConfigured.value && userProfile.value) {
                        try {
                            const insertedRows = await DatabaseService.upsert(supabase, 'mentor_logs', [row], {
                                upsertOptions: { onConflict: 'week_num,trainee_id' }
                            });
                            if (insertedRows[0]) {
                                row.id = insertedRows[0].id;
                            }
                            await writeMentorLogTrace(row, trainees.value.find((item) => item.id === row.trainee_id)?.name || '学员');
                        } catch (error) {
                            console.error('Mentor log save error:', error);
                        }
                    }

                    logs.value = [{
                        id: Date.now(),
                        weekNum: row.week_num,
                        trainee: trainees.value.find((item) => item.id === row.trainee_id)?.name || '学员',
                        content: row.mentor_content,
                        date: toDateInputValue(new Date().toISOString())
                    }, ...logs.value];
                    draft.mentor_content = '';
                    draft.trainee_content = '';
                    draft.problem_feedback = '';
                    draft.mentor_feedback = '';
                    showAddLog.value = false;
                };

                watch(() => [isSupabaseConfigured.value, userProfile.value?.id], loadMentorData, { immediate: true });

                return { showAddLog, logs, trainees, draft, viewLog, saveLog };
            }
        };
    },

    createKPIView(context) {
        const { ref, computed, watch, userProfile, isSupabaseConfigured, DatabaseService, supabase } = context;

        return {
            template: `
                <div>
                    <div class="flex-between" style="margin-bottom: 20px;">
                        <h1>KPI考核</h1>
                        <div v-if="isAdmin" class="flex">
                            <button class="btn btn-primary" @click="showEditKPI = true">+ 设定KPI目标</button>
                        </div>
                    </div>

                    <div class="grid" style="grid-template-columns: 1fr;">
                        <div class="card">
                            <div class="card-title">{{ currentPeriod }}月度KPI</div>
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>KPI指标</th>
                                        <th>目标值</th>
                                        <th>实际值</th>
                                        <th>权重</th>
                                        <th>得分</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="kpi in kpiItems" :key="kpi.id">
                                        <td>{{ kpi.name }}</td>
                                        <td>{{ kpi.target }}</td>
                                        <td>
                                            <input v-if="!isReadOnly" type="text" class="form-input" v-model="kpi.actual" style="width: 100px;">
                                            <span v-else>{{ kpi.actual }}</span>
                                        </td>
                                        <td>{{ kpi.weight }}%</td>
                                        <td style="font-weight: 600; color: var(--accent);">{{ kpi.score }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="grid">
                            <div class="stat-card">
                                <div class="stat-card-label">KPI达成率</div>
                                <div class="stat-card-value">{{ kpiAchievement }}%</div>
                                <div class="progress-bar">
                                    <div class="progress-fill" :style="{ width: kpiAchievement + '%' }"></div>
                                </div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-card-label">总体得分</div>
                                <div class="stat-card-value" :style="{ color: totalScore >= 80 ? 'var(--success)' : 'var(--warning)' }">
                                    {{ totalScore }}
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-title">历史KPI记录</div>
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>时间</th>
                                        <th>KPI类型</th>
                                        <th>达成率</th>
                                        <th>得分</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="row in historyRows" :key="row.period + row.total_score">
                                        <td>{{ row.period }}</td>
                                        <td>{{ row.grade }}</td>
                                        <td>{{ row.total_score }}%</td>
                                        <td style="color: var(--success);">{{ row.total_score }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div v-if="showEditKPI" class="modal" @click.self="showEditKPI = false">
                        <div class="modal-content">
                            <div class="modal-header">设定KPI目标</div>
                            <div class="form-group">
                                <label class="form-label">选择学员</label>
                                <select class="form-select" v-model="selectedUserId">
                                    <option v-for="trainee in trainees" :key="trainee.id" :value="trainee.id">{{ trainee.name }}</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="form-label">考核周期</label>
                                <input class="form-input" v-model="currentPeriod" placeholder="例如：2026年3月">
                            </div>
                            <div class="form-group">
                                <label class="form-label">KPI指标1目标值</label>
                                <input type="text" class="form-input" v-model="kpiItems[0].target" placeholder="输入目标值">
                            </div>
                            <div class="form-group">
                                <label class="form-label">KPI指标2目标值</label>
                                <input type="text" class="form-input" v-model="kpiItems[1].target" placeholder="输入目标值">
                            </div>
                            <div class="modal-footer">
                                <button class="btn btn-text" @click="showEditKPI = false">取消</button>
                                <button class="btn btn-primary" @click="saveKPI">保存</button>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            setup() {
                const isAdmin = computed(() => userProfile.value?.role === 'admin');
                const currentPeriod = ref('2026年3月');
                const showEditKPI = ref(false);
                const isReadOnly = computed(() => !isAdmin.value);
                const trainees = ref([]);
                const selectedUserId = ref('');
                const kpiItems = ref([
                    { id: 1, name: '新客户开发数', target: '20个', actual: 18, weight: 30, score: 90 },
                    { id: 2, name: '销售回款额', target: '100万元', actual: '92万元', weight: 40, score: 92 },
                    { id: 3, name: '客户满意度', target: '95%', actual: '94%', weight: 20, score: 94 },
                    { id: 4, name: '工作报告及时率', target: '100%', actual: '100%', weight: 10, score: 100 }
                ]);
                const historyRows = ref([
                    { period: '2026年1月', grade: '销售KPI', total_score: 85 },
                    { period: '2026年2月', grade: '销售KPI', total_score: 92 }
                ]);
                const writeKPITrace = async (row, traineeName) => {
                    if (!isSupabaseConfigured.value || !userProfile.value) return;
                    try {
                        await Promise.all([
                            DatabaseService.insert(supabase, 'approval_logs', [{
                                module: 'kpi',
                                action: 'kpi_saved',
                                actor_id: userProfile.value.id,
                                target_user_id: row.user_id,
                                ref_table: 'kpi_records',
                                ref_id: row.period,
                                detail: {
                                    actor_name: userProfile.value.name || userProfile.value.email || '系统',
                                    summary: `${row.period} KPI 已保存，总分 ${row.total_score}`,
                                    trainee_name: traineeName
                                }
                            }]),
                            DatabaseService.insert(supabase, 'notifications', [{
                                user_id: row.user_id,
                                type: 'kpi',
                                title: 'KPI结果已更新',
                                content: `${row.period} KPI 已更新，当前总分 ${row.total_score}。`
                            }])
                        ]);
                        window.dispatchEvent(new CustomEvent('app-data-refresh'));
                    } catch (error) {
                        console.error('KPI trace write error:', error);
                    }
                };

                const loadKPI = async () => {
                    if (!isSupabaseConfigured.value || !userProfile.value) return;
                    try {
                        const traineeRows = await DatabaseService.list(supabase, 'users', {
                            select: 'id, name',
                            filters: [{ type: 'eq', column: 'role', value: 'trainee' }]
                        });
                        trainees.value = traineeRows;
                        selectedUserId.value = selectedUserId.value || trainees.value[0]?.id || '';

                        const targetUserId = userProfile.value.role === 'trainee' ? userProfile.value.id : selectedUserId.value;
                        if (!targetUserId) return;

                        const rows = await DatabaseService.list(supabase, 'kpi_records', {
                            select: 'period, items, total_score, grade, created_at',
                            filters: [
                                { type: 'eq', column: 'user_id', value: targetUserId },
                                { type: 'order', column: 'created_at', ascending: false }
                            ]
                        });
                        if (rows[0]?.items?.length) {
                            kpiItems.value = rows[0].items;
                            currentPeriod.value = rows[0].period;
                        }
                        if (rows.length) {
                            historyRows.value = rows;
                        }
                    } catch (error) {
                        console.error('KPI load error:', error);
                    }
                };

                const kpiAchievement = computed(() => {
                    if (!kpiItems.value.length) return 0;
                    const total = kpiItems.value.reduce((sum, item) => sum + Number.parseFloat(item.score || 0), 0);
                    return Math.round(total / kpiItems.value.length);
                });

                const totalScore = computed(() => Math.round(kpiItems.value.reduce((sum, item) => sum + (Number(item.score || 0) * Number(item.weight || 0)), 0) / 100));

                const saveKPI = async () => {
                    const targetUserId = userProfile.value?.role === 'trainee' ? userProfile.value.id : selectedUserId.value;
                    if (!targetUserId) return;
                    const row = {
                        user_id: targetUserId,
                        period: currentPeriod.value,
                        items: kpiItems.value,
                        total_score: totalScore.value,
                        grade: '销售KPI'
                    };
                    if (isSupabaseConfigured.value) {
                        try {
                            await DatabaseService.upsert(supabase, 'kpi_records', [row], {
                                upsertOptions: { onConflict: 'user_id,period' }
                            });
                            await writeKPITrace(row, trainees.value.find((item) => item.id === row.user_id)?.name || '学员');
                        } catch (error) {
                            console.error('KPI save error:', error);
                        }
                    }
                    historyRows.value = [{ period: row.period, grade: row.grade, total_score: row.total_score }, ...historyRows.value];
                    showEditKPI.value = false;
                };

                watch(() => [isSupabaseConfigured.value, userProfile.value?.id, selectedUserId.value], loadKPI, { immediate: true });

                return { isAdmin, currentPeriod, showEditKPI, isReadOnly, trainees, selectedUserId, kpiItems, kpiAchievement, totalScore, historyRows, saveKPI };
            }
        };
    },

    createEvaluationView(context) {
        const { ref, reactive, watch, userProfile, isSupabaseConfigured, DatabaseService, supabase, toDateInputValue, mapEvaluationStatus, catalogState } = context;

        return {
            template: `
                <div>
                    <h1 style="margin-bottom: 20px;">转正评估</h1>

                    <div class="grid" style="grid-template-columns: 1fr;">
                        <div class="card">
                            <div class="card-title">{{ evaluatingUser }}的转正评估</div>
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>评估项目</th>
                                        <th>内容</th>
                                        <th>结果</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>课程完成率</td>
                                        <td>完成7课学习</td>
                                        <td><span class="badge badge-success">{{ summary.courseCompleted }}/{{ catalogState.courses.length }}</span></td>
                                    </tr>
                                    <tr>
                                        <td>考试成绩</td>
                                        <td>岗位考试</td>
                                        <td><span class="badge badge-success">{{ summary.examScore }}分</span></td>
                                    </tr>
                                    <tr>
                                        <td>实操评分</td>
                                        <td>{{ catalogState.tasks.length }}个实操任务</td>
                                        <td><span class="badge badge-success">{{ summary.taskScore }}</span></td>
                                    </tr>
                                    <tr>
                                        <td>带教评价</td>
                                        <td>4周周度评价</td>
                                        <td><span class="badge badge-success">{{ summary.mentorCommentGrade }}</span></td>
                                    </tr>
                                    <tr>
                                        <td>KPI达成</td>
                                        <td>月度KPI考核</td>
                                        <td><span class="badge badge-success">{{ summary.kpiScore }}%</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="grid">
                            <div class="stat-card">
                                <div class="stat-card-label">综合评分</div>
                                <div class="stat-card-value">{{ summary.totalScore }}</div>
                                <div style="font-size: 12px; color: var(--success); margin-top: 10px; font-weight: 600;">{{ summary.totalScore >= 80 ? '符合转正标准' : '建议继续培养' }}</div>
                            </div>
                            <div class="stat-card">
                                <div class="stat-card-label">评估进度</div>
                                <div class="stat-card-value" style="font-size: 24px;">{{ summary.progress }}%</div>
                                <div class="progress-bar">
                                    <div class="progress-fill" :style="{ width: summary.progress + '%' }"></div>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-title">带教人评价</div>
                            <div style="padding: 20px;">
                                <div style="margin-bottom: 15px;">
                                    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 5px;">学员表现评价</div>
                                    <textarea v-model="mentorComment" class="form-textarea" placeholder="请输入带教人的评价意见..." style="height: 80px;"></textarea>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 5px;">推荐意见</div>
                                    <select class="form-select" v-model="adminDecision">
                                        <option>推荐转正</option>
                                        <option>延期转正</option>
                                        <option>不推荐转正</option>
                                    </select>
                                </div>
                                <div class="mt-20">
                                    <button class="btn btn-primary" @click="saveEvaluation">保存评估</button>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-title">管理员审批</div>
                            <div style="padding: 20px;">
                                <div style="margin-bottom: 20px;">
                                    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 10px;">审批意见</div>
                                    <div style="padding: 15px; background: var(--light-bg); border-radius: 6px; border-left: 4px solid var(--success);">
                                        <textarea v-if="userProfile?.role === 'admin'" v-model="summary.adminComment" class="form-textarea" style="height: 90px; margin-bottom: 10px;"></textarea>
                                        <p v-else>{{ summary.adminComment }}</p>
                                        <p style="font-size: 12px; color: var(--text-secondary); margin-top: 10px;">审批时间：{{ summary.updatedAt }}</p>
                                    </div>
                                </div>
                                <div style="margin-bottom: 20px;">
                                    <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 5px;">审批状态</div>
                                    <span class="badge badge-success">{{ summary.statusText }}</span>
                                </div>
                                <div>
                                    <button class="btn btn-primary w-full" @click="printReport">打印评估报告</button>
                                </div>
                            </div>
                        </div>

                        <div class="card">
                            <div class="card-title">审批留痕</div>
                            <table class="table">
                                <thead>
                                    <tr>
                                        <th>时间</th>
                                        <th>动作</th>
                                        <th>执行人</th>
                                        <th>说明</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="log in approvalLogs" :key="log.id">
                                        <td>{{ log.created_at }}</td>
                                        <td>{{ log.actionText }}</td>
                                        <td>{{ log.actorName }}</td>
                                        <td>{{ log.summary }}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `,
            setup() {
                const evaluatingUser = ref('张三');
                const mentorComment = ref('学员学习主动性强，任务完成质量稳定。');
                const adminDecision = ref('推荐转正');
                const summary = reactive({
                    courseCompleted: 7,
                    examScore: 92,
                    taskScore: 14,
                    mentorCommentGrade: '优秀',
                    kpiScore: 92,
                    totalScore: 91,
                    progress: 60,
                    adminComment: '学员各项指标均达到转正标准，建议立即转正。',
                    updatedAt: '2026-03-12',
                    statusText: '已审批'
                });
                const targetEvaluationUserId = ref(null);
                const approvalLogs = ref([]);

                const loadApprovalLogs = async (targetUserId) => {
                    if (!isSupabaseConfigured.value || !targetUserId) return;
                    try {
                        const rows = await DatabaseService.list(supabase, 'approval_logs', {
                            select: '*',
                            filters: [
                                { type: 'eq', column: 'module', value: 'evaluation' },
                                { type: 'eq', column: 'target_user_id', value: targetUserId },
                                { type: 'order', column: 'created_at', ascending: false }
                            ]
                        });
                        approvalLogs.value = rows.map((row) => ({
                            id: row.id,
                            created_at: toDateInputValue(row.created_at),
                            actionText: row.action === 'submitted' ? '提交评估' : row.action === 'approved' ? '审批通过' : row.action === 'delayed' ? '延期转正' : '评估更新',
                            actorName: row.detail?.actor_name || '系统',
                            summary: row.detail?.summary || '已记录流程动作'
                        }));
                    } catch (error) {
                        console.error('Approval log load error:', error);
                        approvalLogs.value = [];
                    }
                };

                const loadEvaluation = async () => {
                    if (!isSupabaseConfigured.value || !userProfile.value) return;
                    try {
                        let targetUserId = userProfile.value.role === 'trainee' ? userProfile.value.id : null;
                        if (!targetUserId) {
                            const trainee = (await DatabaseService.list(supabase, 'users', {
                                select: 'id, name',
                                filters: [{ type: 'eq', column: 'role', value: 'trainee' }, { type: 'limit', column: 'id', value: 1 }]
                            }))[0];
                            targetUserId = trainee?.id || null;
                            evaluatingUser.value = trainee?.name || evaluatingUser.value;
                        }

                        if (!targetUserId) return;
                        targetEvaluationUserId.value = targetUserId;

                        const [progressRows, examRows, taskRows, kpiRows, evalRows] = await Promise.all([
                            DatabaseService.list(supabase, 'course_progress', {
                                select: 'status',
                                filters: [{ type: 'eq', column: 'user_id', value: targetUserId }]
                            }),
                            DatabaseService.list(supabase, 'exam_records', {
                                select: 'score, created_at',
                                filters: [{ type: 'eq', column: 'user_id', value: targetUserId }, { type: 'order', column: 'created_at', ascending: false }, { type: 'limit', column: 'created_at', value: 1 }]
                            }),
                            DatabaseService.list(supabase, 'task_submissions', {
                                select: 'status, score',
                                filters: [{ type: 'eq', column: 'user_id', value: targetUserId }]
                            }),
                            DatabaseService.list(supabase, 'kpi_records', {
                                select: 'total_score, created_at',
                                filters: [{ type: 'eq', column: 'user_id', value: targetUserId }, { type: 'order', column: 'created_at', ascending: false }, { type: 'limit', column: 'created_at', value: 1 }]
                            }),
                            DatabaseService.list(supabase, 'evaluations', {
                                select: '*',
                                filters: [{ type: 'eq', column: 'user_id', value: targetUserId }, { type: 'order', column: 'created_at', ascending: false }, { type: 'limit', column: 'created_at', value: 1 }]
                            })
                        ]);

                        summary.courseCompleted = progressRows.filter((row) => row.status === 'completed').length;
                        summary.examScore = examRows[0]?.score || 0;
                        summary.taskScore = taskRows.filter((row) => row.status === 'scored').length;
                        summary.kpiScore = Math.round(kpiRows[0]?.total_score || 0);
                        summary.progress = Math.round(((summary.courseCompleted > 0) + (summary.examScore > 0) + (summary.taskScore > 0) + (summary.kpiScore > 0)) / 4 * 100);
                        summary.totalScore = Math.round((summary.courseCompleted / Math.max(catalogState.courses.length, 1) * 100 * 0.2) + (summary.examScore * 0.3) + ((summary.taskScore / Math.max(catalogState.tasks.length, 1) * 100) * 0.2) + (summary.kpiScore * 0.3));

                        const evalRow = evalRows[0];
                        if (evalRow) {
                            mentorComment.value = evalRow.mentor_comment || mentorComment.value;
                            summary.adminComment = evalRow.admin_comment || summary.adminComment;
                            summary.updatedAt = toDateInputValue(evalRow.created_at);
                            summary.statusText = mapEvaluationStatus(evalRow.status);
                            adminDecision.value = evalRow.admin_decision === 'approved' ? '推荐转正' : evalRow.admin_decision === 'delayed' ? '延期转正' : '不推荐转正';
                        }
                        await loadApprovalLogs(targetUserId);
                    } catch (error) {
                        console.error('Evaluation load error:', error);
                    }
                };

                const saveEvaluation = async () => {
                    if (!isSupabaseConfigured.value || !userProfile.value) return;
                    try {
                        const targetUserId = targetEvaluationUserId.value || (userProfile.value.role === 'trainee' ? userProfile.value.id : null);
                        if (!targetUserId) return;
                        const decisionMap = { '推荐转正': 'approved', '延期转正': 'delayed', '不推荐转正': 'rejected' };
                        const nextStatus = userProfile.value.role === 'admin' ? 'completed' : 'mentor_reviewed';
                        await DatabaseService.upsert(supabase, 'evaluations', [{
                            user_id: targetUserId,
                            course_pct: Math.round(summary.courseCompleted / Math.max(catalogState.courses.length, 1) * 100),
                            exam_score: summary.examScore,
                            task_score: Math.round(summary.taskScore / Math.max(catalogState.tasks.length, 1) * 100),
                            mentor_score: 90,
                            kpi_score: summary.kpiScore,
                            total_score: summary.totalScore,
                            mentor_comment: mentorComment.value,
                            admin_decision: decisionMap[adminDecision.value] || 'approved',
                            admin_comment: summary.adminComment,
                            status: nextStatus
                        }], {
                            upsertOptions: { onConflict: 'user_id' }
                        });
                        await Promise.all([
                            DatabaseService.insert(supabase, 'approval_logs', [{
                                module: 'evaluation',
                                action: userProfile.value.role === 'admin' ? (decisionMap[adminDecision.value] || 'approved') : 'submitted',
                                actor_id: userProfile.value.id,
                                target_user_id: targetUserId,
                                ref_table: 'evaluations',
                                ref_id: String(targetUserId),
                                detail: {
                                    actor_name: userProfile.value.name || userProfile.value.email || '审批人',
                                    summary: `${adminDecision.value}，综合评分 ${summary.totalScore}`,
                                    total_score: summary.totalScore,
                                    status: nextStatus
                                }
                            }]),
                            DatabaseService.insert(supabase, 'notifications', [{
                                user_id: targetUserId,
                                type: 'approval',
                                title: '转正评估状态已更新',
                                content: `${userProfile.value.name || '系统'} 已提交新的转正评估：${adminDecision.value}`
                            }])
                        ]);
                        window.dispatchEvent(new CustomEvent('app-data-refresh'));
                        summary.statusText = mapEvaluationStatus(nextStatus);
                        summary.updatedAt = toDateInputValue(new Date().toISOString());
                        await loadApprovalLogs(targetUserId);
                    } catch (error) {
                        console.error('Evaluation save error:', error);
                    }
                };

                const printReport = () => {
                    window.print();
                };

                watch(() => [isSupabaseConfigured.value, userProfile.value?.id, catalogState.courses.length, catalogState.tasks.length], loadEvaluation, { immediate: true });

                return { evaluatingUser, mentorComment, adminDecision, summary, saveEvaluation, printReport, catalogState, userProfile, approvalLogs };
            }
        };
    }
};
