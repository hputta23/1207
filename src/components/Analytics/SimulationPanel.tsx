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
    const [driftAdj, setDriftAdj] = useState(0); // 0%
    const [volatilityAdj, setVolatilityAdj] = useState(0); // 0%
    const chartRef = useRef<HTMLDivElement>(null);
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
                drift_adj: driftAdj / 100, // Convert percentage to decimal (e.g. 5 -> 0.05)
                volatility_adj: volatilityAdj / 100, // Convert percentage to decimal assumption? 
                // Wait, model expects vol_adj as multiplier? 
                // Model code: adj_stdev = self.stdev * (1 + volatility_adj)
                // So if user input is 20 (meaning +20%), we send 0.2. Correct.
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

            // Backend returns 'paths', not 'simulation_paths'
            const rawPaths = data.paths || data.simulation_paths || [];

            // Limit visualization to max 100 paths to prevent crash
            const visualPaths = rawPaths.slice(0, 100);

            const traces = visualPaths.map((path: number[]) => ({
                y: path,
                type: 'scatter',
                mode: 'lines',
                line: { color: 'rgba(59, 130, 246, 0.1)', width: 1 },
                showlegend: false,
                hoverinfo: 'none'
            }));

            // Add mean path
            if (rawPaths.length > 0) {
                const meanPath = new Array(rawPaths[0].length).fill(0);
                rawPaths.forEach((path: number[]) => {
                    path.forEach((val, idx) => meanPath[idx] += val);
                });
                meanPath.forEach((val, idx) => meanPath[idx] /= rawPaths.length);

                traces.push({
                    y: meanPath,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Mean Path',
                    line: { color: '#fff', width: 2 },
                    showlegend: true
                });
            }

            // Config string
            const driftStr = driftAdj >= 0 ? `+${driftAdj}%` : `${driftAdj}%`;
            const volStr = volatilityAdj >= 0 ? `+${volatilityAdj}%` : `${volatilityAdj}%`;
            const subtitle = `Drift: ${driftStr}, Vol: ${volStr}`;

            const layout = {
                title: {
                    text: `Simulate (${simulationMethod.toUpperCase()})<br><span style='font-size:12px'>${subtitle}</span>`,
                    font: { color: '#fff' }
                },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#888' },
                xaxis: { gridcolor: '#333', title: 'Days' },
                yaxis: { gridcolor: '#333', title: 'Price ($)' },
            };

            PlotlyLib.newPlot(chartRef.current, traces, layout, { responsive: true, displayModeBar: false });
        }
    }, [data, plotlyLoaded, driftAdj, volatilityAdj, simulationMethod]);

    return (
        <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <label style={{ color: '#bbb' }}>Model:</label>
                    <select
                        value={simulationMethod}
                        onChange={(e) => setSimulationMethod(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', background: '#222', color: 'white', border: '1px solid #444' }}
                    >
                        <option value="gbm">Monte Carlo (GBM)</option>
                        <option value="jump_diffusion">Jump Diffusion</option>
                        <option value="heston">Heston Model</option>
                    </select>

                    <label style={{ color: '#bbb' }}>Simulations:</label>
                    <input
                        type="number"
                        value={simulations}
                        onChange={(e) => setSimulations(Number(e.target.value))}
                        style={{ width: '80px', padding: '8px', borderRadius: '4px', background: '#222', color: 'white', border: '1px solid #444' }}
                    />

                    <label style={{ color: '#bbb' }}>Days:</label>
                    <select
                        value={days}
                        onChange={(e) => setDays(Number(e.target.value))}
                        style={{ padding: '8px', borderRadius: '4px', background: '#222', color: 'white', border: '1px solid #444' }}
                    >
                        <option value={30}>30 Days</option>
                        <option value={60}>60 Days</option>
                        <option value={90}>90 Days</option>
                        <option value={252}>1 Year</option>
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ color: '#bbb', fontSize: '12px' }}>
                        Drift Adj: <span style={{ color: '#fff' }}>{driftAdj}%</span>
                    </label>
                    <input
                        type="range"
                        min="-20"
                        max="20"
                        value={driftAdj}
                        onChange={(e) => setDriftAdj(Number(e.target.value))}
                        style={{ width: '120px' }}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ color: '#bbb', fontSize: '12px' }}>
                        Volatility Adj: <span style={{ color: '#fff' }}>{volatilityAdj}%</span>
                    </label>
                    <input
                        type="range"
                        min="-50"
                        max="200"
                        value={volatilityAdj}
                        onChange={(e) => setVolatilityAdj(Number(e.target.value))}
                        style={{ width: '120px' }}
                    />
                </div>

                <button
                    onClick={handleSimulate}
                    disabled={loading}
                    style={{
                        padding: '8px 16px',
                        marginTop: '10px',
                        background: loading ? '#555' : '#8b5cf6',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Simulating...' : 'Run Simulation'}
                </button>
            </div>

            {error && <div style={{ color: '#ef4444', marginBottom: '10px' }}>{error}</div>}

            <div ref={chartRef} style={{ width: '100%', height: '400px', background: '#111', borderRadius: '8px' }}>
                {!data && !loading && <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>Run simulation to view paths</div>}
            </div>

            {data && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                    <div style={{ background: '#222', padding: '10px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#888' }}>VaR (95%)</div>
                        <div style={{ fontSize: '18px', color: '#ef4444' }}>${Math.abs(data.var_95 || 0).toFixed(2)}</div>
                    </div>
                    <div style={{ background: '#222', padding: '10px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#888' }}>Expected Return</div>
                        <div style={{ fontSize: '18px', color: '#10b981' }}>{((data.expected_return || 0) * 100).toFixed(2)}%</div>
                    </div>
                </div>
            )}
        </div>
    );
}
