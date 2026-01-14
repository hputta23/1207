import type { Candle, Viewport } from '../renderer/types';

export interface RenderBounds {
    minPrice: number;
    maxPrice: number;
}

export class CanvasCandlestickRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(context: CanvasRenderingContext2D) {
        this.ctx = context;
    }

    public render(
        candles: Candle[],
        viewport: Viewport,
        bounds: RenderBounds
    ): void {
        if (candles.length === 0) return;
        if (!viewport || !viewport.width || !viewport.height) return; // Guard clause

        const { width, height } = viewport;
        const { minPrice, maxPrice } = bounds;
        const priceRange = maxPrice - minPrice;

        if (priceRange === 0) return;

        // Metrics
        const numCandles = candles.length;
        // Same logic as WebGL for consistency
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

        this.ctx.lineWidth = 1;

        candles.forEach((candle, i) => {
            const x = leftMargin + i * totalWidth + candleWidth / 2;

            const yOpen = priceToY(candle.open);
            const yClose = priceToY(candle.close);
            const yHigh = priceToY(candle.high);
            const yLow = priceToY(candle.low);

            const isBullish = candle.close >= candle.open;

            // Set Color
            this.ctx.fillStyle = isBullish ? '#10b981' : '#ef4444';
            this.ctx.strokeStyle = isBullish ? '#10b981' : '#ef4444';

            // Wick
            this.ctx.beginPath();
            this.ctx.moveTo(x, yHigh);
            this.ctx.lineTo(x, yLow);
            this.ctx.stroke();

            // Body
            const bodyTop = Math.min(yOpen, yClose);
            const bodyBottom = Math.max(yOpen, yClose);
            const bodyHeight = Math.max(1, bodyBottom - bodyTop);

            this.ctx.fillRect(
                x - candleWidth / 2,
                bodyTop,
                candleWidth,
                bodyHeight
            );
        });
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

        const range = maxPrice - minPrice;
        const padding = range * 0.05;

        return {
            minPrice: minPrice - padding,
            maxPrice: maxPrice + padding
        };
    }
}
