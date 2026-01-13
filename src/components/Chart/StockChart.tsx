import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ChartContainer } from './ChartContainer';
import { DataService, type DataServiceConfig } from '../../services/data-service';
import { useDataSourceStore } from '../../services/data-source-config';
import { useDimensions } from '../../hooks/useDimensions';
import { useThemeStore, getThemeColors } from '../../services/theme-service';
import { TimeSyncManager } from '../../core/synchronization/time-sync-manager';
import type { Candle } from '../../core/renderer/types';

interface StockChartProps {
    symbol: string;
}

export function StockChart({ symbol }: StockChartProps) {
    const { ref: chartRef, dimensions } = useDimensions<HTMLDivElement>();
    const { selectedSource, sources } = useDataSourceStore();
    const { theme: themeMode } = useThemeStore();
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

    // Update data service config when data source or symbol changes
    useEffect(() => {
        if (dataServiceRef.current) {
            dataServiceRef.current.updateConfig(dataSourceConfig);
            dataServiceRef.current.fetchHistory(symbol, '1d', '3mo'); // Default 3mo history
        }
    }, [dataSourceConfig, symbol]);

    return (
        <div ref={chartRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
            {dimensions.width > 0 && dimensions.height > 0 && (
                <ChartContainer
                    id={`chart-${symbol}`}
                    width={dimensions.width}
                    height={dimensions.height}
                    theme={theme}
                    data={candles}
                    syncManager={syncManager}
                />
            )}
        </div>
    );
}
