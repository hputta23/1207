import { useState } from 'react';
import { useTradingStore } from '../../services/trading-service';

interface PortfolioTableProps {
    quotes: Record<string, { price: number; change: number; changePercent: number }>;
}

// Simple Sell Modal Component
const SellModal = ({
    isOpen,
    onClose,
    symbol,
    currentPrice,
    maxQty,
    onConfirm
}: {
    isOpen: boolean;
    onClose: () => void;
    symbol: string;
    currentPrice: number;
    maxQty: number;
    onConfirm: (qty: number) => void;
}) => {
    const [qty, setQty] = useState<string>('1');

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', zIndex: 1000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={onClose}>
            <div style={{
                background: '#1a1a2e', padding: '24px', borderRadius: '12px',
                width: '320px', border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
            }} onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 16px', color: '#fff' }}>Sell {symbol}</h3>

                <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: '#888', fontSize: '13px' }}>
                        <span>Available</span>
                        <span>{maxQty} shares</span>
                    </div>
                    <input
                        type="number"
                        value={qty}
                        onChange={e => setQty(e.target.value)}
                        max={maxQty}
                        min="1"
                        style={{
                            width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px',
                            color: '#fff', fontSize: '16px'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', fontSize: '14px' }}>
                    <span style={{ color: '#888' }}>Est. Total</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>
                        ${(parseInt(qty || '0') * currentPrice).toFixed(2)}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={onClose} style={{ flex: 1, padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', cursor: 'pointer' }}>Cancel</button>
                    <button
                        onClick={() => {
                            const val = parseInt(qty);
                            if (val > 0 && val <= maxQty) onConfirm(val);
                        }}
                        style={{ flex: 1, padding: '10px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                    >
                        Confirm Sell
                    </button>
                </div>
            </div>
        </div>
    );
};

export function PortfolioTable({ quotes }: PortfolioTableProps) {
    const { holdings, executeOrder } = useTradingStore(); // Use hook directly
    const holdingKeys = Object.keys(holdings);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSell, setSelectedSell] = useState<{ symbol: string, maxQty: number, currentPrice: number } | null>(null);

    const handleSellClick = (symbol: string, maxQty: number, currentPrice: number) => {
        setSelectedSell({ symbol, maxQty, currentPrice });
        setModalOpen(true);
    };

    const confirmSell = (qty: number) => {
        if (selectedSell) {
            const result = executeOrder(selectedSell.symbol, 'SELL', qty, selectedSell.currentPrice);
            if (result.success) {
                // Success feedback handled by store or UI update? Store doesn't seem to emit events but UI will react.
                // We can add a toast here later if needed.
            } else {
                alert(result.message);
            }
        }
        setModalOpen(false);
        setSelectedSell(null);
    };

    if (holdingKeys.length === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '40px',
                color: '#888',
                background: '#1a1a2e',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
            }}>
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📉</div>
                <p style={{ margin: 0 }}>No active holdings.</p>
                <p style={{ fontSize: '12px', opacity: 0.7 }}>Place an order to start your portfolio.</p>
            </div>
        );
    }

    return (
        <div style={{
            background: '#1a1a2e',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
        }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left' }}>
                        <th style={headerStyle}>Symbol</th>
                        <th style={headerStyle}>Qty</th>
                        <th style={headerStyle}>Avg Cost</th>
                        <th style={headerStyle}>Last Price</th>
                        <th style={headerStyle}>Day Change</th>
                        <th style={headerStyle}>Mkt Value</th>
                        <th style={headerStyle}>Unrealized P&L</th>
                        <th style={headerStyle}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {holdingKeys.map(symbol => {
                        const position = holdings[symbol];
                        const quote = quotes[symbol] || { price: position.averageCost, change: 0, changePercent: 0 };
                        const currentPrice = quote.price;
                        const marketValue = position.quantity * currentPrice;
                        const totalCost = position.quantity * position.averageCost;
                        const pnl = marketValue - totalCost;
                        const pnlPercent = (pnl / totalCost) * 100;
                        const isPositive = pnl >= 0;
                        const pnlColor = isPositive ? '#22c55e' : '#ef4444';

                        const dayChangeColor = quote.change >= 0 ? '#22c55e' : '#ef4444';

                        return (
                            <tr key={symbol} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ ...cellStyle, fontWeight: 700, color: '#fff' }}>{symbol}</td>
                                <td style={cellStyle}>{position.quantity}</td>
                                <td style={cellStyle}>${position.averageCost.toFixed(2)}</td>
                                <td style={cellStyle}>${currentPrice.toFixed(2)}</td>
                                <td style={cellStyle}>
                                    <span style={{ color: dayChangeColor, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        {quote.change > 0 ? '+' : ''}{quote.change.toFixed(2)}
                                        <span style={{ fontSize: '11px', opacity: 0.8 }}>
                                            ({quote.change > 0 ? '+' : ''}{quote.changePercent.toFixed(2)}%)
                                        </span>
                                    </span>
                                </td>
                                <td style={cellStyle}>${marketValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td style={cellStyle}>
                                    <span style={{ color: pnlColor, fontWeight: 500 }}>
                                        ${pnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                    <span style={{
                                        color: pnlColor,
                                        fontSize: '11px',
                                        marginLeft: '6px',
                                        background: isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                        padding: '2px 4px',
                                        borderRadius: '4px'
                                    }}>
                                        {isPositive ? '+' : ''}{pnlPercent.toFixed(2)}%
                                    </span>
                                </td>
                                <td style={cellStyle}>
                                    <button
                                        onClick={() => handleSellClick(symbol, position.quantity, currentPrice)}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            color: '#ef4444',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: '4px',
                                            padding: '4px 12px',
                                            cursor: 'pointer',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        SELL
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <SellModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                symbol={selectedSell?.symbol || ''}
                currentPrice={selectedSell?.currentPrice || 0}
                maxQty={selectedSell?.maxQty || 0}
                onConfirm={confirmSell}
            />
        </div>
    );
}

const headerStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
};

const cellStyle: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#ccc',
};
