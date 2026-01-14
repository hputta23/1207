import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { useUserProfileStore } from './user-profile-service';

export type OrderType = 'MARKET' | 'LIMIT';
export type OrderSide = 'BUY' | 'SELL';

export interface Transaction {
    id: string;
    symbol: string;
    side: OrderSide;
    type: OrderType;
    quantity: number;
    price: number;
    total: number;
    timestamp: number;
    status: 'FILLED' | 'REJECTED';
}

export interface Holding {
    symbol: string;
    quantity: number;
    averageCost: number;
}

export interface PortfolioSnapshot {
    timestamp: number;
    value: number;
}

interface TradingState {
    holdings: Record<string, Holding>;
    transactions: Transaction[];
    portfolioHistory: PortfolioSnapshot[];
    realizedPnL: number;
    executeOrder: (symbol: string, side: OrderSide, quantity: number, currentPrice: number) => { success: boolean; message: string };
    getHolding: (symbol: string) => Holding | undefined;
    trackPortfolioValue: (currentPrices: Record<string, number>) => void;
    resetTrading: () => void;
}

export const useTradingStore = create<TradingState>()(
    persist(
        (set, get) => ({
            holdings: {},
            transactions: [],
            portfolioHistory: [],
            realizedPnL: 0,

            executeOrder: (symbol, side, quantity, currentPrice) => {
                const { holdings, transactions } = get();
                const userStore = useUserProfileStore.getState();
                const totalCost = quantity * currentPrice;
                const upperSymbol = symbol.toUpperCase();

                if (quantity <= 0) {
                    return { success: false, message: 'Quantity must be positive' };
                }

                if (side === 'BUY') {
                    // Check Funds
                    if (userStore.profile.balance < totalCost) {
                        return { success: false, message: 'Insufficient funds' };
                    }

                    // 1. Deduct Balance
                    userStore.updateBalance(-totalCost);

                    // 2. Update Holdings (Weighted Average Cost)
                    const currentHolding = holdings[upperSymbol];
                    let newHolding: Holding;

                    if (currentHolding) {
                        const totalShares = currentHolding.quantity + quantity;
                        const totalValue = (currentHolding.quantity * currentHolding.averageCost) + totalCost;
                        newHolding = {
                            symbol: upperSymbol,
                            quantity: totalShares,
                            averageCost: totalValue / totalShares,
                        };
                    } else {
                        newHolding = {
                            symbol: upperSymbol,
                            quantity: quantity,
                            averageCost: currentPrice,
                        };
                    }

                    // 3. Log Transaction
                    const transaction: Transaction = {
                        id: uuidv4(),
                        symbol: upperSymbol,
                        side: 'BUY',
                        type: 'MARKET',
                        quantity,
                        price: currentPrice,
                        total: totalCost,
                        timestamp: Date.now(),
                        status: 'FILLED',
                    };

                    set({
                        holdings: { ...holdings, [upperSymbol]: newHolding },
                        transactions: [transaction, ...transactions],
                    });

                    return { success: true, message: `Bought ${quantity} ${upperSymbol} @ $${currentPrice.toFixed(2)}` };

                } else { // SELL
                    // Check Ownership
                    const currentHolding = holdings[upperSymbol];
                    if (!currentHolding || currentHolding.quantity < quantity) {
                        return { success: false, message: 'Insufficient shares' };
                    }

                    // 1. Add Balance
                    userStore.updateBalance(totalCost);

                    // 2. Update Holdings
                    const remainingQty = currentHolding.quantity - quantity;
                    const newHoldings = { ...holdings };

                    if (remainingQty > 0) {
                        // Avg Cost remains same on partial sell
                        newHoldings[upperSymbol] = {
                            ...currentHolding,
                            quantity: remainingQty,
                        };
                    } else {
                        delete newHoldings[upperSymbol];
                    }

                    // 3. Calculate Realized P&L
                    const costBasis = quantity * currentHolding.averageCost;
                    const realizedPnL = totalCost - costBasis; // Proceeds - Cost

                    // 4. Log Transaction
                    const transaction: Transaction = {
                        id: uuidv4(),
                        symbol: upperSymbol,
                        side: 'SELL',
                        type: 'MARKET',
                        quantity,
                        price: currentPrice,
                        total: totalCost,
                        timestamp: Date.now(),
                        status: 'FILLED',
                    };

                    // 5. Update Realized P&L History (Simplified: just cumulative for now, or transaction based)
                    // We'll trust transaction history for P&L calc, but store a cumulative total for easier access
                    const currentRealized = get().realizedPnL || 0;

                    set({
                        holdings: newHoldings,
                        transactions: [transaction, ...transactions],
                        realizedPnL: currentRealized + realizedPnL
                    });

                    return { success: true, message: `Sold ${quantity} ${upperSymbol} (P&L: $${realizedPnL.toFixed(2)})` };
                }
            },

            // New Method: Snapshot Portfolio Value
            // Call this periodically or on major actions
            trackPortfolioValue: (currentPrices: Record<string, number>) => {
                const { holdings, portfolioHistory } = get();
                const userStore = useUserProfileStore.getState();

                let holdingsValue = 0;
                Object.values(holdings).forEach(h => {
                    const price = currentPrices[h.symbol] || h.averageCost;
                    holdingsValue += h.quantity * price;
                });

                const totalValue = userStore.profile.balance + holdingsValue;
                const timestamp = Date.now();

                // DONT add duplicate if close in time (e.g. < 1 min)
                const lastEntry = portfolioHistory[portfolioHistory.length - 1];
                if (lastEntry && (timestamp - lastEntry.timestamp < 60000)) {
                    return;
                }

                set({
                    portfolioHistory: [...portfolioHistory, { timestamp, value: totalValue }]
                });
            },

            getHolding: (symbol) => get().holdings[symbol.toUpperCase()],

            resetTrading: () => {
                set({ holdings: {}, transactions: [] });
            },
        }),
        {
            name: 'terminal-pro-trading',
        }
    )
);

// Subscribe user profile reset to trading reset
// logic: if user resets profile, we should probably reset trading data too.
// For now, let's keep them separate actions or we can link them in the UI reset handler.
