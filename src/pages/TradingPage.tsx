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

    // Mobile Tab State
    const [activeMobileTab, setActiveMobileTab] = useState<'chart' | 'trade' | 'portfolio' | 'market'>('chart');

    // Mobile Tab Styles
    const mobileTabStyle = (isActive: boolean) => ({
        flex: 1,
        padding: '12px',
        textAlign: 'center' as const,
        fontSize: '13px',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? '#3b82f6' : '#888',
        borderBottom: isActive ? '2px solid #3b82f6' : '2px solid transparent',
        cursor: 'pointer',
        background: 'transparent',
    });

    return (
        <div className="page-container">
            {/* Header - Fixed */}
            <div style={{
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#0f172a',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                    <TickerSearch
                        currentSymbol={symbol}
                        onSymbolChange={handleSymbolChange}
                    />
                    <div className="desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#22c55e', fontWeight: 600 }}>● LIVE</span>
                    </div>
                </div>
                <div className="desktop-only">
                    <DataSourceSelector />
                </div>
            </div>

            {/* Mobile Tab Navigation (Visible only on Mobile) */}
            <div className="mobile-tabs" style={{ display: 'none', background: '#0f172a', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div onClick={() => setActiveMobileTab('chart')} style={mobileTabStyle(activeMobileTab === 'chart')}>Chart</div>
                <div onClick={() => setActiveMobileTab('trade')} style={mobileTabStyle(activeMobileTab === 'trade')}>Trade</div>
                <div onClick={() => setActiveMobileTab('portfolio')} style={mobileTabStyle(activeMobileTab === 'portfolio')}>Positions</div>
                <div onClick={() => setActiveMobileTab('market')} style={mobileTabStyle(activeMobileTab === 'market')}>Market</div>
            </div>
            <style>{`
                @media (max-width: 1023px) {
                    .mobile-tabs { display: flex !important; }
                    .desktop-only { display: none !important; }
                    .trading-grid { display: none !important; } /* Hide Grid, Show Mobile Views */
                    .mobile-view { display: block !important; padding: 16px; height: calc(100vh - 120px); overflow-y: auto; }
                }
                @media (min-width: 1024px) {
                    .mobile-view { display: none !important; }
                }
            `}</style>

            {/* Desktop Grid Layout (Hidden on Mobile) */}
            <div className="trading-grid">
                {/* 1. Left Column: Charts & Portfolio */}
                <div className="chart-section">
                    <div style={{ height: '500px', background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <StockChart symbol={symbol} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 2fr) 1fr', gap: '24px' }}>
                        <PortfolioChart />
                        <PnLMetrics quotes={quotes} />
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <h3 style={{ color: '#fff', marginBottom: '16px' }}>Portfolio</h3>
                        <PortfolioTable quotes={quotes} />
                    </div>
                </div>

                {/* 2. Right Column: Sidebar */}
                <div className="sidebar-section">
                    <OrderEntry symbol={symbol} currentPrice={quotes[symbol]?.price || 0} onOrderPlaced={() => { }} />
                    <div style={{ flex: 1, minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
                        <MarketSidebar onSelectSymbol={handleSymbolChange} />
                    </div>
                </div>
            </div>

            {/* Mobile View Container (Visible only on Mobile) */}
            <div className="mobile-view">
                {activeMobileTab === 'chart' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ height: '400px', background: '#1a1a2e', borderRadius: '12px', overflow: 'hidden' }}>
                            <StockChart symbol={symbol} />
                        </div>
                        <PnLMetrics quotes={quotes} />
                    </div>
                )}

                {activeMobileTab === 'trade' && (
                    <OrderEntry symbol={symbol} currentPrice={quotes[symbol]?.price || 0} onOrderPlaced={() => setActiveMobileTab('portfolio')} />
                )}

                {activeMobileTab === 'portfolio' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <PortfolioChart />
                        <PortfolioTable quotes={quotes} />
                    </div>
                )}

                {activeMobileTab === 'market' && (
                    <div style={{ height: '100%' }}>
                        <MarketSidebar onSelectSymbol={(s) => { handleSymbolChange(s); setActiveMobileTab('chart'); }} />
                    </div>
                )}
            </div>
        </div>
    );
}
