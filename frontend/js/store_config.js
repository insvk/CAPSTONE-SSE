/**
 * ==============================================================================
 * CSA0201-B-CAPSTONE-IMBS :: Enterprise Store Configuration & Multi-Counter Network
 * Manages Shop Profile (Name, Address, Mobile, GSTIN) and Dynamic POS Counters
 * Synchronized with Supabase & Client SafeStorage
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
        footer_note: "Thank you for shopping with SSE Enterprise! Visit again."
    },

    DEFAULT_COUNTERS: [
        { id: "CTR-01", name: "Counter 01 - Front Desk Terminal", code: "CTR-01", is_active: true },
        { id: "CTR-02", name: "Counter 02 - Express Checkout Lane", code: "CTR-02", is_active: true },
        { id: "CTR-03", name: "Counter 03 - Wholesale & B2B Billing", code: "CTR-03", is_active: true },
        { id: "CTR-04", name: "Counter 04 - Mobile / Floor POS", code: "CTR-04", is_active: true }
    ],

    getProfile() {
        try {
            const raw = window.SafeStorage ? window.SafeStorage.getItem('imbs_store_profile') : null;
            if (raw) return { ...this.DEFAULT_PROFILE, ...JSON.parse(raw) };
        } catch (_) {}
        return { ...this.DEFAULT_PROFILE };
    },

    saveProfile(profileData) {
        const merged = { ...this.getProfile(), ...profileData };
        if (window.SafeStorage) {
            window.SafeStorage.setItem('imbs_store_profile', JSON.stringify(merged));
        }

        // Also update Supabase organization / branch if reachable
        if (window.SupabaseClient) {
            window.SupabaseClient.updateStoreProfile(merged).catch(err => {
                console.warn("[Store Profile Sync Warning]", err.message);
            });
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
