import { useState, useEffect } from 'react';
import { marketOverviewService, type IndexData, type MarketStatus } from '../../services/market-overview-service';

export function MarketOverview() {
    const [indices, setIndices] = useState<IndexData[]>([]);
    const [marketStatus, setMarketStatus] = useState<MarketStatus | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async (isInitialLoad = false) => {
            // Only show loading spinner on initial load, not on refreshes
            if (isInitialLoad) {
                setLoading(true);
            }
            const data = await marketOverviewService.fetchAllIndices();
            setIndices(data);
            setMarketStatus(marketOverviewService.getMarketStatus());
            if (isInitialLoad) {
                setLoading(false);
            }
        };

        // Initial load with loading state
        fetchData(true);

        // Subsequent refreshes without loading state (silent updates)
        const interval = setInterval(() => fetchData(false), 5000);

        return () => clearInterval(interval);
    }, []);

    if (loading && indices.length === 0) {
        return (
            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '24px',
                marginBottom: '32px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#888' }}>
                    <div style={{
                        width: '16px',
                        height: '16px',
                        border: '2px solid #333',
                        borderTop: '2px solid #3b82f6',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }} />
                    <span>Loading market data...</span>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
        }}>
            {/* Header with Market Status */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <h2 style={{
                        margin: '0 0 4px 0',
                        fontSize: '20px',
                        fontWeight: 600,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        📊 Market Overview
                    </h2>
                    <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                        Live market indices • Updated every 5 seconds
                    </p>
                </div>

                {marketStatus && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 16px',
                        background: marketStatus.isOpen
                            ? 'rgba(34, 197, 94, 0.15)'
                            : 'rgba(239, 68, 68, 0.15)',
                        border: `1px solid ${marketStatus.isOpen ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        borderRadius: '8px',
                    }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: marketStatus.isOpen ? '#22c55e' : '#ef4444',
                            boxShadow: marketStatus.isOpen
                                ? '0 0 8px #22c55e'
                                : 'none',
                        }} />
                        <span style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: marketStatus.isOpen ? '#22c55e' : '#ef4444',
                        }}>
                            {marketStatus.statusText}
                        </span>
                    </div>
                )}
            </div>

            {/* Indices Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '16px',
            }}>
                {indices.map((index) => {
                    const isPositive = index.change >= 0;
                    const changeColor = isPositive ? '#22c55e' : '#ef4444';

                    return (
                        <div
                            key={index.symbol}
                            style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '16px',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                                e.currentTarget.style.borderColor = changeColor;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                        >
                            {/* Index Name */}
                            <div style={{
                                fontSize: '11px',
                                color: '#888',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                marginBottom: '8px',
                                fontWeight: 600,
                            }}>
                                {index.name}
                            </div>

                            {/* Price */}
                            <div style={{
                                fontSize: '24px',
                                fontWeight: 700,
                                color: '#fff',
                                marginBottom: '4px',
                            }}>
                                ${index.price.toFixed(2)}
                            </div>

                            {/* Change */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                            }}>
                                <span style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: changeColor,
                                }}>
                                    {isPositive ? '▲' : '▼'} {Math.abs(index.change).toFixed(2)}
                                </span>
                                <span style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: changeColor,
                                    background: `${changeColor}20`,
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                }}>
                                    {isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%
                                </span>
                            </div>

                            {/* Symbol */}
                            <div style={{
                                fontSize: '10px',
                                color: '#666',
                                marginTop: '8px',
                                fontFamily: 'monospace',
                            }}>
                                {index.symbol}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
