import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { useStore } from '../state/store';
import { ChartContainer } from '../components/Chart/ChartContainer';
import { TimeSyncManager } from '../core/synchronization/time-sync-manager';
import { DataService, type DataServiceConfig } from '../services/data-service';
import { useDimensions } from '../hooks/useDimensions';
import { Indicators } from '../core/data/indicators';
import { TickerSearch } from '../components/TickerSearch/TickerSearch';
import { IndicatorSelector, type IndicatorConfig } from '../components/IndicatorSelector/IndicatorSelector';
import { DataSourceSelector } from '../components/DataSourceSelector/DataSourceSelector';
import { useDataSourceStore } from '../services/data-source-config';
import type { Candle } from '../core/renderer/types';

// Chart configuration interface
interface ChartConfig {
    id: string;
    symbol: string;
    indicators: IndicatorConfig[];
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Chart Panel Header Component
interface ChartPanelHeaderProps {
    chartId: string;
    symbol: string;
    onSymbolChange: (symbol: string) => void;
    indicators: IndicatorConfig[];
    onIndicatorsChange: (indicators: IndicatorConfig[]) => void;
    lastPrice?: number;
    priceChange?: number;
    onRemove?: () => void;
    canRemove?: boolean;
}

const ChartPanelHeader: React.FC<ChartPanelHeaderProps> = ({
    chartId,
    symbol,
    onSymbolChange,
    indicators,
    onIndicatorsChange,
    lastPrice,
    priceChange,
    onRemove,
    canRemove,
}) => {
    const isPositive = (priceChange ?? 0) >= 0;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '44px',
            background: 'linear-gradient(180deg, rgba(18,18,18,0.95) 0%, rgba(18,18,18,0.85) 100%)',
            borderBottom: '1px solid #2a2a2a',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: '12px',
            zIndex: 50,
            backdropFilter: 'blur(8px)',
        }}>
            {/* Remove Chart Button - Moved to start for visibility */}
            {canRemove && onRemove && (
                <button
                    onClick={onRemove}
                    title="Remove this chart"
                    style={{
                        padding: '4px 8px',
                        background: 'transparent',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        color: '#666',
                        fontSize: '11px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#ef4444';
                        e.currentTarget.style.color = '#ef4444';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#333';
                        e.currentTarget.style.color = '#666';
                    }}
                >
                    ✕
                </button>
            )}

            {/* Ticker Search */}
            <TickerSearch
                currentSymbol={symbol}
                onSymbolChange={onSymbolChange}
                chartId={chartId}
            />

            {/* Price Display */}
            {lastPrice !== undefined && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    <span style={{
                        color: '#fff',
                        fontSize: '18px',
                        fontWeight: 600,
                        fontFamily: 'SF Mono, Consolas, monospace',
                    }}>
                        {lastPrice.toFixed(2)}
                    </span>
                    <span style={{
                        color: isPositive ? '#22c55e' : '#ef4444',
                        fontSize: '12px',
                        fontWeight: 500,
                    }}>
                        {isPositive ? '+' : ''}{(priceChange ?? 0).toFixed(2)}%
                    </span>
                </div>
            )}

            {/* Separator */}
            <div style={{ width: '1px', height: '20px', background: '#333' }} />

            {/* Indicator Selector */}
            <IndicatorSelector
                selectedIndicators={indicators}
                onIndicatorsChange={onIndicatorsChange}
            />

            {/* Active Indicators Display */}
            {indicators.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {indicators.slice(0, 3).map(ind => (
                        <span
                            key={ind.id}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '2px 8px',
                                background: '#1a1a1a',
                                borderRadius: '3px',
                                border: '1px solid #2a2a2a',
                                fontSize: '10px',
                                color: '#888',
                            }}
                        >
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: ind.color }} />
                            {ind.name}
                        </span>
                    ))}
                    {indicators.length > 3 && (
                        <span style={{ fontSize: '10px', color: '#555' }}>+{indicators.length - 3}</span>
                    )}
                </div>
            )}

            {/* Timeframe Selector */}
            <div style={{
                display: 'flex',
                gap: '2px',
                marginLeft: 'auto',
            }}>
                {['1m', '5m', '15m', '1H', '4H', '1D'].map((tf, i) => (
                    <button
                        key={tf}
                        style={{
                            padding: '4px 8px',
                            background: i === 3 ? '#3b82f6' : 'transparent',
                            border: 'none',
                            borderRadius: '3px',
                            color: i === 3 ? '#fff' : '#666',
                            fontSize: '11px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            if (i !== 3) e.currentTarget.style.background = '#252525';
                        }}
                        onMouseLeave={(e) => {
                            if (i !== 3) e.currentTarget.style.background = 'transparent';
                        }}
                    >
                        {tf}
                    </button>
                ))}
            </div>
        </div>
    );
};

// Single Chart Panel Component
interface ChartPanelProps {
    config: ChartConfig;
    onConfigChange: (config: ChartConfig) => void;
    onRemove: () => void;
    canRemove: boolean;
    candles: Candle[];
    syncManager: TimeSyncManager;
    theme: any;
    transform: any;
}

