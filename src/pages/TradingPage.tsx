import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { StockChart } from '../components/Chart/StockChart';
import { OrderEntry } from '../components/Trading/OrderEntry';
import { PortfolioTable } from '../components/Trading/PortfolioTable';
import { DataSourceSelector } from '../components/DataSourceSelector/DataSourceSelector';
import { TickerSearch } from '../components/TickerSearch/TickerSearch';
import { useTradingStore } from '../services/trading-service';
import { BASE_URL } from '../services/api-client';

export function TradingPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const symbolParam = searchParams.get('symbol');
    const [symbol, setSymbol] = useState(symbolParam || 'SPY');
    const [quotes, setQuotes] = useState<Record<string, number>>({});
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

            const newQuotes: Record<string, number> = { ...quotes };

            // We'll fetch them individually for now (Yahoo Proxy limitation)
            // In a real app, we'd use a bulk endpoint.
            for (const s of symbolsToFetch) {
                try {
                    const response = await fetch(`${BASE_URL}/api/yahoo/v8/finance/chart/${s}`);
                    const data = await response.json();
                    const result = data?.chart?.result?.[0];
                    if (result?.meta?.regularMarketPrice) {
                        newQuotes[s] = result.meta.regularMarketPrice;
                    } else if (result?.meta?.chartPreviousClose) {
                        newQuotes[s] = result.meta.chartPreviousClose;
                    }
                } catch (e) {
                    // console.error(`Failed to fetch quote for ${s}`, e);
                }
            }
            setQuotes(newQuotes);
        };

        fetchQuotes();
        const interval = setInterval(fetchQuotes, 5000); // 5s refresh
        return () => clearInterval(interval);
    }, [symbol, holdings]); // Re-run if symbol or holdings change

    return (
        <div style={{ padding: '24px', height: 'calc(100vh - 50px)', overflowY: 'auto', boxSizing: 'border-box' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h1 style={{ margin: 0, fontSize: '24px', color: '#fff' }}>Paper Trading</h1>
                    <TickerSearch
                        currentSymbol={symbol}
                        onSymbolChange={handleSymbolChange}
                    />
                </div>
                <DataSourceSelector />
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 320px',
                gridTemplateRows: '500px auto',
                gap: '24px'
            }}>
                {/* 1. Chart Area */}
                <div style={{
                    background: '#1a1a2e',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    <StockChart symbol={symbol} />
                </div>

                {/* 2. Order Ticket */}
                <div>
                    <OrderEntry
                        symbol={symbol}
                        currentPrice={quotes[symbol] || 0}
                        onOrderPlaced={() => { /* maybe refresh logic */ }}
                    />
                </div>

                {/* 3. Portfolio Table (Full Width Bottom) */}
                <div style={{ gridColumn: '1 / -1' }}>
                    <h3 style={{ color: '#fff', marginBottom: '16px' }}>Your Portfolio</h3>
                    <PortfolioTable quotes={quotes} />
                </div>
            </div>
        </div>
    );
}
