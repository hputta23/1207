import React, { useMemo } from 'react';
import { useTradingStore } from '../../services/trading-service';
import { useUserProfileStore } from '../../services/user-profile-service';

export const PnLMetrics: React.FC<{ quotes: Record<string, any> }> = ({ quotes }) => {
    const { holdings, portfolioHistory, realizedPnL } = useTradingStore();
    const { profile } = useUserProfileStore();

    const metrics = useMemo(() => {
        // 1. Calculate Unrealized P&L
        let holdingsValue = 0;
        let totalCostBasis = 0;

        Object.values(holdings).forEach(h => {
            const price = quotes[h.symbol]?.price || h.averageCost;
            holdingsValue += h.quantity * price;
            totalCostBasis += h.quantity * h.averageCost;
        });

        const unrealizedPnL = holdingsValue - totalCostBasis;
        const totalPnL = realizedPnL + unrealizedPnL;
        const currentValue = profile.balance + holdingsValue;

        // Buying Power is just the cash balance
        const buyingPower = profile.balance;

        return {
            totalValue: currentValue,
            buyingPower,
            realizedPnL,
            unrealizedPnL,
            totalPnL,
            holdingsValue
        };
    }, [holdings, profile.balance, quotes, realizedPnL]);

    const MetricCard = ({ label, value, subValue, isCurrency = true, colorOverride }: any) => {
        const isPositive = value >= 0;
        const color = colorOverride || (value >= 0 ? '#22c55e' : '#ef4444');
        const displayValue = isCurrency
            ? `$${Math.abs(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : value;

        return (
            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                flex: 1,
                minWidth: '140px'
            }}>
                <span style={{ fontSize: '12px', color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {label}
                </span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 700, color: isCurrency ? color : '#fff' }}>
                        {isCurrency && value < 0 ? '-' : ''}{displayValue}
                    </span>
                    {subValue && (
                        <span style={{ fontSize: '12px', color: '#666' }}>{subValue}</span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <MetricCard
                    label="Account Value"
                    value={metrics.totalValue}
                    colorOverride="#fff"
                />
                <MetricCard
                    label="Buying Power"
                    value={metrics.buyingPower}
                    colorOverride="#3b82f6"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <MetricCard
                    label="Day's Rlz. P&L"
                    value={metrics.realizedPnL}
                />
                <MetricCard
                    label="Unrealized P&L"
                    value={metrics.unrealizedPnL}
                />
            </div>

            <div style={{
                padding: '12px',
                background: metrics.totalPnL >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: `1px solid ${metrics.totalPnL >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: metrics.totalPnL >= 0 ? '#22c55e' : '#ef4444' }}>
                    Total Profit/Loss
                </span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: metrics.totalPnL >= 0 ? '#22c55e' : '#ef4444' }}>
                    {metrics.totalPnL >= 0 ? '+' : ''}${metrics.totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
            </div>
        </div>
    );
};
