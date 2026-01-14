import React from 'react';

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '1d';

interface ChartControlsProps {
    symbol: string;
    interval: Timeframe;
    indicators: {
        sma: boolean;
        ema: boolean;
        volume: boolean;
    };
    onIntervalChange: (interval: Timeframe) => void;
    onIndicatorToggle: (indicator: 'sma' | 'ema' | 'volume') => void;
}

export const ChartControls: React.FC<ChartControlsProps> = ({
    symbol,
    interval,
    indicators,
    onIntervalChange,
    onIndicatorToggle
}) => {
    const timeframes: Timeframe[] = ['1m', '5m', '15m', '1h', '1d'];

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(0,0,0,0.2)',
            flexWrap: 'wrap',
            gap: '12px'
        }}>
            {/* Left: Symbol & Timeframes */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: '18px', color: '#fff' }}>
                    {symbol}
                </div>

                <div style={{ display: 'flex', background: '#1a1a2e', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                    {timeframes.map(tf => (
                        <button
                            key={tf}
                            onClick={() => onIntervalChange(tf)}
                            style={{
                                border: 'none',
                                background: interval === tf ? '#3b82f6' : 'transparent',
                                color: interval === tf ? '#fff' : '#888',
                                padding: '4px 12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {tf.toUpperCase()}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right: Indicators */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '12px', color: '#666', fontWeight: 600 }}>INDICATORS:</span>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#ccc' }}>
                    <input
                        type="checkbox"
                        checked={indicators.volume}
                        onChange={() => onIndicatorToggle('volume')}
                    />
                    Volume
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#ccc' }}>
                    <input
                        type="checkbox"
                        checked={indicators.sma}
                        onChange={() => onIndicatorToggle('sma')}
                    />
                    SMA
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', color: '#ccc' }}>
                    <input
                        type="checkbox"
                        checked={indicators.ema}
                        onChange={() => onIndicatorToggle('ema')}
                    />
                    EMA
                </label>
            </div>
        </div>
    );
};
