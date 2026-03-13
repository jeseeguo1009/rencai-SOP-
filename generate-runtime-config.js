const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const runtimeConfigPath = path.join(rootDir, 'runtime-config.js');
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('缺少环境变量: SUPABASE_URL 或 SUPABASE_ANON_KEY');
    process.exit(1);
}

const content = `window.__APP_CONFIG__ = {
    SUPABASE_URL: ${JSON.stringify(supabaseUrl)},
    SUPABASE_ANON_KEY: ${JSON.stringify(supabaseAnonKey)}
};
`;

fs.writeFileSync(runtimeConfigPath, content, 'utf8');
console.log(`已生成运行时配置: ${runtimeConfigPath}`);
