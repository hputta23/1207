import React, { useState, useEffect } from 'react';
import { useAlertsStore, showAlertNotification } from '../../services/alerts-service';

export function AlertsBadge() {
    const { alerts, clearTriggered } = useAlertsStore();
    const [isOpen, setIsOpen] = useState(false);
    const [prevTriggeredCount, setPrevTriggeredCount] = useState(0);

    const triggeredAlerts = alerts.filter(a => a.status === 'triggered');
    const triggeredCount = triggeredAlerts.length;

    useEffect(() => {
        if (triggeredCount > prevTriggeredCount) {
            const newAlerts = triggeredAlerts.slice(prevTriggeredCount);
            newAlerts.forEach(alert => showAlertNotification(alert));
        }
        setPrevTriggeredCount(triggeredCount);
    }, [triggeredCount]);

    if (triggeredCount === 0) return null;

    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'relative',
                    padding: '8px 14px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    fontSize: '13px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                }}
            >
                🔔 Alerts
                <span style={{
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontWeight: 600,
                }}>
                    {triggeredCount}
                </span>
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '320px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    background: 'rgba(20, 20, 20, 0.98)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    zIndex: 1000,
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '12px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                    }}>
                        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                            Triggered Alerts
                        </h3>
                        <button
                            onClick={() => {
                                clearTriggered();
                                setIsOpen(false);
                            }}
                            style={{
                                padding: '4px 8px',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                borderRadius: '4px',
                                color: '#ef4444',
                                fontSize: '11px',
                                cursor: 'pointer',
                            }}
                        >
                            Clear All
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {triggeredAlerts.map((alert) => (
                            <div
                                key={alert.id}
                                style={{
                                    padding: '12px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '8px',
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'start',
                                    marginBottom: '6px',
                                }}>
                                    <div style={{
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#ef4444',
                                    }}>
                                        {alert.symbol}
                                    </div>
                                    <div style={{
                                        fontSize: '10px',
                                        color: '#888',
                                    }}>
                                        {alert.triggeredAt && new Date(alert.triggeredAt).toLocaleTimeString()}
                                    </div>
                                </div>

                                <div style={{ fontSize: '12px', color: '#fff', marginBottom: '4px' }}>
                                    {alert.type === 'above' && 'Price went above $' + alert.targetPrice?.toFixed(2)}
                                    {alert.type === 'below' && 'Price went below $' + alert.targetPrice?.toFixed(2)}
                                    {alert.type === 'percent_change' && 'Price changed by ' + alert.percentChange + '%'}
                                </div>

                                {alert.note && (
                                    <div style={{ fontSize: '11px', color: '#888', fontStyle: 'italic' }}>
                                        {alert.note}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
