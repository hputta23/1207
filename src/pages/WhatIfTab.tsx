import { useState, useEffect, useRef } from 'react';
import { DataService } from '../services/data-service';
import { TickerSearch } from '../components/TickerSearch/TickerSearch';
import Plotly from 'plotly.js-dist-min';


export function WhatIfTab() {
    const [symbol, setSymbol] = useState('');
    const [amount, setAmount] = useState('1000');
    const [date, setDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const chartRef = useRef<HTMLDivElement>(null);


    useEffect(() => {
        if (result && result.chartData && chartRef.current) {
            const times = result.chartData.map((c: any) => new Date(c.t));
            const values = result.chartData.map((c: any) => c.c * result.shares);
            const initialValue = parseFloat(amount);

            // Determine color based on profit/loss
            const isProfit = result.totalReturn >= 0;
            const lineColor = isProfit ? '#22c55e' : '#ef4444';

            const plotData = [{
                x: times,
                y: values,
                type: 'scatter',
                mode: 'lines',
                line: { color: lineColor, width: 2 },
                fill: 'tozeroy',
                fillcolor: isProfit ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                name: 'Portfolio Value'
            }];

            const layout = {
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                margin: { t: 20, r: 20, l: 40, b: 40 },
                showlegend: false,
                xaxis: {
                    gridcolor: 'rgba(255,255,255,0.05)',
                    zerolinecolor: 'rgba(255,255,255,0.1)',
                    tickfont: { color: '#64748b' }
                },
                yaxis: {
                    gridcolor: 'rgba(255,255,255,0.05)',
                    zerolinecolor: 'rgba(255,255,255,0.1)',
                    tickfont: { color: '#64748b' },
                    tickprefix: '$'
                },
                height: 300,
                // Add a dashed line for initial investment
                shapes: [{
                    type: 'line',
                    xref: 'paper',
                    x0: 0,
                    x1: 1,
                    yref: 'y',
                    y0: initialValue,
                    y1: initialValue,
                    line: {
                        color: '#64748b',
                        width: 1,
                        dash: 'dash'
                    }
                }]
            };

            const config = { responsive: true, displayModeBar: false };

            // @ts-ignore
            Plotly.newPlot(chartRef.current, plotData, layout, config);
        }
    }, [result]);

    const calculate = async () => {
        if (!symbol || !date || !amount) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const dataService = new DataService();
            // Fetch ample history to ensure we cover the requested dates
            // 'max' range is best, or calculate years needed
            const history = await dataService.getHistoryData(symbol, '1d', 'max');

            if (!history || history.length === 0) {
                throw new Error('No historical data found');
            }

            // Sort history by time just in case
            history.sort((a, b) => a.t - b.t);

            const startTime = new Date(date).getTime();
            const firstHistoryTime = history[0].t;
            const lastHistoryTime = history[history.length - 1].t;

            console.log(`Analyzing ${symbol}: Request ${date} (${startTime}), History Range: ${new Date(firstHistoryTime).toISOString()} - ${new Date(lastHistoryTime).toISOString()}`);

            if (startTime < firstHistoryTime) {
                throw new Error(`Entry date is before availble history for ${symbol} (Starts: ${new Date(firstHistoryTime).toLocaleDateString()})`);
            }

            // Find start candle: Exact or first candle POST selection?
            // "If I bought ON this date": means price at close of that day.
            // So we want the candle where candle.t covers that day.
            // Assuming candle.t is 00:00 or close time.
            // Let's find first candle where t >= startTime
            let startCandle = history.find(c => c.t >= startTime);

            // If we selected a weekend, we want the next Monday.
            if (!startCandle) {
                // If requested date is past the last candle
                if (startTime > lastHistoryTime) {
                    throw new Error('Entry date is in the future or no data available');
                }
            }

            // Find end candle
            let currentCandle;
            if (endDate) {
                const endTime = new Date(endDate).getTime();
                if (endTime < startTime) {
                    throw new Error('Exit date cannot be before entry date');
                }

                // Find candle closest to end date
                currentCandle = history.find(c => c.t >= endTime);

                if (!currentCandle) {
                    if (endTime > lastHistoryTime) {
                        currentCandle = history[history.length - 1]; // Use latest available
                    }
                }
            } else {
                // Default to latest
                currentCandle = history[history.length - 1];
            }

            if (!startCandle || !currentCandle) {
                throw new Error('Could not determine entry/exit prices');
            }

            const initialPrice = startCandle.c;
            const currentPrice = currentCandle.c;

            const investmentAmount = parseFloat(amount);
            const shares = investmentAmount / initialPrice;
            const currentValue = shares * currentPrice;
            const totalReturn = currentValue - investmentAmount;
            const roi = (totalReturn / investmentAmount) * 100;

            setResult({
                symbol: symbol.toUpperCase(),
                initialDate: new Date(startCandle.t),
                initialPrice,
                currentDate: new Date(currentCandle.t),
                currentPrice,
                shares,
                currentValue,
                totalReturn,
                roi,
                // Pass slice for chart if we want to render it
                chartData: history.filter(c => c.t >= startCandle.t && c.t <= currentCandle.t)
            });

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to calculate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            padding: 'clamp(24px, 5vw, 40px)',
            maxWidth: '1400px',
            margin: '0 auto',
            color: '#fff',
            minHeight: '100vh',
            fontFamily: 'Inter, -apple-system, sans-serif'
        }}>
            <h1 style={{
                marginBottom: '12px',
                fontSize: '32px',
                fontWeight: 700,
                letterSpacing: '-1px',
                background: 'linear-gradient(to right, #fff, #94a3b8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: 'inline-block'
            }}>
                What if simulator
            </h1>
            <p style={{ color: '#94a3b8', marginBottom: '40px', fontSize: '16px', maxWidth: '600px', lineHeight: '1.5' }}>
                Analyze potential returns by simulating entry points from the past. Backtest your investment thesis against historical market data.
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '32px',
                alignItems: 'start'
            }}>
                {/* Input Card */}
                <div style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    backdropFilter: 'blur(12px)',
                    padding: '32px',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.2)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                        <div style={{ width: '4px', height: '24px', background: '#3b82f6', borderRadius: '2px' }} />
                        <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#f8fafc', margin: 0 }}>Configuration</h2>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '13px', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                Asset
                            </label>
                            <div style={{ height: '48px', position: 'relative', zIndex: 10 }}>
                                <TickerSearch
                                    currentSymbol={symbol}
                                    onSymbolChange={(s) => setSymbol(s)}
                                />
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '13px', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                Entry Date
                            </label>

                            {/* Date Presets */}
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                                {[
                                    { label: 'YTD', getVal: () => { const d = new Date(); d.setMonth(0, 1); return d.toISOString().split('T')[0]; } },
                                    { label: '1Y', getVal: () => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return d.toISOString().split('T')[0]; } },
                                    { label: '5Y', getVal: () => { const d = new Date(); d.setFullYear(d.getFullYear() - 5); return d.toISOString().split('T')[0]; } },
                                    { label: 'COVID', getVal: () => '2020-03-20' }, // March 2020 low
                                    { label: "Trump '25", getVal: () => '2025-01-20' }, // Inauguration Day
                                ].map((preset) => (
                                    <button
                                        key={preset.label}
                                        onClick={() => setDate(preset.getVal())}
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.05)',
                                            border: '1px solid rgba(255, 255, 255, 0.1)',
                                            borderRadius: '6px',
                                            color: '#94a3b8',
                                            padding: '4px 10px',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                                            e.currentTarget.style.borderColor = '#3b82f6';
                                            e.currentTarget.style.color = '#3b82f6';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                                            e.currentTarget.style.color = '#94a3b8';
                                        }}
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                            </div>

                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    color: '#f8fafc',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    fontFamily: 'inherit'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '13px', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                Exit Date <span style={{ color: '#64748b', fontSize: '11px', textTransform: 'none', letterSpacing: '0' }}>(Optional, defaults to today)</span>
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={date}
                                max={new Date().toISOString().split('T')[0]}
                                style={{
                                    width: '100%',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    color: '#f8fafc',
                                    fontSize: '15px',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    fontFamily: 'inherit'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', color: '#94a3b8', marginBottom: '8px', fontSize: '13px', fontWeight: 500, letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                                Capital Allocation
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}>$</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="1000"
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.1)',
                                        padding: '14px 16px 14px 32px',
                                        borderRadius: '12px',
                                        color: '#f8fafc',
                                        fontSize: '15px',
                                        outline: 'none',
                                        transition: 'all 0.2s'
                                    }}
                                    onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                                    onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                                />
                            </div>
                        </div>

                        <button
                            onClick={calculate}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '16px',
                                marginTop: '8px',
                                background: loading ? '#334155' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                fontSize: '15px',
                                fontWeight: 600,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: loading ? 'none' : '0 4px 12px rgba(37, 99, 235, 0.2)'
                            }}
                            onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-1px)')}
                            onMouseLeave={(e) => !loading && (e.currentTarget.style.transform = 'translateY(0)')}
                        >
                            {loading ? 'Simulating...' : 'Run Simulation'}
                        </button>

                        {error && (
                            <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '10px', fontSize: '13px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* Results Card */}
                <div style={{
                    background: 'rgba(20, 20, 20, 0.6)',
                    backdropFilter: 'blur(12px)',
                    padding: '32px',
                    borderRadius: '24px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 4px 24px -1px rgba(0, 0, 0, 0.2)',
                    minHeight: '480px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: result ? 'flex-start' : 'center',
                    alignItems: result ? 'stretch' : 'center'
                }}>
                    {!result ? (
                        <div style={{ textAlign: 'center', opacity: 0.4 }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                margin: '0 auto 24px auto',
                                border: '2px dashed #64748b',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <span style={{ fontSize: '32px', color: '#64748b' }}>$</span>
                            </div>
                            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#94a3b8', marginBottom: '8px' }}>Ready to Simulate</h3>
                            <p style={{ fontSize: '14px', color: '#64748b', maxWidth: '280px', margin: '0 auto' }}>Enter your parameters to generate a historical performance report.</p>
                        </div>
                    ) : (
                        <div style={{ animation: 'fadeIn 0.5s ease' }}>
                            <div style={{
                                paddingBottom: '32px',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                marginBottom: '32px'
                            }}>
                                <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Valuation on {result.currentDate.toLocaleDateString()}</div>
                                <div style={{
                                    fontSize: '56px',
                                    fontWeight: 700,
                                    color: '#fff',
                                    letterSpacing: '-2px',
                                    lineHeight: 1,
                                    marginBottom: '16px'
                                }}>
                                    ${result.currentValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </div>

                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '20px', background: result.totalReturn >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}>
                                    <span style={{
                                        color: result.totalReturn >= 0 ? '#22c55e' : '#ef4444',
                                        fontWeight: 600,
                                        fontSize: '14px'
                                    }}>
                                        {result.totalReturn >= 0 ? '▲' : '▼'} {Math.abs(result.roi).toFixed(2)}%
                                    </span>
                                    <span style={{ color: result.totalReturn >= 0 ? '#86efac' : '#fca5a5', fontSize: '13px' }}>
                                        ({result.totalReturn >= 0 ? '+' : ''}${result.totalReturn.toLocaleString(undefined, { maximumFractionDigits: 2 })})
                                    </span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Entry Point</div>
                                    <div style={{ fontSize: '20px', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>${result.initialPrice.toFixed(2)}</div>
                                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>{result.initialDate.toLocaleDateString()}</div>
                                </div>
                                <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px' }}>
                                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Exit Point</div>
                                    <div style={{ fontSize: '20px', fontWeight: 600, color: '#e2e8f0', marginBottom: '4px' }}>${result.currentPrice.toFixed(2)}</div>
                                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>{result.currentDate.toLocaleDateString()}</div>
                                </div>
                                <div style={{ padding: '20px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '16px', gridColumn: 'span 2' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Volume</div>
                                            <div style={{ fontSize: '20px', fontWeight: 600, color: '#e2e8f0' }}>{result.shares.toFixed(4)} <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 400 }}>shares</span></div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', textTransform: 'uppercase' }}>Initial Capital</div>
                                            <div style={{ fontSize: '16px', fontWeight: 500, color: '#94a3b8' }}>${parseFloat(amount).toLocaleString()}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '32px', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Performance History</span>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>Baseline: ${parseFloat(amount).toLocaleString()}</span>
                                </div>
                                <div ref={chartRef} style={{ width: '100%', minHeight: '300px' }} />
                                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '16px', textAlign: 'center', fontStyle: 'italic' }}>
                                    Calculated using historical data from Yahoo Finance. Past performance is not indicative of future results.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
