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

    private isStatic = false;
    private currentSymbol = 'SPY';

    constructor(useStaticData = false, symbol = 'SPY') {
        this.isStatic = useStaticData;
        this.currentSymbol = symbol;
        if (this.isStatic) {
            this.generateStaticFixture();
        } else {
            // Start with mock data, will be replaced by fetchHistory
            this.generateInitialHistory();
            this.startSimulation();
        }
    }

    /**
     * Fetch historical data from Yahoo Finance API
     * Falls back to mock data if API fails
     */
    public async fetchHistory(symbol: string, interval = '1d', range = '1mo'): Promise<void> {
        try {
            const url = `/api/yahoo/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
            const response = await fetch(url);

            if (!response.ok) {
                console.warn(`Yahoo Finance API returned ${response.status} for ${symbol}`);
                throw new Error(`HTTP ${response.status}`);
            }

            const data = await response.json();
            const result = data?.chart?.result?.[0];

            if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
                console.warn(`Invalid data structure from Yahoo Finance for ${symbol}`);
                throw new Error('Invalid data structure');
            }

            const timestamps = result.timestamp;
            const quote = result.indicators.quote[0];

            const history: any[] = [];
            for (let i = 0; i < timestamps.length; i++) {
                // Skip incomplete candles
                if (!quote.open[i] || !quote.high[i] || !quote.low[i] || !quote.close[i]) {
                    continue;
                }

                history.push({
                    t: timestamps[i] * 1000, // Convert to milliseconds
                    o: quote.open[i],
                    h: quote.high[i],
                    l: quote.low[i],
                    c: quote.close[i],
                    v: quote.volume?.[i] || 0,
                });
            }

            if (history.length === 0) {
                throw new Error('No valid candles in response');
            }

            // Stop simulation and replace with real data
            this.stop();
            this.currentCandles = DataNormalizer.normalizeArray(history);
            this.lastPrice = history[history.length - 1].c;
            this.currentSymbol = symbol;
            this.notifyListeners();

            console.log(`Loaded ${history.length} candles for ${symbol}`);
        } catch (error) {
            console.error(`Failed to fetch data for ${symbol}:`, error);
            console.log(`Falling back to mock data for ${symbol}`);

            // Fallback to mock data
            this.stop();
            this.generateStaticFixture();
        }
    }

    private generateStaticFixture() {
        const history: any[] = [];
        const baseTime = 1700000000000; // Fixed timestamp
        let price = 1500;

        for (let i = 0; i < 50; i++) {
            const time = baseTime + i * this.candleIntervalMs;
            const open = price;
            // Deterministic pattern: Sine wave
            const close = price + Math.sin(i * 0.2) * 5;
            const high = Math.max(open, close) + 2;
            const low = Math.min(open, close) - 1;

            history.push({
                t: time,
                o: open,
                h: high,
                l: low,
                c: close,
                v: 100 + i
            });
            price = close;
        }

        this.currentCandles = DataNormalizer.normalizeArray(history);
        this.lastPrice = price;
        this.notifyListeners();
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
        if (this.intervalId || this.isStatic) return;

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
