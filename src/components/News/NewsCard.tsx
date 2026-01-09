import type { NewsItem } from '../../services/news-service';
import { FinancialSentiment } from '../../utils/sentiment';

interface NewsCardProps {
    item: NewsItem;
}

const sentiment = new FinancialSentiment();

export function NewsCard({ item }: NewsCardProps) {
    const analysis = sentiment.analyze(item.headline);

    const sentimentColor =
        analysis.type === 'positive'
            ? '#22c55e'
            : analysis.type === 'negative'
                ? '#ef4444'
                : '#888';

    const date = new Date(item.datetime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return (
        <tr style={{ borderBottom: '1px solid #222' }}>
            <td style={{ padding: '12px 8px' }}>
                <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: sentimentColor,
                        textDecoration: 'none',
                        fontSize: '13px',
                        lineHeight: 1.4,
                        display: 'block',
                        transition: 'opacity 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
                    title={item.headline}
                >
                    {item.headline}
                </a>
            </td>
            <td style={{ padding: '12px 8px', fontSize: '12px', color: '#666' }}>
                {item.source}
            </td>
            <td style={{ padding: '12px 8px', fontSize: '12px', color: '#666', whiteSpace: 'nowrap' }}>
                {date}
            </td>
        </tr>
    );
}
