import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/api-client';

interface BacktestPanelProps {
    ticker: string;
}

export function BacktestPanel({ ticker }: BacktestPanelProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<any>(null);
    const [backtestMode, setBacktestMode] = useState<'technical' | 'ai'>('technical');
    const [strategy, setStrategy] = useState('SMA_Crossover');
    const [modelType, setModelType] = useState('random_forest');
    const [initialCapital, setInitialCapital] = useState(10000);
    const [commission, setCommission] = useState(0.1); // 0.1% default
    const chartRef = useRef<HTMLDivElement>(null);
    const [plotlyLoaded, setPlotlyLoaded] = useState(false);

    useEffect(() => {
        import('plotly.js-dist-min').then((module) => {
            // @ts-ignore
            if (!window.Plotly) window.Plotly = module.default || module;
            setPlotlyLoaded(true);
        });
    }, []);

    const handleBacktest = async () => {
        setLoading(true);
        setError('');
        try {
            const requestData: any = {
                ticker,
                initial_capital: initialCapital,
                period: '2y',
                commission: commission / 100, // Convert percentage to decimal
            };

            if (backtestMode === 'technical') {
                requestData.strategy = strategy;
            } else {
                requestData.model_type = modelType;
            }

            const result = await apiClient.backtest(requestData);
            setData(result);
        } catch (err: any) {
            setError('Failed to run backtest. Ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (data && chartRef.current && plotlyLoaded) {
            // @ts-ignore
            const PlotlyLib = window.Plotly;

            // Both Technical and AI now return 'equity_curve' and 'dates' at top level
            // (AI returns it inside results[0], but backend now normalizes response to have top level keys too or we handle it)
            // Wait, backend AI response structure: { results: [...], dates: ..., equity_curve: ... } 

            const dates = data.dates || [];
            const equity = data.equity_curve || [];

            // Calculate Profit/Loss color
            const isProfit = equity.length > 0 && equity[equity.length - 1] >= initialCapital;
            const lineColor = isProfit ? '#10b981' : '#ef4444';
            const fillColor = isProfit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

            const traces = [
                {
                    x: dates,
                    y: equity,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Portfolio Value',
                    line: { color: lineColor, width: 2 },
                    fill: 'tozeroy',
                    fillcolor: fillColor
                }
            ];

            // Add 'Buy & Hold' benchmark if available or we can approximate it? 
            // For now let's stick to the equity curve.

            const title = backtestMode === 'technical'
                ? `Backtest: ${strategy} (Comm: ${commission}%)`
                : `AI Backtest: ${modelType} (Comm: ${commission}%)`;

            const layout = {
                title: { text: title, font: { color: '#fff' } },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#888' },
                xaxis: { gridcolor: '#333' },
                yaxis: { gridcolor: '#333', title: 'Equity ($)' },
            };

            PlotlyLib.newPlot(chartRef.current, traces, layout, { responsive: true, displayModeBar: false });
        }
    }, [data, plotlyLoaded, backtestMode, strategy, modelType, commission]);

    return (
        <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                <label style={{ color: '#bbb' }}>Type:</label>
                <select
                    value={backtestMode}
                    onChange={(e) => setBacktestMode(e.target.value as 'technical' | 'ai')}
                    style={{ padding: '8px', borderRadius: '4px', background: '#222', color: 'white', border: '1px solid #444' }}
                >
                    <option value="technical">Technical Strategy</option>
                    <option value="ai">AI Model Trading</option>
                </select>

                {backtestMode === 'technical' ? (
                    <>
                        <label style={{ color: '#bbb' }}>Strategy:</label>
                        <select
                            value={strategy}
                            onChange={(e) => setStrategy(e.target.value)}
                            style={{ padding: '8px', borderRadius: '4px', background: '#222', color: 'white', border: '1px solid #444' }}
                        >
                            <option value="SMA_Crossover">SMA Crossover (20/50)</option>
                            <option value="RSI_Strategy">RSI Strategy (30/70)</option>
                            <option value="Macd_Strategy">MACD Signal</option>
                        </select>
                    </>
                ) : (
                    <>
                        <label style={{ color: '#bbb' }}>Model:</label>
                        <select
                            value={modelType}
                            onChange={(e) => setModelType(e.target.value)}
                            style={{ padding: '8px', borderRadius: '4px', background: '#222', color: 'white', border: '1px solid #444' }}
                        >
                            <option value="random_forest">Random Forest</option>
                            <option value="gradient_boosting">Gradient Boosting</option>
                            <option value="svr">SVR</option>
                            <option value="lstm">LSTM</option>
                        </select>
                    </>
                )}

                <label style={{ color: '#bbb' }}>Capital:</label>
                <input
                    type="number"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Number(e.target.value))}
                    style={{ width: '80px', padding: '8px', borderRadius: '4px', background: '#222', color: 'white', border: '1px solid #444' }}
                />

                <label style={{ color: '#bbb' }}>Comm(%):</label>
                <input
                    type="number"
                    step="0.1"
                    value={commission}
                    onChange={(e) => setCommission(Number(e.target.value))}
                    style={{ width: '60px', padding: '8px', borderRadius: '4px', background: '#222', color: 'white', border: '1px solid #444' }}
                />

                <button
                    onClick={handleBacktest}
                    disabled={loading}
                    style={{
                        padding: '8px 16px',
                        background: loading ? '#555' : '#f59e0b',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Testing...' : 'Run Backtest'}
                </button>
            </div>

            {error && <div style={{ color: '#ef4444', marginBottom: '10px' }}>{error}</div>}

            <div ref={chartRef} style={{ width: '100%', height: '400px', background: '#111', borderRadius: '8px' }}>
                {!data && !loading && <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>Run backtest to view performance</div>}
            </div>

            {data && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginTop: '10px' }}>
                    <div style={{ background: '#222', padding: '10px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#888' }}>Total Return</div>
                        <div style={{ fontSize: '18px', color: (data.total_return > 0) ? '#10b981' : '#ef4444' }}>{data.total_return?.toFixed(2)}%</div>
                    </div>
                    <div style={{ background: '#222', padding: '10px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#888' }}>Final Value</div>
                        <div style={{ fontSize: '18px', color: '#fff' }}>${data.final_value?.toLocaleString()}</div>
                    </div>
                    <div style={{ background: '#222', padding: '10px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#888' }}>Sharpe Ratio</div>
                        <div style={{ fontSize: '18px', color: '#fff' }}>{data.sharpe_ratio?.toFixed(2)}</div>
                    </div>
                    <div style={{ background: '#222', padding: '10px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#888' }}>Max Drawdown</div>
                        <div style={{ fontSize: '18px', color: '#ef4444' }}>{data.max_drawdown?.toFixed(2)}%</div>
                    </div>
                </div>
            )}
        </div>
    );
}
