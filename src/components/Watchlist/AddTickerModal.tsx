import { useState } from 'react';

interface AddTickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (ticker: string) => boolean;
}

export function AddTickerModal({ isOpen, onClose, onAdd }: AddTickerModalProps) {
    const [ticker, setTicker] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const trimmed = ticker.trim().toUpperCase();
        if (!trimmed) {
            setError('Please enter a ticker symbol');
            return;
        }

        if (!/^[A-Z]{1,5}$/.test(trimmed)) {
            setError('Invalid ticker format (1-5 letters)');
            return;
        }

        const added = onAdd(trimmed);
        if (!added) {
            setError('Ticker already in watchlist');
            return;
        }

        setTicker('');
        onClose();
    };

    const handleClose = () => {
        setTicker('');
        setError('');
        onClose();
    };

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={handleClose}
        >
            <div
                style={{
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '12px',
                    padding: '32px',
                    width: '90%',
                    maxWidth: '400px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 700, color: '#fff' }}>
                    Add to Watchlist
                </h2>
                <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: '#888' }}>
                    Enter a stock ticker symbol to add to your watchlist
                </p>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={ticker}
                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                        placeholder="e.g., AAPL, TSLA, NVDA"
                        autoFocus
                        style={{
                            width: '100%',
                            padding: '12px 16px',
                            background: '#0a0a0a',
                            border: error ? '1px solid #ef4444' : '1px solid #333',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '16px',
                            outline: 'none',
                            marginBottom: '8px',
                        }}
                        onFocus={(e) => !error && (e.currentTarget.style.borderColor = '#3b82f6')}
                        onBlur={(e) => !error && (e.currentTarget.style.borderColor = '#333')}
                    />

                    {error && (
                        <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#ef4444' }}>
                            {error}
                        </p>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button
                            type="button"
                            onClick={handleClose}
                            style={{
                                flex: 1,
                                padding: '12px 24px',
                                background: 'transparent',
                                border: '1px solid #333',
                                borderRadius: '8px',
                                color: '#888',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = '#666';
                                e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#333';
                                e.currentTarget.style.color = '#888';
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            style={{
                                flex: 1,
                                padding: '12px 24px',
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
                            Add Ticker
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
