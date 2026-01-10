import { SMA, EMA, RSI, MACD, BollingerBands } from 'technicalindicators';

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
    ema12?: number[];
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
            // Use local Python backend to avoid CORS issues
            const response = await fetch('http://localhost:8000/history', {
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
            const result = responseData.history;

            if (!result || result.length === 0) {
                throw new Error(`No data available for ${ticker}`);
            }

            // Build historical data
            const historical: StockData[] = result.map((item: any) => ({
                date: item.date.split('T')[0],
                open: item.open,
                high: item.high,
                low: item.low,
                close: item.close,
                volume: item.volume,
            }));

            // Calculate technical indicators
            const indicators = this.calculateTechnicalIndicators(historical);
            // const indicators: TechnicalIndicators = {}; // Empty for now

            // Calculate statistics
            const statistics = this.calculateStatistics(historical, indicators);

            const analyticsData: AnalyticsData = {
                ticker,
                historical,
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
            if (closes.length >= 12) {
                indicators.ema12 = EMA.calculate({ period: 12, values: closes });
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
