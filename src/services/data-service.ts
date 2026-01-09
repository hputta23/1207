import { DataNormalizer } from '../core/data/normalizer';
import type { Candle } from '../core/renderer/types';

type DataListener = (data: Candle[]) => void;

export class DataService {
    private listeners = new Set<DataListener>();
    private intervalId: any = null;
    private currentCandles: Candle[] = [];
    private lastPrice = 1000;
    // private lastTimestamp = Date.now();

    // Config
    private updateRateMs = 100; // 100ms updates
    private candleIntervalMs = 1000; // 1s candles for testing

    constructor() {
        this.generateInitialHistory();
        this.startSimulation();
    }

    public subscribe(listener: DataListener): () => void {
        this.listeners.add(listener);
        // Send current state immediately
        listener(this.currentCandles);
        return () => this.listeners.delete(listener);
    }

    private generateInitialHistory() {
        // Generate last 100 candles
        const history: any[] = [];
        const now = Date.now();
        let price = 1000;

        for (let i = 100; i > 0; i--) {
            const time = now - i * this.candleIntervalMs;
            const volatility = 2.0;
            const open = price;
            const close = price + (Math.random() - 0.5) * volatility;
            const high = Math.max(open, close) + Math.random();
            const low = Math.min(open, close) - Math.random();

            history.push({
                t: time,
                o: open,
                h: high,
                l: low,
                c: close,
                v: Math.floor(Math.random() * 100)
            });
            price = close;
        }

        this.currentCandles = DataNormalizer.normalizeArray(history);
        this.lastPrice = price;
        // this.lastTimestamp = now;
    }

    private startSimulation() {
        if (this.intervalId) return;

        this.intervalId = setInterval(() => {
            const now = Date.now();
            const currentCandle = this.currentCandles[this.currentCandles.length - 1];

            // Check if we need a new candle or update existing
            const isNewCandle = now - currentCandle.timestamp > this.candleIntervalMs;

            if (isNewCandle) {
                // Finalize old candle (implicitly done by creating new one)
                currentCandle.complete = true;

                // Create new partial candle
                const newCandle: Candle = {
                    timestamp: now,
                    open: this.lastPrice,
                    high: this.lastPrice,
                    low: this.lastPrice,
                    close: this.lastPrice,
                    volume: 0,
                    complete: false
                };
                this.currentCandles = [...this.currentCandles, newCandle];
                // Keep buffer size fixed if needed, e.g. 1000
                if (this.currentCandles.length > 500) {
                    this.currentCandles.shift();
                }
            } else {
                // Update existing candle (simulate ticks)
                const change = (Math.random() - 0.5) * 1.5;
                const newPrice = this.lastPrice + change;

                const update: Partial<Candle> = {
                    close: newPrice,
                    volume: Math.floor(Math.random() * 10),
                    complete: false
                };

                const updatedCandle = DataNormalizer.mergeUpdate(currentCandle, update);
                this.currentCandles[this.currentCandles.length - 1] = updatedCandle;
                this.lastPrice = newPrice;
            }

            this.notifyListeners();

        }, this.updateRateMs);
    }

    private notifyListeners() {
        // In a real app we might verify if listeners need full array or just updates
        // For React/Immutability, sending new array reference is easiest
        const dataSnapshot = [...this.currentCandles];
        this.listeners.forEach(l => l(dataSnapshot));
    }

    public stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
}
