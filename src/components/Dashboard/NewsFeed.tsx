import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsFeedService, type NewsItem } from '../../services/news-feed-service';

export function NewsFeed() {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            const items = await newsFeedService.fetchLatestNews(6);
            setNews(items);
            setLoading(false);
        };

        fetchNews();

        // Refresh news every 5 minutes
        const interval = setInterval(fetchNews, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, []);

    const getSentimentColor = (sentiment?: string) => {
        switch (sentiment) {
            case 'positive':
                return '#22c55e';
            case 'negative':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    const getSentimentIcon = (sentiment?: string) => {
        switch (sentiment) {
            case 'positive':
                return '📈';
            case 'negative':
                return '📉';
            default:
                return '📰';
        }
    };

    const handleViewAll = () => {
        navigate('/news');
    };

    if (loading) {
        return (
            <div style={{ marginBottom: '32px' }}>
                <h2 style={{
                    margin: '0 0 16px 0',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    📰 Market News
                </h2>
                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    padding: '40px',
                    textAlign: 'center',
                }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        border: '3px solid rgba(59, 130, 246, 0.3)',
                        borderTop: '3px solid #3b82f6',
                        borderRadius: '50%',
                        margin: '0 auto',
                        animation: 'spin 1s linear infinite',
                    }} />
                    <style>{`
                        @keyframes spin {
                            to { transform: rotate(360deg); }
                        }
                    `}</style>
                </div>
            </div>
        );
    }

    return (
        <div style={{ marginBottom: '32px' }}>
            {/* Header */}
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
                    📰 Market News
                    <span style={{
                        fontSize: '12px',
                        color: '#888',
                        fontWeight: 400,
                    }}>
                        Latest headlines
                    </span>
                </h2>

                <button
                    onClick={handleViewAll}
                    style={{
                        padding: '6px 12px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '6px',
                        color: '#3b82f6',
                        fontSize: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                    }}
                >
                    View All News →
                </button>
            </div>

            {/* News Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '16px',
            }}>
                {news.map((item, index) => (
                    <div
                        key={index}
                        onClick={() => {
                            if (item.url && item.url !== '#') {
                                window.open(item.url, '_blank', 'noopener,noreferrer');
                            }
                        }}
                        style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '12px',
                            padding: '20px',
                            cursor: item.url !== '#' ? 'pointer' : 'default',
                            transition: 'all 0.2s',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                        onMouseEnter={(e) => {
                            if (item.url !== '#') {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.borderColor = getSentimentColor(item.sentiment);
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        {/* Sentiment indicator bar */}
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '4px',
                            height: '100%',
                            background: getSentimentColor(item.sentiment),
                        }} />

                        {/* Header with sentiment icon and source */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: '12px',
                            gap: '8px',
                        }}>
                            <div style={{
                                fontSize: '20px',
                                flexShrink: 0,
                            }}>
                                {getSentimentIcon(item.sentiment)}
                            </div>

                            <div style={{
                                flex: 1,
                                textAlign: 'right',
                            }}>
                                <div style={{
                                    fontSize: '11px',
                                    color: '#888',
                                    fontWeight: 500,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px',
                                }}>
                                    {item.source}
                                </div>
                                <div style={{
                                    fontSize: '10px',
                                    color: '#666',
                                    marginTop: '2px',
                                }}>
                                    {newsFeedService.getFormattedTime(item.publishedAt)}
                                </div>
                            </div>
                        </div>

                        {/* Title */}
                        <h3 style={{
                            margin: '0 0 12px 0',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#fff',
                            lineHeight: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}>
                            {item.title}
                        </h3>

                        {/* Related symbols */}
                        {item.symbols && item.symbols.length > 0 && (
                            <div style={{
                                display: 'flex',
                                gap: '6px',
                                flexWrap: 'wrap',
                            }}>
                                {item.symbols.map((symbol) => (
                                    <span
                                        key={symbol}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/charts?symbol=${symbol}`);
                                        }}
                                        style={{
                                            padding: '2px 8px',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            border: '1px solid rgba(59, 130, 246, 0.2)',
                                            borderRadius: '4px',
                                            color: '#3b82f6',
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            fontFamily: 'monospace',
                                            cursor: 'pointer',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                                        }}
                                    >
                                        {symbol}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Refresh indicator */}
            <div style={{
                textAlign: 'center',
                marginTop: '12px',
                fontSize: '11px',
                color: '#666',
            }}>
                Updates every 5 minutes
            </div>
        </div>
    );
}
