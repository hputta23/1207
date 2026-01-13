import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth-context';
import { watchlistService } from '../services/watchlist-service';
import { MarketOverview } from '../components/Dashboard/MarketOverview';
import { QuickSearch } from '../components/Dashboard/QuickSearch';
import { WatchlistQuickView } from '../components/Dashboard/WatchlistQuickView';
import { TrendingStocks } from '../components/Dashboard/TrendingStocks';
import { RecentActivity } from '../components/Dashboard/RecentActivity';
import { NewsFeed } from '../components/Dashboard/NewsFeed';
import { AutoRefreshControl } from '../components/AutoRefresh/AutoRefreshControl';

export function Dashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [watchlistCount, setWatchlistCount] = useState(0);

    useEffect(() => {
        // Load watchlist count on mount
        setWatchlistCount(watchlistService.getCount());

        // Update count every second to catch changes from other tabs
        const interval = setInterval(() => {
            setWatchlistCount(watchlistService.getCount());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const quickStats = [
        { label: 'Active Charts', value: '2', icon: '📊', color: '#3b82f6' },
        { label: 'Watchlist', value: watchlistCount.toString(), icon: '⭐', color: '#f59e0b' },
        { label: 'Alerts', value: '3', icon: '🔔', color: '#ef4444' },
        { label: 'Performance', value: '+5.2%', icon: '📈', color: '#22c55e' },
    ];

    const navigationCards = [
        {
            title: 'Live Charts',
            description: 'Multi-chart workspace with real-time data and technical indicators',
            icon: '📈',
            color: '#3b82f6',
            path: '/charts',
        },
        {
            title: 'Market News',
            description: 'Latest financial news with sentiment analysis for your watchlist',
            icon: '📰',
            color: '#10b981',
            path: '/news',
        },
        {
            title: 'Watchlist',
            description: `Track ${watchlistCount} favorite stock${watchlistCount === 1 ? '' : 's'} with quick access to charts and news`,
            icon: '⭐',
            color: '#f59e0b',
            path: '/watchlist',
        },
        {
            title: 'Analytics',
            description: 'Technical analysis with indicators, charts, and market insights',
            icon: '📊',
            color: '#8b5cf6',
            path: '/analytics',
        },
    ];

    return (
        <div style={{
            width: '100%',
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
            overflow: 'auto',
            padding: 'clamp(16px, 5vw, 40px)',
        }}>
            {/* Welcome Section */}
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
                <div style={{ marginBottom: 'clamp(24px, 5vw, 40px)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h1 style={{
                            margin: '0 0 8px 0',
                            fontSize: 'clamp(24px, 6vw, 36px)',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, #fff 0%, #aaa 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}>
                            Welcome back, {user?.username || 'Trader'}
                        </h1>
                        <p style={{ margin: 0, fontSize: 'clamp(13px, 3vw, 16px)', color: '#888' }}>
                            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <AutoRefreshControl />
                </div>

                {/* Quick Search */}
                <QuickSearch />

                {/* Market Overview */}
                <MarketOverview />

                {/* Watchlist Quick View */}
                <WatchlistQuickView />

                {/* Trending Stocks */}
                <TrendingStocks />

                {/* Recent Activity */}
                <RecentActivity />

                {/* Market News Feed */}
                <NewsFeed />

                {/* Quick Stats */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '12px',
                    marginBottom: '32px',
                }}>
                    {quickStats.map((stat) => (
                        <div
                            key={stat.label}
                            style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: 'clamp(16px, 4vw, 24px)',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <div style={{
                                    fontSize: 'clamp(20px, 6vw, 32px)',
                                    width: 'clamp(32px, 8vw, 48px)',
                                    height: 'clamp(32px, 8vw, 48px)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: `${stat.color}20`,
                                    borderRadius: '8px',
                                }}>
                                    {stat.icon}
                                </div>
                                <div>
                                    <div style={{ fontSize: 'clamp(18px, 5vw, 28px)', fontWeight: 700, color: '#fff' }}>{stat.value}</div>
                                    <div style={{ fontSize: 'clamp(11px, 3vw, 13px)', color: '#888' }}>{stat.label}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Navigation Cards */}
                <div>
                    <h2 style={{
                        margin: '0 0 20px 0',
                        fontSize: '24px',
                        fontWeight: 600,
                        color: '#fff',
                    }}>
                        Quick Access
                    </h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '20px',
                    }}>
                        {navigationCards.map((card) => (
                            <button
                                key={card.title}
                                onClick={() => navigate(card.path)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '16px',
                                    padding: 'clamp(20px, 5vw, 32px)',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.borderColor = card.color;
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{
                                    fontSize: 'clamp(32px, 8vw, 48px)',
                                    marginBottom: '16px',
                                }}>
                                    {card.icon}
                                </div>
                                <h3 style={{
                                    margin: '0 0 8px 0',
                                    fontSize: 'clamp(18px, 4vw, 20px)',
                                    fontWeight: 600,
                                    color: '#fff',
                                }}>
                                    {card.title}
                                </h3>
                                <p style={{
                                    margin: 0,
                                    fontSize: '14px',
                                    color: '#888',
                                    lineHeight: 1.5,
                                }}>
                                    {card.description}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
