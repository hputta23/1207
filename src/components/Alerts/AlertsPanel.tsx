import React, { useState } from 'react';
import { useAlertsStore, type AlertType, requestNotificationPermission } from '../../services/alerts-service';

interface AlertsPanelProps {
    symbol: string;
    currentPrice: number;
}

export function AlertsPanel({ symbol, currentPrice }: AlertsPanelProps) {
    const { alerts, addAlert, removeAlert } = useAlertsStore();
    const [isOpen, setIsOpen] = useState(false);
    const [alertType, setAlertType] = useState<AlertType>('above');
    const [targetPrice, setTargetPrice] = useState('');
    const [percentChange, setPercentChange] = useState('');
    const [note, setNote] = useState('');

    const symbolAlerts = alerts.filter(a => a.symbol === symbol && a.status === 'active');

    const handleAddAlert = async () => {
        await requestNotificationPermission();

        if (alertType === 'percent_change') {
            const percent = parseFloat(percentChange);
            if (!isNaN(percent) && percent !== 0) {
                addAlert({
                    symbol,
                    type: 'percent_change',
                    percentChange: percent,
                    currentPrice,
                    note,
                });
                setPercentChange('');
                setNote('');
            }
        } else {
            const price = parseFloat(targetPrice);
            if (!isNaN(price) && price > 0) {
                addAlert({
                    symbol,
                    type: alertType,
                    targetPrice: price,
                    currentPrice,
                    note,
                });
                setTargetPrice('');
                setNote('');
            }
        }
    };

    return (
        <div style={{ marginTop: '24px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
            }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                    Price Alerts {symbolAlerts.length > 0 && `(${symbolAlerts.length})`}
                </h3>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        padding: '6px 12px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '6px',
                        color: '#3b82f6',
                        fontSize: '12px',
                        fontWeight: 500,
                        cursor: 'pointer',
                    }}
                >
                    {isOpen ? '- Close' : '+ Add Alert'}
                </button>
            </div>

            {isOpen && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '16px',
                }}>
                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                            Alert Type
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {(['above', 'below', 'percent_change'] as AlertType[]).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setAlertType(type)}
                                    style={{
                                        flex: 1,
                                        padding: '8px',
                                        background: alertType === type ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                                        border: alertType === type ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '6px',
                                        color: alertType === type ? '#3b82f6' : '#888',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    {type === 'percent_change' ? '% Change' : type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {alertType === 'percent_change' ? (
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                                Percent Change (%)
                            </label>
                            <input
                                type="number"
                                value={percentChange}
                                onChange={(e) => setPercentChange(e.target.value)}
                                placeholder="e.g., 5 or -5"
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    fontSize: '13px',
                                }}
                            />
                        </div>
                    ) : (
                        <div style={{ marginBottom: '12px' }}>
                            <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                                Target Price ($)
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={targetPrice}
                                onChange={(e) => setTargetPrice(e.target.value)}
                                placeholder={'Current: $' + currentPrice.toFixed(2)}
                                style={{
                                    width: '100%',
                                    padding: '8px 12px',
                                    background: 'rgba(0, 0, 0, 0.2)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    fontSize: '13px',
                                }}
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '12px' }}>
                        <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '6px' }}>
                            Note (optional)
                        </label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Resistance level, support, etc."
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                background: 'rgba(0, 0, 0, 0.2)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '6px',
                                color: '#fff',
                                fontSize: '13px',
                            }}
                        />
                    </div>

                    <button
                        onClick={handleAddAlert}
                        style={{
                            width: '100%',
                            padding: '10px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Create Alert
                    </button>
                </div>
            )}

            {symbolAlerts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {symbolAlerts.map((alert) => (
                        <div
                            key={alert.id}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px',
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                            }}
                        >
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                                    {alert.type === 'above' && '▲ Above $' + alert.targetPrice?.toFixed(2)}
                                    {alert.type === 'below' && '▼ Below $' + alert.targetPrice?.toFixed(2)}
                                    {alert.type === 'percent_change' && (alert.percentChange || 0) > 0 ? '+' : ''}
                                    {alert.type === 'percent_change' && alert.percentChange + '% Change'}
                                </div>
                                {alert.note && (
                                    <div style={{ fontSize: '11px', color: '#888' }}>
                                        {alert.note}
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={() => removeAlert(alert.id)}
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
                                Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
