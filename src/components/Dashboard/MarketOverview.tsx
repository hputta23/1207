import { useState, useEffect } from 'react';
import { marketOverviewService, type IndexData, type MarketStatus } from '../../services/market-overview-service';

export function MarketOverview() {
    const [indices, setIndices] = useState<IndexData[]>([]);
    const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
    const [scrollDirection, setScrollDirection] = useState<'left' | 'right'>('right');

    useEffect(() => {
        const fetchData = async () => {
            const data = await marketOverviewService.fetchAllIndices();
            setIndices(data);
            setMarketStatus(marketOverviewService.getMarketStatus());
        };

        fetchData();

        // Update every 30 seconds (no loading state - just silent updates)
        const interval = setInterval(fetchData, 30000);

        return () => clearInterval(interval);
    }, []);

    // Duplicate indices for seamless infinite scroll
    const scrollingIndices = [...indices, ...indices, ...indices];

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '16px',
            padding: '20px 0',
            marginBottom: '32px',
            overflow: 'hidden',
            position: 'relative',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0 24px 16px 24px',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                marginBottom: '16px',
            }}>
                <div>
                    <h2 style={{
                        margin: '0 0 4px 0',
                        fontSize: 'clamp(16px, 4vw, 18px)',
                        fontWeight: 600,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        📊 Market Overview
                    </h2>
                    <p style={{ margin: 0, fontSize: '11px', color: '#888' }}>
                        Live market indices • Updates every 30 seconds
                    </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {/* Direction Toggle Button */}
                    <button
                        onClick={() => setScrollDirection(prev => prev === 'left' ? 'right' : 'left')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: 'rgba(59, 130, 246, 0.15)',
                            border: '1px solid rgba(59, 130, 246, 0.3)',
                            borderRadius: '6px',
                            color: '#3b82f6',
                            fontSize: '11px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.25)';
                            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                        }}
                    >
                        {scrollDirection === 'left' ? '← Scroll' : 'Scroll →'}
                    </button>

                    {marketStatus && (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            background: marketStatus.isOpen
                                ? 'rgba(34, 197, 94, 0.15)'
                                : 'rgba(239, 68, 68, 0.15)',
                            border: `1px solid ${marketStatus.isOpen ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            borderRadius: '6px',
                        }}>
                            <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: marketStatus.isOpen ? '#22c55e' : '#ef4444',
                                boxShadow: marketStatus.isOpen ? '0 0 8px #22c55e' : 'none',
                            }} />
                            <span className="market-status-text" style={{
                                fontSize: '11px',
                                fontWeight: 600,
                                color: marketStatus.isOpen ? '#22c55e' : '#ef4444',
                            }}>
                                {marketStatus.statusText}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Scrolling Ticker */}
            <div style={{
                position: 'relative',
                overflow: 'hidden',
                height: '80px',
            }}>
                {indices.length > 0 ? (
                    <div
                        style={{
                            display: 'flex',
                            gap: 'clamp(12px, 3vw, 20px)',
                            animation: scrollDirection === 'left'
                                ? 'scroll-left 40s linear infinite'
                                : 'scroll-right 40s linear infinite',
                            paddingLeft: scrollDirection === 'left' ? '100%' : '0',
                            paddingRight: scrollDirection === 'right' ? '100%' : '0',
                        }}
                    >
                        {scrollingIndices.map((index, idx) => {
                            const isPositive = index.change >= 0;
                            const changeColor = isPositive ? '#22c55e' : '#ef4444';

                            return (
                                <div
                                    key={`${index.symbol}-${idx}`}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 20px)',
                                        background: 'rgba(0, 0, 0, 0.3)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '10px',
                                        minWidth: 'clamp(160px, 40vw, 220px)',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {/* Symbol and Name */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            fontSize: 'clamp(10px, 2vw, 12px)',
                                            color: '#888',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            marginBottom: '2px',
                                        }}>
                                            {index.name}
                                        </div>
                                        <div style={{
                                            fontSize: 'clamp(15px, 4vw, 18px)',
                                            fontWeight: 700,
                                            color: '#fff',
                                        }}>
                                            ${index.price.toFixed(2)}
                                        </div>
                                    </div>

                                    {/* Change */}
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{
                                            fontSize: 'clamp(11px, 2vw, 13px)',
                                            fontWeight: 600,
                                            color: changeColor,
                                            marginBottom: '2px',
                                        }}>
                                            {isPositive ? '▲' : '▼'} {Math.abs(index.change).toFixed(2)}
                                        </div>
                                        <div style={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            color: changeColor,
                                            background: `${changeColor}20`,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                        }}>
                                            {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        height: '100%',
                        color: '#888',
                        fontSize: '13px',
                    }}>
                        Loading market data...
                    </div>
                )}
            </div>

            {/* CSS Animation */}
            <style>{`
                @media (max-width: 480px) {
                    .market-status-text {
                        display: none;
                    }
                }

                @keyframes scroll-left {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(-33.33%);
                    }
                }

                @keyframes scroll-right {
                    0% {
                        transform: translateX(-33.33%);
                    }
                    100% {
                        transform: translateX(0);
                    }
                }

                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
