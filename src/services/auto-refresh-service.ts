import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type RefreshInterval = 'off' | '10s' | '30s' | '1m' | '5m';

interface AutoRefreshState {
    interval: RefreshInterval;
    isEnabled: boolean;
    setInterval: (interval: RefreshInterval) => void;
    toggleEnabled: () => void;
}

export const useAutoRefreshStore = create<AutoRefreshState>()(
    persist(
        (set) => ({
            interval: '1m',
            isEnabled: true,

            setInterval: (interval: RefreshInterval) => set({ 
                interval,
                isEnabled: interval !== 'off'
            }),

            toggleEnabled: () => set((state) => ({ 
                isEnabled: !state.isEnabled 
            })),
        }),
        {
            name: 'terminal-pro-auto-refresh',
        }
    )
);

// Convert interval string to milliseconds
export const getRefreshMs = (interval: RefreshInterval): number => {
    switch (interval) {
        case '10s': return 10000;
        case '30s': return 30000;
        case '1m': return 60000;
        case '5m': return 300000;
        case 'off': return 0;
        default: return 60000;
    }
};

// Hook to use auto-refresh in components
export const useAutoRefresh = (callback: () => void, enabled: boolean = true) => {
    const { interval, isEnabled } = useAutoRefreshStore();
    const ms = getRefreshMs(interval);

    if (!isEnabled || !enabled || ms === 0) {
        return null;
    }

    return setInterval(callback, ms);
};
