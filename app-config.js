(function () {
    const defaultConfig = {
        SUPABASE_URL: 'YOUR_SUPABASE_URL',
        SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY'
    };

    const existingConfig = window.APP_CONFIG || {};
    const runtimeConfig = window.__APP_CONFIG__ || {};
    let localConfig = {};

    try {
        const storedConfig = window.localStorage.getItem('sop_app_config');
        if (storedConfig) {
            localConfig = JSON.parse(storedConfig);
        }
    } catch (error) {
        console.warn('Local app config parse error:', error);
    }

    const resolvedConfig = {
        ...defaultConfig,
        ...existingConfig,
        ...runtimeConfig,
        ...localConfig
    };

    const configSources = [];
    if (Object.keys(existingConfig).length) configSources.push('window.APP_CONFIG');
    if (Object.keys(runtimeConfig).length) configSources.push('window.__APP_CONFIG__');
    if (Object.keys(localConfig).length) configSources.push('localStorage.sop_app_config');
    if (!configSources.length) configSources.push('defaults');

    window.APP_CONFIG = resolvedConfig;
    window.APP_CONFIG_META = {
        sources: configSources
    };
})();
