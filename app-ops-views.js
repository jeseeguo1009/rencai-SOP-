const OPERATIONAL_HIDDEN_TITLE_PATTERNS = ['仓库装箱单'];

const isPlaceholderOnlyText = (value) => {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    return /^[{}]+$/.test(trimmed);
};

const shouldHideOperationalItem = (item, titleFields) => {
    if (!item || !Array.isArray(titleFields)) return false;
    return titleFields.some((field) => {
        const text = typeof item[field] === 'string' ? item[field].trim() : '';
        if (!text) return false;
        return OPERATIONAL_HIDDEN_TITLE_PATTERNS.some((keyword) => text.includes(keyword)) || isPlaceholderOnlyText(text);
    });
};

const sanitizeOperationalItems = (rows, titleFields) => {
    if (!Array.isArray(rows)) return [];
    return rows.filter((item) => !shouldHideOperationalItem(item, titleFields));
};

const countHiddenOperationalItems = (rows, titleFields) => {
    if (!Array.isArray(rows)) return 0;
    return rows.filter((item) => shouldHideOperationalItem(item, titleFields)).length;
};

window.AppOperationalViews = {
    createTalentWorkflowView(context) {
        const {
            ref,
            reactive,
            computed,
            watch,
            useRoute,
            useRouter,
            userProfile,
            isSupabaseConfigured,
            DatabaseService,
            supabase,
            fallbackWorkflows
        } = context;

        return {
            template: `
                <div>
                    <div class="flex-between" style="margin-bottom: 20px;">
                        <div>
                            <h1>人才配岗与筛选</h1>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">覆盖筛选、培养、配岗、归档的标准化闭环</div>
                        </div>
                        <button v-if="canManage" class="btn btn-primary" @click="showCreate = true">+ 新建流程</button>
                    </div>

                    <div v-if="showSuspiciousHelp" class="card" style="background: rgba(250, 173, 20, 0.08); border-color: rgba(250, 173, 20, 0.35);">
                        <div style="padding: 18px 20px; color: var(--text-secondary); line-height: 1.8;">
                            当前是从系统诊断跳转过来的排查模式。这里会自动隐藏“仓库装箱单”这类异常名称，请重点检查 Supabase 原始候选人名称、导入数据和最近一次流程归档来源。
                            <div style="margin-top: 8px;">当前已过滤 {{ hiddenWorkflowCount }} 条可疑流程记录。</div>
                            <div style="margin-top: 12px;">
                                <button class="btn btn-text" @click="applySuspiciousFilters">应用排查筛选</button>
                                <button class="btn btn-text" @click="backToSystemHealth">返回系统诊断</button>
                            </div>
                        </div>
                    </div>

                    <div class="grid">
                        <div class="stat-card">
                            <div class="stat-card-label">活跃流程</div>
                            <div class="stat-card-value">{{ activeCount }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">筛选中</div>
                            <div class="stat-card-value">{{ screeningCount }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">培养中</div>
                            <div class="stat-card-value">{{ trainingCount }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">已归档</div>
                            <div class="stat-card-value">{{ archivedCount }}</div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">流程筛选</div>
                        <div style="padding: 20px;" class="flex gap-10">
                            <select class="form-select" v-model="selectedStage" style="max-width: 220px;">
                                <option value="">全部阶段</option>
                                <option value="screening">筛选中</option>
                                <option value="training">培养中</option>
                                <option value="placement">待配岗</option>
                                <option value="completed">已完成</option>
                                <option value="archived">已归档</option>
                            </select>
                            <select class="form-select" v-model="selectedStatus" style="max-width: 220px;">
                                <option value="">全部状态</option>
                                <option value="active">进行中</option>
                                <option value="completed">已完成</option>
                                <option value="archived">已归档</option>
                            </select>
                            <input class="form-input" v-model="searchText" placeholder="搜索姓名、岗位、渠道..." style="max-width: 320px;">
                            <select class="form-select" v-model="sortMode" style="max-width: 220px;">
                                <option value="recent">最近更新优先</option>
                                <option value="score_desc">筛选评分从高到低</option>
                                <option value="score_asc">筛选评分从低到高</option>
                                <option value="name">姓名排序</option>
                            </select>
                        </div>
                        <div style="padding: 0 20px 20px;">
                            <label style="display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-secondary); cursor: pointer;">
                                <input type="checkbox" v-model="onlyPending">
                                仅看待处理流程（筛选中 / 培养中 / 待配岗）
                            </label>
                        </div>
                    </div>

                    <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">
                        <div v-for="item in filteredWorkflows" :key="item.id" class="card">
                            <div class="flex-between" style="margin-bottom: 12px;">
                                <div>
                                    <div style="font-weight: 600;">{{ item.candidate_name }}</div>
                                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">{{ item.target_role }} · {{ item.source_channel }}</div>
                                </div>
                                <span class="badge" :class="getStageBadgeClass(item)">{{ getStageLabel(item.current_stage) }}</span>
                            </div>
                            <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.8;">
                                <div>筛选评分：{{ item.screening_score || 0 }}</div>
                                <div>培养计划：{{ item.training_plan || '待制定' }}</div>
                                <div>配岗建议：{{ item.placement_notes || '待输出' }}</div>
                            </div>
                            <div style="margin-top: 12px; padding: 12px; background: var(--light-bg); border-radius: 8px;">
                                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 4px;">最近动作</div>
                                <div style="font-size: 13px; font-weight: 600;">{{ getLatestActionText(item) }}</div>
                                <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">{{ getLatestActionTime(item) }}</div>
                            </div>
                            <div class="flex gap-10" style="margin-top: 16px;">
                                <button v-if="canManage && !item.archived" class="btn btn-text" @click="advanceStage(item)">推进阶段</button>
                                <button v-if="canManage && !item.archived" class="btn btn-text" @click="archiveCase(item)">归档</button>
                            </div>
                        </div>
                    </div>
                    <div v-if="!filteredWorkflows.length" class="card" style="color: var(--text-secondary);">当前筛选条件下没有匹配的人才流程</div>

                    <div v-if="showCreate" class="modal" @click.self="showCreate = false">
                        <div class="modal-content">
                            <div class="modal-header">新建人才流程</div>
                            <div class="form-group">
                                <label class="form-label">候选人/员工姓名</label>
                                <input v-model="draft.candidate_name" class="form-input" placeholder="请输入姓名">
                            </div>
                            <div class="form-group">
                                <label class="form-label">目标岗位</label>
                                <input v-model="draft.target_role" class="form-input" placeholder="例如：运营助理">
                            </div>
                            <div class="form-group">
                                <label class="form-label">来源渠道</label>
                                <input v-model="draft.source_channel" class="form-input" placeholder="例如：校招/内推/社招">
                            </div>
                            <div class="form-group">
                                <label class="form-label">培养计划</label>
                                <textarea v-model="draft.training_plan" class="form-textarea" placeholder="请输入培养计划"></textarea>
                            </div>
                            <div class="modal-footer">
                                <button class="btn btn-text" @click="showCreate = false">取消</button>
                                <button class="btn btn-primary" @click="createWorkflow">保存</button>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            setup() {
                const route = useRoute();
                const router = useRouter();
                const workflows = ref([]);
                const hiddenWorkflowCount = ref(0);
                const showCreate = ref(false);
                const selectedStage = ref('');
                const selectedStatus = ref('');
                const searchText = ref('');
                const sortMode = ref('recent');
                const onlyPending = ref(false);
                const canManage = computed(() => ['admin', 'mentor'].includes(userProfile.value?.role));
                const showSuspiciousHelp = computed(() => route.query.issue === 'suspicious');
                const latestActionById = reactive({});
                const draft = reactive({
                    candidate_name: '',
                    source_channel: '',
                    target_role: '',
                    training_plan: ''
                });
                const stageLabels = {
                    screening: '筛选中',
                    training: '培养中',
                    placement: '待配岗',
                    completed: '已完成',
                    archived: '已归档'
                };
                const formatActionDate = (value) => {
                    if (!value) return '刚刚更新';
                    const date = new Date(value);
                    if (Number.isNaN(date.getTime())) return String(value);
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                };
                const setLatestAction = (itemId, summary, createdAt) => {
                    if (!itemId) return;
                    latestActionById[itemId] = {
                        summary,
                        createdAt: formatActionDate(createdAt)
                    };
                };
                const writeWorkflowLog = async (action, item, extraDetail) => {
                    if (!isSupabaseConfigured.value || !userProfile.value) return;
                    try {
                        const inserted = await DatabaseService.insert(supabase, 'approval_logs', [{
                            module: 'talent_workflow',
                            action,
                            actor_id: userProfile.value.id,
                            target_user_id: item.user_id || null,
                            ref_table: 'talent_workflow_cases',
                            ref_id: item.id ? String(item.id) : null,
                            detail: {
                                candidate_name: item.candidate_name,
                                current_stage: item.current_stage,
                                status: item.status,
                                target_role: item.target_role,
                                ...extraDetail
                            }
                        }]);
                        return inserted[0] || null;
                    } catch (error) {
                        console.error('Talent workflow log error:', error);
                        return null;
                    }
                };
                const writeWorkflowNotification = async (item, actionText) => {
                    if (!isSupabaseConfigured.value || !item.user_id) return;
                    try {
                        await DatabaseService.insert(supabase, 'notifications', [{
                            user_id: item.user_id,
                            type: 'workflow',
                            title: '人才流程状态已更新',
                            content: `${item.candidate_name} 的流程已更新为“${actionText}”。`
                        }]);
                    } catch (error) {
                        console.error('Talent workflow notification error:', error);
                    }
                };

                const loadWorkflows = async () => {
                    if (!isSupabaseConfigured.value) {
                        const fallbackRows = fallbackWorkflows.map((item) => ({ ...item }));
                        hiddenWorkflowCount.value = countHiddenOperationalItems(fallbackRows, ['candidate_name']);
                        workflows.value = sanitizeOperationalItems(fallbackRows, ['candidate_name']);
                        return;
                    }

                    try {
                        const sourceRows = await DatabaseService.list(supabase, 'talent_workflow_cases', {
                            select: '*',
                            filters: [{ type: 'order', column: 'created_at', ascending: false }]
                        });
                        hiddenWorkflowCount.value = countHiddenOperationalItems(sourceRows, ['candidate_name']);
                        const rows = sanitizeOperationalItems(sourceRows, ['candidate_name']);
                        Object.keys(latestActionById).forEach((key) => delete latestActionById[key]);
                        if (rows.length) {
                            const logs = await DatabaseService.list(supabase, 'approval_logs', {
                                select: 'ref_id, action, detail, created_at',
                                filters: [
                                    { type: 'eq', column: 'module', value: 'talent_workflow' },
                                    { type: 'order', column: 'created_at', ascending: false }
                                ]
                            });
                            logs.forEach((log) => {
                                if (log.ref_id && !latestActionById[log.ref_id]) {
                                    setLatestAction(
                                        log.ref_id,
                                        log.detail?.summary || log.detail?.current_stage || '流程已更新',
                                        log.created_at
                                    );
                                }
                            });
                        }
                        workflows.value = rows.length ? rows : sanitizeOperationalItems(
                            fallbackWorkflows.map((item) => ({ ...item })),
                            ['candidate_name']
                        );
                    } catch (error) {
                        console.error('Talent workflow load error:', error);
                        const fallbackRows = fallbackWorkflows.map((item) => ({ ...item }));
                        hiddenWorkflowCount.value = countHiddenOperationalItems(fallbackRows, ['candidate_name']);
                        workflows.value = sanitizeOperationalItems(fallbackRows, ['candidate_name']);
                    }
                };

                const createWorkflow = async () => {
                    if (!draft.candidate_name || !draft.target_role) return;
                    const row = {
                        candidate_name: draft.candidate_name,
                        source_channel: draft.source_channel,
                        target_role: draft.target_role,
                        training_plan: draft.training_plan,
                        current_stage: 'screening',
                        status: 'active',
                        mentor_id: userProfile.value?.role === 'mentor' ? userProfile.value.id : null
                    };

                    if (isSupabaseConfigured.value) {
                        try {
                            const createdRows = await DatabaseService.upsert(supabase, 'talent_workflow_cases', [row]);
                            if (createdRows[0]) {
                                row.id = createdRows[0].id;
                                row.user_id = createdRows[0].user_id;
                            }
                            const logRow = await writeWorkflowLog('created', row, {
                                source_channel: row.source_channel,
                                summary: `已创建人才流程，当前阶段为${stageLabels[row.current_stage]}`
                            });
                            setLatestAction(row.id || createdRows[0]?.id, `已创建人才流程，当前阶段为${stageLabels[row.current_stage]}`, logRow?.created_at || new Date().toISOString());
                            await writeWorkflowNotification(row, stageLabels[row.current_stage]);
                            window.dispatchEvent(new CustomEvent('app-data-refresh'));
                        } catch (error) {
                            console.error('Talent workflow create error:', error);
                        }
                    }

                    workflows.value = [{ id: Date.now(), archived: false, screening_score: 0, placement_notes: '', ...row }, ...workflows.value];
                    draft.candidate_name = '';
                    draft.source_channel = '';
                    draft.target_role = '';
                    draft.training_plan = '';
                    showCreate.value = false;
                };

                const advanceStage = async (item) => {
                    const nextStageMap = { screening: 'training', training: 'placement', placement: 'completed', completed: 'completed' };
                    const nextStage = nextStageMap[item.current_stage] || 'training';
                    item.current_stage = nextStage;
                    item.status = nextStage === 'completed' ? 'completed' : 'active';

                    if (isSupabaseConfigured.value && item.id) {
                        try {
                            await DatabaseService.upsert(supabase, 'talent_workflow_cases', [{
                                id: item.id,
                                candidate_name: item.candidate_name,
                                source_channel: item.source_channel,
                                target_role: item.target_role,
                                current_stage: item.current_stage,
                                status: item.status,
                                training_plan: item.training_plan,
                                placement_notes: item.placement_notes,
                                screening_score: item.screening_score,
                                mentor_id: item.mentor_id || null,
                                user_id: item.user_id || null,
                                archived: item.archived || false
                            }]);
                            const logRow = await writeWorkflowLog('stage_advanced', item, {
                                next_stage: item.current_stage,
                                summary: `流程已推进到${stageLabels[item.current_stage]}`
                            });
                            setLatestAction(item.id, `流程已推进到${stageLabels[item.current_stage]}`, logRow?.created_at || new Date().toISOString());
                            await writeWorkflowNotification(item, stageLabels[item.current_stage]);
                            window.dispatchEvent(new CustomEvent('app-data-refresh'));
                        } catch (error) {
                            console.error('Talent workflow update error:', error);
                        }
                    }
                };

                const archiveCase = async (item) => {
                    item.archived = true;
                    item.status = 'archived';
                    item.current_stage = 'archived';

                    if (isSupabaseConfigured.value && item.id) {
                        try {
                            await Promise.all([
                                DatabaseService.upsert(supabase, 'talent_workflow_cases', [{
                                    id: item.id,
                                    candidate_name: item.candidate_name,
                                    source_channel: item.source_channel,
                                    target_role: item.target_role,
                                    current_stage: 'archived',
                                    status: 'archived',
                                    training_plan: item.training_plan,
                                    placement_notes: item.placement_notes,
                                    screening_score: item.screening_score,
                                    mentor_id: item.mentor_id || null,
                                    user_id: item.user_id || null,
                                    archived: true,
                                    archived_at: new Date().toISOString()
                                }]),
                                DatabaseService.upsert(supabase, 'archive_records', [{
                                    archive_type: 'talent_workflow',
                                    ref_table: 'talent_workflow_cases',
                                    ref_id: String(item.id),
                                    title: `${item.candidate_name} 人才流程归档`,
                                    snapshot: item,
                                    archived_by: userProfile.value?.id || null
                                }])
                            ]);
                            const logRow = await writeWorkflowLog('archived', item, {
                                archived_at: new Date().toISOString(),
                                summary: '流程已归档'
                            });
                            setLatestAction(item.id, '流程已归档', logRow?.created_at || new Date().toISOString());
                            await writeWorkflowNotification(item, '已归档');
                            window.dispatchEvent(new CustomEvent('app-data-refresh'));
                        } catch (error) {
                            console.error('Talent workflow archive error:', error);
                        }
                    }
                };

                const activeCount = computed(() => workflows.value.filter((item) => !item.archived).length);
                const screeningCount = computed(() => workflows.value.filter((item) => item.current_stage === 'screening').length);
                const trainingCount = computed(() => workflows.value.filter((item) => item.current_stage === 'training').length);
                const archivedCount = computed(() => workflows.value.filter((item) => item.archived).length);
                const filteredWorkflows = computed(() => {
                    const pendingStages = new Set(['screening', 'training', 'placement']);
                    const rows = workflows.value.filter((item) => {
                        const stageMatch = !selectedStage.value || item.current_stage === selectedStage.value;
                        const normalizedStatus = item.archived ? 'archived' : item.status;
                        const statusMatch = !selectedStatus.value || normalizedStatus === selectedStatus.value;
                        const pendingMatch = !onlyPending.value || pendingStages.has(item.current_stage);
                        const query = searchText.value.trim();
                        const searchMatch = !query || `${item.candidate_name || ''} ${item.target_role || ''} ${item.source_channel || ''}`.includes(query);
                        return stageMatch && statusMatch && pendingMatch && searchMatch;
                    });

                    return rows.slice().sort((a, b) => {
                        if (sortMode.value === 'score_desc') {
                            return Number(b.screening_score || 0) - Number(a.screening_score || 0);
                        }
                        if (sortMode.value === 'score_asc') {
                            return Number(a.screening_score || 0) - Number(b.screening_score || 0);
                        }
                        if (sortMode.value === 'name') {
                            return String(a.candidate_name || '').localeCompare(String(b.candidate_name || ''), 'zh-Hans-CN');
                        }
                        const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
                        const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
                        return bTime - aTime;
                    });
                });
                const getStageLabel = (stage) => stageLabels[stage] || stage;
                const getStageBadgeClass = (item) => {
                    if (item.archived || item.current_stage === 'archived') return 'badge-info';
                    if (item.current_stage === 'completed') return 'badge-success';
                    if (item.current_stage === 'placement') return 'badge-warning';
                    return 'badge-warning';
                };
                const getLatestActionText = (item) => latestActionById[item.id]?.summary || `当前阶段：${getStageLabel(item.current_stage)}`;
                const getLatestActionTime = (item) => latestActionById[item.id]?.createdAt || formatActionDate(item.updated_at || item.created_at);
                const applySuspiciousFilters = () => {
                    selectedStage.value = '';
                    selectedStatus.value = '';
                    searchText.value = '';
                    sortMode.value = 'recent';
                    onlyPending.value = false;
                };
                const backToSystemHealth = () => {
                    router.push('/system-health');
                };

                watch(() => [isSupabaseConfigured.value, userProfile.value?.id], loadWorkflows, { immediate: true });

                return {
                    workflows,
                    showCreate,
                    hiddenWorkflowCount,
                    selectedStage,
                    selectedStatus,
                    searchText,
                    sortMode,
                    onlyPending,
                    showSuspiciousHelp,
                    draft,
                    canManage,
                    activeCount,
                    screeningCount,
                    trainingCount,
                    archivedCount,
                    filteredWorkflows,
                    getStageLabel,
                    getStageBadgeClass,
                    getLatestActionText,
                    getLatestActionTime,
                    applySuspiciousFilters,
                    backToSystemHealth,
                    createWorkflow,
                    advanceStage,
                    archiveCase
                };
            }
        };
    },

    createCoursewareView(context) {
        const {
            ref,
            reactive,
            computed,
            watch,
            useRoute,
            useRouter,
            userProfile,
            isSupabaseConfigured,
            DatabaseService,
            supabase,
            fallbackCoursewares,
            toDateInputValue
        } = context;

        return {
            template: `
                <div>
                    <div class="flex-between" style="margin-bottom: 20px;">
                        <div>
                            <h1>课件版本库</h1>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">支持持续更新、版本发布和试运行回收</div>
                        </div>
                        <button v-if="isAdmin" class="btn btn-primary" @click="showEditor = true">+ 发布课件</button>
                    </div>

                    <div v-if="showSuspiciousHelp" class="card" style="background: rgba(250, 173, 20, 0.08); border-color: rgba(250, 173, 20, 0.35);">
                        <div style="padding: 18px 20px; color: var(--text-secondary); line-height: 1.8;">
                            当前是从系统诊断跳转过来的排查模式。异常课件标题已经被页面过滤，请重点检查 Supabase 里的课件标题、摘要和导入批次，确认没有占位符或误导性标题。
                            <div style="margin-top: 8px;">当前已过滤 {{ hiddenCoursewareCount }} 条可疑课件记录。</div>
                            <div style="margin-top: 12px;">
                                <button class="btn btn-text" @click="applySuspiciousFilters">应用排查筛选</button>
                                <button class="btn btn-text" @click="backToSystemHealth">返回系统诊断</button>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">课件筛选</div>
                        <div style="padding: 20px;" class="flex gap-10">
                            <select class="form-select" v-model="selectedPublishStatus" style="max-width: 220px;">
                                <option value="">全部状态</option>
                                <option value="published">已发布</option>
                                <option value="draft">草稿</option>
                            </select>
                            <select class="form-select" v-model="selectedContentType" style="max-width: 220px;">
                                <option value="">全部类型</option>
                                <option value="document">文档</option>
                                <option value="video">视频</option>
                                <option value="slide">课件PPT</option>
                            </select>
                            <input class="form-input" v-model="searchText" placeholder="搜索标题、摘要、版本..." style="max-width: 320px;">
                            <select class="form-select" v-model="sortMode" style="max-width: 220px;">
                                <option value="recent">最近更新优先</option>
                                <option value="title">标题排序</option>
                                <option value="version">版本排序</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));">
                        <div v-for="item in filteredCoursewares" :key="item.id" class="card">
                            <div class="flex-between" style="margin-bottom: 10px;">
                                <div>
                                    <div style="font-weight: 600;">{{ item.title }}</div>
                                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">{{ item.version }} · {{ item.content_type }}</div>
                                </div>
                                <span class="badge" :class="item.published ? 'badge-success' : 'badge-warning'">{{ item.published ? '已发布' : '草稿' }}</span>
                            </div>
                            <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.8;">{{ item.summary }}</div>
                            <div style="margin-top: 12px; font-size: 12px; color: var(--text-secondary);">
                                更新时间：{{ toDateInputValue(item.updated_at || item.published_at) }}
                            </div>
                            <div v-if="item.content_url" style="margin-top: 12px;">
                                <a :href="item.content_url" target="_blank" style="color: var(--accent); text-decoration: none;">打开课件</a>
                            </div>
                        </div>
                    </div>
                    <div v-if="!filteredCoursewares.length" class="card" style="color: var(--text-secondary);">当前筛选条件下没有匹配的课件版本</div>

                    <div v-if="showEditor" class="modal" @click.self="showEditor = false">
                        <div class="modal-content">
                            <div class="modal-header">发布课件</div>
                            <div class="form-group">
                                <label class="form-label">课件标题</label>
                                <input v-model="editor.title" class="form-input" placeholder="请输入标题">
                            </div>
                            <div class="form-group">
                                <label class="form-label">版本号</label>
                                <input v-model="editor.version" class="form-input" placeholder="例如 v2.1">
                            </div>
                            <div class="form-group">
                                <label class="form-label">课件链接</label>
                                <input v-model="editor.content_url" class="form-input" placeholder="https://...">
                            </div>
                            <div class="form-group">
                                <label class="form-label">更新摘要</label>
                                <textarea v-model="editor.summary" class="form-textarea" placeholder="说明本次更新内容"></textarea>
                            </div>
                            <div class="modal-footer">
                                <button class="btn btn-text" @click="showEditor = false">取消</button>
                                <button class="btn btn-primary" @click="publishCourseware">发布</button>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            setup() {
                const route = useRoute();
                const router = useRouter();
                const isAdmin = computed(() => userProfile.value?.role === 'admin');
                const showSuspiciousHelp = computed(() => route.query.issue === 'suspicious');
                const showEditor = ref(false);
                const hiddenCoursewareCount = ref(0);
                const coursewares = ref([]);
                const selectedPublishStatus = ref('');
                const selectedContentType = ref('');
                const searchText = ref('');
                const sortMode = ref('recent');
                const editor = reactive({
                    title: '',
                    version: 'v1.0',
                    content_url: '',
                    summary: ''
                });
                const emitAppDataRefresh = () => {
                    window.dispatchEvent(new CustomEvent('app-data-refresh'));
                };

                const loadCourseware = async () => {
                    if (!isSupabaseConfigured.value) {
                        const fallbackRows = fallbackCoursewares.map((item) => ({ ...item }));
                        hiddenCoursewareCount.value = countHiddenOperationalItems(fallbackRows, ['title']);
                        coursewares.value = sanitizeOperationalItems(fallbackRows, ['title']);
                        return;
                    }

                    try {
                        const sourceRows = await DatabaseService.list(supabase, 'courseware_library', {
                            select: '*',
                            filters: [{ type: 'order', column: 'updated_at', ascending: false }]
                        });
                        hiddenCoursewareCount.value = countHiddenOperationalItems(sourceRows, ['title']);
                        const rows = sanitizeOperationalItems(sourceRows, ['title']);
                        coursewares.value = rows.length ? rows : sanitizeOperationalItems(
                            fallbackCoursewares.map((item) => ({ ...item })),
                            ['title']
                        );
                    } catch (error) {
                        console.error('Courseware load error:', error);
                        const fallbackRows = fallbackCoursewares.map((item) => ({ ...item }));
                        hiddenCoursewareCount.value = countHiddenOperationalItems(fallbackRows, ['title']);
                        coursewares.value = sanitizeOperationalItems(fallbackRows, ['title']);
                    }
                };
                const writeCoursewareTrace = async (row) => {
                    if (!isSupabaseConfigured.value || !userProfile.value) return;
                    try {
                        await DatabaseService.insert(supabase, 'approval_logs', [{
                            module: 'courseware',
                            action: 'published',
                            actor_id: userProfile.value.id,
                            ref_table: 'courseware_library',
                            ref_id: row.id ? String(row.id) : null,
                            detail: {
                                actor_name: userProfile.value.name || userProfile.value.email || '管理员',
                                summary: `已发布课件《${row.title}》 ${row.version}`,
                                title: row.title,
                                version: row.version
                            }
                        }]);
                    } catch (error) {
                        console.error('Courseware trace write error:', error);
                    }
                };
                const notifyCoursewareAudience = async (row) => {
                    if (!isSupabaseConfigured.value) return;
                    try {
                        const recipients = await DatabaseService.list(supabase, 'users', {
                            select: 'id',
                            filters: [{ type: 'in', column: 'role', value: ['mentor', 'trainee'] }]
                        });
                        if (!recipients.length) return;
                        await DatabaseService.insert(supabase, 'notifications', recipients.map((recipient) => ({
                            user_id: recipient.id,
                            type: 'courseware',
                            title: '课件资料已更新',
                            content: `《${row.title}》已发布 ${row.version}，请及时查看最新课件内容。`
                        })));
                    } catch (error) {
                        console.error('Courseware notification error:', error);
                    }
                };

                const publishCourseware = async () => {
                    if (!editor.title) return;
                    const row = {
                        title: editor.title,
                        version: editor.version,
                        content_url: editor.content_url,
                        summary: editor.summary,
                        content_type: 'document',
                        published: true,
                        published_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    };

                    if (isSupabaseConfigured.value) {
                        try {
                            const savedRows = await DatabaseService.upsert(supabase, 'courseware_library', [row]);
                            if (savedRows[0]) {
                                row.id = savedRows[0].id;
                            }
                            await Promise.all([
                                writeCoursewareTrace(row),
                                notifyCoursewareAudience(row)
                            ]);
                            emitAppDataRefresh();
                        } catch (error) {
                            console.error('Courseware publish error:', error);
                        }
                    }

                    coursewares.value = [{ id: Date.now(), ...row }, ...coursewares.value];
                    editor.title = '';
                    editor.version = 'v1.0';
                    editor.content_url = '';
                    editor.summary = '';
                    showEditor.value = false;
                };
                const filteredCoursewares = computed(() => {
                    const rows = coursewares.value.filter((item) => {
                        const publishStatus = item.published ? 'published' : 'draft';
                        const publishMatch = !selectedPublishStatus.value || publishStatus === selectedPublishStatus.value;
                        const typeMatch = !selectedContentType.value || item.content_type === selectedContentType.value;
                        const query = searchText.value.trim();
                        const searchMatch = !query || `${item.title || ''} ${item.summary || ''} ${item.version || ''}`.includes(query);
                        return publishMatch && typeMatch && searchMatch;
                    });

                    return rows.slice().sort((a, b) => {
                        if (sortMode.value === 'title') {
                            return String(a.title || '').localeCompare(String(b.title || ''), 'zh-Hans-CN');
                        }
                        if (sortMode.value === 'version') {
                            return String(b.version || '').localeCompare(String(a.version || ''), 'zh-Hans-CN', { numeric: true });
                        }
                        const aTime = new Date(a.updated_at || a.published_at || 0).getTime();
                        const bTime = new Date(b.updated_at || b.published_at || 0).getTime();
                        return bTime - aTime;
                    });
                });
                const applySuspiciousFilters = () => {
                    selectedPublishStatus.value = '';
                    selectedContentType.value = '';
                    searchText.value = '';
                    sortMode.value = 'recent';
                };
                const backToSystemHealth = () => {
                    router.push('/system-health');
                };

                watch(() => isSupabaseConfigured.value, loadCourseware, { immediate: true });

                return {
                    isAdmin,
                    showEditor,
                    coursewares,
                    hiddenCoursewareCount,
                    selectedPublishStatus,
                    selectedContentType,
                    searchText,
                    sortMode,
                    showSuspiciousHelp,
                    applySuspiciousFilters,
                    backToSystemHealth,
                    editor,
                    filteredCoursewares,
                    publishCourseware,
                    toDateInputValue
                };
            }
        };
    },

    createArchiveView(context) {
        const {
            ref,
            computed,
            watch,
            useRoute,
            useRouter,
            isSupabaseConfigured,
            DatabaseService,
            supabase,
            fallbackArchives,
            toDateInputValue
        } = context;

        return {
            template: `
                <div>
                    <div class="flex-between" style="margin-bottom: 20px;">
                        <div>
                            <h1>历史归档中心</h1>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">支持按类型检索流程留痕，并导出归档快照</div>
                        </div>
                        <button class="btn btn-secondary" @click="exportArchives">导出归档JSON</button>
                    </div>

                    <div v-if="showSuspiciousHelp" class="card" style="background: rgba(250, 173, 20, 0.08); border-color: rgba(250, 173, 20, 0.35);">
                        <div style="padding: 18px 20px; color: var(--text-secondary); line-height: 1.8;">
                            当前是从系统诊断跳转过来的排查模式。归档标题里的异常文案会被隐藏，请重点核对归档标题、来源表和快照内容是否来自错误的导入或历史测试数据。
                            <div style="margin-top: 8px;">当前已过滤 {{ hiddenArchiveCount }} 条可疑归档记录。</div>
                            <div style="margin-top: 12px;">
                                <button class="btn btn-text" @click="applySuspiciousFilters">应用排查筛选</button>
                                <button class="btn btn-text" @click="backToSystemHealth">返回系统诊断</button>
                            </div>
                        </div>
                    </div>
                    <div class="grid">
                        <div class="stat-card">
                            <div class="stat-card-label">归档总数</div>
                            <div class="stat-card-value">{{ archives.length }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">流程归档</div>
                            <div class="stat-card-value">{{ workflowArchives }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">学习记录归档</div>
                            <div class="stat-card-value">{{ learningArchives }}</div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">归档筛选</div>
                        <div style="padding: 20px;" class="flex gap-10">
                            <select class="form-select" v-model="selectedType" style="max-width: 220px;">
                                <option value="">全部类型</option>
                                <option value="talent_workflow">人才流程</option>
                                <option value="learning_record">学习记录</option>
                                <option value="pilot_run">试运行</option>
                            </select>
                            <input class="form-input" v-model="searchText" placeholder="搜索标题、来源表..." style="max-width: 320px;">
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">归档记录</div>
                        <table class="table">
                            <thead>
                                <tr>
                                    <th>类型</th>
                                    <th>标题</th>
                                    <th>来源表</th>
                                    <th>归档时间</th>
                                    <th>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="item in filteredArchives" :key="item.id">
                                    <td>{{ item.archive_type }}</td>
                                    <td>{{ item.title }}</td>
                                    <td>{{ item.ref_table }}</td>
                                    <td>{{ toDateInputValue(item.archived_at) }}</td>
                                    <td><button class="btn btn-text" @click="openSnapshot(item)">查看快照</button></td>
                                </tr>
                            </tbody>
                        </table>
                        <div v-if="!filteredArchives.length" style="padding: 20px; color: var(--text-secondary);">当前筛选条件下没有归档记录</div>
                    </div>

                    <div v-if="selectedArchive" class="modal" @click.self="selectedArchive = null">
                        <div class="modal-content" style="max-width: 720px;">
                            <div class="modal-header">{{ selectedArchive.title }}</div>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 15px;">
                                {{ selectedArchive.archive_type }} · {{ selectedArchive.ref_table }} · {{ toDateInputValue(selectedArchive.archived_at) }}
                            </div>
                            <pre style="white-space: pre-wrap; word-break: break-word; background: var(--light-bg); border-radius: 8px; padding: 16px; max-height: 420px; overflow: auto;">{{ formatSnapshot(selectedArchive.snapshot) }}</pre>
                            <div class="modal-footer">
                                <button class="btn btn-primary" @click="selectedArchive = null">关闭</button>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            setup() {
                const route = useRoute();
                const router = useRouter();
                const archives = ref([]);
                const hiddenArchiveCount = ref(0);
                const showSuspiciousHelp = computed(() => route.query.issue === 'suspicious');
                const selectedType = ref('');
                const searchText = ref('');
                const selectedArchive = ref(null);

                const loadArchives = async () => {
                    if (!isSupabaseConfigured.value) {
                        const fallbackRows = fallbackArchives.map((item) => ({ ...item }));
                        hiddenArchiveCount.value = countHiddenOperationalItems(fallbackRows, ['title']);
                        archives.value = sanitizeOperationalItems(fallbackRows, ['title']);
                        return;
                    }

                    try {
                        const sourceRows = await DatabaseService.list(supabase, 'archive_records', {
                            select: '*',
                            filters: [{ type: 'order', column: 'archived_at', ascending: false }]
                        });
                        hiddenArchiveCount.value = countHiddenOperationalItems(sourceRows, ['title']);
                        const rows = sanitizeOperationalItems(sourceRows, ['title']);
                        archives.value = rows.length ? rows : sanitizeOperationalItems(
                            fallbackArchives.map((item) => ({ ...item })),
                            ['title']
                        );
                    } catch (error) {
                        console.error('Archive load error:', error);
                        const fallbackRows = fallbackArchives.map((item) => ({ ...item }));
                        hiddenArchiveCount.value = countHiddenOperationalItems(fallbackRows, ['title']);
                        archives.value = sanitizeOperationalItems(fallbackRows, ['title']);
                    }
                };

                const workflowArchives = computed(() => archives.value.filter((item) => item.archive_type === 'talent_workflow').length);
                const learningArchives = computed(() => archives.value.filter((item) => item.archive_type !== 'talent_workflow').length);
                const filteredArchives = computed(() => archives.value.filter((item) => {
                    const typeMatch = !selectedType.value || item.archive_type === selectedType.value;
                    const query = searchText.value.trim();
                    const searchMatch = !query || `${item.title || ''} ${item.ref_table || ''} ${item.archive_type || ''}`.includes(query);
                    return typeMatch && searchMatch;
                }));
                const openSnapshot = (item) => {
                    selectedArchive.value = item;
                };
                const formatSnapshot = (snapshot) => {
                    if (!snapshot) return '暂无快照内容';
                    return JSON.stringify(snapshot, null, 2);
                };
                const exportArchives = () => {
                    const payload = {
                        exported_at: new Date().toISOString(),
                        total: filteredArchives.value.length,
                        records: filteredArchives.value
                    };
                    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `archive-export-${new Date().toISOString().slice(0, 10)}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                };
                const applySuspiciousFilters = () => {
                    selectedType.value = '';
                    searchText.value = '';
                };
                const backToSystemHealth = () => {
                    router.push('/system-health');
                };

                watch(() => isSupabaseConfigured.value, loadArchives, { immediate: true });

                return {
                    archives,
                    workflowArchives,
                    learningArchives,
                    hiddenArchiveCount,
                    showSuspiciousHelp,
                    applySuspiciousFilters,
                    backToSystemHealth,
                    selectedType,
                    searchText,
                    filteredArchives,
                    selectedArchive,
                    openSnapshot,
                    formatSnapshot,
                    exportArchives,
                    toDateInputValue
                };
            }
        };
    },

    createPilotRunView(context) {
        const {
            ref,
            reactive,
            computed,
            watch,
            useRoute,
            useRouter,
            userProfile,
            isSupabaseConfigured,
            DatabaseService,
            supabase,
            fallbackPilots
        } = context;

        return {
            template: `
                <div>
                    <div class="flex-between" style="margin-bottom: 20px;">
                        <div>
                            <h1>试运行台账</h1>
                            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 6px;">用于跟踪灰度试运行、问题回收与上线放量</div>
                        </div>
                        <button v-if="isAdmin" class="btn btn-primary" @click="showCreator = true">+ 新建试运行</button>
                    </div>

                    <div v-if="showSuspiciousHelp" class="card" style="background: rgba(250, 173, 20, 0.08); border-color: rgba(250, 173, 20, 0.35);">
                        <div style="padding: 18px 20px; color: var(--text-secondary); line-height: 1.8;">
                            当前是从系统诊断跳转过来的排查模式。异常试运行名称已被过滤，请重点检查 Supabase 中的名称、结果记录和归档写回来源，确认不是测试占位数据残留。
                            <div style="margin-top: 8px;">当前已过滤 {{ hiddenPilotCount }} 条可疑试运行记录。</div>
                            <div style="margin-top: 12px;">
                                <button class="btn btn-text" @click="applySuspiciousFilters">应用排查筛选</button>
                                <button class="btn btn-text" @click="backToSystemHealth">返回系统诊断</button>
                            </div>
                        </div>
                    </div>

                    <div class="grid">
                        <div class="stat-card">
                            <div class="stat-card-label">试运行总数</div>
                            <div class="stat-card-value">{{ pilots.length }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">规划中</div>
                            <div class="stat-card-value">{{ planningCount }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">进行中</div>
                            <div class="stat-card-value">{{ runningCount }}</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-card-label">已完成</div>
                            <div class="stat-card-value">{{ completedCount }}</div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-title">试运行筛选</div>
                        <div style="padding: 20px;" class="flex gap-10">
                            <select class="form-select" v-model="selectedStatus" style="max-width: 220px;">
                                <option value="">全部状态</option>
                                <option value="planning">规划中</option>
                                <option value="running">进行中</option>
                                <option value="completed">已完成</option>
                            </select>
                            <input class="form-input" v-model="searchText" placeholder="搜索名称、范围、下一动作..." style="max-width: 320px;">
                            <select class="form-select" v-model="sortMode" style="max-width: 220px;">
                                <option value="recent">最近更新优先</option>
                                <option value="name">名称排序</option>
                                <option value="status">状态排序</option>
                            </select>
                        </div>
                    </div>

                    <div class="grid">
                        <div v-for="item in filteredPilots" :key="item.id" class="card">
                            <div class="flex-between" style="margin-bottom: 12px;">
                                <div>
                                    <div style="font-weight: 600;">{{ item.name }}</div>
                                    <div style="font-size: 12px; color: var(--text-secondary); margin-top: 4px;">{{ item.scope }}</div>
                                </div>
                                <span class="badge" :class="getPilotBadgeClass(item.status)">{{ getPilotStatusLabel(item.status) }}</span>
                            </div>
                            <div style="font-size: 13px; color: var(--text-secondary); line-height: 1.8;">
                                <div>发现问题：{{ item.findings || '待补充' }}</div>
                                <div>下一动作：{{ item.next_action || '待安排' }}</div>
                                <div>核心指标：{{ formatPilotMetrics(item.metrics) }}</div>
                                <div>更新时间：{{ formatPilotDate(item.updated_at || item.created_at) }}</div>
                            </div>
                            <div v-if="isAdmin" class="flex gap-10" style="margin-top: 16px;">
                                <button class="btn btn-text" @click="openPilotEditor(item)">更新结果</button>
                                <button v-if="item.status === 'planning'" class="btn btn-text" @click="advancePilot(item)">开始试运行</button>
                                <button v-else-if="item.status === 'running'" class="btn btn-text" @click="advancePilot(item)">标记完成</button>
                            </div>
                        </div>
                    </div>
                    <div v-if="!filteredPilots.length" class="card" style="color: var(--text-secondary);">当前筛选条件下没有试运行记录</div>

                    <div v-if="showCreator" class="modal" @click.self="showCreator = false">
                        <div class="modal-content">
                            <div class="modal-header">新建试运行</div>
                            <div class="form-group">
                                <label class="form-label">试运行名称</label>
                                <input v-model="draft.name" class="form-input" placeholder="请输入名称">
                            </div>
                            <div class="form-group">
                                <label class="form-label">范围</label>
                                <input v-model="draft.scope" class="form-input" placeholder="例如：运营助理首批 10 人">
                            </div>
                            <div class="form-group">
                                <label class="form-label">下一动作</label>
                                <textarea v-model="draft.next_action" class="form-textarea" placeholder="请输入下一步动作"></textarea>
                            </div>
                            <div class="modal-footer">
                                <button class="btn btn-text" @click="showCreator = false">取消</button>
                                <button class="btn btn-primary" @click="createPilot">保存</button>
                            </div>
                        </div>
                    </div>

                    <div v-if="showPilotEditor" class="modal" @click.self="closePilotEditor">
                        <div class="modal-content">
                            <div class="modal-header">更新试运行结果</div>
                            <div class="form-group">
                                <label class="form-label">发现问题</label>
                                <textarea v-model="pilotEditor.findings" class="form-textarea" placeholder="记录本轮试运行发现的问题..."></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">下一动作</label>
                                <textarea v-model="pilotEditor.next_action" class="form-textarea" placeholder="填写下一步动作或修复计划..."></textarea>
                            </div>
                            <div class="form-group">
                                <label class="form-label">覆盖人数</label>
                                <input v-model="pilotEditor.metrics.coverage" class="form-input" placeholder="例如：10人">
                            </div>
                            <div class="form-group">
                                <label class="form-label">完成率</label>
                                <input v-model="pilotEditor.metrics.completion_rate" class="form-input" placeholder="例如：80%">
                            </div>
                            <div class="form-group">
                                <label class="form-label">满意度</label>
                                <input v-model="pilotEditor.metrics.satisfaction" class="form-input" placeholder="例如：4.6/5">
                            </div>
                            <div class="modal-footer">
                                <button class="btn btn-text" @click="closePilotEditor">取消</button>
                                <button class="btn btn-primary" @click="savePilotUpdate">保存更新</button>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            setup() {
                const route = useRoute();
                const router = useRouter();
                const isAdmin = computed(() => userProfile.value?.role === 'admin');
                const showSuspiciousHelp = computed(() => route.query.issue === 'suspicious');
                const showCreator = ref(false);
                const showPilotEditor = ref(false);
                const hiddenPilotCount = ref(0);
                const pilots = ref([]);
                const selectedStatus = ref('');
                const searchText = ref('');
                const sortMode = ref('recent');
                const draft = reactive({ name: '', scope: '', next_action: '' });
                const pilotEditor = reactive({
                    id: null,
                    findings: '',
                    next_action: '',
                    metrics: {
                        coverage: '',
                        completion_rate: '',
                        satisfaction: ''
                    }
                });
                const emitAppDataRefresh = () => {
                    window.dispatchEvent(new CustomEvent('app-data-refresh'));
                };
                const statusLabels = {
                    planning: '规划中',
                    running: '进行中',
                    completed: '已完成'
                };

                const loadPilots = async () => {
                    if (!isSupabaseConfigured.value) {
                        const fallbackRows = fallbackPilots.map((item) => ({ ...item }));
                        hiddenPilotCount.value = countHiddenOperationalItems(fallbackRows, ['name']);
                        pilots.value = sanitizeOperationalItems(fallbackRows, ['name']);
                        return;
                    }

                    try {
                        const sourceRows = await DatabaseService.list(supabase, 'pilot_runs', {
                            select: '*',
                            filters: [{ type: 'order', column: 'created_at', ascending: false }]
                        });
                        hiddenPilotCount.value = countHiddenOperationalItems(sourceRows, ['name']);
                        const rows = sanitizeOperationalItems(sourceRows, ['name']);
                        pilots.value = rows.length ? rows : sanitizeOperationalItems(
                            fallbackPilots.map((item) => ({ ...item })),
                            ['name']
                        );
                    } catch (error) {
                        console.error('Pilot load error:', error);
                        const fallbackRows = fallbackPilots.map((item) => ({ ...item }));
                        hiddenPilotCount.value = countHiddenOperationalItems(fallbackRows, ['name']);
                        pilots.value = sanitizeOperationalItems(fallbackRows, ['name']);
                    }
                };
                const formatPilotDate = (value) => {
                    if (!value) return '待更新';
                    const date = new Date(value);
                    if (Number.isNaN(date.getTime())) return String(value);
                    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                };
                const getPilotStatusLabel = (status) => statusLabels[status] || status;
                const getPilotBadgeClass = (status) => {
                    if (status === 'completed') return 'badge-success';
                    if (status === 'running') return 'badge-info';
                    return 'badge-warning';
                };
                const formatPilotMetrics = (metrics) => {
                    const source = metrics && typeof metrics === 'object' ? metrics : {};
                    const parts = [
                        source.coverage ? `覆盖 ${source.coverage}` : '',
                        source.completion_rate ? `完成率 ${source.completion_rate}` : '',
                        source.satisfaction ? `满意度 ${source.satisfaction}` : ''
                    ].filter(Boolean);
                    return parts.length ? parts.join(' / ') : '待补充';
                };
                const writePilotTrace = async (action, row, summary) => {
                    if (!isSupabaseConfigured.value || !userProfile.value) return;
                    try {
                        await DatabaseService.insert(supabase, 'approval_logs', [{
                            module: 'pilot_run',
                            action,
                            actor_id: userProfile.value.id,
                            ref_table: 'pilot_runs',
                            ref_id: row.id ? String(row.id) : null,
                            detail: {
                                actor_name: userProfile.value.name || userProfile.value.email || '管理员',
                                summary,
                                name: row.name,
                                scope: row.scope,
                                status: row.status
                            }
                        }]);
                    } catch (error) {
                        console.error('Pilot trace write error:', error);
                    }
                };

                const createPilot = async () => {
                    if (!draft.name) return;
                    const row = {
                        name: draft.name,
                        scope: draft.scope,
                        next_action: draft.next_action,
                        status: 'planning',
                        owner_id: userProfile.value?.id || null,
                        findings: '',
                        metrics: {},
                        updated_at: new Date().toISOString()
                    };

                    if (isSupabaseConfigured.value) {
                        try {
                            const savedRows = await DatabaseService.upsert(supabase, 'pilot_runs', [row]);
                            if (savedRows[0]) {
                                row.id = savedRows[0].id;
                            }
                            await writePilotTrace('pilot_created', row, `已新建试运行《${row.name}》`);
                            emitAppDataRefresh();
                        } catch (error) {
                            console.error('Pilot create error:', error);
                        }
                    }

                    pilots.value = [{ id: Date.now(), findings: '', ...row }, ...pilots.value];
                    draft.name = '';
                    draft.scope = '';
                    draft.next_action = '';
                    showCreator.value = false;
                };
                const openPilotEditor = (item) => {
                    pilotEditor.id = item.id;
                    pilotEditor.findings = item.findings || '';
                    pilotEditor.next_action = item.next_action || '';
                    pilotEditor.metrics.coverage = item.metrics?.coverage || '';
                    pilotEditor.metrics.completion_rate = item.metrics?.completion_rate || '';
                    pilotEditor.metrics.satisfaction = item.metrics?.satisfaction || '';
                    showPilotEditor.value = true;
                };
                const closePilotEditor = () => {
                    pilotEditor.id = null;
                    pilotEditor.findings = '';
                    pilotEditor.next_action = '';
                    pilotEditor.metrics.coverage = '';
                    pilotEditor.metrics.completion_rate = '';
                    pilotEditor.metrics.satisfaction = '';
                    showPilotEditor.value = false;
                };
                const savePilotUpdate = async () => {
                    const target = pilots.value.find((item) => item.id === pilotEditor.id);
                    if (!target) return;

                    target.findings = pilotEditor.findings;
                    target.next_action = pilotEditor.next_action;
                    target.metrics = {
                        coverage: pilotEditor.metrics.coverage,
                        completion_rate: pilotEditor.metrics.completion_rate,
                        satisfaction: pilotEditor.metrics.satisfaction
                    };
                    target.updated_at = new Date().toISOString();

                    if (isSupabaseConfigured.value && target.id) {
                        try {
                            await DatabaseService.upsert(supabase, 'pilot_runs', [{
                                id: target.id,
                                name: target.name,
                                scope: target.scope,
                                findings: target.findings,
                                metrics: target.metrics,
                                next_action: target.next_action,
                                status: target.status,
                                owner_id: target.owner_id || null,
                                updated_at: target.updated_at
                            }], {
                                upsertOptions: { onConflict: 'id' }
                            });
                            await writePilotTrace('pilot_updated', target, `试运行《${target.name}》已更新问题与指标`);
                            emitAppDataRefresh();
                        } catch (error) {
                            console.error('Pilot update save error:', error);
                        }
                    }

                    closePilotEditor();
                };
                const advancePilot = async (item) => {
                    const nextStatus = item.status === 'planning' ? 'running' : item.status === 'running' ? 'completed' : 'completed';
                    item.status = nextStatus;
                    item.updated_at = new Date().toISOString();
                    item.next_action = nextStatus === 'running' ? (item.next_action || '跟踪问题并收集反馈') : '完成归档并评估是否放量';

                    if (isSupabaseConfigured.value && item.id) {
                        try {
                            await DatabaseService.upsert(supabase, 'pilot_runs', [{
                                id: item.id,
                                name: item.name,
                                scope: item.scope,
                                findings: item.findings || '',
                                metrics: item.metrics || {},
                                next_action: item.next_action,
                                status: item.status,
                                owner_id: item.owner_id || null,
                                updated_at: item.updated_at
                            }], {
                                upsertOptions: { onConflict: 'id' }
                            });
                            await writePilotTrace(
                                nextStatus === 'running' ? 'pilot_started' : 'pilot_completed',
                                item,
                                nextStatus === 'running' ? `试运行《${item.name}》已启动` : `试运行《${item.name}》已完成`
                            );
                            if (nextStatus === 'completed') {
                                await DatabaseService.upsert(supabase, 'archive_records', [{
                                    archive_type: 'pilot_run',
                                    ref_table: 'pilot_runs',
                                    ref_id: String(item.id),
                                    title: `${item.name} 试运行归档`,
                                    snapshot: item,
                                    archived_by: userProfile.value?.id || null
                                }]);
                            }
                            emitAppDataRefresh();
                        } catch (error) {
                            console.error('Pilot advance error:', error);
                        }
                    }
                };
                const filteredPilots = computed(() => pilots.value.filter((item) => {
                    const statusMatch = !selectedStatus.value || item.status === selectedStatus.value;
                    const query = searchText.value.trim();
                    const searchMatch = !query || `${item.name || ''} ${item.scope || ''} ${item.next_action || ''} ${item.findings || ''}`.includes(query);
                    return statusMatch && searchMatch;
                }).slice().sort((a, b) => {
                    if (sortMode.value === 'name') {
                        return String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hans-CN');
                    }
                    if (sortMode.value === 'status') {
                        return String(a.status || '').localeCompare(String(b.status || ''), 'zh-Hans-CN');
                    }
                    const aTime = new Date(a.updated_at || a.created_at || 0).getTime();
                    const bTime = new Date(b.updated_at || b.created_at || 0).getTime();
                    return bTime - aTime;
                }));
                const applySuspiciousFilters = () => {
                    selectedStatus.value = '';
                    searchText.value = '';
                    sortMode.value = 'recent';
                };
                const backToSystemHealth = () => {
                    router.push('/system-health');
                };
                const planningCount = computed(() => pilots.value.filter((item) => item.status === 'planning').length);
                const runningCount = computed(() => pilots.value.filter((item) => item.status === 'running').length);
                const completedCount = computed(() => pilots.value.filter((item) => item.status === 'completed').length);

                watch(() => isSupabaseConfigured.value, loadPilots, { immediate: true });

                return {
                    isAdmin,
                    showCreator,
                    showPilotEditor,
                    pilots,
                    hiddenPilotCount,
                    selectedStatus,
                    searchText,
                    sortMode,
                    showSuspiciousHelp,
                    applySuspiciousFilters,
                    backToSystemHealth,
                    draft,
                    pilotEditor,
                    filteredPilots,
                    planningCount,
                    runningCount,
                    completedCount,
                    formatPilotDate,
                    formatPilotMetrics,
                    getPilotStatusLabel,
                    getPilotBadgeClass,
                    createPilot,
                    openPilotEditor,
                    closePilotEditor,
                    savePilotUpdate,
                    advancePilot
                };
            }
        };
    }
};
