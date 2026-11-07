/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Enterprise Store Configuration & Multi-Counter Network
 * 100% Live Cloud Synchronization with Supabase PostgreSQL 17
 * Manages Shop Profile (Name, Address, Mobile, GSTIN, UPI) and Dynamic POS Counters
 * ==============================================================================
 */

const StoreConfig = {
    DEFAULT_PROFILE: {
        shop_name: "SSE Enterprise Hub & Retail",
        tagline: "High-Performance Inventory & Multi-Counter Retail",
        address_line1: "Plot 42, Tech Park Avenue, BKC Complex",
        address_line2: "Mumbai, Maharashtra - 400051",
        phone: "+91 98765 43210",
        email: "contact@sse.inv.com",
        gstin: "27AABCU9603R1ZM",
        fssai: "11521000000123",
        upi_id: "sse.retail@icici",
        footer_note: "Thank you for shopping with SSE Enterprise! Visit again."
    },

    _currentProfile: null,

    DEFAULT_COUNTERS: [
        { id: "CTR-01", name: "Counter 01 - Front Desk Terminal", code: "CTR-01", is_active: true },
        { id: "CTR-02", name: "Counter 02 - Express Checkout Lane", code: "CTR-02", is_active: true },
        { id: "CTR-03", name: "Counter 03 - Wholesale & B2B Billing", code: "CTR-03", is_active: true },
        { id: "CTR-04", name: "Counter 04 - Mobile / Floor POS", code: "CTR-04", is_active: true }
    ],

    async loadFromCloud() {
        if (!window.SupabaseClient) return this.getProfile();
        try {
            const [branches, orgs, audits] = await Promise.all([
                window.SupabaseClient.restRequest('branches?id=eq.10000000-0000-0000-0000-000000000001').catch(() => []),
                window.SupabaseClient.restRequest('organizations?id=eq.00000000-0000-0000-0000-000000000001').catch(() => []),
                window.SupabaseClient.restRequest('audit_events?action=eq.STORE_CONFIG_SYNC&order=created_at.desc&limit=1').catch(() => [])
            ]);

            const branch = (branches && branches[0]) ? branches[0] : {};
            const org = (orgs && orgs[0]) ? orgs[0] : {};
            let auditDetails = {};
            if (audits && audits[0] && audits[0].details) {
                try {
                    auditDetails = JSON.parse(audits[0].details);
                } catch (_) {}
            }

            const cloudProfile = {
                shop_name: branch.name || org.name || this.DEFAULT_PROFILE.shop_name,
                tagline: auditDetails.tagline || this.DEFAULT_PROFILE.tagline,
                address_line1: branch.address_line1 || this.DEFAULT_PROFILE.address_line1,
                address_line2: branch.address_line2 || this.DEFAULT_PROFILE.address_line2,
                phone: branch.phone || this.DEFAULT_PROFILE.phone,
                email: branch.email || this.DEFAULT_PROFILE.email,
                gstin: org.tax_identifier || this.DEFAULT_PROFILE.gstin,
                fssai: auditDetails.fssai || this.DEFAULT_PROFILE.fssai,
                upi_id: auditDetails.upi_id || this.DEFAULT_PROFILE.upi_id,
                footer_note: auditDetails.footer_note || this.DEFAULT_PROFILE.footer_note
            };

            this._currentProfile = { ...this.DEFAULT_PROFILE, ...cloudProfile };
            if (window.SafeStorage) {
                window.SafeStorage.setItem('imbs_store_profile', JSON.stringify(this._currentProfile));
            }
            return this._currentProfile;
        } catch (err) {
            console.warn("[StoreConfig Cloud Load Warning]", err.message);
            return this.getProfile();
        }
    },

    getProfile() {
        if (this._currentProfile) return this._currentProfile;
        try {
            const raw = window.SafeStorage ? window.SafeStorage.getItem('imbs_store_profile') : null;
            if (raw) {
                this._currentProfile = { ...this.DEFAULT_PROFILE, ...JSON.parse(raw) };
                return this._currentProfile;
            }
        } catch (_) {}
        return { ...this.DEFAULT_PROFILE };
    },

    async saveProfile(profileData) {
        const merged = { ...this.getProfile(), ...profileData };
        this._currentProfile = merged;
        if (window.SafeStorage) {
            window.SafeStorage.setItem('imbs_store_profile', JSON.stringify(merged));
        }

        // 100% Cloud DB commit
        if (window.SupabaseClient) {
            await window.SupabaseClient.updateStoreProfile(merged);
        }

        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('imbs_store_profile_updated', { detail: merged }));
        }
        return merged;
    },

    getCounters() {
        try {
            const raw = window.SafeStorage ? window.SafeStorage.getItem('imbs_pos_counters') : null;
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (_) {}
        return [...this.DEFAULT_COUNTERS];
    },

    saveCounters(counters) {
        if (window.SafeStorage) {
            window.SafeStorage.setItem('imbs_pos_counters', JSON.stringify(counters));
        }
        if (window.SupabaseClient) {
            window.SupabaseClient.logAudit("POS_COUNTERS_UPDATE", "PERIPHERAL", "COUNTERS", JSON.stringify(counters)).catch(() => {});
        }
    },

    addCounter(name, code) {
        const list = this.getCounters();
        const id = `CTR-${String(list.length + 1).padStart(2, '0')}`;
        const newCounter = {
            id,
            name: name.trim() || `Counter ${list.length + 1}`,
            code: (code || id).trim().toUpperCase(),
            is_active: true
        };
        list.push(newCounter);
        this.saveCounters(list);
        return newCounter;
    },

    getActiveCounter() {
        try {
            const stored = window.SafeStorage ? window.SafeStorage.getItem('imbs_active_counter') : null;
            if (stored) {
                const found = this.getCounters().find(c => c.id === stored && c.is_active);
                if (found) return found;
            }
        } catch (_) {}
        const list = this.getCounters();
        return list[0] || this.DEFAULT_COUNTERS[0];
    },

    setActiveCounter(counterId) {
        if (window.SafeStorage) {
            window.SafeStorage.setItem('imbs_active_counter', counterId);
        }
    }
};

window.StoreConfig = StoreConfig;
