import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useStore } from './state/store';
import { ChartContainer } from './components/Chart/ChartContainer';
import { TimeSyncManager } from './core/synchronization/time-sync-manager';
import { DataService } from './services/data-service';
import { useDimensions } from './hooks/useDimensions';
import { Indicators } from './core/data/indicators';
import { AuthProvider, useAuth } from './state/auth-context';
import { TickerSearch } from './components/TickerSearch/TickerSearch';
import { IndicatorSelector, type IndicatorConfig } from './components/IndicatorSelector/IndicatorSelector';
import type { Candle } from './core/renderer/types';
import './App.css';

// Chart configuration interface
interface ChartConfig {
  id: string;
  symbol: string;
  indicators: IndicatorConfig[];
}

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Chart Panel Header Component
interface ChartPanelHeaderProps {
  chartId: string;
  symbol: string;
  onSymbolChange: (symbol: string) => void;
  indicators: IndicatorConfig[];
  onIndicatorsChange: (indicators: IndicatorConfig[]) => void;
  lastPrice?: number;
  priceChange?: number;
  onRemove?: () => void;
  canRemove?: boolean;
}

const ChartPanelHeader: React.FC<ChartPanelHeaderProps> = ({
  chartId,
  symbol,
  onSymbolChange,
  indicators,
  onIndicatorsChange,
  lastPrice,
  priceChange,
  onRemove,
  canRemove,
}) => {
  const isPositive = (priceChange ?? 0) >= 0;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '44px',
      background: 'linear-gradient(180deg, rgba(18,18,18,0.95) 0%, rgba(18,18,18,0.85) 100%)',
      borderBottom: '1px solid #2a2a2a',
      display: 'flex',
      alignItems: 'center',
      padding: '0 12px',
      gap: '12px',
      zIndex: 50,
      backdropFilter: 'blur(8px)',
    }}>
      {/* Ticker Search */}
      <TickerSearch
        currentSymbol={symbol}
        onSymbolChange={onSymbolChange}
        chartId={chartId}
      />

      {/* Price Display */}
      {lastPrice !== undefined && (
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
          <span style={{
            color: '#fff',
            fontSize: '18px',
            fontWeight: 600,
            fontFamily: 'SF Mono, Consolas, monospace',
          }}>
            {lastPrice.toFixed(2)}
          </span>
          <span style={{
            color: isPositive ? '#22c55e' : '#ef4444',
            fontSize: '12px',
            fontWeight: 500,
          }}>
            {isPositive ? '+' : ''}{(priceChange ?? 0).toFixed(2)}%
          </span>
        </div>
      )}

      {/* Separator */}
      <div style={{ width: '1px', height: '20px', background: '#333' }} />

      {/* Indicator Selector */}
      <IndicatorSelector
        selectedIndicators={indicators}
        onIndicatorsChange={onIndicatorsChange}
      />

      {/* Active Indicators Display */}
      {indicators.length > 0 && (
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {indicators.slice(0, 3).map(ind => (
            <span
              key={ind.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                background: '#1a1a1a',
                borderRadius: '3px',
                border: '1px solid #2a2a2a',
                fontSize: '10px',
                color: '#888',
              }}
            >
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: ind.color }} />
              {ind.name}
            </span>
          ))}
          {indicators.length > 3 && (
            <span style={{ fontSize: '10px', color: '#555' }}>+{indicators.length - 3}</span>
          )}
        </div>
      )}

      {/* Timeframe Selector */}
      <div style={{
        display: 'flex',
        gap: '2px',
        marginLeft: 'auto',
      }}>
        {['1m', '5m', '15m', '1H', '4H', '1D'].map((tf, i) => (
          <button
            key={tf}
            style={{
              padding: '4px 8px',
              background: i === 3 ? '#3b82f6' : 'transparent',
              border: 'none',
              borderRadius: '3px',
              color: i === 3 ? '#fff' : '#666',
              fontSize: '11px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (i !== 3) e.currentTarget.style.background = '#252525';
            }}
            onMouseLeave={(e) => {
              if (i !== 3) e.currentTarget.style.background = 'transparent';
            }}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Remove Chart Button */}
      {canRemove && onRemove && (
        <button
          onClick={onRemove}
          style={{
            padding: '4px 8px',
            background: 'transparent',
            border: '1px solid #333',
            borderRadius: '4px',
            color: '#666',
            fontSize: '11px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#ef4444';
            e.currentTarget.style.color = '#ef4444';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#333';
            e.currentTarget.style.color = '#666';
          }}
        >
          Remove
        </button>
      )}
    </div>
  );
};

