import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type DataSourceType = 'yahoo' | 'alpha_vantage' | 'finnhub' | 'polygon' | 'mock';

export interface DataSourceConfig {
    type: DataSourceType;
    apiKey?: string;
    enabled: boolean;
}

export interface DataSourceState {
    // Current selected data source
    selectedSource: DataSourceType;

    // Available data sources with their configurations
    sources: Record<DataSourceType, DataSourceConfig>;

    // Actions
    selectSource: (source: DataSourceType) => void;
    updateApiKey: (source: DataSourceType, apiKey: string) => void;
    enableSource: (source: DataSourceType, enabled: boolean) => void;
}

export const useDataSourceStore = create<DataSourceState>()(
    persist(
        (set) => ({
            selectedSource: 'yahoo',
            sources: {
                yahoo: {
                    type: 'yahoo',
                    enabled: true,
                },
                alpha_vantage: {
                    type: 'alpha_vantage',
                    apiKey: '',
                    enabled: false,
                },
                finnhub: {
                    type: 'finnhub',
                    apiKey: '',
                    enabled: false,
                },
                polygon: {
                    type: 'polygon',
                    apiKey: '',
                    enabled: false,
                },
                mock: {
                    type: 'mock',
                    enabled: true,
                },
            },
            selectSource: (source) => set({ selectedSource: source }),
            updateApiKey: (source, apiKey) =>
                set((state) => ({
                    sources: {
                        ...state.sources,
                        [source]: {
                            ...state.sources[source],
                            apiKey,
                            enabled: apiKey.length > 0,
                        },
                    },
                })),
            enableSource: (source, enabled) =>
                set((state) => ({
                    sources: {
                        ...state.sources,
                        [source]: {
                            ...state.sources[source],
                            enabled,
                        },
                    },
                })),
        }),
        {
            name: 'data-source-storage',
        }
    )
);

export const DATA_SOURCE_INFO: Record<DataSourceType, { name: string; description: string; requiresApiKey: boolean; website: string }> = {
    yahoo: {
        name: 'Yahoo Finance',
        description: 'Free, real-time market data from Yahoo Finance',
        requiresApiKey: false,
        website: 'https://finance.yahoo.com',
    },
    alpha_vantage: {
        name: 'Alpha Vantage',
        description: 'Premium financial data with technical indicators',
        requiresApiKey: true,
        website: 'https://www.alphavantage.co',
    },
    finnhub: {
        name: 'Finnhub',
        description: 'Real-time stock data, news, and fundamentals',
        requiresApiKey: true,
        website: 'https://finnhub.io',
    },
    polygon: {
        name: 'Polygon.io',
        description: 'Professional-grade market data',
        requiresApiKey: true,
        website: 'https://polygon.io',
    },
    mock: {
        name: 'Mock Data',
        description: 'Generated test data for development',
        requiresApiKey: false,
        website: '',
    },
};
