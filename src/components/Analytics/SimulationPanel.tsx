import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/api-client';

interface SimulationPanelProps {
    ticker: string;
}

export function SimulationPanel({ ticker }: SimulationPanelProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<any>(null);
    const [simulations, setSimulations] = useState(200);
    const [days, setDays] = useState(30);
    const [simulationMethod, setSimulationMethod] = useState('gbm');
    const [driftAdj, setDriftAdj] = useState(0);
    const [volatilityAdj, setVolatilityAdj] = useState(0);
    const chartRef = useRef<HTMLDivElement>(null);
    const histRef = useRef<HTMLDivElement>(null);
    const [plotlyLoaded, setPlotlyLoaded] = useState(false);

    useEffect(() => {
        import('plotly.js-dist-min').then((module) => {
            // @ts-ignore
            if (!window.Plotly) window.Plotly = module.default || module;
            setPlotlyLoaded(true);
        });
    }, []);

    const handleSimulate = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await apiClient.simulate({
                ticker,
                simulations,
                days,
                simulation_method: simulationMethod,
                drift_adj: driftAdj / 100,
                volatility_adj: volatilityAdj / 100,
            });
            setData(result);
        } catch (err: any) {
            setError('Failed to run simulation. Ensure backend is running.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (data && chartRef.current && plotlyLoaded) {
            // @ts-ignore
            const PlotlyLib = window.Plotly;

            const rawPaths = data.paths || data.simulation_paths || [];
            const visualPaths = rawPaths.slice(0, 100);

            // Calculate percentiles
            const percentiles = calculatePercentiles(rawPaths);

            const traces: any[] = [];

            // Add individual paths with lower opacity
            visualPaths.forEach((path: number[]) => {
                traces.push({
                    y: path,
                    type: 'scatter',
                    mode: 'lines',
                    line: { color: 'rgba(59, 130, 246, 0.08)', width: 1 },
                    showlegend: false,
                    hoverinfo: 'none',
                });
            });

            // Add percentile bands
            if (percentiles.p5 && percentiles.p95) {
                traces.push({
                    y: percentiles.p95,
                    type: 'scatter',
                    mode: 'lines',
                    name: '95th Percentile',
                    line: { color: '#10b981', width: 0 },
                    showlegend: false,
                    hoverinfo: 'skip',
                });

                traces.push({
                    y: percentiles.p5,
                    type: 'scatter',
                    mode: 'lines',
                    name: '5th Percentile',
                    line: { color: '#10b981', width: 0 },
                    fill: 'tonexty',
                    fillcolor: 'rgba(16, 185, 129, 0.15)',
                    showlegend: false,
                    hoverinfo: 'skip',
                });

                // 25th and 75th percentiles for inner band
                traces.push({
                    y: percentiles.p75,
                    type: 'scatter',
                    mode: 'lines',
                    name: '75th Percentile',
                    line: { color: 'rgba(59, 130, 246, 0.5)', width: 1, dash: 'dot' },
                    showlegend: false,
                });

                traces.push({
                    y: percentiles.p25,
                    type: 'scatter',
                    mode: 'lines',
                    name: '25th Percentile',
                    line: { color: 'rgba(59, 130, 246, 0.5)', width: 1, dash: 'dot' },
                    showlegend: false,
                });
            }

            // Add mean path
            if (rawPaths.length > 0) {
                const meanPath = new Array(rawPaths[0].length).fill(0);
                rawPaths.forEach((path: number[]) => {
                    path.forEach((val, idx) => meanPath[idx] += val);
                });
                meanPath.forEach((_val, idx) => meanPath[idx] /= rawPaths.length);

                traces.push({
                    y: meanPath,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Expected Value',
                    line: { color: '#fff', width: 3 },
                    showlegend: true,
                });
            }

            const driftStr = driftAdj >= 0 ? `+${driftAdj}%` : `${driftAdj}%`;
            const volStr = volatilityAdj >= 0 ? `+${volatilityAdj}%` : `${volatilityAdj}%`;

            const layout = {
                title: {
                    text: `Monte Carlo Simulation - ${simulationMethod.toUpperCase()}<br><sub style='font-size:12px;color:#888'>Drift Adj: ${driftStr}, Vol Adj: ${volStr}</sub>`,
                    font: { color: '#fff', size: 16 }
                },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: '#0a0a0a',
                font: { color: '#888', size: 11 },
                xaxis: {
                    gridcolor: '#1a1a1a',
                    title: { text: 'Days', font: { size: 12 } },
                    showgrid: true,
                    zeroline: false,
                },
                yaxis: {
                    gridcolor: '#1a1a1a',
                    title: { text: 'Price ($)', font: { size: 12 } },
                    showgrid: true,
                    zeroline: false,
                },
                legend: {
                    x: 0.02,
                    y: 0.98,
                    bgcolor: 'rgba(0,0,0,0.7)',
                    bordercolor: '#333',
                    borderwidth: 1,
                    font: { color: '#9ca3af', size: 10 }
                },
                margin: { l: 60, r: 20, t: 80, b: 50 },
            };

            PlotlyLib.newPlot(chartRef.current, traces, layout, {
                responsive: true,
                displayModeBar: false
            });
        }
    }, [data, plotlyLoaded, driftAdj, volatilityAdj, simulationMethod]);

    // Create histogram of final prices
    useEffect(() => {
        if (data && histRef.current && plotlyLoaded) {
            // @ts-ignore
            const PlotlyLib = window.Plotly;

            const rawPaths = data.paths || data.simulation_paths || [];
            const finalPrices = rawPaths.map((path: number[]) => path[path.length - 1]);

            const trace = {
                x: finalPrices,
                type: 'histogram',
                marker: {
                    color: 'rgba(59, 130, 246, 0.7)',
                    line: { color: '#3b82f6', width: 1 }
                },
                nbinsx: 40,
            };

            const layout = {
                title: {
                    text: 'Distribution of Final Prices',
                    font: { color: '#fff', size: 14 }
                },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: '#0a0a0a',
                font: { color: '#888', size: 11 },
                xaxis: {
                    gridcolor: '#1a1a1a',
                    title: { text: 'Final Price ($)', font: { size: 11 } },
                    showgrid: true,
                },
                yaxis: {
                    gridcolor: '#1a1a1a',
                    title: { text: 'Frequency', font: { size: 11 } },
                    showgrid: true,
                },
                margin: { l: 50, r: 20, t: 50, b: 40 },
                showlegend: false,
            };

            PlotlyLib.newPlot(histRef.current, [trace], layout, {
                responsive: true,
                displayModeBar: false
            });
        }
    }, [data, plotlyLoaded]);

    const calculatePercentiles = (paths: number[][]) => {
        if (paths.length === 0) return {};

        const timeSteps = paths[0].length;
        const percentiles: any = {
            p5: [],
            p25: [],
            p50: [],
            p75: [],
            p95: [],
        };

        for (let t = 0; t < timeSteps; t++) {
            const values = paths.map(p => p[t]).sort((a, b) => a - b);
            percentiles.p5.push(values[Math.floor(values.length * 0.05)]);
            percentiles.p25.push(values[Math.floor(values.length * 0.25)]);
            percentiles.p50.push(values[Math.floor(values.length * 0.50)]);
            percentiles.p75.push(values[Math.floor(values.length * 0.75)]);
            percentiles.p95.push(values[Math.floor(values.length * 0.95)]);
        }

        return percentiles;
    };

    const calculateStats = () => {
        if (!data || !data.paths) return null;

        const finalPrices = data.paths.map((path: number[]) => path[path.length - 1]);
        const initialPrice = data.paths[0][0];

        const profitCount = finalPrices.filter((p: number) => p > initialPrice).length;
        const profitProbability = (profitCount / finalPrices.length) * 100;

        const sortedPrices = [...finalPrices].sort((a, b) => a - b);
        const p5 = sortedPrices[Math.floor(sortedPrices.length * 0.05)];
        const p95 = sortedPrices[Math.floor(sortedPrices.length * 0.95)];
        const cvar95 = sortedPrices.slice(0, Math.floor(sortedPrices.length * 0.05))
            .reduce((a, b) => a + b, 0) / Math.floor(sortedPrices.length * 0.05);

        return {
            profitProbability,
            p5,
            p95,
            cvar95,
            initialPrice,
        };
    };

    const stats = calculateStats();

    const getMethodDescription = (method: string) => {
        const descriptions: Record<string, string> = {
            'gbm': 'Geometric Brownian Motion - Standard model assuming log-normal returns',
            'jump_diffusion': 'Merton Jump Diffusion - GBM with sudden price jumps',
            'heston': 'Heston Model - Stochastic volatility for realistic scenarios',
        };
        return descriptions[method] || '';
    };

    return (
        <div style={{ marginTop: '20px' }}>
            {/* Header Section */}
            <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
            }}>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '16px', lineHeight: '1.6' }}>
                    Simulate thousands of possible future price paths to estimate risk.
                    {simulationMethod && <span style={{ color: '#aaa' }}> {getMethodDescription(simulationMethod)}</span>}
                </p>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Model</label>
                        <select
                            value={simulationMethod}
                            onChange={(e) => setSimulationMethod(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                background: '#1a1a1a',
                                color: '#fff',
                                border: '1px solid #333',
                                fontSize: '13px',
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            <option value="gbm">Monte Carlo (GBM)</option>
                            <option value="jump_diffusion">Jump Diffusion</option>
                            <option value="heston">Heston Model</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Simulations</label>
                        <input
                            type="number"
                            value={simulations}
                            onChange={(e) => setSimulations(Number(e.target.value))}
                            min="100"
                            max="10000"
                            step="100"
                            style={{
                                width: '100px',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                background: '#1a1a1a',
                                color: '#fff',
                                border: '1px solid #333',
                                fontSize: '13px',
                                outline: 'none',
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Time Horizon</label>
                        <select
                            value={days}
                            onChange={(e) => setDays(Number(e.target.value))}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                background: '#1a1a1a',
                                color: '#fff',
                                border: '1px solid #333',
                                fontSize: '13px',
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            <option value={30}>30 Days</option>
                            <option value={60}>60 Days</option>
                            <option value={90}>90 Days</option>
                            <option value={180}>6 Months</option>
                            <option value={252}>1 Year</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ color: '#888', fontSize: '11px' }}>
                            Drift Adj: <span style={{ color: driftAdj >= 0 ? '#10b981' : '#ef4444', fontWeight: 600 }}>{driftAdj > 0 ? '+' : ''}{driftAdj}%</span>
                        </label>
                        <input
                            type="range"
                            min="-20"
                            max="20"
                            value={driftAdj}
                            onChange={(e) => setDriftAdj(Number(e.target.value))}
                            style={{
                                width: '140px',
                                accentColor: '#3b82f6'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <label style={{ color: '#888', fontSize: '11px' }}>
                            Volatility Adj: <span style={{ color: volatilityAdj >= 0 ? '#f59e0b' : '#10b981', fontWeight: 600 }}>{volatilityAdj > 0 ? '+' : ''}{volatilityAdj}%</span>
                        </label>
                        <input
                            type="range"
                            min="-50"
                            max="200"
                            value={volatilityAdj}
                            onChange={(e) => setVolatilityAdj(Number(e.target.value))}
                            style={{
                                width: '140px',
                                accentColor: '#f59e0b'
                            }}
                        />
                    </div>

                    <button
                        onClick={handleSimulate}
                        disabled={loading}
                        style={{
                            padding: '9px 20px',
                            background: loading ? '#444' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: loading ? 'none' : '0 2px 8px rgba(139, 92, 246, 0.3)',
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        {loading ? '🔄 Simulating...' : '▶ Run Simulation'}
                    </button>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <span style={{ fontSize: '16px' }}>⚠️</span>
                    <div>
                        <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>Simulation Failed</div>
                        <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '2px' }}>{error}</div>
                    </div>
                </div>
            )}

            {/* Charts Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: '16px', marginBottom: '16px' }}>
                {/* Main Simulation Chart */}
                <div style={{
                    background: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    <div ref={chartRef} style={{ width: '100%', height: 'clamp(300px, 50vh, 450px)' }}>
                        {!data && !loading && (
                            <div style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#555',
                                gap: '12px'
                            }}>
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                                </svg>
                                <div style={{ fontSize: '14px', color: '#666' }}>Configure parameters and run simulation</div>
                            </div>
                        )}
                        {loading && (
                            <div style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '16px'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    border: '3px solid #333',
                                    borderTop: '3px solid #8b5cf6',
                                    borderRadius: '50%',
                                    animation: 'spin 1s linear infinite'
                                }} />
                                <div style={{ color: '#666', fontSize: '13px' }}>Running {simulations} simulations over {days} days...</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Distribution Histogram */}
                <div style={{
                    background: '#0a0a0a',
                    border: '1px solid #1a1a1a',
                    borderRadius: '8px',
                    overflow: 'hidden'
                }}>
                    <div ref={histRef} style={{ width: '100%', height: 'clamp(300px, 50vh, 450px)' }}>
                        {!data && !loading && (
                            <div style={{
                                height: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#555',
                                fontSize: '13px'
                            }}>
                                Distribution chart
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Risk Metrics */}
            {stats && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                    gap: '12px'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        borderRadius: '8px',
                        padding: '16px'
                    }}>
                        <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                            Probability of Profit
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
                            {stats.profitProbability.toFixed(1)}%
                        </div>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                            Chance of ending above ${stats.initialPrice.toFixed(2)}
                        </div>
                    </div>

                    <div style={{
                        background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        borderRadius: '8px',
                        padding: '16px'
                    }}>
                        <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                            VaR (95%)
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#ef4444' }}>
                            ${Math.abs(data.var_95 || (stats.initialPrice - stats.p5)).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                            95% confidence max loss
                        </div>
                    </div>

                    <div style={{
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(217, 119, 6, 0.05) 100%)',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        borderRadius: '8px',
                        padding: '16px'
                    }}>
                        <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                            CVaR (95%)
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
                            ${stats.cvar95.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                            Expected loss in worst 5%
                        </div>
                    </div>

                    <div style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '8px',
                        padding: '16px'
                    }}>
                        <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                            Expected Return
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
                            {((data.expected_return || 0) * 100).toFixed(2)}%
                        </div>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                            Mean simulated return
                        </div>
                    </div>

                    <div style={{
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)',
                        border: '1px solid rgba(168, 85, 247, 0.2)',
                        borderRadius: '8px',
                        padding: '16px'
                    }}>
                        <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                            95th Percentile
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#a855f7' }}>
                            ${stats.p95.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                            Best case (95% confidence)
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
