import { useEffect, useRef, useState } from 'react';
import type { StockData, TechnicalIndicators } from '../../services/analytics-service';

interface PriceChartProps {
    data: StockData[];
    indicators: TechnicalIndicators;
    ticker: string;
}

export function PriceChart({ data, indicators, ticker }: PriceChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);
    const [plotly, setPlotly] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Load Plotly dynamically
    useEffect(() => {
        import('plotly.js-dist-min')
            .then((module) => {
                setPlotly(module.default || module);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to load Plotly:', err);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        if (!chartRef.current || !data || data.length === 0 || !plotly || loading) return;

        const dates = data.map(d => d.date);
        const traces: any[] = [];

        // Candlestick trace
        traces.push({
            x: dates,
            close: data.map(d => d.close),
            high: data.map(d => d.high),
            low: data.map(d => d.low),
            open: data.map(d => d.open),
            decreasing: { line: { color: '#ef4444' } },
            increasing: { line: { color: '#10b981' } },
            type: 'candlestick',
            name: 'OHLC',
            yaxis: 'y',
        });

        // SMA 20
        if (indicators.sma20 && indicators.sma20.length > 0) {
            const offset = data.length - indicators.sma20.length;
            traces.push({
                x: dates.slice(offset),
                y: indicators.sma20,
                type: 'scatter',
                mode: 'lines',
                name: 'SMA 20',
                line: { color: '#fb923c', width: 1.5 },
                yaxis: 'y',
            });
        }

        // SMA 50
        if (indicators.sma50 && indicators.sma50.length > 0) {
            const offset = data.length - indicators.sma50.length;
            traces.push({
                x: dates.slice(offset),
                y: indicators.sma50,
                type: 'scatter',
                mode: 'lines',
                name: 'SMA 50',
                line: { color: '#f59e0b', width: 1.5 },
                yaxis: 'y',
            });
        }

        // EMA 9
        if (indicators.ema9 && indicators.ema9.length > 0) {
            const offset = data.length - indicators.ema9.length;
            traces.push({
                x: dates.slice(offset),
                y: indicators.ema9,
                type: 'scatter',
                mode: 'lines',
                name: 'EMA 9',
                line: { color: '#06b6d4', width: 1.5, dash: 'dot' },
                yaxis: 'y',
            });
        }

        // EMA 21
        if (indicators.ema21 && indicators.ema21.length > 0) {
            const offset = data.length - indicators.ema21.length;
            traces.push({
                x: dates.slice(offset),
                y: indicators.ema21,
                type: 'scatter',
                mode: 'lines',
                name: 'EMA 21',
                line: { color: '#3b82f6', width: 1.5, dash: 'dot' },
                yaxis: 'y',
            });
        }

        // EMA 200
        if (indicators.ema200 && indicators.ema200.length > 0) {
            const offset = data.length - indicators.ema200.length;
            traces.push({
                x: dates.slice(offset),
                y: indicators.ema200,
                type: 'scatter',
                mode: 'lines',
                name: 'EMA 200',
                line: { color: '#6366f1', width: 2, dash: 'dot' },
                yaxis: 'y',
            });
        }

        // Bollinger Bands
        if (indicators.bollingerBands) {
            const offset = data.length - indicators.bollingerBands.upper.length;
            traces.push({
                x: dates.slice(offset),
                y: indicators.bollingerBands.upper,
                type: 'scatter',
                mode: 'lines',
                name: 'BB Upper',
                line: { color: 'rgba(147, 51, 234, 0.3)', width: 1 },
                yaxis: 'y',
            });
            traces.push({
                x: dates.slice(offset),
                y: indicators.bollingerBands.lower,
                type: 'scatter',
                mode: 'lines',
                name: 'BB Lower',
                line: { color: 'rgba(147, 51, 234, 0.3)', width: 1 },
                fill: 'tonexty',
                fillcolor: 'rgba(147, 51, 234, 0.1)',
                yaxis: 'y',
            });
        }

        // Volume bars
        traces.push({
            x: dates,
            y: data.map(d => d.volume),
            type: 'bar',
            name: 'Volume',
            marker: { color: '#374151' },
            yaxis: 'y2',
        });

        // RSI
        if (indicators.rsi && indicators.rsi.length > 0) {
            const offset = data.length - indicators.rsi.length;
            traces.push({
                x: dates.slice(offset),
                y: indicators.rsi,
                type: 'scatter',
                mode: 'lines',
                name: 'RSI',
                line: { color: '#a855f7', width: 1.5 },
                yaxis: 'y3',
            });
            // Add RSI overbought/oversold lines
            traces.push({
                x: dates.slice(offset),
                y: Array(indicators.rsi.length).fill(70),
                type: 'scatter',
                mode: 'lines',
                name: 'Overbought',
                line: { color: '#ef4444', width: 0.5, dash: 'dash' },
                yaxis: 'y3',
                showlegend: false,
            });
            traces.push({
                x: dates.slice(offset),
                y: Array(indicators.rsi.length).fill(30),
                type: 'scatter',
                mode: 'lines',
                name: 'Oversold',
                line: { color: '#10b981', width: 0.5, dash: 'dash' },
                yaxis: 'y3',
                showlegend: false,
            });
        }

        // MACD
        if (indicators.macd && indicators.macd.MACD.length > 0) {
            const offset = data.length - indicators.macd.MACD.length;

            // MACD Histogram
            traces.push({
                x: dates.slice(offset),
                y: indicators.macd.histogram,
                type: 'bar',
                name: 'MACD Histogram',
                marker: {
                    color: indicators.macd.histogram.map(val => val >= 0 ? '#10b981' : '#ef4444'),
                },
                yaxis: 'y4',
            });

            // MACD Line
            traces.push({
                x: dates.slice(offset),
                y: indicators.macd.MACD,
                type: 'scatter',
                mode: 'lines',
                name: 'MACD',
                line: { color: '#3b82f6', width: 1.5 },
                yaxis: 'y4',
            });

            // Signal Line
            traces.push({
                x: dates.slice(offset),
                y: indicators.macd.signal,
                type: 'scatter',
                mode: 'lines',
                name: 'Signal',
                line: { color: '#f59e0b', width: 1.5 },
                yaxis: 'y4',
            });
        }

        const layout: any = {
            title: {
                text: `${ticker} Price Chart`,
                font: { color: '#fff', size: 18 },
            },
            plot_bgcolor: '#0a0a0a',
            paper_bgcolor: '#0a0a0a',
            font: { color: '#9ca3af', family: "'Inter', sans-serif" },
            showlegend: true,
            legend: {
                orientation: 'h',
                y: 1.1,
                x: 0,
                font: { color: '#9ca3af', size: 10 },
            },
            hovermode: 'x unified',
            xaxis: {
                type: 'date',
                gridcolor: '#1a1a1a',
                rangeslider: { visible: false },
            },
            yaxis: {
                title: 'Price ($)',
                gridcolor: '#1a1a1a',
                domain: [0.50, 1],
            },
            yaxis2: {
                title: 'Volume',
                gridcolor: '#1a1a1a',
                domain: [0.38, 0.48],
            },
            yaxis3: {
                title: 'RSI',
                gridcolor: '#1a1a1a',
                domain: [0.19, 0.36],
                range: [0, 100],
            },
            yaxis4: {
                title: 'MACD',
                gridcolor: '#1a1a1a',
                domain: [0, 0.17],
            },
            margin: { l: 60, r: 20, t: 60, b: 40 },
            autosize: true,
        };

        const config = {
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            modeBarButtonsToRemove: ['lasso2d', 'select2d'],
        };

        plotly.newPlot(chartRef.current, traces, layout, config);

        return () => {
            if (chartRef.current && plotly) {
                plotly.purge(chartRef.current);
            }
        };
    }, [data, indicators, ticker, plotly, loading]);

    return (
        <div
            ref={chartRef}
            style={{
                width: '100%',
                height: '800px',
                background: '#0a0a0a',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {loading && (
                <div style={{ color: '#888', fontSize: '14px' }}>
                    Loading chart...
                </div>
            )}
        </div>
    );
}