// Single Chart Panel Component
interface ChartPanelProps {
  config: ChartConfig;
  onConfigChange: (config: ChartConfig) => void;
  onRemove: () => void;
  canRemove: boolean;
  candles: Candle[];
  syncManager: TimeSyncManager;
  theme: any;
  transform: any;
}

const ChartPanel: React.FC<ChartPanelProps> = ({
  config,
  onConfigChange,
  onRemove,
  canRemove,
  candles,
  syncManager,
  theme,
  transform,
}) => {
  const { ref: chartRef, dimensions } = useDimensions<HTMLDivElement>();

  // Calculate price metrics
  const lastPrice = candles.length > 0 ? candles[candles.length - 1].close : undefined;
  const firstPrice = candles.length > 0 ? candles[0].open : undefined;
  const priceChange = lastPrice && firstPrice ? ((lastPrice - firstPrice) / firstPrice) * 100 : undefined;

  // Calculate indicators for this chart
  const indicatorResults = useMemo(() => {
    if (config.indicators.length === 0) return [];
    return Indicators.calculateIndicators(candles, config.indicators);
  }, [candles, config.indicators]);

  // Convert to the format expected by ChartContainer
  const indicatorData = useMemo(() => {
    if (indicatorResults.length === 0) return undefined;

    return {
      indicatorList: indicatorResults.map(ir => ({
        id: ir.id,
        name: ir.name,
        color: ir.color,
        points: ir.points,
      })),
    };
  }, [indicatorResults]);

  return (
    <div
      ref={chartRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: theme.background,
      }}
    >
      <ChartPanelHeader
        chartId={config.id}
        symbol={config.symbol}
        onSymbolChange={(symbol) => onConfigChange({ ...config, symbol })}
        indicators={config.indicators}
        onIndicatorsChange={(indicators) => onConfigChange({ ...config, indicators })}
        lastPrice={lastPrice}
        priceChange={priceChange}
        onRemove={onRemove}
        canRemove={canRemove}
      />
      {dimensions.width > 0 && dimensions.height > 0 && (
        <div style={{ paddingTop: '44px', height: '100%', boxSizing: 'border-box' }}>
          <ChartContainer
            id={config.id}
            width={dimensions.width}
            height={dimensions.height - 44}
            theme={theme}
            initialTransform={transform}
            syncManager={syncManager}
            data={candles}
            indicatorData={indicatorData}
          />
        </div>
      )}
    </div>
  );
};

