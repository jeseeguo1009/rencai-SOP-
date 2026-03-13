const fs = require('fs');
const path = require('path');

function readFileSafe(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        return null;
    }
}

function createRecorder(results) {
    return (ok, title, detail) => {
        results.push({
            ok,
            title,
            detail: detail || ''
        });
    };
}

function runPreflightChecks(rootDir) {
    const results = [];
    const record = createRecorder(results);

    function assertFileExists(relativePath) {
        const absolutePath = path.join(rootDir, relativePath);
        const exists = fs.existsSync(absolutePath);
        record(exists, `文件存在 ${relativePath}`, exists ? '' : '缺少该文件');
        return exists;
    }

    function assertContains(filePath, pattern, title, detailIfMissing) {
        const content = readFileSafe(filePath);
        const ok = Boolean(content && pattern.test(content));
        record(ok, title, ok ? '' : detailIfMissing);
        return ok;
    }

    const requiredFiles = [
        'index.html',
        'app-config.js',
        'app-config.example.js',
        'runtime-config.js',
        'runtime-config.example.js',
        'generate-runtime-config.js',
        'prepare-release.js',
        'app-services.js',
        'app-ops-views.js',
        'app-review-views.js',
        'app-support-views.js',
        'vendor/vue.global.prod.js',
        'vendor/vue-router.global.prod.js',
        'vendor/chart.umd.min.js',
        'vendor/supabase.min.js',
        'setup.sql',
        'seed_data.sql',
        'vercel.json',
        'netlify.toml',
        'DEPLOY_WEBSITE.md',
        'GO_LIVE_CHECKLIST.md'
    ];

    requiredFiles.forEach(assertFileExists);

    const appConfigPath = path.join(rootDir, 'app-config.js');
    const appConfig = readFileSafe(appConfigPath) || '';
    const runtimeConfigPath = path.join(rootDir, 'runtime-config.js');
    const runtimeConfig = readFileSafe(runtimeConfigPath) || '';
    const hasRuntimeConfig = Boolean(runtimeConfig);
    const hasResolvedRuntimeConfig = hasRuntimeConfig
        && !runtimeConfig.includes('your-project.supabase.co')
        && !runtimeConfig.includes('your-public-anon-key')
        && /SUPABASE_URL/.test(runtimeConfig)
        && /SUPABASE_ANON_KEY/.test(runtimeConfig)
        && !/window\.__APP_CONFIG__\s*=\s*window\.__APP_CONFIG__\s*\|\|\s*\{\s*\}/.test(runtimeConfig);

    record(
        !appConfig.includes('YOUR_SUPABASE_URL') || hasResolvedRuntimeConfig,
        'Supabase URL 已配置',
        'app-config.js 仍是占位值 YOUR_SUPABASE_URL，且未检测到有效 runtime-config.js'
    );
    record(
        !appConfig.includes('YOUR_SUPABASE_ANON_KEY') || hasResolvedRuntimeConfig,
        'Supabase Anon Key 已配置',
        'app-config.js 仍是占位值 YOUR_SUPABASE_ANON_KEY，且未检测到有效 runtime-config.js'
    );

    assertContains(
        appConfigPath,
        /window\.__APP_CONFIG__/,
        '支持运行时配置覆盖',
        'app-config.js 尚未支持 window.__APP_CONFIG__ 运行时覆盖'
    );
    assertContains(
        appConfigPath,
        /sop_app_config/,
        '支持本地调试配置覆盖',
        'app-config.js 尚未支持 localStorage 调试配置'
    );
    assertContains(
        path.join(rootDir, 'generate-runtime-config.js'),
        /process\.env\.SUPABASE_URL/,
        '支持通过环境变量生成 runtime-config.js',
        'generate-runtime-config.js 缺少环境变量生成逻辑'
    );
    record(
        hasRuntimeConfig,
        '存在 runtime-config.js',
        hasRuntimeConfig ? '' : '缺少运行时配置文件，占位部署时可能出现 404'
    );

    const setupSqlPath = path.join(rootDir, 'setup.sql');
    const requiredTables = [
        'users',
        'course_catalog',
        'exam_question_bank',
        'task_catalog',
        'course_progress',
        'exam_records',
        'task_submissions',
        'mentor_logs',
        'kpi_records',
        'evaluations',
        'notifications',
        'talent_workflow_cases',
        'courseware_library',
        'archive_records',
        'pilot_runs',
        'approval_logs'
    ];

    requiredTables.forEach((tableName) => {
        assertContains(
            setupSqlPath,
            new RegExp(`CREATE TABLE IF NOT EXISTS ${tableName}\\b`),
            `数据库表已定义 ${tableName}`,
            `setup.sql 中缺少 ${tableName}`
        );
    });

    ['notifications', 'courseware_library', 'archive_records', 'pilot_runs', 'approval_logs'].forEach((tableName) => {
        assertContains(
            setupSqlPath,
            new RegExp(`ALTER TABLE ${tableName} ENABLE ROW LEVEL SECURITY;`),
            `RLS 已启用 ${tableName}`,
            `${tableName} 缺少 RLS 启用语句`
        );
    });

    const vercelConfigPath = path.join(rootDir, 'vercel.json');
    assertContains(
        vercelConfigPath,
        /"destination"\s*:\s*"\/index\.html"/,
        'Vercel SPA 重写已配置',
        'vercel.json 缺少对 /index.html 的 rewrite'
    );
    const netlifyConfigPath = path.join(rootDir, 'netlify.toml');
    assertContains(
        netlifyConfigPath,
        /publish\s*=\s*"\."/,
        'Netlify 发布目录已配置',
        'netlify.toml 缺少 publish = "."'
    );
    assertContains(
        netlifyConfigPath,
        /for\s*=\s*"\/runtime-config\.js"[\s\S]*Cache-Control\s*=\s*"no-store, no-cache, must-revalidate"/,
        'Netlify runtime-config.js 禁止缓存',
        'netlify.toml 尚未为 runtime-config.js 配置 no-store 缓存策略'
    );

    const indexHtmlPath = path.join(rootDir, 'index.html');
    assertContains(
        indexHtmlPath,
        /\.\/runtime-config\.js|runtime-config\.js/,
        '首页已引入 runtime-config.js',
        'index.html 没有引入 runtime-config.js'
    );
    assertContains(
        indexHtmlPath,
        /\.\/vendor\/vue\.global\.prod\.js/,
        '首页已引入本地 Vue',
        'index.html 仍未切换到本地 Vue 资源'
    );
    assertContains(
        indexHtmlPath,
        /\.\/vendor\/vue-router\.global\.prod\.js/,
        '首页已引入本地 Vue Router',
        'index.html 仍未切换到本地 Vue Router 资源'
    );
    assertContains(
        indexHtmlPath,
        /\.\/vendor\/chart\.umd\.min\.js/,
        '首页已引入本地 Chart.js',
        'index.html 仍未切换到本地 Chart.js 资源'
    );
    assertContains(
        indexHtmlPath,
        /\.\/vendor\/supabase\.min\.js/,
        '首页已引入本地 Supabase SDK',
        'index.html 仍未切换到本地 Supabase SDK 资源'
    );
    assertContains(
        indexHtmlPath,
        /app-config\.js/,
        '首页已引入 app-config.js',
        'index.html 没有引入 app-config.js'
    );
    assertContains(
        indexHtmlPath,
        /window\.AppOperationalViews|app-ops-views\.js/,
        '首页已引入运营模块',
        'index.html 没有引入运营模块脚本'
    );
    assertContains(
        indexHtmlPath,
        /window\.AppSupportViews|app-support-views\.js/,
        '首页已引入支持模块',
        'index.html 没有引入支持模块脚本'
    );
    assertContains(
        indexHtmlPath,
        /window\.AppReviewViews|app-review-views\.js/,
        '首页已引入评估模块',
        'index.html 没有引入评估模块脚本'
    );

    const failedChecks = results.filter((item) => !item.ok);
    const blockers = failedChecks.map((item) => ({
        title: item.title,
        detail: item.detail
    }));
    const nextSteps = [];
    let suggestedCommand = '';
    const hasSupabaseUrlFailure = failedChecks.some((item) => item.title === 'Supabase URL 已配置');
    const hasSupabaseAnonFailure = failedChecks.some((item) => item.title === 'Supabase Anon Key 已配置');

    if (hasSupabaseUrlFailure || hasSupabaseAnonFailure) {
        nextSteps.push('先注入真实 SUPABASE_URL 和 SUPABASE_ANON_KEY，可优先使用 node generate-runtime-config.js 生成 runtime-config.js。');
        suggestedCommand = 'SUPABASE_URL=你的地址 SUPABASE_ANON_KEY=你的公钥 RELEASE_TARGET=production node prepare-release.js';
    }
    if (failedChecks.some((item) => item.title.includes('数据库表已定义') || item.title.includes('RLS 已启用'))) {
        nextSteps.push('回到 setup.sql 补齐缺失表和 RLS 后，再重新执行预检。');
    }
    if (failedChecks.some((item) => item.title.includes('首页已引入') || item.title.includes('Vercel SPA 重写已配置') || item.title.includes('Netlify '))) {
        nextSteps.push('修复前端入口脚本、vercel.json 或 netlify.toml 后，再重新执行预检。');
    }
    if (!nextSteps.length && failedChecks.length) {
        nextSteps.push('先按失败项逐条修复，再重新执行 node preflight-check.js。');
    }

    return {
        rootDir,
        ok: failedChecks.length === 0,
        failedChecks,
        blockers,
        nextSteps,
        suggestedCommand,
        results
    };
}

