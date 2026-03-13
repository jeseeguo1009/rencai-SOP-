# 目录数据迁移说明

当前前端对以下目录数据采用“Supabase 优先，本地兜底”策略：

- `course_catalog`
- `task_catalog`
- `exam_question_bank`

只要这三张表存在且有数据，页面会优先读取数据库；如果表不存在、为空或查询失败，则自动回退到本地默认数据。

## 表结构摘要

### `course_catalog`

- `id`: 课程 ID
- `title`: 课程名称
- `description`: 课程描述
- `topics`: JSON 数组，课程知识点
- `sort_order`: 排序

### `task_catalog`

- `id`: 任务 ID
- `course_id`: 关联课程
- `title`: 任务名称
- `description`: 任务描述
- `points`: 分值
- `sort_order`: 排序

### `exam_question_bank`

- `role_name`: 岗位试卷名称
- `question_order`: 题号顺序
- `question`: 题目
- `options`: JSON 数组，选项列表
- `correct_index`: 正确答案下标

## 推荐迁移顺序

1. 在 Supabase 中重新运行 [setup.sql](/Users/guojiangwei/人才SOP/setup.sql)
2. 先导入课程目录 `course_catalog`
3. 再导入任务目录 `task_catalog`
4. 最后导入题库 `exam_question_bank`
5. 刷新前端，确认页面已从数据库读取目录数据

## 注意

- 如果只导入其中一张表，前端仍会整体回退到本地默认目录数据。
- 当前课程进度、任务提交、考试成绩等业务数据表不受这次迁移影响。
