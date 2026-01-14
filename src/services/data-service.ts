import { DataNormalizer } from '../core/data/normalizer';
import type { Candle } from '../core/renderer/types';
import type { DataSourceType } from './data-source-config';
import { BASE_URL } from './api-client';

type DataListener = (data: Candle[]) => void;

export interface DataServiceConfig {
    dataSource: DataSourceType;
    apiKey?: string;
}

export class DataService {
    private listeners = new Set<DataListener>();
    private intervalId: any = null;
    private currentCandles: Candle[] = [];
    private lastPrice = 1000;
    private lastFetchTime = 0;
    private fetchRetryCount = 0;
    private maxRetries = 3;

    // Config
    private updateRateMs = 100; // 100ms updates
    private candleIntervalMs = 1000; // 1s candles for testing

    private isStatic = false;
    private config: DataServiceConfig;

    constructor(useStaticData = false, _symbol = 'SPY', config?: DataServiceConfig) {
        this.isStatic = useStaticData;
        this.config = config || { dataSource: 'yahoo' };

        if (this.isStatic) {
            this.generateStaticFixture();
        } else {
            // Start with mock data, will be replaced by fetchHistory
            this.generateInitialHistory();
            this.startSimulation();
        }
    }

    public updateConfig(config: DataServiceConfig) {
        this.config = config;
    }

    /**
     * Fetch historical data from selected data source
     * Falls back to mock data if API fails
     */
    public async fetchHistory(symbol: string, interval = '1d', range = '1mo'): Promise<void> {
        const now = Date.now();

        // Prevent too frequent refetches (rate limiting)
        if (now - this.lastFetchTime < 5000) {
            console.log('Skipping fetch - too soon after last fetch');
            return;
        }

        try {
            this.lastFetchTime = now;
            let history: any[] = [];

            // Use Yahoo Finance via Vite proxy for direct API access
            if (this.config.dataSource === 'yahoo') {
                history = await this.fetchFromYahoo(symbol, interval, range);
            }
            // Use backend for other data sources
            else {
                history = await this.fetchFromBackend(symbol, range);
            }

            if (history.length === 0) {
                throw new Error('No valid candles in response');
            }

            // Stop simulation and replace with real data
            this.stop();
            this.currentCandles = DataNormalizer.normalizeArray(history);
            this.lastPrice = history[history.length - 1].c;
            this.fetchRetryCount = 0; // Reset retry count on success
            this.notifyListeners();

            console.log(`✅ Loaded ${history.length} candles for ${symbol} from ${this.config.dataSource}`);

            // Start live updates simulation (approximates real-time updates)
            this.startSimulation();

        } catch (error) {
            console.error(`❌ Failed to fetch data for ${symbol} from ${this.config.dataSource}:`, error);

            // Retry logic
            if (this.fetchRetryCount < this.maxRetries) {
                this.fetchRetryCount++;
                const retryDelay = Math.pow(2, this.fetchRetryCount) * 1000; // Exponential backoff
                console.log(`Retrying in ${retryDelay}ms... (attempt ${this.fetchRetryCount}/${this.maxRetries})`);

                setTimeout(() => {
                    this.fetchHistory(symbol, interval, range);
                }, retryDelay);
            } else {
                console.log(`⚠️ Max retries reached. Falling back to mock data for ${symbol}`);
                this.fetchRetryCount = 0;

                // Fallback to mock data
                this.stop();
                this.generateStaticFixture();
            }
        }
    }
    /**
     * Get raw historical data without affecting internal state (Chart)
     */
    public async getHistoryData(symbol: string, interval = '1d', range = 'max'): Promise<any[]> {
        try {
            if (this.config.dataSource === 'yahoo') {
                return await this.fetchFromYahoo(symbol, interval, range);
            } else {
                return await this.fetchFromBackend(symbol, range);
            }
        } catch (error) {
            console.warn(`[DataService] Fetch failed for ${symbol}, falling back to mock data.`, error);
            return this.generateMockHistoryForSymbol(symbol);
        }
    }

    private generateMockHistoryForSymbol(symbol: string): any[] {
        const history: any[] = [];
        const now = Date.now();
        const days = 365 * 20; // 20 years of history (increased from 10)
        let price = 150.0; // Start somewhere plausible

        // Deterministic seed-ish based on symbol char codes
        let seed = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        for (let i = days; i >= 0; i--) {
            const time = now - (i * 24 * 60 * 60 * 1000);

            // Add some trend and volatility
            const trend = (i > days / 2) ? 0.05 : -0.02; // Change trend halfway
            const volatility = price * 0.02;
            const change = (random() - 0.48) * volatility; // slight upward bias

            const open = price;
            const close = price + change;
            const high = Math.max(open, close) + (random() * volatility * 0.5);
            const low = Math.min(open, close) - (random() * volatility * 0.5);

            history.push({
                t: time,
                o: open,
                h: high,
                l: low,
                c: close,
                v: Math.floor(1000000 + random() * 500000)
            });

            price = close;
            if (price < 10) price = 10; // Prevent negative prices
        }

        return history;
    }

    private async fetchFromYahoo(symbol: string, interval: string, range: string): Promise<any[]> {
        // Use backend proxy to avoid CORS
        const url = `${BASE_URL}/api/yahoo/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Yahoo Finance API returned ${response.status}`);
        }

        const data = await response.json();
        const result = data?.chart?.result?.[0];

        if (!result || !result.timestamp || !result.indicators?.quote?.[0]) {
            throw new Error('Invalid data structure from Yahoo Finance');
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

        return history;
    }

    private async fetchFromBackend(symbol: string, period: string): Promise<any[]> {
        const response = await fetch(`${BASE_URL}/history`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ticker: symbol,
                period: period,
                api_source: this.config.dataSource,
                api_key: this.config.apiKey,
            }),
        });

        if (!response.ok) {
            throw new Error(`Backend API returned ${response.status}`);
        }

        const data = await response.json();
        const historyData = data?.history || [];

        return historyData.map((item: any) => ({
            t: new Date(item.date).getTime(),
            o: item.open,
            h: item.high,
            l: item.low,
            c: item.close,
            v: item.volume,
        }));
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