const ChartPanel: React.FC<ChartPanelProps> = ({
    config,
    onConfigChange,
    onRemove,
    canRemove,
    candles: _unusedCandles,
    syncManager,
    theme,
    transform,
}) => {
    const { ref: chartRef, dimensions } = useDimensions<HTMLDivElement>();
    const { selectedSource, sources } = useDataSourceStore();

    const [candles, setCandles] = useState<Candle[]>([]);
    const dataServiceRef = useRef<DataService | null>(null);

    // Get data source config
    const dataSourceConfig: DataServiceConfig = useMemo(() => ({
        dataSource: selectedSource,
        apiKey: sources[selectedSource]?.apiKey,
    }), [selectedSource, sources]);

    if (!dataServiceRef.current) {
        const isTestMode = new URLSearchParams(window.location.search).get('mode') === 'test';
        dataServiceRef.current = new DataService(isTestMode, config.symbol, dataSourceConfig);
    }

    useEffect(() => {
        const unsubscribe = dataServiceRef.current!.subscribe(setCandles);
        return () => {
            unsubscribe();
            dataServiceRef.current?.stop();
        };
    }, []);

    // Update data service config when data source changes
    useEffect(() => {
        if (dataServiceRef.current) {
            dataServiceRef.current.updateConfig(dataSourceConfig);
            dataServiceRef.current.fetchHistory(config.symbol, '1d', '1mo');
        }
    }, [dataSourceConfig, config.symbol]);

    const lastPrice = candles.length > 0 ? candles[candles.length - 1].close : undefined;
    const firstPrice = candles.length > 0 ? candles[0].open : undefined;
    const priceChange = lastPrice && firstPrice ? ((lastPrice - firstPrice) / firstPrice) * 100 : undefined;

    const indicatorResults = useMemo(() => {
        if (config.indicators.length === 0) return [];
        return Indicators.calculateIndicators(candles, config.indicators);
    }, [candles, config.indicators]);

    const indicatorData = useMemo(() => {
        if (indicatorResults.length === 0) return undefined;

        return {
            indicatorList: indicatorResults.map(ir => ({
                id: ir.id,
                name: ir.name,
                color: ir.color,
                points: ir.points,
            })),
        };
    }, [indicatorResults]);

    return (
        <div
            ref={chartRef}
            style={{
                width: '100%',
                height: '100%',
                position: 'relative',
                background: theme.background,
            }}
        >
            <ChartPanelHeader
                chartId={config.id}
                symbol={config.symbol}
                onSymbolChange={(symbol) => onConfigChange({ ...config, symbol })}
                indicators={config.indicators}
                onIndicatorsChange={(indicators) => onConfigChange({ ...config, indicators })}
                lastPrice={lastPrice}
                priceChange={priceChange}
                onRemove={onRemove}
                canRemove={canRemove}
            />
            {dimensions.width > 0 && dimensions.height > 0 && (
                <div style={{ paddingTop: '44px', height: '100%', boxSizing: 'border-box' }}>
                    <ChartContainer
                        id={config.id}
                        width={dimensions.width}
                        height={dimensions.height - 44}
                        theme={theme}
                        initialTransform={transform}
                        syncManager={syncManager}
                        data={candles}
                        indicatorData={indicatorData}
                    />
                </div>
            )}
        </div>
    );
};

export function ChartsPage() {
    const workspace = useStore((state) => state.workspace);

    const [charts, setCharts] = useState<ChartConfig[]>([
        { id: generateId(), symbol: 'SPY', indicators: [{ id: 'sma', name: 'SMA 20', period: 20, color: '#f59e0b', enabled: true }] },
        { id: generateId(), symbol: 'NVDA', indicators: [{ id: 'ema', name: 'EMA 20', period: 20, color: '#3b82f6', enabled: true }] },
    ]);

    const syncManagerRef = useRef<TimeSyncManager | null>(null);
    if (!syncManagerRef.current) syncManagerRef.current = new TimeSyncManager();

    const addChart = useCallback(() => {
        setCharts(prev => [
            ...prev,
            { id: generateId(), symbol: 'SPY', indicators: [] }
        ]);
    }, []);

    const removeChart = useCallback((id: string) => {
        setCharts(prev => prev.filter(c => c.id !== id));
    }, []);

    const updateChart = useCallback((id: string, config: ChartConfig) => {
        setCharts(prev => prev.map(c => c.id === id ? config : c));
    }, []);

    return (
        <div className="app-container" style={{
            width: '100vw',
            height: '100vh',
            overflow: 'hidden',
            background: '#0a0a0a',
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        }}>
            {/* Header Bar */}
            <div style={{
                height: '40px',
                background: '#111',
                borderBottom: '1px solid #222',
                display: 'flex',
                alignItems: 'center',
                padding: '0 16px',
                justifyContent: 'space-between',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '4px 10px',
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: '4px',
                        border: '1px solid rgba(34, 197, 94, 0.2)',
                    }}>
                        <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: '#22c55e',
                            boxShadow: '0 0 8px #22c55e',
                        }} />
                        <span style={{
                            color: '#22c55e',
                            fontSize: '11px',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                        }}>
                            Live
                        </span>
                    </div>

                    <DataSourceSelector />

                    <button
                        onClick={addChart}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 12px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '6px',
                            color: '#aaa',
                            fontSize: '12px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#3b82f6';
                            e.currentTarget.style.color = '#fff';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#333';
                            e.currentTarget.style.color = '#aaa';
                        }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        Add Chart
                    </button>

                    <span style={{ color: '#555', fontSize: '11px' }}>
                        {charts.length} chart{charts.length !== 1 ? 's' : ''}
                    </span>
                </div>
            </div>

            {/* Main Content - Dynamic Chart Grid */}
            <div style={{
                height: 'calc(100vh - 40px)',
                display: 'grid',
                gridTemplateColumns: charts.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))',
                gridTemplateRows: charts.length <= 2 ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '1px',
                background: '#222',
            }}>
                {charts.map((chart) => (
                    <ChartPanel
                        key={chart.id}
                        config={chart}
                        onConfigChange={(config) => updateChart(chart.id, config)}
                        onRemove={() => removeChart(chart.id)}
                        canRemove={charts.length > 1}
                        candles={[]}
                        syncManager={syncManagerRef.current!}
                        theme={workspace.theme}
                        transform={workspace.transform}
                    />
                ))}
            </div>
        </div>
    );
}
