import type { Candle, Viewport } from '../renderer/types';

export interface CrosshairState {
    x: number;
    y: number;
    dataIndex: number;
    candle: Candle | null;
    timestamp: number;
    price: number;
    visible: boolean;
}

export class CrosshairManager {
    /**
     * Calculates the crosshair state based on mouse position and chart context.
     */
    static calculate(
        mouseX: number,
        mouseY: number,
        viewport: Viewport,
        data: Candle[],
        _containerWidth: number,
        _containerHeight: number
    ): CrosshairState {
        // 1. Calculate Price (Y-axis)
        // Map Y pixel to Price:
        // Pixel 0 (top) = MaxPrice ?? Not exactly.
        // We need to know the price bounds currently visible. 
        // NOTE: Our simple renderer currently uses a fixed projection 0..Height.
        // But physically, 0 is High Price, Height is Low Price usually.
        // For now, let's map generic "Unit" coordinates assuming scale=1 means 1px = 1 unit

        // This is tricky without the RenderState's exact bounds (minPrice/maxPrice).
        // The Viewport tells us translation/scale.
        // Let's assume:
        // WorldX = (ScreenX - TranslationX) / Scale
        // WorldY = (ScreenY - TranslationY) / Scale

        const worldX = (mouseX - viewport.x) / viewport.scale;

        // 2. Calculate Index (X-axis)
        // Assuming 1 unit = 1 candle width + space for now? 
        // In our CandlestickRenderer:
        // x = i * (candleW + gap) 
        // candleW=5, gap=2 => stride=7
        const candleStride = 7;
        const dataIndex = Math.floor(worldX / candleStride);

        let candle: Candle | null = null;
        if (dataIndex >= 0 && dataIndex < data.length) {
            candle = data[dataIndex];
        }

        // 3. Price (Approximate for visual crosshair)
        // Ideally we need the Y-axis domain.
        // For this demo, let's just return the raw Y or mapped if possible.
        const price = 0; // Placeholder until we have full Y-axis scaling logic

        return {
            x: mouseX,
            y: mouseY,
            dataIndex,
            candle,
            timestamp: candle?.timestamp || 0,
            price,
            visible: true
        };
    }
}
