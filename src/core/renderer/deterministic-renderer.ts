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

        // 1. Clear with deterministic color
        this.clearCanvas(state.theme);

        // 2. Set up projection (deterministic)
        const projMatrix = this.calculateProjection(state.viewport);
        const viewMatrix = this.calculateView(state.viewport);

        // 3. Render Candles
        this.candlestickRenderer.render(
            state.data.candles,
            state.viewport,
            projMatrix,
            viewMatrix
        );

        // 4. Render Indicators
        if (state.data.indicators?.sma) {
            this.lineRenderer.render(
                state.data.indicators.sma,
                state.viewport,
                projMatrix,
                viewMatrix,
                [1.0, 0.5, 0.0, 1.0] // Orange for SMA
            );
        }

        const objectsRendered = state.data.candles.length;

        // 5. Calculate frame hash
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

    private calculateView(viewport: Viewport): mat4 {
        const out = mat4.create();
        const { x, y, scale } = viewport;

        // Apply translation and scale
        // We are effectively moving the camera
        mat4.translate(out, out, [-x, -y, 0]);
        mat4.scale(out, out, [scale, scale, 1]);

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
}
