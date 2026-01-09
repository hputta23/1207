import type { Candle } from '../renderer/types';

export interface Point {
    x: number; // Index or timestamp? For rendering we map index usually.
    y: number; // Value
    defined: boolean;
}

export class Indicators {

    static calculateSMA(candles: Candle[], period: number): Point[] {
        const result: Point[] = [];
        for (let i = 0; i < candles.length; i++) {
            if (i < period - 1) {
                result.push({ x: i, y: 0, defined: false });
                continue;
            }

            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += candles[i - j].close;
            }

            result.push({ x: i, y: sum / period, defined: true });
        }
        return result;
    }

    static calculateEMA(candles: Candle[], period: number): Point[] {
        const result: Point[] = [];
        const k = 2 / (period + 1);
        let ema = 0;

        for (let i = 0; i < candles.length; i++) {
            if (i === 0) {
                ema = candles[i].close;
                result.push({ x: i, y: ema, defined: true }); // Initialize with first close
                continue;
            }

            // EMA = Price(t) * k + EMA(y) * (1 - k)
            ema = candles[i].close * k + ema * (1 - k);
            result.push({ x: i, y: ema, defined: true });
        }
        return result;
    }
}
