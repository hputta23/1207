import type { Theme, Viewport } from '../core/renderer/types';

export type ChartId = string;
export type Interval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';

export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface TimeRange {
    start: number;
    end: number;
}

export interface IndicatorConfig {
    id: string;
    type: string;
    parameters: Record<string, unknown>;
}

export interface Drawing {
    id: string;
    type: 'line' | 'rect' | 'circle';
    points: Position[];
}

/**
 * STATE OWNERSHIP RULES
 * 
 * 1. Global State owns:
 *    - Workspace transform (pan/zoom of infinite canvas)
 *    - Sync settings (which charts are synced, how)
 *    - Theme (light/dark/custom)
 *    - Global time range (if time-synced)
 *    - Global cursor position (if cursor-synced)
 * 
 * 2. Chart-Local State owns:
 *    - Position on canvas
 *    - Size (width/height)
 *    - Symbol and interval
 *    - Indicators configuration
 *    - Drawings
 *    - Local time range (when not synced)
 */

export interface GlobalState {
    workspace: {
        transform: Viewport;      // Re-using Viewport type for transform for now
        theme: Theme;              // Color scheme
    };

    sync: {
        mode: 'none' | 'time' | 'cursor' | 'both' | 'all';
        timeRange: TimeRange | null;
        cursorPosition: Position | null;
    };
}

export interface ChartLocalState {
    id: ChartId;
    position: Position;          // Where on canvas
    size: Size;                  // Chart dimensions
    symbol: string;
    interval: Interval;
    indicators: IndicatorConfig[];
    drawings: Drawing[];

    // Used only when NOT synced
    localTimeRange: TimeRange | null;
}
