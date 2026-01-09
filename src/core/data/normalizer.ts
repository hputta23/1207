import type { Candle } from '../renderer/types';

export class DataNormalizer {
    /**
     * Merges a partial candle update into an existing candle.
     * Useful for real-time updates where we receive 'ticks' or partial aggregates.
     */
    static mergeUpdate(existing: Candle, update: Partial<Candle>): Candle {
        const result = { ...existing };

        if (update.close !== undefined) {
            result.close = update.close;
            // Update High/Low based on new close if needed
            if (result.close > result.high) result.high = result.close;
            if (result.close < result.low) result.low = result.close;
        }

        if (update.volume !== undefined) {
            // Volume typically accumulates
            result.volume += update.volume;
        }

        // For other fields, simple overwrite if provided
        if (update.open !== undefined) result.open = update.open;
        if (update.high !== undefined && update.high > result.high) result.high = update.high;
        if (update.low !== undefined && update.low < result.low) result.low = update.low;
        if (update.complete !== undefined) result.complete = update.complete;

        return result;
    }

    /**
     * Normalizes a raw data array (e.g. from API) into internal Candle format.
     * Ensures sorted timestamps and data integrity.
     */
    static normalizeArray(raw: any[]): Candle[] {
        // Assume raw has { t, o, h, l, c, v } format commonly used
        return raw.map(item => ({
            timestamp: item.t || item.timestamp,
            open: Number(item.o || item.open),
            high: Number(item.h || item.high),
            low: Number(item.l || item.low),
            close: Number(item.c || item.close),
            volume: Number(item.v || item.volume || 0),
            complete: true
        })).sort((a, b) => a.timestamp - b.timestamp);
    }
}
