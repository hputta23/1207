import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trendingStocksService, type TrendingStock } from '../../services/trending-stocks-service';
import { watchlistService } from '../../services/watchlist-service';
import { activityService } from '../../services/activity-service';

export function TrendingStocks() {
    const [gainers, setGainers] = useState<TrendingStock[]>([]);
    const [losers, setLosers] = useState<TrendingStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'gainers' | 'losers'>('gainers');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const data = await trendingStocksService.fetchTrendingStocks();
            setGainers(data.gainers);
            setLosers(data.losers);
            setLoading(false);
        };

        fetchData();

        // Update every 60 seconds
        const interval = setInterval(fetchData, 60000);

        return () => clearInterval(interval);
    }, []);

    const handleAddToWatchlist = (symbol: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (watchlistService.hasTicker(symbol)) {
            watchlistService.removeTicker(symbol);
            activityService.addActivity('remove_watchlist', symbol);
        } else {
            watchlistService.addTicker(symbol);
            activityService.addActivity('add_watchlist', symbol);
        }
    };

    const handleViewChart = (symbol: string) => {
        navigate(`/charts?symbol=${symbol}`);
    };

    const formatVolume = (volume: number): string => {
        if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`;
        if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`;
        if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`;
        return volume.toString();
    };

    const displayStocks = activeTab === 'gainers' ? gainers : losers;
    const isGainers = activeTab === 'gainers';

    if (loading && gainers.length === 0) {
        return (
            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
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
                    <span>Loading trending stocks...</span>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(239, 68, 68, 0.05) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
        }}>
            {/* Header */}
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
                        🔥 Trending Today
                    </h2>
                    <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                        Top movers in the market • Updated every minute
                    </p>
                </div>

                {/* Tab Switcher */}
                <div style={{
                    display: 'flex',
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '8px',
                    padding: '4px',
                }}>
                    <button
                        onClick={() => setActiveTab('gainers')}
                        style={{
                            padding: '8px 20px',
                            background: activeTab === 'gainers'
                                ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                                : 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            color: activeTab === 'gainers' ? '#fff' : '#888',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        🚀 Gainers
                    </button>
                    <button
                        onClick={() => setActiveTab('losers')}
                        style={{
                            padding: '8px 20px',
                            background: activeTab === 'losers'
                                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                                : 'transparent',
                            border: 'none',
                            borderRadius: '6px',
                            color: activeTab === 'losers' ? '#fff' : '#888',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                    >
                        📉 Losers
                    </button>
                </div>
            </div>

            {/* Stocks List */}
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
            }}>
                {displayStocks.map((stock, index) => {
                    const isPositive = stock.changePercent >= 0;
                    const changeColor = isPositive ? '#22c55e' : '#ef4444';
                    const isInWatchlist = watchlistService.hasTicker(stock.symbol);

                    return (
                        <div
                            key={stock.symbol}
                            onClick={() => handleViewChart(stock.symbol)}
                            style={{
                                background: 'rgba(0, 0, 0, 0.3)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '12px',
                                padding: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)';
                                e.currentTarget.style.borderColor = changeColor;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
                            }}
                        >
                            {/* Rank */}
                            <div style={{
                                minWidth: '32px',
                                height: '32px',
                                background: isGainers
                                    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(22, 163, 74, 0.1) 100%)'
                                    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                                border: `1px solid ${isGainers ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 700,
                                color: isGainers ? '#22c55e' : '#ef4444',
                            }}>
                                #{index + 1}
                            </div>

                            {/* Stock Info */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '4px',
                                }}>
                                    <div style={{
                                        fontSize: '15px',
                                        fontWeight: 700,
                                        color: '#fff',
                                        fontFamily: 'monospace',
                                    }}>
                                        {stock.symbol}
                                    </div>
                                    {stock.name && (
                                        <div style={{
                                            fontSize: '12px',
                                            color: '#666',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {stock.name}
                                        </div>
                                    )}
                                </div>

                                <div style={{
                                    fontSize: '11px',
                                    color: '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}>
                                    <span>Vol: {formatVolume(stock.volume)}</span>
                                </div>
                            </div>

                            {/* Price Info */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'flex-end',
                                gap: '4px',
                            }}>
                                <div style={{
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    color: '#fff',
                                }}>
                                    ${stock.price.toFixed(2)}
                                </div>

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                }}>
                                    <span style={{
                                        fontSize: '13px',
                                        fontWeight: 600,
                                        color: changeColor,
                                    }}>
                                        {isPositive ? '▲' : '▼'} {Math.abs(stock.change).toFixed(2)}
                                    </span>
                                    <span style={{
                                        fontSize: '14px',
                                        fontWeight: 700,
                                        color: changeColor,
                                        background: `${changeColor}20`,
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                    }}>
                                        {isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{
                                display: 'flex',
                                gap: '6px',
                            }}>
                                <button
                                    onClick={(e) => handleAddToWatchlist(stock.symbol, e)}
                                    style={{
                                        padding: '8px 12px',
                                        background: isInWatchlist
                                            ? 'rgba(245, 158, 11, 0.2)'
                                            : 'rgba(255, 255, 255, 0.05)',
                                        border: `1px solid ${isInWatchlist ? 'rgba(245, 158, 11, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                                        borderRadius: '6px',
                                        color: isInWatchlist ? '#f59e0b' : '#888',
                                        fontSize: '16px',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s',
                                    }}
                                    title={isInWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = isInWatchlist
                                            ? 'rgba(245, 158, 11, 0.3)'
                                            : 'rgba(255, 255, 255, 0.1)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = isInWatchlist
                                            ? 'rgba(245, 158, 11, 0.2)'
                                            : 'rgba(255, 255, 255, 0.05)';
                                    }}
                                >
                                    {isInWatchlist ? '⭐' : '☆'}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
