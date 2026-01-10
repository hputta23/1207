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
    const [modelType, setModelType] = useState('random_forest');
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

            let dates: string[] = [];
            let actual: number[] = [];
            let predicted: number[] = [];

            if (data.historical) {
                dates = data.historical.map((h: any) => h.date);
                actual = data.historical.map((h: any) => h.close);
            }

            if (data.results && data.results.length > 0) {
                const modelResult = data.results[0];
                const preds = modelResult.predictions || [];

                preds.forEach((p: any) => {
                    dates.push(p.date);
                    predicted.push(p.price);
                });
            }

            // Create prediction trace with confidence bands
            let predictionDates: string[] = [];
            let predictionValues: number[] = [];
            let upperBound: number[] = [];
            let lowerBound: number[] = [];

            if (actual.length > 0 && predicted.length > 0) {
                const lastActual = actual[actual.length - 1];
                predictionDates = [dates[actual.length - 1], ...dates.slice(actual.length)];
                predictionValues = [lastActual, ...predicted];

                // Calculate confidence intervals (±10% as example, ideally from model)
                upperBound = predictionValues.map(v => v * 1.10);
                lowerBound = predictionValues.map(v => v * 0.90);
            }

            const traces: any[] = [
                // Historical data
                {
                    x: dates.slice(0, actual.length),
                    y: actual,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Historical',
                    line: { color: '#3b82f6', width: 2 },
                    hovertemplate: '<b>%{x}</b><br>Price: $%{y:.2f}<extra></extra>',
                },
                // Prediction line
                {
                    x: predictionDates,
                    y: predictionValues,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Prediction',
                    line: { color: '#10b981', width: 2, dash: 'dot' },
                    hovertemplate: '<b>%{x}</b><br>Predicted: $%{y:.2f}<extra></extra>',
                },
                // Upper confidence band
                {
                    x: predictionDates,
                    y: upperBound,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Upper Bound (90% CI)',
                    line: { width: 0 },
                    showlegend: false,
                    hoverinfo: 'skip',
                },
                // Lower confidence band
                {
                    x: predictionDates,
                    y: lowerBound,
                    type: 'scatter',
                    mode: 'lines',
                    name: 'Lower Bound (90% CI)',
                    line: { width: 0 },
                    fill: 'tonexty',
                    fillcolor: 'rgba(16, 185, 129, 0.15)',
                    showlegend: false,
                    hoverinfo: 'skip',
                },
            ];

            const layout = {
                title: {
                    text: `Price Prediction - ${modelType.replace('_', ' ').toUpperCase()}<br><sub style='font-size:12px;color:#888'>${days} Day Forecast</sub>`,
                    font: { color: '#fff', size: 16 }
                },
                paper_bgcolor: 'rgba(0,0,0,0)',
                plot_bgcolor: 'rgba(15,15,15,0.5)',
                font: { color: '#888', size: 11 },
                xaxis: {
                    gridcolor: '#2a2a2a',
                    showgrid: true,
                    zeroline: false,
                },
                yaxis: {
                    gridcolor: '#2a2a2a',
                    title: { text: 'Price ($)', font: { size: 12 } },
                    showgrid: true,
                    zeroline: false,
                },
                showlegend: true,
                legend: {
                    orientation: 'h',
                    y: 1.15,
                    x: 0,
                    font: { size: 11 },
                    bgcolor: 'rgba(0,0,0,0)',
                },
                margin: { l: 60, r: 20, t: 80, b: 40 },
                hovermode: 'x unified',
            };

            PlotlyLib.newPlot(chartRef.current, traces, layout, {
                responsive: true,
                displayModeBar: false
            });
        }
    }, [data, plotlyLoaded, modelType, days]);

    const getModelDescription = (model: string) => {
        const descriptions: Record<string, string> = {
            'random_forest': 'Ensemble learning method using decision trees',
            'gradient_boosting': 'Sequential ensemble building strong predictive model',
            'svr': 'Support Vector Regression for non-linear patterns',
            'lstm': 'Deep learning model for sequential data (GPU recommended)',
        };
        return descriptions[model] || '';
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
                    Use machine learning models to forecast future price movements.
                    {modelType && <span style={{ color: '#aaa' }}> {getModelDescription(modelType)}</span>}
                </p>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Model</label>
                        <select
                            value={modelType}
                            onChange={(e) => setModelType(e.target.value)}
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
                            <option value="random_forest">Random Forest</option>
                            <option value="gradient_boosting">Gradient Boosting</option>
                            <option value="svr">SVR</option>
                            <option value="lstm">LSTM (Neural Net)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ color: '#888', fontSize: '11px', display: 'block', marginBottom: '4px' }}>Forecast Period</label>
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
                            <option value={7}>7 Days</option>
                            <option value={14}>14 Days</option>
                            <option value={30}>30 Days</option>
                            <option value={60}>60 Days</option>
                            <option value={90}>90 Days</option>
                        </select>
                    </div>

                    <button
                        onClick={handlePredict}
                        disabled={loading}
                        style={{
                            padding: '9px 20px',
                            marginTop: '16px',
                            background: loading ? '#444' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            border: 'none',
                            borderRadius: '6px',
                            color: 'white',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: loading ? 'none' : '0 2px 8px rgba(16, 185, 129, 0.3)',
                        }}
                        onMouseEnter={(e) => {
                            if (!loading) e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                        }}
                    >
                        {loading ? '🔄 Predicting...' : '▶ Run Prediction'}
                    </button>

                    {error && (
                        <button
                            onClick={handlePredict}
                            style={{
                                padding: '9px 16px',
                                marginTop: '16px',
                                background: '#3b82f6',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: '12px',
                                fontWeight: 500,
                                cursor: 'pointer',
                            }}
                        >
                            🔄 Retry
                        </button>
                    )}
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
                        <div style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}>Prediction Failed</div>
                        <div style={{ color: '#fca5a5', fontSize: '12px', marginTop: '2px' }}>{error}</div>
                    </div>
                </div>
            )}

            {/* Chart */}
            <div style={{
                background: '#0a0a0a',
                border: '1px solid #1a1a1a',
                borderRadius: '8px',
                overflow: 'hidden'
            }}>
                <div ref={chartRef} style={{ width: '100%', height: '450px' }}>
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
                                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                            </svg>
                            <div style={{ fontSize: '14px', color: '#666' }}>Select a model and run prediction</div>
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
                                borderTop: '3px solid #10b981',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }} />
                            <div style={{ color: '#666', fontSize: '13px' }}>Training model and generating predictions...</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Metrics Grid */}
            {data && data.metrics && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '12px',
                    marginTop: '16px'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '8px',
                        padding: '16px'
                    }}>
                        <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                            Model Accuracy (RMSE)
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>
                            ${data.metrics.rmse?.toFixed(2) || 'N/A'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                            Lower is better
                        </div>
                    </div>

                    <div style={{
                        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(147, 51, 234, 0.05) 100%)',
                        border: '1px solid rgba(168, 85, 247, 0.2)',
                        borderRadius: '8px',
                        padding: '16px'
                    }}>
                        <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                            Mean Abs Error (MAE)
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: 700, color: '#a855f7' }}>
                            ${data.metrics.mae?.toFixed(2) || 'N/A'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                            Average prediction error
                        </div>
                    </div>

                    {data.results && data.results[0] && (
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.05) 100%)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            borderRadius: '8px',
                            padding: '16px'
                        }}>
                            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                                Predicted Change
                            </div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#10b981' }}>
                                {data.results[0].predictions && data.results[0].predictions.length > 0
                                    ? `${((data.results[0].predictions[data.results[0].predictions.length - 1].price / data.historical[data.historical.length - 1].close - 1) * 100).toFixed(2)}%`
                                    : 'N/A'}
                            </div>
                            <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
                                From current price
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
