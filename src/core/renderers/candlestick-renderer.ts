
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

export interface RenderBounds {
    minPrice: number;
    maxPrice: number;
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
        viewMatrix: mat4,
        bounds?: RenderBounds
    ): void {
        if (candles.length === 0) return;

        // Calculate bounds from data if not provided
        const dataBounds = bounds || this.calculateBounds(candles);

        // 2. Build Geometry
        const geometry = this.buildGeometry(candles, viewport, dataBounds);

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

    public calculateBounds(candles: Candle[]): RenderBounds {
        if (candles.length === 0) {
            return { minPrice: 0, maxPrice: 100 };
        }

        let minPrice = Infinity;
        let maxPrice = -Infinity;

        for (const candle of candles) {
            if (candle.low < minPrice) minPrice = candle.low;
            if (candle.high > maxPrice) maxPrice = candle.high;
        }

        // Add padding (5% on each side)
        const range = maxPrice - minPrice;
        const padding = range * 0.05;

        return {
            minPrice: minPrice - padding,
            maxPrice: maxPrice + padding
        };
    }

    private buildGeometry(candles: Candle[], viewport: Viewport, bounds: RenderBounds): CandleGeometry {
        const vertexData: number[] = [];
        const indexData: number[] = [];
        let vertexIndex = 0;

        // Calculate dimensions based on viewport
        const chartHeight = viewport.height;
        const chartWidth = viewport.width;
        const priceRange = bounds.maxPrice - bounds.minPrice;

        // Calculate candle width based on number of visible candles
        const numCandles = candles.length;
        const totalCandleSpace = chartWidth * 0.9; // 90% for candles, 10% for margins
        const candleWidth = Math.max(3, Math.min(20, totalCandleSpace / numCandles * 0.8));
        const spacing = candleWidth * 0.25;
        const totalWidth = candleWidth + spacing;

        // Margin from edges
        const leftMargin = chartWidth * 0.05;
        const topMargin = 30; // Space for price labels
        const bottomMargin = 30; // Space for time labels
        const usableHeight = chartHeight - topMargin - bottomMargin;

        // Price to Y coordinate conversion
        const priceToY = (price: number): number => {
            const normalized = (price - bounds.minPrice) / priceRange;
            // Invert Y so higher prices are at top (lower Y value)
            return topMargin + usableHeight * (1 - normalized);
        };

        candles.forEach((candle, i) => {
            // Calculate X position
            const x = leftMargin + i * totalWidth + candleWidth / 2;

            // Calculate Y positions using proper scaling
            const yOpen = priceToY(candle.open);
            const yClose = priceToY(candle.close);
            const yHigh = priceToY(candle.high);
            const yLow = priceToY(candle.low);

            const isBullish = candle.close >= candle.open;
            const color = isBullish
                ? [0.15, 0.75, 0.55, 1.0]  // Teal green
                : [0.94, 0.33, 0.31, 1.0]; // Coral red

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
            const wickX = x;
            const wickWidth = Math.max(1, candleWidth * 0.1);
            const bodyTop = top;
            const bodyBottom = finalBottom;

            // Top Wick (from body top to high)
            if (yHigh < bodyTop - 0.5) {
                this.addRect(vertexData, indexData, vertexIndex, wickX - wickWidth / 2, yHigh, wickX + wickWidth / 2, bodyTop, color, 1.0);
                vertexIndex += 4;
            }

            // Bottom Wick (from body bottom to low)
            if (yLow > bodyBottom + 0.5) {
                this.addRect(vertexData, indexData, vertexIndex, wickX - wickWidth / 2, bodyBottom, wickX + wickWidth / 2, yLow, color, 1.0);
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
