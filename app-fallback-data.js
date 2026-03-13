window.AppFallbackData = {
    resources: {
        faqItems: [
            { question: '如何重置密码？', answer: '您可以在登录页面点击"忘记密码"，或联系管理员进行重置。', expanded: false },
            { question: '考试可以多次参加吗？', answer: '是的，考试可以参加多次，系统会记录您最高的成绩。', expanded: false },
            { question: '任务评分标准是什么？', answer: '任务评分包括理解程度、完整性和实用性三个方面，各占一定比例。', expanded: false },
            { question: '如何下载结业证书？', answer: '在转正通过后，您可以在个人中心下载电子版结业证书。', expanded: false },
            { question: '带教人如何填写周记录？', answer: '每周周一通过"带教跟踪"菜单，填写学员的学习进展和反馈意见。', expanded: false }
        ],
        links: [
            { id: 1, name: 'ERP系统', description: '企业资源规划系统', url: '#' },
            { id: 2, name: 'CRM客户管理', description: '客户关系管理平台', url: '#' },
            { id: 3, name: '协作平台', description: '团队文档和沟通工具', url: '#' },
            { id: 4, name: '数据分析平台', description: '业务数据查询和分析', url: '#' },
            { id: 5, name: '企业邮箱', description: '员工电子邮件系统', url: '#' }
        ]
    },
    workflows: [
        { id: 1, candidate_name: '张三', source_channel: '校招', target_role: '运营助理', current_stage: 'screening', status: 'active', training_plan: '基础课+实操任务', placement_notes: '待完成考试后配岗', screening_score: 78, archived: false },
        { id: 2, candidate_name: '李四', source_channel: '内推', target_role: '运营专员', current_stage: 'training', status: 'active', training_plan: '专项提升班', placement_notes: '拟进入Shopee组', screening_score: 88, archived: false },
        { id: 3, candidate_name: '王五', source_channel: '社招', target_role: '运营组长', current_stage: 'archived', status: 'archived', training_plan: '管理者复训', placement_notes: '已完成试运行', screening_score: 91, archived: true }
    ],
    coursewares: [
        { id: 1, title: '东南亚市场基础课件', version: 'v2.0', content_type: 'document', summary: '新增泰国站点案例和女鞋尺码段说明。', content_url: '#', published: true, updated_at: '2026-03-01' },
        { id: 2, title: '商品上架 SOP 视频', version: 'v1.4', content_type: 'video', summary: '补充 TikTok 上架改版后的字段说明。', content_url: '#', published: true, updated_at: '2026-03-05' }
    ],
    archives: [
        { id: 1, archive_type: 'talent_workflow', title: '张三 人才流程归档', ref_table: 'talent_workflow_cases', archived_at: '2026-03-02' },
        { id: 2, archive_type: 'learning_snapshot', title: '2026Q1 学习结业存档', ref_table: 'course_progress', archived_at: '2026-03-06' }
    ],
    pilots: [
        { id: 1, name: '员工学习主流程试运行', scope: '首批 10 名运营助理', status: 'running', findings: '课程节奏良好，任务评分反馈需提速', next_action: '补齐导师评分 SLA' },
        { id: 2, name: '人才筛选标准化试运行', scope: '社招渠道样本', status: 'review', findings: '筛选评分维度已稳定，可进入归档联动', next_action: '增加面试官反馈模板' }
    ]
};
