import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChartContainer } from './ChartContainer';
import { ChartControls, type Timeframe } from './ChartControls';
import { DataService, type DataServiceConfig } from '../../services/data-service';
import { useDataSourceStore } from '../../services/data-source-config';
import { useDimensions } from '../../hooks/useDimensions';
import { useThemeStore, getThemeColors } from '../../services/theme-service';
import { TimeSyncManager } from '../../core/synchronization/time-sync-manager';
import type { Candle } from '../../core/renderer/types';

interface StockChartProps {
    symbol: string;
}

interface IndicatorState {
    sma: boolean;
    ema: boolean;
    volume: boolean;
}

export function StockChart({ symbol }: StockChartProps) {
    const { ref: chartRef, dimensions } = useDimensions<HTMLDivElement>();
    const { selectedSource, sources } = useDataSourceStore();
    const { theme: themeMode } = useThemeStore();

    // Chart State
    const [interval, setInterval] = useState<Timeframe>('5m'); // Default 5m as requested
    const [indicators, setIndicators] = useState<IndicatorState>({
        sma: false,
        ema: false,
        volume: true
    });

    const theme = useMemo(() => {
        const colors = getThemeColors(themeMode);
        return {
            background: colors.background,
            text: colors.text,
            grid: colors.border,
            bullish: '#22c55e',
            bearish: '#ef4444',
            crosshair: '#ffffff',
            primary: '#3b82f6'
        };
    }, [themeMode]);

    const [candles, setCandles] = useState<Candle[]>([]);
    const dataServiceRef = useRef<DataService | null>(null);
    const syncManager = useRef(new TimeSyncManager()).current;

    // Get data source config
    const dataSourceConfig: DataServiceConfig = useMemo(() => ({
        dataSource: selectedSource,
        apiKey: sources[selectedSource]?.apiKey,
    }), [selectedSource, sources]);

    if (!dataServiceRef.current) {
        dataServiceRef.current = new DataService(false, symbol, dataSourceConfig);
    }

    useEffect(() => {
        const unsubscribe = dataServiceRef.current!.subscribe(setCandles);
        return () => {
            unsubscribe();
            dataServiceRef.current?.stop();
        };
    }, []);

    // Update data when Config, Symbol, OR Interval changes
    useEffect(() => {
        if (dataServiceRef.current) {
            dataServiceRef.current.updateConfig(dataSourceConfig);
            // Fetch with selected interval
            dataServiceRef.current.fetchHistory(symbol, interval);
        }
    }, [dataSourceConfig, symbol, interval]);

    // Handle Indicator Toggles (Mock data for now until calculation service exists)
    const indicatorData = useMemo(() => {
        const data: any = { indicatorList: [] };
        // We would calculate SMA/EMA here based on 'candles'
        return data;
    }, [candles, indicators]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
            {/* Toolbar */}
            <ChartControls
                symbol={symbol}
                interval={interval}
                indicators={indicators}
                onIntervalChange={setInterval}
                onIndicatorToggle={(key) => setIndicators(prev => ({ ...prev, [key]: !prev[key] }))}
            />

            {/* Chart Area */}
            <div ref={chartRef} style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                {dimensions.width > 0 && dimensions.height > 0 && (
                    <ChartContainer
                        id={`chart-${symbol}`}
                        width={dimensions.width}
                        height={dimensions.height}
                        theme={theme}
                        data={candles}
                        syncManager={syncManager}
                        indicatorData={indicatorData}
                    />
                )}
            </div>
        </div>
    );
}
