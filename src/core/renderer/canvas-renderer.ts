import { CanvasCandlestickRenderer } from '../renderers/canvas-candlestick-renderer';
import { CanvasLineRenderer } from '../renderers/canvas-line-renderer';
import type { RenderState, RenderOutput, Theme } from './types';
import { simpleHash } from '../../shared/utils/hash';

export class CanvasRenderer {
    private ctx: CanvasRenderingContext2D;
    private candlestickRenderer: CanvasCandlestickRenderer;
    private lineRenderer: CanvasLineRenderer;

    constructor(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
            throw new Error('Could not get Canvas 2D context');
        }
        this.ctx = ctx;
        this.candlestickRenderer = new CanvasCandlestickRenderer(this.ctx);
        this.lineRenderer = new CanvasLineRenderer(this.ctx);
    }

    public render(state: RenderState): RenderOutput {
        const startTime = performance.now();

        // 1. Clear
        this.clearCanvas(state.theme);

        // 2. Metrics & Bounds
        const bounds = this.candlestickRenderer.calculateBounds(state.data.candles);
        const numCandles = state.data.candles.length;

        // 3. Render Candles
        this.candlestickRenderer.render(
            state.data.candles,
            state.viewport,
            bounds
        );

        // 4. Render Indicators
        if (state.data.indicatorList) {
            for (const indicator of state.data.indicatorList) {
                this.lineRenderer.render(
                    indicator.points,
                    state.viewport,
                    indicator.color,
                    bounds,
                    numCandles
                );
            }
        }

        // Legacy indicators
        if (state.data.indicators?.sma) {
            this.lineRenderer.render(
                state.data.indicators.sma,
                state.viewport,
                '#ffa500', // Orange
                bounds,
                numCandles
            );
        }

        if (state.data.indicators?.ema) {
            this.lineRenderer.render(
                state.data.indicators.ema,
                state.viewport,
                '#60a5fa', // Blue
                bounds,
                numCandles
            );
        }

        const renderTime = performance.now() - startTime;

        // Use simplified hash for now 
        const frameId = simpleHash(JSON.stringify(state.timestamp));

        return {
            frameId,
            renderTime,
            objectsRendered: numCandles
        };
    }

    private clearCanvas(theme: Theme): void {
        this.ctx.fillStyle = theme.background;
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }
}
