import { useState } from 'react';
import type { NewsItem } from '../../services/news-service';
import { NewsCard } from './NewsCard';

interface NewsSectionProps {
    ticker: string;
    news: NewsItem[];
    isSingleView?: boolean;
}

export function NewsSection({ ticker, news, isSingleView = false }: NewsSectionProps) {
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

    const sortedNews = [...news].sort((a, b) =>
        sortOrder === 'desc' ? b.datetime - a.datetime : a.datetime - b.datetime
    );

    const displayLimit = isSingleView ? 20 : 5;
    const displayNews = sortedNews.slice(0, displayLimit);

    const toggleSort = () => {
        setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
    };

    if (news.length === 0) {
        return (
            <div
                style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '32px',
                    marginBottom: '20px',
                }}
            >
                <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                    <span
                        style={{
                            display: 'inline-block',
                            padding: '4px 12px',
                            background: '#3b82f6',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            marginRight: '8px',
                        }}
                    >
                        {ticker}
                    </span>
                    {isSingleView && 'Latest News'}
                </h3>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>No news found.</p>
            </div>
        );
    }

    return (
        <div
            style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '20px',
            }}
        >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                <span
                    style={{
                        display: 'inline-block',
                        padding: '4px 12px',
                        background: '#3b82f6',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        marginRight: '8px',
                    }}
                >
                    {ticker}
                </span>
                {isSingleView && 'Latest News'}
            </h3>

            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #333' }}>
                            <th
                                style={{
                                    padding: '12px 8px',
                                    textAlign: 'left',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#aaa',
                                    width: '60%',
                                }}
                            >
                                Headline
                            </th>
                            <th
                                style={{
                                    padding: '12px 8px',
                                    textAlign: 'left',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#aaa',
                                    width: '20%',
                                }}
                            >
                                Source
                            </th>
                            <th
                                onClick={toggleSort}
                                style={{
                                    padding: '12px 8px',
                                    textAlign: 'left',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#aaa',
                                    width: '20%',
                                    cursor: 'pointer',
                                    userSelect: 'none',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#aaa')}
                            >
                                Date {sortOrder === 'desc' ? '↓' : '↑'}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayNews.map((item, index) => (
                            <NewsCard key={`${item.url}-${index}`} item={item} />
                        ))}
                    </tbody>
                </table>
            </div>

            {news.length > displayLimit && (
                <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#666', textAlign: 'center' }}>
                    Showing {displayLimit} of {news.length} articles
                </p>
            )}
        </div>
    );
}
