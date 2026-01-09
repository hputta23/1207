import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { GlobalState, ChartLocalState, ChartId } from './ownership';
import type { Theme, Viewport } from '../core/renderer/types';

interface AppState extends GlobalState {
    // Charts map
    charts: Map<ChartId, ChartLocalState>;

    // Actions - Charts
    addChart: (config: Partial<ChartLocalState>) => ChartId;
    removeChart: (id: ChartId) => void;
    updateChart: (id: ChartId, update: Partial<ChartLocalState>) => void;
    // moveChart: (id: ChartId, position: Position) => void;
    // resizeChart: (id: ChartId, size: Size) => void;

    // Actions - Workspace
    setWorkspaceTransform: (transform: Viewport) => void;
    setTheme: (theme: Theme) => void;

    // Actions - Sync
    // enableTimeSync: (chartIds: ChartId[]) => void;
    // disableTimeSync: () => void;
    // updateSyncedTime: (range: TimeRange) => void;
}

const defaultTheme: Theme = {
    background: '#121212',
    grid: '#2a2a2a',
    bullish: '#26a69a',
    bearish: '#ef5350',
    text: '#d1d4dc',
    crosshair: '#787b86'
};

export const useStore = create<AppState>()(
    devtools(
        subscribeWithSelector(
            persist(
                (set) => ({
                    workspace: {
                        transform: { x: 0, y: 0, width: 1000, height: 800, scale: 1.0 },
                        theme: defaultTheme
                    },
                    sync: {
                        mode: 'none',
                        timeRange: null,
                        cursorPosition: null
                    },
                    charts: new Map(),

                    addChart: (config) => {
                        const id = uuidv4();
                        const chart: ChartLocalState = {
                            id,
                            position: config.position || { x: 0, y: 0 },
                            size: config.size || { width: 800, height: 600 },
                            symbol: config.symbol || 'SPY',
                            interval: config.interval || '1h',
                            indicators: [],
                            drawings: [],
                            localTimeRange: null
                        };

                        set((state) => ({
                            charts: new Map(state.charts).set(id, chart)
                        }));
                        return id;
                    },

                    removeChart: (id) => {
                        set((state) => {
                            const newCharts = new Map(state.charts);
                            newCharts.delete(id);
                            return { charts: newCharts };
                        });
                    },

                    updateChart: (id, update) => {
                        set((state) => {
                            const chart = state.charts.get(id);
                            if (!chart) return state;

                            const updated = { ...chart, ...update };
                            const newCharts = new Map(state.charts);
                            newCharts.set(id, updated);

                            return { charts: newCharts };
                        });
                    },

                    setWorkspaceTransform: (transform) => {
                        set((state) => ({
                            workspace: { ...state.workspace, transform }
                        }));
                    },

                    setTheme: (theme) => {
                        set((state) => ({
                            workspace: { ...state.workspace, theme }
                        }));
                    }
                }),
                {
                    name: '1207-storage',
                    partialize: (state) => ({
                        workspace: state.workspace,
                        // Convert Map to array for persistence
                        charts: Array.from(state.charts.entries())
                    }) as any, // Type cast needed for simple persistence of complex maps
                    merge: (persistedState: any, currentState) => {
                        // Rehydrate Map from array
                        const charts = new Map(persistedState.charts || []);
                        return { ...currentState, ...persistedState, charts };
                    }
                }
            )
        )
    )
);
