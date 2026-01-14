import { useState, useEffect } from 'react';
import { watchlistService } from '../../services/watchlist-service';
import { BASE_URL } from '../../services/api-client';

interface MarketSidebarProps {
    onSelectSymbol: (symbol: string) => void;
}

export function MarketSidebar({ onSelectSymbol }: MarketSidebarProps) {
    const [activeTab, setActiveTab] = useState<'WATCHLIST' | 'MOVERS'>('WATCHLIST');
    const [activeFilter, setActiveFilter] = useState<'GAINERS' | 'LOSERS'>('GAINERS');
    const [watchlistQuotes, setWatchlistQuotes] = useState<any[]>([]);
    const [movers, setMovers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Watchlist Data
    useEffect(() => {
        if (activeTab === 'WATCHLIST') {
            const fetchWatchlist = async () => {
                setLoading(true);
                const tickers = watchlistService.getTickers();

                if (tickers.length === 0) {
                    setWatchlistQuotes([]);
                    setLoading(false);
                    return;
                }

                const quotes = await fetchQuotesForList(tickers);
                setWatchlistQuotes(quotes);
                setLoading(false);
            };
            fetchWatchlist();
            const interval = setInterval(fetchWatchlist, 10000); // 10s refresh
            return () => clearInterval(interval);
        }
    }, [activeTab]);

    // Top Movers Data (Mocked/Proxied)
    useEffect(() => {
        if (activeTab === 'MOVERS') {
            const fetchMovers = async () => {
                setLoading(true);
                // Since we don't have a real screener API, we'll fetch a preset list of popular volatile stocks
                // and sort them dynamically to simulate "Top Movers"
                const popularTickers = ['NVDA', 'TSLA', 'AMD', 'AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META', 'NFLX', 'COIN', 'MARA', 'PLTR', 'SOFI'];
                const quotes = await fetchQuotesForList(popularTickers);

                // Sort by change percent
                const sorted = quotes.sort((a, b) => b.changePercent - a.changePercent);
                setMovers(sorted);
                setLoading(false);
            };
            fetchMovers();
        }
    }, [activeTab]);

    const fetchQuotesForList = async (tickers: string[]) => {
        const results = [];
        for (const symbol of tickers) {
            try {
                const res = await fetch(`${BASE_URL}/api/yahoo/v8/finance/chart/${symbol}`);
                const data = await res.json();
                const meta = data?.chart?.result?.[0]?.meta;
                if (meta) {
                    const price = meta.regularMarketPrice || meta.chartPreviousClose;
                    const prev = meta.chartPreviousClose;
                    const change = price - prev;
                    const changeP = (change / prev) * 100;
                    results.push({ symbol, price, change, changePercent: changeP });
                }
            } catch (e) {
                // console.error(e);
            }
        }
        return results;
    };

    const displayedMovers = activeTab === 'MOVERS'
        ? (activeFilter === 'GAINERS'
            ? movers.filter(m => m.changePercent > 0).slice(0, 5)
            : movers.filter(m => m.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent).slice(0, 5))
        : [];

    const displayedItems = activeTab === 'WATCHLIST' ? watchlistQuotes : displayedMovers;

    return (
        <div style={{
            background: '#1a1a2e',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            flex: 1, // fill simplified container
            display: 'flex',
            flexDirection: 'column'
        }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <button
                    onClick={() => setActiveTab('WATCHLIST')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        background: activeTab === 'WATCHLIST' ? 'rgba(255,255,255,0.05)' : 'transparent',
                        border: 'none',
                        color: activeTab === 'WATCHLIST' ? '#fff' : '#888',
                        fontWeight: 600,
                        cursor: 'pointer',
                        borderBottom: activeTab === 'WATCHLIST' ? '2px solid #3b82f6' : 'none'
                    }}
                >
                    Watchlist
                </button>
                <button
                    onClick={() => setActiveTab('MOVERS')}
                    style={{
                        flex: 1,
                        padding: '12px',
                        background: activeTab === 'MOVERS' ? 'rgba(255,255,255,0.05)' : 'transparent',
                        border: 'none',
                        color: activeTab === 'MOVERS' ? '#fff' : '#888',
                        fontWeight: 600,
                        cursor: 'pointer',
                        borderBottom: activeTab === 'MOVERS' ? '2px solid #3b82f6' : 'none'
                    }}
                >
                    Top Movers
                </button>
            </div>

            {/* Sub-Filters for Movers */}
            {activeTab === 'MOVERS' && (
                <div style={{ display: 'flex', padding: '8px', gap: '8px', background: 'rgba(0,0,0,0.2)' }}>
                    <button
                        onClick={() => setActiveFilter('GAINERS')}
                        style={{
                            flex: 1, padding: '4px', borderRadius: '4px', border: 'none',
                            background: activeFilter === 'GAINERS' ? 'rgba(34, 197, 94, 0.2)' : 'transparent',
                            color: activeFilter === 'GAINERS' ? '#22c55e' : '#666',
                            fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Gainers
                    </button>
                    <button
                        onClick={() => setActiveFilter('LOSERS')}
                        style={{
                            flex: 1, padding: '4px', borderRadius: '4px', border: 'none',
                            background: activeFilter === 'LOSERS' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                            color: activeFilter === 'LOSERS' ? '#ef4444' : '#666',
                            fontSize: '11px', fontWeight: 600, cursor: 'pointer'
                        }}
                    >
                        Losers
                    </button>
                </div>
            )}

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '13px' }}>Loading...</div>
                ) : displayedItems.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#666', fontSize: '13px' }}>
                        {activeTab === 'WATCHLIST' ? 'Watchlist is empty' : 'No movers found'}
                    </div>
                ) : (
                    displayedItems.map(item => (
                        <div
                            key={item.symbol}
                            onClick={() => onSelectSymbol(item.symbol)}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '12px 16px',
                                borderBottom: '1px solid rgba(255,255,255,0.05)',
                                cursor: 'pointer',
                                transition: 'background 0.2s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                        >
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{item.symbol}</div>
                                <div style={{ fontSize: '11px', color: '#888' }}>
                                    ${item.price.toFixed(2)}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: item.change >= 0 ? '#22c55e' : '#ef4444'
                                }}>
                                    {item.change >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                                </div>
                                <div style={{ fontSize: '11px', color: item.change >= 0 ? '#22c55e' : '#ef4444', opacity: 0.7 }}>
                                    {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
