import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useTradingStore } from '../../services/trading-service';
import { useUserProfileStore } from '../../services/user-profile-service';

export const PortfolioChart: React.FC = () => {
    const { portfolioHistory } = useTradingStore();
    const { profile } = useUserProfileStore();

    // Create data for chart
    const data = useMemo(() => {
        if (portfolioHistory.length === 0) {
            // Default flat line if no history
            return [
                { time: Date.now() - 86400000, value: profile.balance },
                { time: Date.now(), value: profile.balance }
            ];
        }
        return portfolioHistory.map(p => ({
            time: p.timestamp,
            value: p.value
        }));
    }, [portfolioHistory, profile.balance]);

    const isPositive = data.length > 1 ? data[data.length - 1].value >= data[0].value : true;
    const color = isPositive ? '#22c55e' : '#ef4444';

    return (
        <div style={{ height: '300px', width: '100%', background: '#1a1a2e', borderRadius: '12px', padding: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#888', fontWeight: 600 }}>PORTFOLIO PERFORMANCE</h3>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis
                        dataKey="time"
                        hide={true}
                        domain={['auto', 'auto']}
                        type="number"
                    />
                    <YAxis
                        hide={false}
                        domain={['auto', 'auto']}
                        orientation="right"
                        tick={{ fill: '#666', fontSize: 10 }}
                        tickFormatter={(val) => `$${val.toLocaleString()}`}
                        axisLine={false}
                        tickLine={false}
                    />
                    <Tooltip
                        contentStyle={{ background: '#0f172a', border: '1px solid #333', borderRadius: '4px' }}
                        labelFormatter={(label) => new Date(label).toLocaleTimeString()}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'Value']}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        fillOpacity={1}
                        fill="url(#colorValue)"
                        strokeWidth={2}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
