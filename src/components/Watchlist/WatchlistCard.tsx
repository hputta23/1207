import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BASE_URL } from '../../services/api-client';

interface WatchlistCardProps {
    ticker: string;
    onRemove: (ticker: string) => void;
}

interface StockQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
}

export function WatchlistCard({ ticker, onRemove }: WatchlistCardProps) {
    const navigate = useNavigate();
    const [quote, setQuote] = useState<StockQuote | null>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const fetchQuote = async () => {
            try {
                const url = `${BASE_URL}/api/yahoo/v8/finance/chart/${ticker}`;
                const response = await fetch(url);

                if (!response.ok) {
                    setLoading(false);
                    return;
                }

                const data = await response.json();
                const result = data?.chart?.result?.[0];

                if (!result) {
                    setLoading(false);
                    return;
                }

                const meta = result.meta;
                const currentPrice = meta.regularMarketPrice || meta.previousClose;
                const previousClose = meta.chartPreviousClose || meta.previousClose;
                const change = currentPrice - previousClose;
                const changePercent = (change / previousClose) * 100;

                setQuote({
                    symbol: ticker,
                    price: currentPrice,
                    change,
                    changePercent,
                });
                setLoading(false);
            } catch (error) {
                console.error(`Error fetching ${ticker}:`, error);
                setLoading(false);
            }
        };

        fetchQuote();

        // Update every 30 seconds
        const interval = setInterval(fetchQuote, 30000);

        return () => clearInterval(interval);
    }, [ticker]);

    const handleViewChart = () => {
        navigate(`/charts?symbol=${ticker}`);
    };

    const handleViewNews = () => {
        navigate(`/news?symbol=${ticker}`);
    };

    const handleCopyTicker = async () => {
        try {
            await navigator.clipboard.writeText(ticker);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy ticker:', error);
        }
    };

    return (
        <div
            style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Ticker Symbol and Price */}
            <div>
                <button
                    onClick={handleCopyTicker}
                    aria-label={`Copy ${ticker} to clipboard`}
                    title={copied ? 'Copied!' : `Click to copy ${ticker}`}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        background: copied
                            ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)'
                            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: '#fff',
                        marginBottom: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                        if (!copied) {
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    {ticker}
                    {copied && <span style={{ fontSize: '14px' }}>✓</span>}
                </button>

                {loading ? (
                    <div style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>Loading price...</div>
                ) : quote ? (
                    <div>
                        <div style={{
                            fontSize: '24px',
                            fontWeight: 700,
                            color: '#fff',
                            marginBottom: '4px',
                        }}>
                            ${quote.price.toFixed(2)}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                                style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: quote.change >= 0 ? '#22c55e' : '#ef4444',
                                }}
                                aria-label={quote.change >= 0 ? 'Price increase' : 'Price decrease'}
                            >
                                {quote.change >= 0 ? '▲' : '▼'} {Math.abs(quote.change).toFixed(2)}
                            </span>
                            <span style={{
                                fontSize: '12px',
                                fontWeight: 600,
                                color: quote.change >= 0 ? '#22c55e' : '#ef4444',
                                background: quote.change >= 0 ? '#22c55e20' : '#ef444420',
                                padding: '2px 6px',
                                borderRadius: '4px',
                            }}>
                                {quote.change >= 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%
                            </span>
                        </div>
                    </div>
                ) : (
                    <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>Failed to load price</div>
                )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button
                    onClick={handleViewChart}
                    aria-label={`View chart for ${ticker}`}
                    title={`View chart for ${ticker}`}
                    style={{
                        flex: 1,
                        minHeight: '44px',
                        padding: '12px 16px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '6px',
                        color: '#3b82f6',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                    }}
                >
                    📈 Chart
                </button>
                <button
                    onClick={handleViewNews}
                    aria-label={`View news for ${ticker}`}
                    title={`View news for ${ticker}`}
                    style={{
                        flex: 1,
                        minHeight: '44px',
                        padding: '12px 16px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '6px',
                        color: '#3b82f6',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                    }}
                >
                    📰 News
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(ticker);
                    }}
                    aria-label={`Remove ${ticker} from watchlist`}
                    title={`Remove ${ticker} from watchlist`}
                    style={{
                        minHeight: '44px',
                        minWidth: '44px',
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '6px',
                        color: '#ef4444',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                    }}
                >
                    ×
                </button>
            </div>
        </div>
    );
}
