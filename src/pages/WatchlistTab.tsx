import { useState, useEffect } from 'react';
import { watchlistService } from '../services/watchlist-service';
import { WatchlistCard } from '../components/Watchlist/WatchlistCard';
import { AddTickerModal } from '../components/Watchlist/AddTickerModal';

export function WatchlistTab() {
    const [tickers, setTickers] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        loadWatchlist();
    }, []);

    const loadWatchlist = () => {
        setTickers(watchlistService.getTickers());
    };

    const handleAddTicker = (ticker: string): boolean => {
        const added = watchlistService.addTicker(ticker);
        if (added) {
            loadWatchlist();
        }
        return added;
    };

    const handleRemoveTicker = (ticker: string) => {
        watchlistService.removeTicker(ticker);
        loadWatchlist();
    };

    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
                overflow: 'auto',
                padding: '40px',
            }}
        >
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 700, color: '#fff' }}>
                            Watchlist
                        </h1>
                        <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
                            {tickers.length === 0
                                ? 'Your watchlist is empty'
                                : `Tracking ${tickers.length} ticker${tickers.length === 1 ? '' : 's'}`}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{
                            padding: '12px 24px',
                            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'transform 0.15s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    >
                        <span style={{ fontSize: '18px' }}>+</span>
                        Add Ticker
                    </button>
                </div>

                {/* Empty State */}
                {tickers.length === 0 && (
                    <div
                        style={{
                            textAlign: 'center',
                            padding: '80px 40px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                        }}
                    >
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>📊</div>
                        <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 600, color: '#fff' }}>
                            Your Watchlist is Empty
                        </h2>
                        <p style={{ margin: '0 auto 24px', fontSize: '14px', color: '#888', maxWidth: '400px' }}>
                            Start tracking your favorite stocks by adding tickers to your watchlist.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            style={{
                                padding: '12px 32px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'transform 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                            + Add Your First Ticker
                        </button>
                    </div>
                )}

                {/* Watchlist Grid */}
                {tickers.length > 0 && (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                            gap: '20px',
                        }}
                    >
                        {tickers.map((ticker) => (
                            <WatchlistCard key={ticker} ticker={ticker} onRemove={handleRemoveTicker} />
                        ))}
                    </div>
                )}

                {/* Add Ticker Modal */}
                <AddTickerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddTicker} />
            </div>
        </div>
    );
}
