const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { runPreflightChecks, printPreflightReport } = require('./preflight-check');

const rootDir = __dirname;
const runtimeConfigScript = path.join(rootDir, 'generate-runtime-config.js');
const manifestPath = path.join(rootDir, 'release-manifest.json');
const releaseHistoryDir = path.join(rootDir, 'release-history');

function runNodeScript(scriptPath, envOverrides) {
    return spawnSync(process.execPath, [scriptPath], {
        cwd: rootDir,
        env: { ...process.env, ...envOverrides },
        encoding: 'utf8'
    });
}

function writeManifest(payload) {
    fs.writeFileSync(manifestPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    fs.mkdirSync(releaseHistoryDir, { recursive: true });
    const timestamp = payload.generated_at.replace(/[:]/g, '-');
    const historyPath = path.join(releaseHistoryDir, `${timestamp}-${payload.release_target}.json`);
    fs.writeFileSync(historyPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    return historyPath;
}

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const releaseTarget = process.env.RELEASE_TARGET || 'production';

console.log('新人入职 SOP 管理系统 - 发布准备');
console.log(`目标环境: ${releaseTarget}`);

if (supabaseUrl && supabaseAnonKey) {
    console.log('检测到环境变量，正在生成 runtime-config.js ...');
    const runtimeResult = runNodeScript(runtimeConfigScript, {
        SUPABASE_URL: supabaseUrl,
        SUPABASE_ANON_KEY: supabaseAnonKey
    });
    process.stdout.write(runtimeResult.stdout || '');
    process.stderr.write(runtimeResult.stderr || '');
    if (runtimeResult.status !== 0) {
        console.error('运行时配置生成失败，已中止发布准备。');
        process.exit(runtimeResult.status || 1);
    }
} else {
    console.log('未提供 SUPABASE_URL / SUPABASE_ANON_KEY，将直接执行预检。');
}

console.log('正在执行上线前预检 ...');
const preflightReport = runPreflightChecks(rootDir);
printPreflightReport(preflightReport);

const manifest = {
    generated_at: new Date().toISOString(),
    release_target: releaseTarget,
    used_runtime_env: Boolean(supabaseUrl && supabaseAnonKey),
    preflight_passed: preflightReport.ok,
    runtime_config_generated: Boolean(supabaseUrl && supabaseAnonKey),
    blockers: preflightReport.blockers,
    next_steps: preflightReport.nextSteps,
    suggested_command: preflightReport.suggestedCommand,
    failed_checks: preflightReport.failedChecks.map((item) => ({
        title: item.title,
        detail: item.detail
    })),
    checks: preflightReport.results
};

const historyPath = writeManifest(manifest);
console.log(`已生成发布清单: ${manifestPath}`);
console.log(`已归档发布记录: ${historyPath}`);
if (manifest.blockers.length) {
    console.log('当前关键阻塞项:');
    manifest.blockers.forEach((item, index) => {
        console.log(`${index + 1}. ${item.title}${item.detail ? ` - ${item.detail}` : ''}`);
    });
}
if (manifest.next_steps.length) {
    console.log('建议下一步:');
    manifest.next_steps.forEach((item, index) => {
        console.log(`${index + 1}. ${item}`);
    });
}
if (manifest.suggested_command) {
    console.log(`推荐命令: ${manifest.suggested_command}`);
}

if (!preflightReport.ok) {
    console.error('预检未通过，暂不建议继续上线。');
    process.exit(1);
}

console.log('发布准备完成，可以继续进行静态部署。');