function printPreflightReport(report) {
    console.log('新人入职 SOP 管理系统 - 上线前预检');
    console.log(`检查目录: ${report.rootDir}`);
    console.log('');

    report.results.forEach((item) => {
        const prefix = item.ok ? '[PASS]' : '[FAIL]';
        console.log(`${prefix} ${item.title}${item.detail ? `: ${item.detail}` : ''}`);
    });

    console.log('');
    if (report.ok) {
        console.log('预检结果: 本地文件层面已基本满足上线前准备。');
    } else {
        console.log('预检结果: 存在待处理项，暂不建议直接上线。');
        if (report.blockers.length) {
            console.log('关键阻塞项:');
            report.blockers.forEach((item, index) => {
                console.log(`${index + 1}. ${item.title}${item.detail ? ` - ${item.detail}` : ''}`);
            });
        }
        if (report.nextSteps.length) {
            console.log('建议下一步:');
            report.nextSteps.forEach((item, index) => {
                console.log(`${index + 1}. ${item}`);
            });
        }
        if (report.suggestedCommand) {
            console.log(`推荐命令: ${report.suggestedCommand}`);
        }
    }
}

if (require.main === module) {
    const report = runPreflightChecks(__dirname);
    printPreflightReport(report);
    if (!report.ok) {
        process.exitCode = 1;
    }
}

module.exports = {
    runPreflightChecks,
    printPreflightReport
};
