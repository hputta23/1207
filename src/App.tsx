import { useEffect, useState, useRef, useMemo } from 'react';
import { useStore } from './state/store';
import { ChartContainer } from './components/Chart/ChartContainer';
import { TimeSyncManager } from './core/synchronization/time-sync-manager';
import { DataService } from './services/data-service';
import { SimpleSplitPane } from './components/Layout/SimpleSplitPane';
import { useDimensions } from './hooks/useDimensions';
import { Indicators } from './core/data/indicators';
import { AuthProvider, useAuth } from './state/auth-context';
import type { Candle } from './core/renderer/types';
import './App.css';

// Inner App Component to use Auth Hook
function ChartApp() {
  const { user, login, logout } = useAuth();
  const workspace = useStore((state) => state.workspace);
  const [candles, setCandles] = useState<Candle[]>([]);

  // persistent services
  const syncManagerRef = useRef<TimeSyncManager | null>(null);
  const dataServiceRef = useRef<DataService | null>(null);

  // Measure dimensions 
  const { ref: chart1Ref, dimensions: dim1 } = useDimensions<HTMLDivElement>();
  const { ref: chart2Ref, dimensions: dim2 } = useDimensions<HTMLDivElement>();

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

  // Compute Indicators
  const indicators1 = useMemo(() => ({
    sma: Indicators.calculateSMA(candles, 20)
  }), [candles]);

  const indicators2 = useMemo(() => ({
    ema: Indicators.calculateEMA(candles, 20)
  }), [candles]);

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#111',
        color: '#fff'
      }}>
        <h1>Enterprise Terminal</h1>
        <p>Please log in to access the markets.</p>
        <button
          onClick={() => login('trader_1')}
          style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}
        >
          Login as User
        </button>
      </div>
    );
  }

  return (
    <div className="app-container" style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>

      {/* Header / Info Bar */}
      <div style={{
        height: '30px',
        background: '#222',
        borderBottom: '1px solid #444',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        justifyContent: 'space-between',
        color: '#ccc',
        fontSize: '12px'
      }}>
        <span>CONNECTED | {user.username} ({user.role})</span>
        <button onClick={logout} style={{ background: 'none', border: 'none', color: '#f66', cursor: 'pointer' }}>LOGOUT</button>
      </div>

      <div style={{ height: 'calc(100vh - 30px)' }}>
        <SimpleSplitPane orientation="vertical" initialRatio={0.5}>
          {/* Top Pane */}
          <div ref={chart1Ref} style={{ width: '100%', height: '100%', position: 'relative' }}>
            {dim1.width > 0 && dim1.height > 0 && (
              <ChartContainer
                id="chart-1"
                width={dim1.width}
                height={dim1.height}
                theme={workspace.theme}
                initialTransform={workspace.transform}
                syncManager={syncManagerRef.current!}
                data={candles}
                indicatorData={indicators1}
              />
            )}
            <div style={{ position: 'absolute', top: 10, left: 10, color: '#888', pointerEvents: 'none', fontSize: '12px' }}>
              Chart 1 (SMA 20)
            </div>
          </div>

          {/* Bottom Pane */}
          <div ref={chart2Ref} style={{ width: '100%', height: '100%', position: 'relative' }}>
            {dim2.width > 0 && dim2.height > 0 && (
              <ChartContainer
                id="chart-2"
                width={dim2.width}
                height={dim2.height}
                theme={workspace.theme}
                initialTransform={workspace.transform}
                syncManager={syncManagerRef.current!}
                data={candles}
                indicatorData={indicators2}
              />
            )}
            <div style={{ position: 'absolute', top: 10, left: 10, color: '#888', pointerEvents: 'none', fontSize: '12px' }}>
              Chart 2 (EMA 20)
            </div>
          </div>
        </SimpleSplitPane>
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
