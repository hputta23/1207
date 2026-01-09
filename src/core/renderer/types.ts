
export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

export interface Candle {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  complete: boolean;
}

export interface Point {
  x: number;
  y: number;
  defined: boolean;
}

export interface IndicatorData {
  id: string;
  name: string;
  color: string;
  points: Point[];
}

export interface CandleData {
  candles: Candle[];
  indicators?: {
    sma?: Point[];
    ema?: Point[];
  };
  // New: dynamic indicators array
  indicatorList?: IndicatorData[];
  // Metadata for rendering optimization
  minPrice: number;
  maxPrice: number;
  minTime: number;
  maxTime: number;
}

export interface Theme {
  background: string;
  grid: string;
  bullish: string;
  bearish: string;
  text: string;
  crosshair: string;
}

export interface RenderState {
  readonly viewport: Viewport;
  readonly data: CandleData; // Using the full data object for now, or a visible subset
  readonly theme: Theme;
  readonly timestamp: number; // For replay/debugging logic
}

export interface RenderOutput {
  frameId: string; // Hash of input state
  renderTime: number;
  objectsRendered: number;
}
