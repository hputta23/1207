import { useTradingStore } from '../../services/trading-service';

interface PortfolioTableProps {
    quotes: Record<string, number>;
}

export function PortfolioTable({ quotes }: PortfolioTableProps) {
    const { holdings } = useTradingStore();
    const holdingKeys = Object.keys(holdings);

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
                        <th style={headerStyle}>Price</th>
                        <th style={headerStyle}>Mkt Value</th>
                        <th style={headerStyle}>Unrealized P&L</th>
                    </tr>
                </thead>
                <tbody>
                    {holdingKeys.map(symbol => {
                        const position = holdings[symbol];
                        const currentPrice = quotes[symbol] || position.averageCost; // Fallback to cost if no quote
                        const marketValue = position.quantity * currentPrice;
                        const totalCost = position.quantity * position.averageCost;
                        const pnl = marketValue - totalCost;
                        const pnlPercent = (pnl / totalCost) * 100;
                        const isPositive = pnl >= 0;
                        const pnlColor = isPositive ? '#22c55e' : '#ef4444';

                        return (
                            <tr key={symbol} style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                                <td style={{ ...cellStyle, fontWeight: 700, color: '#fff' }}>{symbol}</td>
                                <td style={cellStyle}>{position.quantity}</td>
                                <td style={cellStyle}>${position.averageCost.toFixed(2)}</td>
                                <td style={cellStyle}>${currentPrice.toFixed(2)}</td>
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
                            </tr>
                        );
                    })}
                </tbody>
            </table>
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
