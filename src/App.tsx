import { useEffect, useState, useRef, useMemo } from 'react';
import { useStore } from './state/store';
import { ChartContainer } from './components/Chart/ChartContainer';
import { TimeSyncManager } from './core/synchronization/time-sync-manager';
import { DataService } from './services/data-service';
import { SimpleSplitPane } from './components/Layout/SimpleSplitPane';
import { useDimensions } from './hooks/useDimensions';
import { Indicators } from './core/data/indicators';
import type { Candle } from './core/renderer/types';
import './App.css';

function App() {
  const workspace = useStore((state) => state.workspace);
  const [candles, setCandles] = useState<Candle[]>([]);

  // persistent services
  const syncManagerRef = useRef<TimeSyncManager | null>(null);
  const dataServiceRef = useRef<DataService | null>(null);

  // Measure dimensions 
  const { ref: chart1Ref, dimensions: dim1 } = useDimensions<HTMLDivElement>();
  const { ref: chart2Ref, dimensions: dim2 } = useDimensions<HTMLDivElement>();

  if (!syncManagerRef.current) syncManagerRef.current = new TimeSyncManager();
  if (!dataServiceRef.current) dataServiceRef.current = new DataService();

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

  return (
    <div className="app-container" style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
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
            Chart 1 (Synced • Live)
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
            Chart 2 (Synced • Live)
          </div>
        </div>
      </SimpleSplitPane>
    </div>
  );
}

export default App;
