/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Supabase Direct Browser Client
 * Enables direct client-to-database communication with Supabase PostgREST
 * ==============================================================================
 */

const SupabaseClient = {
    getUrl() {
        return localStorage.getItem('imbs_supabase_url') || (window.ENV && window.ENV.SUPABASE_URL) || '';
    },

    getKey() {
        return localStorage.getItem('imbs_supabase_anon_key') || (window.ENV && window.ENV.SUPABASE_ANON_KEY) || '';
    },

    isConfigured() {
        const u = this.getUrl();
        const k = this.getKey();
        return Boolean(u && k && u.startsWith('https://') && k.length > 20);
    },

    saveConfig(url, anonKey) {
        if (!url || !anonKey) {
            localStorage.removeItem('imbs_supabase_url');
            localStorage.removeItem('imbs_supabase_anon_key');
            return false;
        }
        localStorage.setItem('imbs_supabase_url', url.trim());
        localStorage.setItem('imbs_supabase_anon_key', anonKey.trim());
        return true;
    },

    async testConnection(testUrl, testKey) {
        const url = (testUrl || this.getUrl()).replace(/\/$/, '');
        const key = testKey || this.getKey();

        if (!url || !key) {
            throw new Error("Supabase URL and Anon Key are required.");
        }

        const endpoint = `${url}/rest/v1/products?select=id,sku,name&limit=1`;
        const resp = await fetch(endpoint, {
            method: 'GET',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            }
        });

        if (!resp.ok) {
            const txt = await resp.text();
            throw new Error(`Supabase returned HTTP ${resp.status}: ${txt}`);
        }

        const data = await resp.json();
        return { success: true, count: data.length, sample: data[0] };
    },

    async query(table, params = {}) {
        if (!this.isConfigured()) return null;

        const url = this.getUrl().replace(/\/$/, '');
        const key = this.getKey();

        const queryParams = new URLSearchParams(params).toString();
        const endpoint = `${url}/rest/v1/${table}${queryParams ? '?' + queryParams : ''}`;

        const resp = await fetch(endpoint, {
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json'
            }
        });

        if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`[Supabase Query Error] ${err}`);
        }

        return await resp.json();
    },

    async insert(table, records) {
        if (!this.isConfigured()) return null;

        const url = this.getUrl().replace(/\/$/, '');
        const key = this.getKey();
        const endpoint = `${url}/rest/v1/${table}`;

        const resp = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(records)
        });

        if (!resp.ok) {
            const err = await resp.text();
            throw new Error(`[Supabase Insert Error] ${err}`);
        }

        return await resp.json();
    }
};

window.SupabaseClient = SupabaseClient;

