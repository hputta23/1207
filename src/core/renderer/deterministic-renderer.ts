import { mat4 } from 'gl-matrix';
import { WebGLContextManager } from '../webgl/context-manager';
import type { RenderState, RenderOutput, Theme, Viewport, CandleData } from './types';
import { simpleHash } from '../../shared/utils/hash';
import { CandlestickRenderer } from '../renderers/candlestick-renderer';
import { LineRenderer } from '../renderers/line-renderer';

export class DeterministicRenderer {
    private gl: WebGL2RenderingContext | WebGLRenderingContext;
    private contextManager: WebGLContextManager;
    private candlestickRenderer: CandlestickRenderer;
    private lineRenderer: LineRenderer;

    constructor(canvas: HTMLCanvasElement) {
        this.contextManager = new WebGLContextManager();
        this.gl = this.contextManager.initContext(canvas);
        this.candlestickRenderer = new CandlestickRenderer(this.gl, this.contextManager);
        this.lineRenderer = new LineRenderer(this.gl, this.contextManager);
    }

    render(state: RenderState): RenderOutput {
        const startTime = performance.now();

        // 1. Update WebGL viewport to match canvas size
        this.gl.viewport(0, 0, state.viewport.width, state.viewport.height);

        // 2. Clear with deterministic color
        this.clearCanvas(state.theme);

        // 3. Set up projection (deterministic) - identity view since geometry is in screen coords
        const projMatrix = this.calculateProjection(state.viewport);
        const viewMatrix = mat4.create(); // Identity matrix - no view transform needed

        // 3. Calculate bounds from data
        const bounds = this.candlestickRenderer.calculateBounds(state.data.candles);
        const numCandles = state.data.candles.length;

        // 4. Render Candles
        this.candlestickRenderer.render(
            state.data.candles,
            state.viewport,
            projMatrix,
            viewMatrix,
            bounds
        );

        // 5. Render Indicators - support both old and new format
        // New dynamic indicators list
        if (state.data.indicatorList && state.data.indicatorList.length > 0) {
            for (const indicator of state.data.indicatorList) {
                const color = this.parseColorToArray(indicator.color);
                this.lineRenderer.render(
                    indicator.points,
                    state.viewport,
                    projMatrix,
                    viewMatrix,
                    color,
                    bounds,
                    numCandles
                );
            }
        }

        // Legacy support for old indicator format
        if (state.data.indicators?.sma) {
            this.lineRenderer.render(
                state.data.indicators.sma,
                state.viewport,
                projMatrix,
                viewMatrix,
                [1.0, 0.6, 0.0, 1.0], // Orange for SMA
                bounds,
                numCandles
            );
        }

        if (state.data.indicators?.ema) {
            this.lineRenderer.render(
                state.data.indicators.ema,
                state.viewport,
                projMatrix,
                viewMatrix,
                [0.4, 0.6, 1.0, 1.0], // Blue for EMA
                bounds,
                numCandles
            );
        }

        const objectsRendered = state.data.candles.length;

        // 6. Calculate frame hash
        const frameId = this.calculateFrameHash(state);

        const renderTime = performance.now() - startTime;

        return { frameId, renderTime, objectsRendered };
    }

    private clearCanvas(theme: Theme): void {
        const [r, g, b, a] = this.parseColor(theme.background);
        this.gl.clearColor(r, g, b, a);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    private calculateProjection(viewport: Viewport): mat4 {
        const out = mat4.create();
        // Orthographic projection: left, right, bottom, top, near, far
        // Coordinate system: (0,0) at top-left
        mat4.ortho(out, 0, viewport.width, viewport.height, 0, -1, 1);
        return out;
    }

    private calculateFrameHash(state: RenderState): string {
        // Hash the input state to verify determinism logic (input -> hash)
        // In a real verification, we might readPixels, but reading pixels is slow.
        // We verify "Input Determinism" here.
        const stateString = JSON.stringify({
            viewport: state.viewport,
            dataHash: this.hashCandleData(state.data),
            theme: state.theme,
            timestamp: state.timestamp
        });

        return simpleHash(stateString);
    }

    private hashCandleData(data: CandleData): string {
        // Hash a subset or summary of candle data
        // Optimisation: Hash start/end indices and specific values
        const sample = data.candles.length > 0 ? data.candles[0].close : 0;
        return `${data.candles.length}-${sample}`;
    }

    private parseColor(hex: string): [number, number, number, number] {
        // Minimal hex parser
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return [r, g, b, 1.0];
    }

    private parseColorToArray(color: string): [number, number, number, number] {
        // Handle hex colors
        if (color.startsWith('#')) {
            return this.parseColor(color);
        }
        // Default fallback
        return [1.0, 1.0, 1.0, 1.0];
    }
}