// Inner App Component to use Auth Hook
function ChartApp() {
  const { user, login, logout } = useAuth();
  const workspace = useStore((state) => state.workspace);
  const [candles, setCandles] = useState<Candle[]>([]);

  // Multiple charts state
  const [charts, setCharts] = useState<ChartConfig[]>([
    { id: generateId(), symbol: 'SPY', indicators: [{ id: 'sma', name: 'SMA 20', period: 20, color: '#f59e0b', enabled: true }] },
    { id: generateId(), symbol: 'SPY', indicators: [{ id: 'ema', name: 'EMA 20', period: 20, color: '#3b82f6', enabled: true }] },
  ]);

  // Persistent services
  const syncManagerRef = useRef<TimeSyncManager | null>(null);
  const dataServiceRef = useRef<DataService | null>(null);

  if (!syncManagerRef.current) syncManagerRef.current = new TimeSyncManager();
  if (!dataServiceRef.current) {
    const isTestMode = new URLSearchParams(window.location.search).get('mode') === 'test';
    dataServiceRef.current = new DataService(isTestMode);
  }

  useEffect(() => {
    const unsubscribeData = dataServiceRef.current!.subscribe(setCandles);
    return () => {
      unsubscribeData();
      dataServiceRef.current?.stop();
    };
  }, []);

  // Chart management functions
  const addChart = useCallback(() => {
    setCharts(prev => [
      ...prev,
      { id: generateId(), symbol: 'SPY', indicators: [] }
    ]);
  }, []);

  const removeChart = useCallback((id: string) => {
    setCharts(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateChart = useCallback((id: string, config: ChartConfig) => {
    setCharts(prev => prev.map(c => c.id === id ? config : c));
  }, []);

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        color: '#fff',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '40px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 700,
          }}>
            T
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '-0.5px',
            }}>
              Terminal Pro
            </h1>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: '#666',
              fontWeight: 400,
            }}>
              Enterprise Trading Platform
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div style={{
          background: '#141414',
          border: '1px solid #2a2a2a',
          borderRadius: '16px',
          padding: '32px 40px',
          minWidth: '360px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '20px',
            fontWeight: 600,
          }}>
            Welcome back
          </h2>
          <p style={{
            margin: '0 0 24px 0',
            fontSize: '14px',
            color: '#666',
          }}>
            Sign in to access your trading workspace
          </p>

          <button
            onClick={() => login('trader_1')}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            Sign in as Trader
          </button>

          <p style={{
            margin: '16px 0 0 0',
            fontSize: '12px',
            color: '#555',
            textAlign: 'center',
          }}>
            Demo mode - No credentials required
          </p>
        </div>

        {/* Footer */}
        <p style={{
          position: 'absolute',
          bottom: '20px',
          fontSize: '11px',
          color: '#444',
        }}>
          Project 1207 - Enterprise Financial Charting Platform
        </p>
      </div>
    );
  }

  return (
    <div className="app-container" style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      background: '#0a0a0a',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* Header Bar */}
      <div style={{
        height: '40px',
        background: '#111',
        borderBottom: '1px solid #222',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        justifyContent: 'space-between',
      }}>
        {/* Left: Logo & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              color: '#fff',
            }}>
              T
            </div>
            <span style={{
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              letterSpacing: '-0.3px',
            }}>
              Terminal Pro
            </span>
          </div>

          {/* Connection Status */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            background: 'rgba(34, 197, 94, 0.1)',
            borderRadius: '4px',
            border: '1px solid rgba(34, 197, 94, 0.2)',
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#22c55e',
              boxShadow: '0 0 8px #22c55e',
              animation: 'pulse 2s infinite',
            }} />
            <span style={{
              color: '#22c55e',
              fontSize: '11px',
              fontWeight: 500,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Live
            </span>
          </div>

          {/* Add Chart Button */}
          <button
            onClick={addChart}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#aaa',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#333';
              e.currentTarget.style.color = '#aaa';
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Chart
          </button>

          {/* Chart Count */}
          <span style={{ color: '#555', fontSize: '11px' }}>
            {charts.length} chart{charts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Right: User & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            background: '#1a1a1a',
            borderRadius: '6px',
          }}>
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 600,
              color: '#fff',
            }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <span style={{ color: '#ccc', fontSize: '12px', fontWeight: 500 }}>
              {user.username}
            </span>
            <span style={{
              color: '#666',
              fontSize: '10px',
              padding: '2px 6px',
              background: '#252525',
              borderRadius: '3px',
              textTransform: 'uppercase',
            }}>
              {user.role}
            </span>
          </div>

          <button
            onClick={logout}
            style={{
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid #333',
              borderRadius: '6px',
              color: '#888',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#333';
              e.currentTarget.style.color = '#888';
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main Content - Dynamic Chart Grid */}
      <div style={{
        height: 'calc(100vh - 40px)',
        display: 'grid',
        gridTemplateColumns: charts.length === 1 ? '1fr' : 'repeat(auto-fit, minmax(400px, 1fr))',
        gridTemplateRows: charts.length <= 2 ? '1fr' : 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1px',
        background: '#222',
      }}>
        {charts.map((chart) => (
          <ChartPanel
            key={chart.id}
            config={chart}
            onConfigChange={(config) => updateChart(chart.id, config)}
            onRemove={() => removeChart(chart.id)}
            canRemove={charts.length > 1}
            candles={candles}
            syncManager={syncManagerRef.current!}
            theme={workspace.theme}
            transform={workspace.transform}
          />
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ChartApp />
    </AuthProvider>
  );
}

export default App;
