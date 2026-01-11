import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { watchlistService } from '../../services/watchlist-service';
import { activityService } from '../../services/activity-service';

const POPULAR_STOCKS = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corporation' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'SPY', name: 'S&P 500 ETF' },
];

export function QuickSearch() {
    const [query, setQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const navigate = useNavigate();
    const inputRef = useRef<HTMLInputElement>(null);

    // Keyboard shortcut: Cmd/Ctrl + K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                inputRef.current?.focus();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const filteredStocks = POPULAR_STOCKS.filter(stock =>
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
    );

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            navigate(`/charts?symbol=${query.toUpperCase()}`);
            setQuery('');
            setIsFocused(false);
        }
    };

    const handleStockClick = (symbol: string, action: 'chart' | 'analytics' | 'watchlist') => {
        if (action === 'chart') {
            navigate(`/charts?symbol=${symbol}`);
        } else if (action === 'analytics') {
            navigate(`/analytics?symbol=${symbol}`);
        } else if (action === 'watchlist') {
            if (watchlistService.hasTicker(symbol)) {
                watchlistService.removeTicker(symbol);
                activityService.addActivity('remove_watchlist', symbol);
            } else {
                watchlistService.addTicker(symbol);
                activityService.addActivity('add_watchlist', symbol);
            }
        }
        setQuery('');
        setIsFocused(false);
    };

    return (
        <div style={{ position: 'relative', marginBottom: '32px' }}>
            <form onSubmit={handleSearch}>
                <div style={{ position: 'relative' }}>
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                        placeholder="Quick search stocks... (⌘K)"
                        style={{
                            width: '100%',
                            padding: '16px 50px 16px 48px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: `2px solid ${isFocused ? '#3b82f6' : 'rgba(255, 255, 255, 0.1)'}`,
                            borderRadius: '12px',
                            color: '#fff',
                            fontSize: '16px',
                            outline: 'none',
                            transition: 'all 0.2s',
                            boxSizing: 'border-box',
                        }}
                    />

                    {/* Search Icon */}
                    <div style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#888',
                        pointerEvents: 'none',
                    }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                    </div>

                    {/* Clear Button */}
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery('')}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#888',
                                cursor: 'pointer',
                                padding: '6px 10px',
                                fontSize: '12px',
                            }}
                        >
                            Clear
                        </button>
                    )}
                </div>
            </form>

            {/* Dropdown */}
            {isFocused && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '8px',
                    background: '#1a1a1a',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    zIndex: 1000,
                }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                        <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {query ? 'Search Results' : 'Popular Stocks'}
                        </div>
                    </div>

                    {filteredStocks.length > 0 ? (
                        filteredStocks.map((stock) => (
                            <div
                                key={stock.symbol}
                                style={{
                                    padding: '12px 16px',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                    cursor: 'pointer',
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>
                                            {stock.symbol}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#888' }}>
                                            {stock.name}
                                        </div>
                                    </div>

                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button
                                            onClick={() => handleStockClick(stock.symbol, 'chart')}
                                            style={{
                                                padding: '6px 12px',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                                borderRadius: '6px',
                                                color: '#3b82f6',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Chart
                                        </button>
                                        <button
                                            onClick={() => handleStockClick(stock.symbol, 'watchlist')}
                                            style={{
                                                padding: '6px 12px',
                                                background: 'rgba(245, 158, 11, 0.1)',
                                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                                borderRadius: '6px',
                                                color: '#f59e0b',
                                                fontSize: '11px',
                                                fontWeight: 600,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            ⭐
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div style={{
                            padding: '24px 16px',
                            textAlign: 'center',
                            color: '#666',
                            fontSize: '13px',
                        }}>
                            No stocks found. Press Enter to search for "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
