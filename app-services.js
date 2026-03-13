(function () {
    function getConfig(config) {
        return config || window.APP_CONFIG || {};
    }

    function isSupabaseReady(config) {
        const resolvedConfig = getConfig(config);
        return Boolean(
            resolvedConfig.SUPABASE_URL &&
            resolvedConfig.SUPABASE_ANON_KEY &&
            resolvedConfig.SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
            resolvedConfig.SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY'
        );
    }

    function createSupabaseClient(config, supabaseLib) {
        const resolvedConfig = getConfig(config);
        const clientFactory = supabaseLib && typeof supabaseLib.createClient === 'function'
            ? supabaseLib
            : window.supabase;

        if (!clientFactory || typeof clientFactory.createClient !== 'function') {
            throw new Error('Supabase client library is not available.');
        }

        return clientFactory.createClient(
            resolvedConfig.SUPABASE_URL || 'https://placeholder.supabase.co',
            resolvedConfig.SUPABASE_ANON_KEY || 'placeholder-anon-key'
        );
    }

    const AuthService = {
        async getSession(client) {
            const { data, error } = await client.auth.getSession();
            if (error) {
                throw error;
            }
            return data.session;
        },

        onAuthStateChange(client, handler) {
            return client.auth.onAuthStateChange(handler);
        },

        async fetchProfile(client, authId) {
            if (!authId) {
                return null;
            }

            const { data, error } = await client
                .from('users')
                .select('*')
                .eq('auth_id', authId)
                .single();

            if (error) {
                throw error;
            }

            return data;
        },

        async login(client, credentials) {
            const { data, error } = await client.auth.signInWithPassword(credentials);
            if (error) {
                throw error;
            }
            return data.user;
        },

        async registerAuth(client, credentials) {
            const { data, error } = await client.auth.signUp(credentials);
            if (error) {
                throw error;
            }
            return data.user;
        },

        async createUserProfile(client, profile) {
            const { error } = await client
                .from('users')
                .insert([profile]);

            if (error) {
                throw error;
            }
        },

        async logout(client) {
            const { error } = await client.auth.signOut();
            if (error) {
                throw error;
            }
        }
    };

    function applyFilters(query, filters) {
        return (filters || []).reduce((currentQuery, filter) => {
            if (!filter || !filter.type) {
                return currentQuery;
            }

            if (filter.type === 'eq') {
                return currentQuery.eq(filter.column, filter.value);
            }

            if (filter.type === 'in') {
                return currentQuery.in(filter.column, filter.value);
            }

            if (filter.type === 'gte') {
                return currentQuery.gte(filter.column, filter.value);
            }

            if (filter.type === 'lte') {
                return currentQuery.lte(filter.column, filter.value);
            }

            if (filter.type === 'order') {
                return currentQuery.order(filter.column, { ascending: filter.ascending !== false });
            }

            if (filter.type === 'limit') {
                return currentQuery.limit(filter.value);
            }

            return currentQuery;
        }, query);
    }

    const DatabaseService = {
        async list(client, table, options) {
            const resolvedOptions = options || {};
            let query = client.from(table).select(resolvedOptions.select || '*');
            query = applyFilters(query, resolvedOptions.filters);

            const { data, error } = await query;
            if (error) {
                throw error;
            }

            return data || [];
        },

        async count(client, table, options) {
            const resolvedOptions = options || {};
            let query = client.from(table).select('*', { count: 'exact', head: true });
            query = applyFilters(query, resolvedOptions.filters);

            const { count, error } = await query;
            if (error) {
                throw error;
            }

            return count || 0;
        },

        async upsert(client, table, rows, options) {
            const resolvedOptions = options || {};
            const { data, error } = await client
                .from(table)
                .upsert(rows, resolvedOptions.upsertOptions || {})
                .select(resolvedOptions.select || '*');

            if (error) {
                throw error;
            }

            return data || [];
        },

        async insert(client, table, rows, options) {
            const resolvedOptions = options || {};
            const { data, error } = await client
                .from(table)
                .insert(rows)
                .select(resolvedOptions.select || '*');

            if (error) {
                throw error;
            }

            return data || [];
        }
    };

    window.AppServices = {
        isSupabaseReady,
        createSupabaseClient,
        AuthService,
        DatabaseService
    };
})();
