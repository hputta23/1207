import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StockChart } from '../components/Chart/StockChart';
import { OrderEntry } from '../components/Trading/OrderEntry';
import { PortfolioTable } from '../components/Trading/PortfolioTable';
import { PortfolioChart } from '../components/Trading/PortfolioChart';
import { MarketSidebar } from '../components/Trading/MarketSidebar'; // New
import { PnLMetrics } from '../components/Trading/PnLMetrics';
import { DataSourceSelector } from '../components/DataSourceSelector/DataSourceSelector';
import { TickerSearch } from '../components/TickerSearch/TickerSearch';
import { useTradingStore } from '../services/trading-service';
import { BASE_URL } from '../services/api-client';

export function TradingPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const symbolParam = searchParams.get('symbol');
    const [symbol, setSymbol] = useState(symbolParam || 'SPY');
    // Store more details: price, change, changePercent
    const [quotes, setQuotes] = useState<Record<string, { price: number; change: number; changePercent: number }>>({});
    const { holdings } = useTradingStore();

    // Sync state with URL
    useEffect(() => {
        if (symbolParam && symbolParam !== symbol) {
            setSymbol(symbolParam);
        }
    }, [symbolParam]);

    const handleSymbolChange = (newSymbol: string) => {
        setSymbol(newSymbol);
        setSearchParams({ symbol: newSymbol });
    };

    // Fetch Quotes Logic
    useEffect(() => {
        const fetchQuotes = async () => {
            const symbolsToFetch = new Set<string>();
            symbolsToFetch.add(symbol);
            Object.keys(holdings).forEach(s => symbolsToFetch.add(s));

            const newQuotes = { ...quotes };
            let pricesForTracking: Record<string, number> = {};

            // We'll fetch them individually for now (Yahoo Proxy limitation)
            // In a real app, we'd use a bulk endpoint.
            for (const s of symbolsToFetch) {
                try {
                    const response = await fetch(`${BASE_URL}/api/yahoo/v8/finance/chart/${s}`);
                    const data = await response.json();
                    const result = data?.chart?.result?.[0];
                    const meta = result?.meta;

                    if (meta) {
                        const price = meta.regularMarketPrice || meta.chartPreviousClose || 0;
                        const prevClose = meta.chartPreviousClose || price;
                        const change = price - prevClose;
                        const changePercent = prevClose ? (change / prevClose) * 100 : 0;

                        newQuotes[s] = { price, change, changePercent };
                        pricesForTracking[s] = price; // Track price
                    }
                } catch (e) {
                    // console.error(`Failed to fetch quote for ${s}`, e);
                }
            }
            setQuotes(newQuotes);

            // Track Value
            useTradingStore.getState().trackPortfolioValue(pricesForTracking);
        };

        fetchQuotes();
        const interval = setInterval(fetchQuotes, 5000); // 5s refresh
        return () => clearInterval(interval);
    }, [symbol, holdings]); // Re-run if symbol or holdings change

    return (
        <div className="page-container">
            {/* Header - Fixed */}
            <div style={{
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: '#0f172a',
                flexWrap: 'wrap',
                gap: '16px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                    <h1 style={{ margin: 0, fontSize: 'clamp(18px, 4vw, 20px)', color: '#fff' }}>Paper Trading Dashboard</h1>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)',
                        padding: '4px 8px', borderRadius: '4px'
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 8px #22c55e' }}></div>
                        <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600, whiteSpace: 'nowrap' }}>LIVE (DELAYED)</span>
                    </div>
                </div>
                <div style={{ flexGrow: 1, maxWidth: '400px', display: 'flex', gap: '16px', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <TickerSearch
                        currentSymbol={symbol}
                        onSymbolChange={handleSymbolChange}
                    />
                    <DataSourceSelector />
                </div>
            </div>

            {/* Main Content - Responsive Grid */}
            <div className="trading-grid">
                {/* 1. Left Column: Charts & Portfolio */}
                <div className="chart-section">
                    {/* Main Stock Chart */}
                    <div style={{
                        height: 'clamp(300px, 50vh, 500px)',
                        minHeight: '300px',
                        background: '#1a1a2e',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                        <StockChart symbol={symbol} />
                    </div>

                    {/* Portfolio Components */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '24px'
                    }}>
                        <PortfolioChart />
                        <div>
                            <h3 style={{ margin: '0 0 16px', fontSize: '14px', color: '#888', fontWeight: 600 }}>METRICS</h3>
                            <PnLMetrics quotes={quotes} />
                        </div>
                    </div>

                    {/* Portfolio Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <h3 style={{ color: '#fff', marginBottom: '16px' }}>Your Portfolio</h3>
                        <PortfolioTable quotes={quotes} />
                    </div>
                </div>

                {/* 2. Right Column: Order Entry & Watchlist */}
                <div className="sidebar-section">
                    <OrderEntry
                        symbol={symbol}
                        currentPrice={quotes[symbol]?.price || 0}
                        onOrderPlaced={() => { }}
                    />

                    {/* Market Sidebar - Set exact height or flex to ensure visibility */}
                    <div style={{ flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                        <MarketSidebar onSelectSymbol={handleSymbolChange} />
                    </div>
                </div>
            </div>
        </div>
    );
}
