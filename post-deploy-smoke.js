const { URL } = require('url');

async function fetchText(url) {
    const response = await fetch(url, {
        redirect: 'follow',
        headers: {
            'Cache-Control': 'no-cache'
        }
    });

    const text = await response.text();
    return {
        ok: response.ok,
        status: response.status,
        url: response.url,
        text
    };
}

function printResult(ok, title, detail) {
    const prefix = ok ? '[PASS]' : '[FAIL]';
    console.log(`${prefix} ${title}${detail ? `: ${detail}` : ''}`);
}

async function run() {
    const siteUrl = (process.argv[2] || '').trim();
    if (!siteUrl) {
        console.error('用法: node post-deploy-smoke.js <站点地址>');
        process.exit(1);
    }

    let baseUrl;
    try {
        baseUrl = new URL(siteUrl);
    } catch (error) {
        console.error(`无效地址: ${siteUrl}`);
        process.exit(1);
    }

    const homeUrl = baseUrl.toString().replace(/\/$/, '') + '/';
    const runtimeUrl = new URL('/runtime-config.js', baseUrl).toString();

    console.log('新人入职 SOP 管理系统 - 上线后烟雾检查');
    console.log(`站点地址: ${homeUrl}`);
    console.log('');

    const results = [];

    try {
        const home = await fetchText(homeUrl);
        results.push({
            ok: home.ok,
            title: '首页可访问',
            detail: `${home.status} ${home.url}`
        });
        results.push({
            ok: /runtime-config\.js/.test(home.text),
            title: '首页已引用 runtime-config.js',
            detail: '首页缺少 runtime-config.js 引用'
        });
    } catch (error) {
        results.push({
            ok: false,
            title: '首页可访问',
            detail: error.message || '首页请求失败'
        });
    }

    try {
        const runtime = await fetchText(runtimeUrl);
        const hasUrl = /SUPABASE_URL/.test(runtime.text) && runtime.text.includes('https://');
        const hasAnon = /SUPABASE_ANON_KEY/.test(runtime.text) && runtime.text.includes('sb_publishable_');
        const notPlaceholder = !runtime.text.includes('your-project.supabase.co') && !runtime.text.includes('your-public-anon-key');

        results.push({
            ok: runtime.ok,
            title: 'runtime-config.js 可访问',
            detail: `${runtime.status} ${runtime.url}`
        });
        results.push({
            ok: hasUrl && hasAnon && notPlaceholder,
            title: 'runtime-config.js 已注入真实配置',
            detail: 'runtime-config.js 仍像占位内容或缺少关键字段'
        });
    } catch (error) {
        results.push({
            ok: false,
            title: 'runtime-config.js 可访问',
            detail: error.message || 'runtime-config.js 请求失败'
        });
    }

    results.forEach((item) => printResult(item.ok, item.title, item.detail));
    console.log('[INFO] 保护模式属于前端运行态，静态抓取首页 HTML 无法准确判断当前是否真实落入保护页。请结合 runtime-config.js 检查和浏览器实际访问确认。');

    const failed = results.filter((item) => !item.ok);
    console.log('');
    if (failed.length) {
        console.log('烟雾检查结果: 存在待处理项，建议先修复后再开放员工使用。');
        process.exit(1);
    }

    console.log('烟雾检查结果: 站点已通过基础上线检查，可以继续做角色联调。');
}

run().catch((error) => {
    console.error(error.message || error);
    process.exit(1);
});
