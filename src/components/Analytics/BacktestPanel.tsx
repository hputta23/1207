import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/api-client';

interface BacktestPanelProps {
    ticker: string;
}

const STRATEGY_INFO: Record<string, { name: string; description: string; bestFor: string }> = {
    'SMA_Crossover': {
        name: 'SMA Crossover (20/50)',
        description: 'Buy when fast SMA (20) crosses above slow SMA (50), sell when it crosses below',
        bestFor: 'Trending markets with clear momentum'
    },
    'RSI_Strategy': {
        name: 'RSI Strategy (30/70)',
        description: 'Buy when RSI drops below 30 (oversold), sell when RSI rises above 70 (overbought)',
        bestFor: 'Range-bound, oscillating markets'
    },
    'Macd_Strategy': {
        name: 'MACD Signal',
        description: 'Buy when MACD line crosses above signal line, sell when it crosses below',
        bestFor: 'Identifying trend changes and momentum shifts'
    },
    'BB_MeanReversion': {
        name: 'Bollinger Band Mean Reversion',
        description: 'Buy when price touches lower band, sell when price touches upper band',
        bestFor: 'Mean-reverting stocks with stable volatility'
    },
    'GoldenCross': {
        name: 'Golden/Death Cross (50/200)',
        description: 'Buy on golden cross (50 SMA > 200 SMA), sell on death cross (50 SMA < 200 SMA)',
        bestFor: 'Long-term trend following, reducing whipsaws'
    },
    'TripleEMA': {
        name: 'Triple EMA (9/21/55)',
        description: 'Buy when fast EMA > medium EMA > slow EMA, sell when reversed',
        bestFor: 'Multi-timeframe trend confirmation'
    },
    'BB_Squeeze': {
        name: 'Bollinger Band Squeeze',
        description: 'Buy on breakout after period of low volatility (squeeze)',
        bestFor: 'Catching explosive moves after consolidation'
    }
};

