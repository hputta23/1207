import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { analyticsService } from '../services/analytics-service';
import type { AnalyticsData } from '../services/analytics-service';
import { AnalyticsCard } from '../components/Analytics/AnalyticsCard';
import { PriceChart } from '../components/Analytics/PriceChart';
import { PredictionPanel } from '../components/Analytics/PredictionPanel';
import { SimulationPanel } from '../components/Analytics/SimulationPanel';
import { BacktestPanel } from '../components/Analytics/BacktestPanel';
import { useDataSourceStore } from '../services/data-source-config';
import { DataSourceSelector } from '../components/DataSourceSelector/DataSourceSelector';
import { activityService } from '../services/activity-service';

// Tab button component
const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
        onClick={onClick}
        style={{
            padding: '10px 20px',
            background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            border: 'none',
            borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
            color: active ? '#3b82f6' : '#888',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
        }}
    >
        {children}
    </button>
);

export function AnalyticsTab() {
    const [searchParams] = useSearchParams();
    const [ticker, setTicker] = useState('AAPL'); // Default to AAPL
    const [period, setPeriod] = useState('6mo');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [activeTab, setActiveTab] = useState<'technical' | 'prediction' | 'simulation' | 'backtest'>('technical');

    const { selectedSource, sources } = useDataSourceStore();

    // Handle URL parameter for symbol
    useEffect(() => {
        const symbol = searchParams.get('symbol');
        if (symbol) {
            const upperSymbol = symbol.toUpperCase();
            setTicker(upperSymbol);
            fetchData(upperSymbol);
            activityService.addActivity('run_analysis', upperSymbol);
        } else {
            // Load default data on mount if no URL param
            fetchData('AAPL');
        }
    }, [searchParams]);

    // Refetch when data source changes
    useEffect(() => {
        if (ticker) {
            fetchData(ticker);
        }
    }, [selectedSource]);

    const fetchData = async (symbol: string) => {
        setLoading(true);
        setError('');

        try {
            const apiKey = sources[selectedSource]?.apiKey;
            const result = await analyticsService.fetchStockData(
                symbol.toUpperCase(),
                period,
                selectedSource,
                apiKey
            );
            setData(result);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch analytics data');
            setData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyze = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticker.trim()) {
            setError('Please enter a ticker symbol');
            return;
        }
        activityService.addActivity('run_analysis', ticker.toUpperCase());
        fetchData(ticker);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    const formatPercent = (value: number) => {
        return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
    };

    const formatVolume = (value: number) => {
        if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
        if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
        if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
        return value.toString();
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
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', fontWeight: 700, color: '#fff' }}>
                        Advanced Analytics
                    </h1>
                    <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
                        Technical analysis, AI predictions, and algorithmic backtesting
                    </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleAnalyze} style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            value={ticker}
                            onChange={(e) => setTicker(e.target.value.toUpperCase())}
                            placeholder="Enter ticker (e.g., AAPL)"
                            style={{
                                flex: '1 1 200px',
                                padding: '12px 16px',
                                background: '#0a0a0a',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none',
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                            onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)')}
                        />
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            style={{
                                padding: '12px 16px',
                                background: '#0a0a0a',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px',
                                outline: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            <option value="1mo">1 Month</option>
                            <option value="3mo">3 Months</option>
                            <option value="6mo">6 Months</option>
                            <option value="1y">1 Year</option>
                            <option value="2y">2 Years</option>
                        </select>
                        <DataSourceSelector />
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                padding: '12px 32px',
                                background: loading ? '#555' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'transform 0.15s ease',
                            }}
                            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-1px)')}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                            {loading ? 'Fetching Data...' : 'Analyze'}
                        </button>
                    </div>
                </form>

                {/* Error Message */}
                {error && (
                    <div
                        style={{
                            padding: '16px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            marginBottom: '32px',
                        }}
                    >
                        {error}
                    </div>
                )}

                {/* Analytics Content */}
                {data && (
                    <>
                        {/* Main Stats Grid */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                gap: '16px',
                                marginBottom: '32px',
                            }}
                        >
                            <AnalyticsCard
                                label="Current Price"
                                value={formatCurrency(data.statistics.currentPrice)}
                                trend={data.statistics.change >= 0 ? 'up' : 'down'}
                            />
                            <AnalyticsCard
                                label="Change"
                                value={formatPercent(data.statistics.changePercent)}
                                trend={data.statistics.changePercent >= 0 ? 'up' : 'down'}
                                subtitle={formatCurrency(data.statistics.change)}
                            />
                            <AnalyticsCard
                                label="Volatility"
                                value={formatPercent(data.statistics.volatility * 100)}
                                subtitle="Annualized"
                            />
                            <AnalyticsCard
                                label="Volume"
                                value={formatVolume(data.statistics.volume)}
                            />
                            <AnalyticsCard
                                label="Trend"
                                value={data.statistics.trend.toUpperCase()}
                                trend={data.statistics.trend === 'bullish' ? 'up' : data.statistics.trend === 'bearish' ? 'down' : 'neutral'}
                            />
                            {data.indicators.rsi && data.indicators.rsi.length > 0 && (
                                <AnalyticsCard
                                    label="RSI (14)"
                                    value={data.indicators.rsi[data.indicators.rsi.length - 1].toFixed(2)}
                                    subtitle={
                                        data.indicators.rsi[data.indicators.rsi.length - 1] > 70 ? 'Overbought' :
                                        data.indicators.rsi[data.indicators.rsi.length - 1] < 30 ? 'Oversold' : 'Neutral'
                                    }
                                    trend={
                                        data.indicators.rsi[data.indicators.rsi.length - 1] > 70 ? 'down' :
                                        data.indicators.rsi[data.indicators.rsi.length - 1] < 30 ? 'up' : 'neutral'
                                    }
                                />
                            )}
                            {data.indicators.macd && data.indicators.macd.MACD.length > 0 && (
                                <AnalyticsCard
                                    label="MACD"
                                    value={data.indicators.macd.MACD[data.indicators.macd.MACD.length - 1].toFixed(2)}
                                    subtitle={
                                        data.indicators.macd.MACD[data.indicators.macd.MACD.length - 1] >
                                        data.indicators.macd.signal[data.indicators.macd.signal.length - 1]
                                            ? 'Bullish Signal'
                                            : 'Bearish Signal'
                                    }
                                    trend={
                                        data.indicators.macd.MACD[data.indicators.macd.MACD.length - 1] >
                                        data.indicators.macd.signal[data.indicators.macd.signal.length - 1]
                                            ? 'up'
                                            : 'down'
                                    }
                                />
                            )}
                            {data.indicators.bollingerBands && data.indicators.bollingerBands.upper.length > 0 && (
                                <AnalyticsCard
                                    label="Bollinger Bands"
                                    value={formatCurrency(data.indicators.bollingerBands.middle[data.indicators.bollingerBands.middle.length - 1])}
                                    subtitle={`Width: ${(
                                        ((data.indicators.bollingerBands.upper[data.indicators.bollingerBands.upper.length - 1] -
                                        data.indicators.bollingerBands.lower[data.indicators.bollingerBands.lower.length - 1]) /
                                        data.indicators.bollingerBands.middle[data.indicators.bollingerBands.middle.length - 1]) * 100
                                    ).toFixed(2)}%`}
                                />
                            )}
                        </div>

                        {/* Tabs */}
                        <div style={{ borderBottom: '1px solid #333', marginBottom: '20px', display: 'flex' }}>
                            <TabButton active={activeTab === 'technical'} onClick={() => setActiveTab('technical')}>Technical Chart</TabButton>
                            <TabButton active={activeTab === 'prediction'} onClick={() => setActiveTab('prediction')}>AI Prediction</TabButton>
                            <TabButton active={activeTab === 'simulation'} onClick={() => setActiveTab('simulation')}>Simulate</TabButton>
                            <TabButton active={activeTab === 'backtest'} onClick={() => setActiveTab('backtest')}>Backtesting</TabButton>
                        </div>

                        {/* Tab Panels */}
                        {activeTab === 'technical' && (
                            <PriceChart data={data.historical} indicators={data.indicators} ticker={data.ticker} />
                        )}

                        {activeTab === 'prediction' && (
                            <div>
                                <div style={{ marginBottom: '10px', color: '#aaa', fontSize: '14px' }}>
                                    Use machine learning models to forecast future price movements.
                                </div>
                                <PredictionPanel ticker={data.ticker} />
                            </div>
                        )}

                        {activeTab === 'simulation' && (
                            <div>
                                <div style={{ marginBottom: '10px', color: '#aaa', fontSize: '14px' }}>
                                    Simulate thousands of possible future price paths to estimate risk.
                                </div>
                                <SimulationPanel ticker={data.ticker} />
                            </div>
                        )}

                        {activeTab === 'backtest' && (
                            <div>
                                <div style={{ marginBottom: '10px', color: '#aaa', fontSize: '14px' }}>
                                    Test trading strategies against historical data.
                                </div>
                                <BacktestPanel ticker={data.ticker} />
                            </div>
                        )}
                    </>
                )}

                {/* Empty State */}
                {!data && !loading && !error && (
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
                            Advanced Market Analytics
                        </h2>
                        <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
                            Enter a ticker to unlock Technical Analysis, AI Predictions, Simulations, and Backtesting
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
