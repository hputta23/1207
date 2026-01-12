import React, { useState } from 'react';
import { useAutoRefreshStore, type RefreshInterval } from '../../services/auto-refresh-service';

export function AutoRefreshControl() {
    const { interval, isEnabled, setInterval, toggleEnabled } = useAutoRefreshStore();
    const [isOpen, setIsOpen] = useState(false);

    const intervals: { value: RefreshInterval; label: string }[] = [
        { value: 'off', label: 'Off' },
        { value: '10s', label: '10 seconds' },
        { value: '30s', label: '30 seconds' },
        { value: '1m', label: '1 minute' },
        { value: '5m', label: '5 minutes' },
    ];

    const currentLabel = intervals.find(i => i.value === interval)?.label || '1 minute';

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    background: isEnabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: isEnabled ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: isEnabled ? '#22c55e' : '#ef4444',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = isEnabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = isEnabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
                }}
            >
                <span>{isEnabled ? '🔄' : '⏸️'}</span>
                <span>Auto-Refresh: {currentLabel}</span>
                <span style={{ fontSize: '10px' }}>{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        right: 0,
                        marginTop: '8px',
                        background: 'rgba(20, 20, 20, 0.98)',
                        backdropFilter: 'blur(12px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '12px',
                        minWidth: '200px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                        zIndex: 1000,
                    }}
                >
                    <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                            Refresh Interval
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {intervals.map((item) => (
                                <button
                                    key={item.value}
                                    onClick={() => {
                                        setInterval(item.value);
                                        if (item.value !== 'off') {
                                            setIsOpen(false);
                                        }
                                    }}
                                    style={{
                                        padding: '8px 12px',
                                        background: interval === item.value ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                        border: '1px solid ' + (interval === item.value ? 'rgba(59, 130, 246, 0.3)' : 'transparent'),
                                        borderRadius: '6px',
                                        color: interval === item.value ? '#3b82f6' : '#888',
                                        fontSize: '12px',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (interval !== item.value) {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                            e.currentTarget.style.color = '#fff';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (interval !== item.value) {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.color = '#888';
                                        }
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => {
                            toggleEnabled();
                            setIsOpen(false);
                        }}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            background: isEnabled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid ' + (isEnabled ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'),
                            borderRadius: '6px',
                            color: isEnabled ? '#ef4444' : '#22c55e',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = isEnabled ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = isEnabled ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)';
                        }}
                    >
                        {isEnabled ? '⏸️ Pause Auto-Refresh' : '▶️ Resume Auto-Refresh'}
                    </button>
                </div>
            )}
        </div>
    );
}
