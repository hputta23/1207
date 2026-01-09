
import { mat4 } from 'gl-matrix';
import { WebGLContextManager } from '../webgl/context-manager';
import type { Candle, Viewport } from '../renderer/types';
// @ts-ignore
import vertSource from '../../shaders/candlestick.vert.glsl?raw';
// @ts-ignore
import fragSource from '../../shaders/candlestick.frag.glsl?raw';

interface CandleGeometry {
    vertices: Float32Array;
    indices: Uint16Array;
    vertexCount: number;
}

export class CandlestickRenderer {
    private gl: WebGL2RenderingContext;
    private program: WebGLProgram;
    private vbo: WebGLBuffer | null = null;
    private ebo: WebGLBuffer | null = null;
    private vao: WebGLVertexArrayObject | null = null;

    // Attribute locations
    private attribLocations = {
        position: 0,
        color: 0,
        candleType: 0
    };

    // Uniform locations
    private uniformLocations = {
        projection: null as WebGLUniformLocation | null,
        view: null as WebGLUniformLocation | null
    };

    constructor(gl: WebGL2RenderingContext | WebGLRenderingContext, contextManager: WebGLContextManager) {
        if (!(gl instanceof WebGL2RenderingContext)) {
            throw new Error('CandlestickRenderer requires WebGL2');
        }
        this.gl = gl;

        this.program = contextManager.getOrCreateProgram(
            'candlestick',
            vertSource,
            fragSource
        );

        this.initLocations();
        this.initBuffers();
    }

    private initLocations(): void {
        this.attribLocations = {
            position: this.gl.getAttribLocation(this.program, 'a_position'),
            color: this.gl.getAttribLocation(this.program, 'a_color'),
            candleType: this.gl.getAttribLocation(this.program, 'a_candleType')
        };

        this.uniformLocations = {
            projection: this.gl.getUniformLocation(this.program, 'u_projection'),
            view: this.gl.getUniformLocation(this.program, 'u_view')
        };
    }

    private initBuffers(): void {
        this.vao = this.gl.createVertexArray();
        this.gl.bindVertexArray(this.vao);

        this.vbo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);

        // Layout: x, y (2) + r, g, b, a (4) + type (1) = 7 floats
        const stride = 7 * 4;

        this.gl.enableVertexAttribArray(this.attribLocations.position);
        this.gl.vertexAttribPointer(this.attribLocations.position, 2, this.gl.FLOAT, false, stride, 0);

        this.gl.enableVertexAttribArray(this.attribLocations.color);
        this.gl.vertexAttribPointer(this.attribLocations.color, 4, this.gl.FLOAT, false, stride, 2 * 4);

        this.gl.enableVertexAttribArray(this.attribLocations.candleType);
        this.gl.vertexAttribPointer(this.attribLocations.candleType, 1, this.gl.FLOAT, false, stride, 6 * 4);

