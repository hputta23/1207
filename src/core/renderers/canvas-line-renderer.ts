import type { Point, Viewport } from '../renderer/types';
import type { RenderBounds } from './canvas-candlestick-renderer';

export class CanvasLineRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(context: CanvasRenderingContext2D) {
        this.ctx = context;
    }

    public render(
        points: Point[],
        viewport: Viewport,
        color: string,
        bounds: RenderBounds,
        numCandles: number
    ): void {
        if (points.length === 0) return;

        const { width, height } = viewport;
        const { minPrice, maxPrice } = bounds;
        const priceRange = maxPrice - minPrice;

        // Metrics match candlestick renderer
        const totalCandleSpace = width * 0.9;
        const candleWidth = Math.max(3, Math.min(20, totalCandleSpace / numCandles * 0.8));
        const spacing = candleWidth * 0.25;
        const totalWidth = candleWidth + spacing;

        const leftMargin = width * 0.05;
        const topMargin = 30;
        const bottomMargin = 30;
        const usableHeight = height - topMargin - bottomMargin;

        const priceToY = (price: number): number => {
            const normalized = (price - minPrice) / priceRange;
            return topMargin + usableHeight * (1 - normalized);
        };

        this.ctx.beginPath();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 1.5;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        let hasStarted = false;

        // Alignment logic: Points align with candlestick centers
        // However, indicators might have fewer points or be offset.
        // Assuming points align from the END if length differs, or assuming 1-to-1 mapping
        // Logic in LineRenderer WebGL suggests they map 1-to-1 with indices if fully populated.
        // If points array maps 1:1 to visible candles:

        points.forEach((point, i) => {
            if (!point.defined) {
                // Gap in line
                hasStarted = false;
                return;
            }

            // We assume points array has same length as candles array or corresponds to it
            // Ideally we need the index relative to the viewport.
            // If the points array IS the length of the viewport candles:
            const x = leftMargin + i * totalWidth + candleWidth / 2;
            const y = priceToY(point.y);

            if (!hasStarted) {
                this.ctx.moveTo(x, y);
                hasStarted = true;
            } else {
                this.ctx.lineTo(x, y);
            }
        });

        this.ctx.stroke();
    }
}
