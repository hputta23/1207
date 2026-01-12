import React from 'react';
import { useThemeStore } from '../../services/theme-service';

export function ThemeToggle() {
    const { theme, toggleTheme } = useThemeStore();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: isDark 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)'
                    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                border: 'none',
                boxShadow: isDark
                    ? '0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                    : '0 4px 12px rgba(245, 158, 11, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                zIndex: 1000,
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1) rotate(180deg)';
                e.currentTarget.style.boxShadow = isDark
                    ? '0 8px 24px rgba(59, 130, 246, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.2)'
                    : '0 8px 24px rgba(245, 158, 11, 0.6), 0 0 0 1px rgba(0, 0, 0, 0.2)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                e.currentTarget.style.boxShadow = isDark
                    ? '0 4px 12px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                    : '0 4px 12px rgba(245, 158, 11, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)';
            }}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {isDark ? '☀️' : '🌙'}
        </button>
    );
}
