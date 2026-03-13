-- ============================================
-- SOP管理系统试运行种子数据
-- 在已执行 setup.sql 后运行
-- ============================================

-- 课程目录
INSERT INTO course_catalog (id, title, description, topics, sort_order, active) VALUES
(1, '东南亚跨境电商基础', '了解东南亚市场、TikTok Shop和Shopee平台特点、女鞋品类分析', '["东南亚市场概览","平台基础认知","女鞋品类特性","COD物流体系"]', 1, true),
(2, '商品上架与优化', '掌握TikTok和Shopee平台的商品上架流程、Listing优化技巧', '["类目选择","标题撰写规范","图片拍摄标准","SKU与变体设置"]', 2, true),
(3, '平台运营规则', '深入了解两大平台的政策规则、违规防范、品质管理', '["平台政策解读","违规案例分析","品质评分体系","申诉与售后"]', 3, true),
(4, '数据分析与决策', '学会使用后台数据工具、分析关键指标、制定运营决策', '["关键指标解读","转化率优化","数据看板","竞品分析"]', 4, true),
(5, '内容营销与推广', '学习短视频制作、直播运营、信息流广告投放', '["短视频策略","直播话术与流程","广告投放体系","达人合作"]', 5, true),
(6, '供应链与物流', '了解供应链管理、物流模式、库存管理、成本控制', '["采购流程","物流选择","库存周转","成本预算"]', 6, true),
(7, '团队管理与发展', '运营团队的管理方法、KPI制定、人才培养、大促筹备', '["KPI体系","团队分工","新人带教","大促运营"]', 7, true)
ON CONFLICT (id) DO NOTHING;

-- 任务目录
INSERT INTO task_catalog (id, course_id, title, description, points, sort_order, active) VALUES
(1, 1, '学习东南亚市场概况', '研究泰国、印尼、越南等目标市场的消费特性和女鞋需求', 15, 1, true),
(2, 1, '完成平台基础认知测试', '通过TikTok Shop和Shopee的基础知识考核', 10, 2, true),
(3, 2, '完成第一次商品上架练习', '在测试账户上上架1款女鞋，完整操作从类目到价格设置', 20, 3, true),
(4, 2, '撰写5个女鞋商品标题', '按照规范撰写TikTok和Shopee平台的标题示例', 15, 4, true),
(5, 3, '学习平台违规案例分析', '研究并总结5个女鞋类目的违规案例及解决办法', 15, 5, true),
(6, 3, '品质评分体系学习', '熟悉DSR评分、退货率、响应率等关键指标', 10, 6, true),
(7, 4, '数据指标分析报告', '分析一个爆款女鞋的浏览、转化、销售数据链条', 20, 7, true),
(8, 4, '竞品分析作业', '选择3款竞品女鞋，对比Listing、价格、销量数据', 20, 8, true),
(9, 5, '观看短视频创意案例', '分析5个优秀女鞋短视频的制作思路和转化效果', 15, 9, true),
(10, 5, '直播脚本撰写练习', '为一款女鞋产品撰写30分钟直播的话术脚本', 20, 10, true),
(11, 6, '成本核算练习', '完成一款女鞋的成本核算（物料+运费+佣金计算）', 15, 11, true),
(12, 6, '库存管理方案制定', '针对5款女鞋制定库存周转目标和风险预案', 20, 12, true),
(13, 7, '完成在线考试（岗位对应级别）', '参加岗位对应的分级在线考试并达成通过分数', 30, 13, true),
(14, 7, '职业发展规划', '制定个人在跨境电商运营岗位的1年成长计划', 20, 14, true)
ON CONFLICT (id) DO NOTHING;

-- 课件版本库
INSERT INTO courseware_library (course_id, title, content_type, version, summary, content_url, published) VALUES
(1, '东南亚市场基础课件', 'document', 'v2.0', '新增泰国站点案例和女鞋尺码段说明。', 'https://example.com/courseware/sea-market-v2.pdf', true),
(2, '商品上架 SOP 视频', 'video', 'v1.4', '补充 TikTok 上架改版后的字段说明。', 'https://example.com/courseware/listing-v1-4.mp4', true),
(4, '数据分析训练营讲义', 'document', 'v1.2', '新增转化漏斗拆解模板。', 'https://example.com/courseware/data-analytics-v1-2.pdf', true);

-- 题库示例（每个岗位至少 2 题，后续可继续扩充）
INSERT INTO exam_question_bank (role_name, question_order, question, options, correct_index, active) VALUES
('实习生', 1, 'TikTok Shop是哪家公司旗下的电商平台？', '["A. 阿里巴巴","B. 字节跳动","C. 腾讯","D. 拼多多"]', 1, true),
('实习生', 2, 'Shopee的总部位于哪个国家？', '["A. 中国","B. 泰国","C. 新加坡","D. 马来西亚"]', 2, true),
('运营助理', 1, 'TikTok Shop商品上架的第一步是？', '["A. 上传图片","B. 选择类目","C. 设置价格","D. 填写标题"]', 1, true),
('运营助理', 2, 'Shopee商品标题的字符上限是？', '["A. 60字符","B. 80字符","C. 120字符","D. 200字符"]', 2, true),
('运营专员', 1, 'Shopee搜索广告的竞价模式是？', '["A. CPM","B. CPC","C. CPA","D. CPV"]', 1, true),
('运营专员', 2, 'TikTok Spark Ads的核心优势是？', '["A. 搜索竞价","B. 加热原生内容","C. 弹窗广告","D. 邮件投放"]', 1, true),
('运营组长', 1, '团队KPI制定中，SMART原则的S代表什么？', '["A. Simple","B. Specific","C. Standard","D. Strategic"]', 1, true),
('运营组长', 2, '女鞋品类的合理库存周转天数应控制在？', '["A. 7天以内","B. 15-30天","C. 60-90天","D. 120天以上"]', 1, true),
('运营主管', 1, '运营主管在审核下属提交的女鞋Listing时，首先应检查什么？', '["A. 有没有错别字","B. 类目是否正确、标题关键词是否合理","C. 图片好不好看","D. 价格高不高"]', 1, true),
('运营主管', 2, '月度运营复盘会上，主管应重点关注哪组数据？', '["A. 粉丝增长数","B. GMV达成率、转化率、广告ROI对比上月变化","C. 每个人的出勤率","D. 上新数量排名"]', 1, true)
ON CONFLICT (role_name, question_order) DO NOTHING;

-- 试运行台账
INSERT INTO pilot_runs (name, scope, status, findings, metrics, next_action) VALUES
('员工学习主流程试运行', '首批10名运营助理', 'running', '课程节奏良好，任务评分反馈需提速', '{"completion_target": 0.8, "pass_target": 0.9}', '补齐导师评分SLA'),
('人才筛选标准化试运行', '社招渠道样本', 'review', '筛选评分维度已稳定，可进入归档联动', '{"screening_accuracy": 0.85}', '增加面试官反馈模板');

-- 历史归档示例
INSERT INTO archive_records (archive_type, ref_table, ref_id, title, snapshot) VALUES
('learning_snapshot', 'course_progress', 'demo-q1', '2026Q1 学习结业存档', '{"note":"示例归档数据，用于演示历史留存"}');
