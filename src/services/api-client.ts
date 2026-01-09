const BASE_URL = 'http://localhost:8000';

export interface PredictionRequest {
    ticker: string;
    days: number;
    model_type: string;
}

export interface SimulationRequest {
    ticker: string;
    simulations: number;
    days: number;
    simulation_method?: string;
    drift_adj?: number;
    volatility_adj?: number;
}

export interface BacktestRequest {
    ticker: string;
    initial_capital: number;
    period: string;
    strategy?: string;
    model_type?: string;
    commission?: number;
}

export const apiClient = {
    async predict(data: PredictionRequest) {
        const response = await fetch(`${BASE_URL}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Prediction failed');
        return response.json();
    },

    async simulate(data: SimulationRequest) {
        const response = await fetch(`${BASE_URL}/simulate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Simulation failed');
        return response.json();
    },

    async backtest(data: BacktestRequest) {
        const response = await fetch(`${BASE_URL}/backtest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Backtest failed');
        return response.json();
    },
};
