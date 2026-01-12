import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { watchlistService } from '../../services/watchlist-service';
import { activityService } from '../../services/activity-service';

interface StockQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
}

export function WatchlistQuickView() {
    const [watchlist, setWatchlist] = useState<string[]>([]);
    const [quotes, setQuotes] = useState<Map<string, StockQuote>>(new Map());
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const updateWatchlist = () => {
            const stocks = watchlistService.getTickers();
            setWatchlist(stocks);
        };

        updateWatchlist();

        // Update watchlist every second
        const interval = setInterval(updateWatchlist, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (watchlist.length === 0) {
            setLoading(false);
            return;
        }

        const fetchQuotes = async () => {
            const newQuotes = new Map<string, StockQuote>();

            for (const symbol of watchlist) {
                try {
                    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
                    const response = await fetch(url);

                    if (!response.ok) continue;

                    const data = await response.json();
                    const result = data?.chart?.result?.[0];

                    if (!result) continue;

                    const meta = result.meta;
                    const currentPrice = meta.regularMarketPrice || meta.previousClose;
                    const previousClose = meta.chartPreviousClose || meta.previousClose;
                    const change = currentPrice - previousClose;
                    const changePercent = (change / previousClose) * 100;

                    newQuotes.set(symbol, {
                        symbol,
                        price: currentPrice,
                        change,
                        changePercent,
                    });
                } catch (error) {
                    console.error(`Error fetching ${symbol}:`, error);
                }
            }

            setQuotes(newQuotes);
            setLoading(false);
        };

        fetchQuotes();

        // Update every 10 seconds
        const interval = setInterval(fetchQuotes, 10000);

        return () => clearInterval(interval);
    }, [watchlist]);

    const handleRemove = (symbol: string, e: React.MouseEvent) => {
        e.stopPropagation();
        watchlistService.removeTicker(symbol);
        activityService.addActivity('remove_watchlist', symbol);
    };

    if (watchlist.length === 0) {
        return (
            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'center',
                marginBottom: '32px',
            }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>⭐</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                    Your Watchlist is Empty
                </h3>
                <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: '#888' }}>
                    Add stocks to track their performance and get quick access
                </p>
                <button
                    onClick={() => navigate('/watchlist')}
                    style={{
                        padding: '10px 20px',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                    }}
                >
                    Browse Stocks
                </button>
            </div>
        );
    }

    return (
        <div style={{ marginBottom: '32px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
            }}>
                <h2 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    ⭐ Your Watchlist
                    <span style={{
                        fontSize: '12px',
                        color: '#888',
                        fontWeight: 400,
                    }}>
                        ({watchlist.length} {watchlist.length === 1 ? 'stock' : 'stocks'})
                    </span>
                </h2>

                <button
                    onClick={() => navigate('/watchlist')}
                    style={{
                        padding: '6px 12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '6px',
                        color: '#888',
                        fontSize: '12px',
                        cursor: 'pointer',
                    }}
                >
                    View All →
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px',
            }}>
                {watchlist.map((symbol) => {
                    const quote = quotes.get(symbol);
                    const isPositive = quote ? quote.change >= 0 : true;
                    const changeColor = isPositive ? '#22c55e' : '#ef4444';

                    return (
                        <div
                            key={symbol}
                            onClick={() => navigate(`/charts?symbol=${symbol}`)}
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                                e.currentTarget.style.borderColor = changeColor;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                                <div style={{
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    color: '#fff',
                                    fontFamily: 'monospace',
                                }}>
                                    {symbol}
                                </div>

                                <button
                                    onClick={(e) => handleRemove(symbol, e)}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: '4px',
                                        color: '#ef4444',
                                        padding: '4px 8px',
                                        fontSize: '11px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    Remove
                                </button>
                            </div>

                            {loading || !quote ? (
                                <div style={{ color: '#666', fontSize: '12px' }}>Loading...</div>
                            ) : (
                                <>
                                    <div style={{
                                        fontSize: '20px',
                                        fontWeight: 700,
                                        color: '#fff',
                                        marginBottom: '4px',
                                    }}>
                                        ${quote.price.toFixed(2)}
                                    </div>

                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span style={{
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            color: changeColor,
                                        }}>
                                            {isPositive ? '▲' : '▼'} {Math.abs(quote.change).toFixed(2)}
                                        </span>
                                        <span style={{
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: changeColor,
                                            background: `${changeColor}20`,
                                            padding: '2px 6px',
                                            borderRadius: '4px',
                                        }}>
                                            {isPositive ? '+' : ''}{quote.changePercent.toFixed(2)}%
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
