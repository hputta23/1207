interface AnalyticsCardProps {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
    color?: string;
    subtitle?: string;
}

export function AnalyticsCard({ label, value, trend, subtitle }: AnalyticsCardProps) {
    const getTrendIcon = () => {
        if (trend === 'up') return '↑';
        if (trend === 'down') return '↓';
        return '→';
    };

    const getTrendColor = () => {
        if (trend === 'up') return '#10b981';
        if (trend === 'down') return '#ef4444';
        return '#888';
    };

    return (
        <div
            style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                backdropFilter: 'blur(10px)',
            }}
        >
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {label}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <div style={{ fontSize: '28px', fontWeight: 700, color: '#fff' }}>
                    {value}
                </div>
                {trend && (
                    <div style={{ fontSize: '18px', color: getTrendColor() }}>
                        {getTrendIcon()}
                    </div>
                )}
            </div>
            {subtitle && (
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                    {subtitle}
                </div>
            )}
        </div>
    );
}
