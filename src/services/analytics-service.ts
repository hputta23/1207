import { SMA, EMA, RSI, MACD, BollingerBands } from 'technicalindicators';
import { BASE_URL } from './api-client';

export interface StockData {
    date: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface TechnicalIndicators {
    sma20?: number[];
    sma50?: number[];
    sma200?: number[];
    ema9?: number[];
    ema12?: number[];
    ema21?: number[];
    ema200?: number[];
    rsi?: number[];
    macd?: {
        MACD: number[];
        signal: number[];
        histogram: number[];
    };
    bollingerBands?: {
        upper: number[];
        middle: number[];
        lower: number[];
    };
}

export interface AnalyticsData {
    ticker: string;
    historical: StockData[];
    indicators: TechnicalIndicators;
    statistics: {
        currentPrice: number;
        change: number;
        changePercent: number;
        volatility: number;
        trend: 'bullish' | 'bearish' | 'neutral';
        volume: number;
    };
}

class AnalyticsService {
    private cache: Map<string, { data: AnalyticsData; timestamp: number }>;
    private cacheTimeout = 5 * 60 * 1000; // 5 minutes

    constructor() {
        this.cache = new Map();
    }

    async fetchStockData(ticker: string, period: string = '6mo', apiSource: string = 'yahoo', apiKey?: string): Promise<AnalyticsData> {
        // Check cache
        const cacheKey = `${ticker}_${period}_${apiSource}`;
        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }

        try {
            let result: StockData[];

            if (apiSource === 'mock') {
                // Generate mock data locally without hitting backend
                result = this.generateMockData(period, ticker);
            } else {
                // Use local Python backend to avoid CORS issues
                const response = await fetch(`${BASE_URL}/history`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ticker: ticker,
                        period: period,
                        api_source: apiSource,
                        api_key: apiKey
                    })
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch data for ${ticker}`);
                }

                const responseData = await response.json();
                const rawResult = responseData.history;

                if (!rawResult || rawResult.length === 0) {
                    throw new Error(`No data available for ${ticker}`);
                }

                // Build historical data
                result = rawResult.map((item: any) => ({
                    date: item.date.split('T')[0],
                    open: item.open,
                    high: item.high,
                    low: item.low,
                    close: item.close,
                    volume: item.volume,
                }));
            }

            // Calculate technical indicators
            const indicators = this.calculateTechnicalIndicators(result);

            // Calculate statistics
            const statistics = this.calculateStatistics(result, indicators);

            const analyticsData: AnalyticsData = {
                ticker,
                historical: result,
                indicators,
                statistics,
            };

            // Cache the result
            this.cache.set(cacheKey, { data: analyticsData, timestamp: Date.now() });

            return analyticsData;
        } catch (error) {
            console.error(`Failed to fetch stock data for ${ticker}:`, error);
            throw error;
        }
    }

    private generateMockData(period: string, ticker: string): StockData[] {
        const days = period === '1mo' ? 30 : period === '3mo' ? 90 : period === '6mo' ? 180 : period === '1y' ? 365 : 730;
        const now = new Date();
        const data: StockData[] = [];
        let price = 150.0;
        let trend = 0;

        // Seed random based on ticker string for consistency
        let seed = 0;
        for (let i = 0; i < ticker.length; i++) {
            seed += ticker.charCodeAt(i);
        }

        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        for (let i = days; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);

            // Random walk
            const volatility = 0.02; // 2% daily volatility
            const change = (random() - 0.5) * volatility;

            // Add some trend
            trend += (random() - 0.5) * 0.001;

            const open = price;
            const close = price * (1 + change + trend);
            const high = Math.max(open, close) * (1 + random() * 0.01);
            const low = Math.min(open, close) * (1 - random() * 0.01);
            const volume = Math.floor(1000000 + random() * 5000000);

            data.push({
                date: date.toISOString().split('T')[0],
                open,
                high,
                low,
                close,
                volume,
            });

            price = close;
        }

        return data;
    }

    calculateTechnicalIndicators(data: StockData[]): TechnicalIndicators {
        const closes = data.map(d => d.close);

        const indicators: TechnicalIndicators = {};

        try {
            // SMA
            if (closes.length >= 20) {
                indicators.sma20 = SMA.calculate({ period: 20, values: closes });
            }
            if (closes.length >= 50) {
                indicators.sma50 = SMA.calculate({ period: 50, values: closes });
            }
            if (closes.length >= 200) {
                indicators.sma200 = SMA.calculate({ period: 200, values: closes });
            }

            // EMA
            if (closes.length >= 9) {
                indicators.ema9 = EMA.calculate({ period: 9, values: closes });
            }
            if (closes.length >= 12) {
                indicators.ema12 = EMA.calculate({ period: 12, values: closes });
            }
            if (closes.length >= 21) {
                indicators.ema21 = EMA.calculate({ period: 21, values: closes });
            }
            if (closes.length >= 200) {
                indicators.ema200 = EMA.calculate({ period: 200, values: closes });
            }

            // RSI
            if (closes.length >= 14) {
                indicators.rsi = RSI.calculate({ period: 14, values: closes });
            }

            // MACD
            if (closes.length >= 26) {
                const macdResult = MACD.calculate({
                    values: closes,
                    fastPeriod: 12,
                    slowPeriod: 26,
                    signalPeriod: 9,
                    SimpleMAOscillator: false,
                    SimpleMASignal: false,
                });

                if (macdResult && macdResult.length > 0) {
                    indicators.macd = {
                        MACD: macdResult.map(m => m.MACD || 0),
                        signal: macdResult.map(m => m.signal || 0),
                        histogram: macdResult.map(m => m.histogram || 0),
                    };
                }
            }

            // Bollinger Bands
            if (closes.length >= 20) {
                const bbResult = BollingerBands.calculate({
                    period: 20,
                    values: closes,
                    stdDev: 2,
                });

                if (bbResult && bbResult.length > 0) {
                    indicators.bollingerBands = {
                        upper: bbResult.map(b => b.upper),
                        middle: bbResult.map(b => b.middle),
                        lower: bbResult.map(b => b.lower),
                    };
                }
            }
        } catch (error) {
            console.error('Error calculating technical indicators:', error);
        }

        return indicators;
    }

    calculateStatistics(data: StockData[], indicators: TechnicalIndicators) {
        const closes = data.map(d => d.close);
        const currentPrice = closes[closes.length - 1];
        const previousPrice = closes[closes.length - 2];
        const change = currentPrice - previousPrice;
        const changePercent = (change / previousPrice) * 100;

        // Calculate volatility (standard deviation of returns)
        const returns = closes.slice(1).map((price, i) => (price - closes[i]) / closes[i]);
        const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
        const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

        // Determine trend
        let trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
        if (indicators.sma20 && indicators.sma50) {
            const sma20Latest = indicators.sma20[indicators.sma20.length - 1];
            const sma50Latest = indicators.sma50[indicators.sma50.length - 1];
            if (sma20Latest > sma50Latest && currentPrice > sma20Latest) {
                trend = 'bullish';
            } else if (sma20Latest < sma50Latest && currentPrice < sma20Latest) {
                trend = 'bearish';
            }
        }

        const volume = data[data.length - 1].volume;

        return {
            currentPrice,
            change,
            changePercent,
            volatility,
            trend,
            volume,
        };
    }

    clearCache() {
        this.cache.clear();
    }
}

export const analyticsService = new AnalyticsService();