        this.ebo = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ebo);

        this.gl.bindVertexArray(null);
    }

    public render(
        candles: Candle[],
        viewport: Viewport,
        projMatrix: mat4,
        viewMatrix: mat4
    ): void {
        if (candles.length === 0) return;

        // 1. Cull / Filter
        // Simple index-based culling requires data to be sorted by time and mapped to X
        // For this POC, we'll just render everything or a subset if provided

        // 2. Build Geometry
        const geometry = this.buildGeometry(candles, viewport);

        // 3. Upload
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vbo);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, geometry.vertices, this.gl.DYNAMIC_DRAW);

        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, geometry.indices, this.gl.DYNAMIC_DRAW);

        // 4. Draw
        this.gl.useProgram(this.program);
        this.gl.uniformMatrix4fv(this.uniformLocations.projection, false, projMatrix);
        this.gl.uniformMatrix4fv(this.uniformLocations.view, false, viewMatrix);

        this.gl.bindVertexArray(this.vao);
        this.gl.drawElements(this.gl.TRIANGLES, geometry.indices.length, this.gl.UNSIGNED_SHORT, 0);
        this.gl.bindVertexArray(null);
    }

    private buildGeometry(candles: Candle[], _viewport: Viewport): CandleGeometry {
        // Estimate size to avoid resizing arrays too often if possible, but JS arrays grow dyn anyway.
        // Use strictly typed arrays for final output.
        const vertexData: number[] = [];
        const indexData: number[] = [];
        let vertexIndex = 0;

        // Width of a candle in pixels (or world units if 1 unit = 1 pixel)
        // In our coordinate system, X is likely index or time.
        // Let's assume X = index * candleWidth + spacing
        const candleWidth = 10; // World units
        const spacing = 2;
        const totalWidth = candleWidth + spacing;

        candles.forEach((candle, i) => {
            // Calculate X position
            const x = i * totalWidth + totalWidth / 2;

            // Calculate Y positions (In our world space, Y increases downwards usually in screen coords, 
            // but we set up Ortho 0..height, so 0 is top.
            // Price needs to be mapped to Y.
            // We'll trust the View Matrix to handle Pan/Zoom, but we need to map Price -> World Y.
            // For simplicity, let's map Price directly to Y inverted or not?
            // Let's map Price = -Y (so higher price = lower Y value = higher on screen if 0 is top)
            // OR better: Map 0 at bottom, Height at top.
            // Deterministic Render set Ortho: 0, width, height, 0 (Top-Left 0,0).
            // So Y increases downwards.
            // Higher Price should be smaller Y.

            // We need a Price-to-Y scale. This is usually part of the Transform/View matrix.
            // But here we might just map data directly if the Viewport handles scale.
            // Let's assume the data is already in a "World" space or we project it here.
            // Actually, normally the View Matrix handles X pan/zoom, but Y scale is dynamic based on price range.
            // To keep it simple: we use a "pixels per dollar" scale.

            // POC: Just scale price by some factor to make it visible
            const priceScale = 1.0;
            const yOpen = 600 - candle.open * priceScale;
            const yClose = 600 - candle.close * priceScale;
            const yHigh = 600 - candle.high * priceScale;
            const yLow = 600 - candle.low * priceScale;

            const isBullish = candle.close >= candle.open;
            const color = isBullish
                ? [0.0, 0.8, 0.4, 1.0]  // Green
                : [0.9, 0.3, 0.3, 1.0]; // Red

            const type = candle.complete ? 0.0 : 2.0;

            // Body (Rect)
            const left = x - candleWidth / 2;
            const right = x + candleWidth / 2;
            const top = Math.min(yOpen, yClose);
            const bottom = Math.max(yOpen, yClose);

            // Avoid zero-height body
            const finalBottom = (Math.abs(bottom - top) < 1) ? top + 1 : bottom;

            this.addRect(vertexData, indexData, vertexIndex, left, top, right, finalBottom, color, type);
            vertexIndex += 4;

            // Wick (Line/Rect)
            // High to Max(Open, Close)
            const wickX = x;
            // const wickW = 1;
            const bodyTop = top;
            const bodyBottom = finalBottom;

            // Top Wick
            if (yHigh < bodyTop) {
                this.addRect(vertexData, indexData, vertexIndex, wickX - 0.5, yHigh, wickX + 0.5, bodyTop, color, 1.0);
                vertexIndex += 4;
            }

            // Bottom Wick
            if (yLow > bodyBottom) {
                this.addRect(vertexData, indexData, vertexIndex, wickX - 0.5, bodyBottom, wickX + 0.5, yLow, color, 1.0);
                vertexIndex += 4;
            }
        });

        return {
            vertices: new Float32Array(vertexData),
            indices: new Uint16Array(indexData),
            vertexCount: indexData.length
        };
    }

    private addRect(
        vertices: number[],
        indices: number[],
        startIdx: number,
        x1: number, y1: number,
        x2: number, y2: number,
        color: number[],
        type: number
    ) {
        // TL, TR, BR, BL
        vertices.push(
            x1, y1, color[0], color[1], color[2], color[3], type,
            x2, y1, color[0], color[1], color[2], color[3], type,
            x2, y2, color[0], color[1], color[2], color[3], type,
            x1, y2, color[0], color[1], color[2], color[3], type
        );

        indices.push(
            startIdx, startIdx + 1, startIdx + 2,
            startIdx, startIdx + 2, startIdx + 3
        );
    }
}
