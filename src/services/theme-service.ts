import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ThemeMode = 'dark' | 'light';

interface ThemeState {
    theme: ThemeMode;
    toggleTheme: () => void;
    setTheme: (theme: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set) => ({
            theme: 'dark',

            toggleTheme: () => set((state) => ({
                theme: state.theme === 'dark' ? 'light' : 'dark'
            })),

            setTheme: (theme: ThemeMode) => set({ theme }),
        }),
        {
            name: 'terminal-pro-theme',
        }
    )
);

// Theme colors
export const themes = {
    dark: {
        background: '#0a0a0a',
        surface: 'rgba(30, 30, 30, 0.6)',
        surfaceHover: 'rgba(255, 255, 255, 0.06)',
        border: 'rgba(255, 255, 255, 0.1)',
        borderHover: 'rgba(59, 130, 246, 0.3)',
        text: '#ffffff',
        textSecondary: '#888888',
        textTertiary: '#666666',
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        cardBg: 'rgba(255, 255, 255, 0.03)',
    },
    light: {
        background: '#ffffff',
        surface: 'rgba(255, 255, 255, 0.9)',
        surfaceHover: 'rgba(59, 130, 246, 0.05)',
        border: 'rgba(0, 0, 0, 0.1)',
        borderHover: 'rgba(59, 130, 246, 0.3)',
        text: '#1a1a1a',
        textSecondary: '#666666',
        textTertiary: '#999999',
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        cardBg: 'rgba(0, 0, 0, 0.02)',
    },
};

export const getThemeColors = (theme: ThemeMode) => themes[theme];
