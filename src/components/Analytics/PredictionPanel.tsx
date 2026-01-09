import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../services/api-client';

interface PredictionPanelProps {
    ticker: string;
}

export function PredictionPanel({ ticker }: PredictionPanelProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState<any>(null);
    const [days, setDays] = useState(30);
    const [modelType, setModelType] = useState('Random Forest');
    const chartRef = useRef<HTMLDivElement>(null);
    const [plotlyLoaded, setPlotlyLoaded] = useState(false);

    useEffect(() => {
        import('plotly.js-dist-min').then((module) => {
            // @ts-ignore
            if (!window.Plotly) window.Plotly = module.default || module;
            setPlotlyLoaded(true);
        });
    }, []);

    const handlePredict = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await apiClient.predict({
                ticker,
                days,
                model_type: modelType,
            });
            setData(result);
        } catch (err) {
            setError('Failed to fetch prediction. Make sure backend is running on port 8000.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (data && chartRef.current && plotlyLoaded) {
            // @ts-ignore
            const PlotlyLib = window.Plotly;

            // Handle new backend response structure
            let dates: string[] = [];
            let actual: number[] = [];
            let predicted: number[] = [];

            // Backend returns { historical: [...], results: [{ predictions: [...] }] }
            // We need to stitch historical data + predictions

            if (data.historical) {
                dates = data.historical.map((h: any) => h.date);
                actual = data.historical.map((h: any) => h.close);
            }

            if (data.results && data.results.length > 0) {
                const modelResult = data.results[0];
                const preds = modelResult.predictions || [];

                // Add prediction dates and values
                preds.forEach((p: any) => {
                    dates.push(p.date);
                    predicted.push(p.price);
                });
            }

            // Align predicted with actual for plotting
            // Actually, 'predicted' from backend are FUTURE predictions usually?
            // If they are backtest predictions, they overlap.
            // But /predict endpoint usually predicts FUTURE.
            // If we want to show future, we append.

            // Plotly traces
            // Trace 1: Historical (Actual)
            // Trace 2: Prediction (Future)

            // Create a gap-less line by including the last historical point in prediction
            let predictionDates = [];
            let predictionValues = [];

            if (actual.length > 0 && predicted.length > 0) {
                predictionDates = [dates[actual.length - 1], ...dates.slice(actual.length)];
                predictionValues = [actual[actual.length - 1], ...predicted];
            }

            const traces = [
                {
                    x: dates.slice(0, actual.length),
                    y: actual,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'History',
                    line: { color: '#3b82f6' }
                },
                {
                    x: predictionDates,
                    y: predictionValues,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Prediction',
                    line: { color: '#10b981', dash: 'dot' }
                }
            ];

            const layout = {
                title: { text: `Price Prediction (${modelType})`, font: { color: '#fff' } },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(0,0,0,0)',
                font: { color: '#888' },
                xaxis: { gridcolor: '#333' },
                yaxis: { gridcolor: '#333', title: 'Price ($)' },
                showlegend: true,
                legend: { orientation: 'h', y: 1.1 }
            };

            PlotlyLib.newPlot(chartRef.current, traces, layout, { responsive: true, displayModeBar: false });
        }
    }, [data, plotlyLoaded]);


    return (
        <div style={{ marginTop: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center' }}>
                <select
                    value={modelType}
                    onChange={(e) => setModelType(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', background: '#222', color: 'white', border: '1px solid #444' }}
                >
                    <option value="random_forest">Random Forest</option>
                    <option value="gradient_boosting">Gradient Boosting</option>
                    <option value="svr">SVR</option>
                    <option value="lstm">LSTM (Requires GPU/Good CPU)</option>
                </select>

                <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    style={{ padding: '8px', borderRadius: '4px', background: '#222', color: 'white', border: '1px solid #444' }}
                >
                    <option value={7}>7 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days</option>
                </select>

                <button
                    onClick={handlePredict}
                    disabled={loading}
                    style={{
                        padding: '8px 16px',
                        background: loading ? '#555' : '#10b981',
                        border: 'none',
                        borderRadius: '4px',
                        color: 'white',
                        cursor: loading ? 'not-allowed' : 'pointer'
                    }}
                >
                    {loading ? 'Predicting...' : 'Run Prediction'}
                </button>
            </div>

            {error && <div style={{ color: '#ef4444', marginBottom: '10px' }}>{error}</div>}

            <div ref={chartRef} style={{ width: '100%', height: '400px', background: '#111', borderRadius: '8px' }}>
                {!data && !loading && <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555' }}>Select model and run prediction</div>}
            </div>

            {data && data.metrics && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '10px' }}>
                    <div style={{ background: '#222', padding: '10px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#888' }}>RMSE</div>
                        <div style={{ fontSize: '18px', color: '#fff' }}>{data.metrics.rmse?.toFixed(2) || 'N/A'}</div>
                    </div>
                    <div style={{ background: '#222', padding: '10px', borderRadius: '4px' }}>
                        <div style={{ fontSize: '12px', color: '#888' }}>MAE</div>
                        <div style={{ fontSize: '18px', color: '#fff' }}>{data.metrics.mae?.toFixed(2) || 'N/A'}</div>
                    </div>
                </div>
            )}
        </div>
    );
}