export function BacktestPanel({ ticker }: BacktestPanelProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<any>(null);
    const [backtestMode, setBacktestMode] = useState<'technical' | 'ai'>('technical');
    const [strategy, setStrategy] = useState('SMA_Crossover');
    const [modelType, setModelType] = useState('random_forest');
    const [initialCapital, setInitialCapital] = useState(10000);
    const [commission, setCommission] = useState(0.1); // 0.1% default
    const [showHelp, setShowHelp] = useState(false);
    const chartRef = useRef<HTMLDivElement>(null);
    const drawdownChartRef = useRef<HTMLDivElement>(null);
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

            const dates = data.dates || [];
            const equity = data.equity_curve || [];
            const trades = data.trades || [];

            // Calculate Profit/Loss color
            const isProfit = equity.length > 0 && equity[equity.length - 1] >= initialCapital;
            const lineColor = isProfit ? '#10b981' : '#ef4444';
            const fillColor = isProfit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';

            const traces: any[] = [
                {
                    x: dates,
                    y: equity,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Strategy',
                    line: { color: lineColor, width: 2.5 },
                    fill: 'tozeroy',
                    fillcolor: fillColor
                }
            ];

            // Add Buy & Hold benchmark
            if (data.buy_hold_curve) {
                traces.push({
                    x: dates,
                    y: data.buy_hold_curve,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Buy & Hold',
                    line: { color: '#6b7280', width: 1.5, dash: 'dot' }
                });
            }

            // Add trade markers
            if (trades && trades.length > 0) {
                const buyDates: string[] = [];
                const buyPrices: number[] = [];
                const sellDates: string[] = [];
                const sellPrices: number[] = [];

                trades.forEach((trade: any) => {
                    const entryIdx = dates.indexOf(trade.entry_date);
                    const exitIdx = dates.indexOf(trade.exit_date);
                    if (entryIdx >= 0) {
                        buyDates.push(trade.entry_date);
                        buyPrices.push(equity[entryIdx]);
                    }
                    if (exitIdx >= 0) {
                        sellDates.push(trade.exit_date);
                        sellPrices.push(equity[exitIdx]);
                    }
                });

                // Buy markers
                if (buyDates.length > 0) {
                    traces.push({
                        x: buyDates,
                        y: buyPrices,
                        type: 'scatter',
                        mode: 'markers',
                        name: 'Buy',
                        marker: {
                            color: '#10b981',
                            size: 10,
                            symbol: 'triangle-up',
                            line: { color: '#fff', width: 1 }
                        }
                    });
                }

                // Sell markers
                if (sellDates.length > 0) {
                    traces.push({
                        x: sellDates,
                        y: sellPrices,
                        type: 'scatter',
                        mode: 'markers',
                        name: 'Sell',
                        marker: {
                            color: '#ef4444',
                            size: 10,
                            symbol: 'triangle-down',
                            line: { color: '#fff', width: 1 }
                        }
                    });
                }
            }

            const strategyName = backtestMode === 'technical'
                ? STRATEGY_INFO[strategy]?.name || strategy
                : modelType;

            const layout = {
                title: {
                    text: `${strategyName} Performance`,
                    font: { color: '#fff', size: 16 }
                },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: '#0a0a0a',
                font: { color: '#888', size: 11 },
                xaxis: {
                    gridcolor: '#1a1a1a',
                    showgrid: true
                },
                yaxis: {
                    gridcolor: '#1a1a1a',
                    title: 'Portfolio Value ($)',
                    showgrid: true
                },
                legend: {
                    orientation: 'h',
                    y: 1.1,
                    x: 0,
                    font: { color: '#9ca3af', size: 10 }
                },
                hovermode: 'x unified',
                margin: { l: 60, r: 20, t: 50, b: 40 }
            };

            PlotlyLib.newPlot(chartRef.current, traces, layout, { responsive: true, displayModeBar: false });
        }

        // Drawdown chart
        if (data && drawdownChartRef.current && plotlyLoaded) {
            // @ts-ignore
            const PlotlyLib = window.Plotly;

            const dates = data.dates || [];
            const equity = data.equity_curve || [];

            // Calculate drawdown
            const drawdown: number[] = [];
            let peak = equity[0] || initialCapital;

            equity.forEach((val: number) => {
                if (val > peak) peak = val;
                const dd = ((val - peak) / peak) * 100;
                drawdown.push(dd);
            });

            const traces = [
                {
                    x: dates,
                    y: drawdown,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Drawdown',
                    line: { color: '#ef4444', width: 1.5 },
                    fill: 'tozeroy',
                    fillcolor: 'rgba(239, 68, 68, 0.2)'
                }
            ];

            const layout = {
                title: {
                    text: 'Drawdown Analysis',
                    font: { color: '#fff', size: 14 }
                },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: '#0a0a0a',
                font: { color: '#888', size: 11 },
                xaxis: {
                    gridcolor: '#1a1a1a',
                    showgrid: true
                },
                yaxis: {
                    gridcolor: '#1a1a1a',
                    title: 'Drawdown (%)',
                    showgrid: true
                },
                showlegend: false,
                hovermode: 'x unified',
                margin: { l: 60, r: 20, t: 40, b: 40 }
            };

            PlotlyLib.newPlot(drawdownChartRef.current, traces, layout, { responsive: true, displayModeBar: false });
        }
    }, [data, plotlyLoaded, backtestMode, strategy, modelType, commission, initialCapital]);

    return (
        <div style={{ marginTop: '20px' }}>
            {/* Header with Help Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                    Strategy Configuration
                </h3>
                <button
                    onClick={() => setShowHelp(!showHelp)}
                    style={{
                        padding: '6px 12px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '6px',
                        color: '#3b82f6',
                        fontSize: '12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}
                >
                    <span>ℹ️</span> {showHelp ? 'Hide' : 'Show'} Guide
                </button>
            </div>

            {/* Help Panel */}
            {showHelp && (
                <div style={{
                    background: 'rgba(59, 130, 246, 0.05)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px'
                }}>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: 600, color: '#3b82f6' }}>
                        📚 How to Use Backtesting
                    </h4>
                    <ol style={{ margin: '0 0 0 20px', padding: 0, fontSize: '13px', color: '#aaa', lineHeight: 1.8 }}>
                        <li>Select a <strong>strategy type</strong> (Technical or AI Model)</li>
                        <li>Choose a specific <strong>strategy or model</strong> from the dropdown</li>
                        <li>Set your <strong>initial capital</strong> and <strong>commission rate</strong></li>
                        <li>Click <strong>"Run Backtest"</strong> to test the strategy on historical data</li>
                        <li>Review the <strong>equity curve</strong>, <strong>drawdown</strong>, and <strong>performance metrics</strong></li>
                        <li>Analyze individual <strong>trades</strong> in the history table</li>
                    </ol>
                    <div style={{ marginTop: '12px', padding: '10px', background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '6px' }}>
                        <p style={{ margin: 0, fontSize: '12px', color: '#fbbf24' }}>
                            ⚠️ <strong>Warning:</strong> Past performance does not guarantee future results. Backtest results may be subject to overfitting and look-ahead bias.
                        </p>
                    </div>
                </div>
            )}

            {/* Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                <div>
                    <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px' }}>Strategy Type</label>
                    <select
                        value={backtestMode}
                        onChange={(e) => setBacktestMode(e.target.value as 'technical' | 'ai')}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#1a1a1a', color: 'white', border: '1px solid #333', fontSize: '13px' }}
                    >
                        <option value="technical">📊 Technical Strategy</option>
                        <option value="ai">🤖 AI Model Trading</option>
                    </select>
                </div>

                {backtestMode === 'technical' ? (
                    <div>
                        <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px' }}>Strategy</label>
                        <select
                            value={strategy}
                            onChange={(e) => setStrategy(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#1a1a1a', color: 'white', border: '1px solid #333', fontSize: '13px' }}
                        >
                            <option value="SMA_Crossover">SMA Crossover (20/50)</option>
                            <option value="RSI_Strategy">RSI Strategy (30/70)</option>
                            <option value="Macd_Strategy">MACD Signal</option>
                            <option value="BB_MeanReversion">Bollinger Band Mean Reversion</option>
                            <option value="GoldenCross">Golden/Death Cross (50/200)</option>
                            <option value="GoldenCross">Golden/Death Cross (50/200)</option>
                            <option value="TripleEMA">Triple EMA (9/21/55)</option>
                            <option value="BB_Squeeze">Bollinger Band Squeeze</option>
                        </select>
                    </div>
                ) : (
                    <div>
                        <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px' }}>AI Model</label>
                        <select
                            value={modelType}
                            onChange={(e) => setModelType(e.target.value)}
                            style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#1a1a1a', color: 'white', border: '1px solid #333', fontSize: '13px' }}
                        >
                            <option value="random_forest">Random Forest</option>
                            <option value="gradient_boosting">Gradient Boosting</option>
                            <option value="svr">Support Vector Regression</option>
                            <option value="lstm">LSTM Neural Network</option>
                        </select>
                    </div>
                )}

                <div>
                    <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px' }}>Initial Capital</label>
                    <input
                        type="number"
                        value={initialCapital}
                        onChange={(e) => setInitialCapital(Number(e.target.value))}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#1a1a1a', color: 'white', border: '1px solid #333', fontSize: '13px' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', color: '#888', fontSize: '12px', marginBottom: '6px' }}>Commission (%)</label>
                    <input
                        type="number"
                        step="0.1"
                        value={commission}
                        onChange={(e) => setCommission(Number(e.target.value))}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#1a1a1a', color: 'white', border: '1px solid #333', fontSize: '13px' }}
                    />
                </div>
            </div>

            {/* Strategy Description */}
            {backtestMode === 'technical' && STRATEGY_INFO[strategy] && (
                <div style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px'
                }}>
                    <div style={{ fontSize: '13px', color: '#10b981', fontWeight: 600, marginBottom: '4px' }}>
                        ✓ {STRATEGY_INFO[strategy].name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#aaa', marginBottom: '6px' }}>
                        {STRATEGY_INFO[strategy].description}
                    </div>
                    <div style={{ fontSize: '11px', color: '#666' }}>
                        <strong>Best for:</strong> {STRATEGY_INFO[strategy].bestFor}
                    </div>
                </div>
            )}

            {/* Run Button */}
            <button
                onClick={handleBacktest}
                disabled={loading}
                style={{
                    width: '100%',
                    padding: '12px',
                    background: loading ? '#555' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    marginBottom: '20px',
                    transition: 'transform 0.15s'
                }}
                onMouseEnter={(e) => !loading && (e.currentTarget.style.transform = 'translateY(-1px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
                {loading ? '⏳ Running Backtest...' : '🚀 Run Backtest'}
            </button>

            {error && (
                <div style={{
                    padding: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    color: '#ef4444',
                    marginBottom: '16px',
                    fontSize: '13px'
                }}>
                    {error}
                </div>
            )}

            {/* Equity Curve Chart */}
            <div ref={chartRef} style={{ width: '100%', height: '400px', background: '#111', borderRadius: '8px', marginBottom: '16px', border: '1px solid #222' }}>
                {!data && !loading && (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#555' }}>
                        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📈</div>
                        <div style={{ fontSize: '14px' }}>Run backtest to view performance</div>
                    </div>
                )}
            </div>

            {/* Drawdown Chart */}
            {data && (
                <div ref={drawdownChartRef} style={{ width: '100%', height: '250px', background: '#111', borderRadius: '8px', marginBottom: '16px', border: '1px solid #222' }} />
            )}

            {data && (
                <>
                    {/* Performance Metrics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginTop: '16px' }}>
                        <div style={{ background: '#222', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Return</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: (data.total_return > 0) ? '#10b981' : '#ef4444' }}>
                                {data.total_return >= 0 ? '+' : ''}{data.total_return?.toFixed(2)}%
                            </div>
                        </div>
                        <div style={{ background: '#222', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Final Value</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>${data.final_value?.toLocaleString()}</div>
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                                from ${initialCapital.toLocaleString()}
                            </div>
                        </div>
                        <div style={{ background: '#222', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Sharpe Ratio</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: data.sharpe_ratio > 1 ? '#10b981' : data.sharpe_ratio > 0 ? '#f59e0b' : '#ef4444' }}>
                                {data.sharpe_ratio?.toFixed(2)}
                            </div>
                        </div>
                        <div style={{ background: '#222', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Max Drawdown</div>
                            <div style={{ fontSize: '20px', fontWeight: 700, color: '#ef4444' }}>{data.max_drawdown?.toFixed(2)}%</div>
                        </div>

                        {/* Additional Metrics */}
                        {data.total_trades !== undefined && (
                            <div style={{ background: '#222', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Trades</div>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>{data.total_trades}</div>
                            </div>
                        )}
                        {data.win_rate !== undefined && (
                            <div style={{ background: '#222', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Win Rate</div>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: data.win_rate >= 50 ? '#10b981' : '#f59e0b' }}>
                                    {data.win_rate?.toFixed(1)}%
                                </div>
                            </div>
                        )}
                        {data.profit_factor !== undefined && (
                            <div style={{ background: '#222', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Profit Factor</div>
                                <div style={{ fontSize: '20px', fontWeight: 700, color: data.profit_factor >= 1.5 ? '#10b981' : data.profit_factor >= 1 ? '#f59e0b' : '#ef4444' }}>
                                    {data.profit_factor?.toFixed(2)}
                                </div>
                            </div>
                        )}
                        {data.avg_win !== undefined && (
                            <div style={{ background: '#222', padding: '12px', borderRadius: '8px', border: '1px solid #333' }}>
                                <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Win / Loss</div>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>
                                    <span style={{ color: '#10b981' }}>${data.avg_win?.toFixed(0)}</span>
                                    {' / '}
                                    <span style={{ color: '#ef4444' }}>${Math.abs(data.avg_loss || 0)?.toFixed(0)}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Trades Table */}
                    {data.trades && data.trades.length > 0 && (
                        <div style={{ marginTop: '20px' }}>
                            <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                                Trade History ({data.trades.length} trades)
                            </h3>
                            <div style={{
                                maxHeight: '300px',
                                overflowY: 'auto',
                                background: '#111',
                                border: '1px solid #333',
                                borderRadius: '8px',
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: '#1a1a1a', zIndex: 1 }}>
                                        <tr>
                                            <th style={{ padding: '10px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>#</th>
                                            <th style={{ padding: '10px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Type</th>
                                            <th style={{ padding: '10px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Entry Date</th>
                                            <th style={{ padding: '10px', textAlign: 'right', color: '#888', borderBottom: '1px solid #333' }}>Entry Price</th>
                                            <th style={{ padding: '10px', textAlign: 'left', color: '#888', borderBottom: '1px solid #333' }}>Exit Date</th>
                                            <th style={{ padding: '10px', textAlign: 'right', color: '#888', borderBottom: '1px solid #333' }}>Exit Price</th>
                                            <th style={{ padding: '10px', textAlign: 'right', color: '#888', borderBottom: '1px solid #333' }}>P&L</th>
                                            <th style={{ padding: '10px', textAlign: 'right', color: '#888', borderBottom: '1px solid #333' }}>Return %</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.trades.map((trade: any, idx: number) => {
                                            const pnl = trade.pnl || 0;
                                            const isProfitable = pnl > 0;
                                            return (
                                                <tr key={idx} style={{ borderBottom: '1px solid #222' }}>
                                                    <td style={{ padding: '8px', color: '#666' }}>{idx + 1}</td>
                                                    <td style={{ padding: '8px' }}>
                                                        <span style={{
                                                            padding: '2px 6px',
                                                            borderRadius: '3px',
                                                            fontSize: '10px',
                                                            fontWeight: 600,
                                                            background: trade.type === 'LONG' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                            color: trade.type === 'LONG' ? '#10b981' : '#ef4444',
                                                        }}>
                                                            {trade.type}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '8px', color: '#aaa' }}>{trade.entry_date}</td>
                                                    <td style={{ padding: '8px', color: '#aaa', textAlign: 'right' }}>${trade.entry_price?.toFixed(2)}</td>
                                                    <td style={{ padding: '8px', color: '#aaa' }}>{trade.exit_date}</td>
                                                    <td style={{ padding: '8px', color: '#aaa', textAlign: 'right' }}>${trade.exit_price?.toFixed(2)}</td>
                                                    <td style={{ padding: '8px', color: isProfitable ? '#10b981' : '#ef4444', textAlign: 'right', fontWeight: 600 }}>
                                                        {isProfitable ? '+' : ''}${pnl.toFixed(2)}
                                                    </td>
                                                    <td style={{ padding: '8px', color: isProfitable ? '#10b981' : '#ef4444', textAlign: 'right', fontWeight: 600 }}>
                                                        {isProfitable ? '+' : ''}{trade.return_pct?.toFixed(2)}%
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
