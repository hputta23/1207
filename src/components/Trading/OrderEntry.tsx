import { useState, useEffect } from 'react';
import { useTradingStore } from '../../services/trading-service';
import { useUserProfileStore } from '../../services/user-profile-service';

interface OrderEntryProps {
    symbol: string;
    currentPrice: number;
    onOrderPlaced?: () => void;
}

export function OrderEntry({ symbol, currentPrice, onOrderPlaced }: OrderEntryProps) {
    const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
    const [quantity, setQuantity] = useState<string>('1');
    const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

    const { executeOrder, getHolding } = useTradingStore();
    const { profile } = useUserProfileStore();

    const holding = getHolding(symbol);
    const sharesOwned = holding ? holding.quantity : 0;
    const buyingPower = profile.balance;

    const qtyNum = parseInt(quantity) || 0;
    const estimatedTotal = qtyNum * currentPrice;

    useEffect(() => {
        // Reset status when symbol changes
        setStatusMessage(null);
    }, [symbol]);

    const handleExecute = () => {
        if (qtyNum <= 0) return;

        const result = executeOrder(symbol, side, qtyNum, currentPrice);

        if (result.success) {
            setStatusMessage({ text: result.message, type: 'success' });
            if (side === 'SELL') {
                // Determine if we sold all, maybe clear input? 
                // For now keep it simple.
            }
            if (onOrderPlaced) onOrderPlaced();

            // Clear message after 3 seconds
            setTimeout(() => setStatusMessage(null), 3000);
        } else {
            console.error("Order Failed:", result.message);
            setStatusMessage({ text: result.message, type: 'error' });
        }
    };

    const isBuy = side === 'BUY';
    const actionColor = isBuy ? '#22c55e' : '#ef4444';

    return (
        <div style={{
            background: '#1a1a2e',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            height: '100%',
        }}>
            <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 600, color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                Order Ticket: <span style={{ color: '#3b82f6' }}>{symbol}</span>
            </h3>

            {/* Buy/Sell Toggle */}
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '4px', marginBottom: '24px' }}>
                <button
                    onClick={() => setSide('BUY')}
                    style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: isBuy ? '#22c55e' : 'transparent',
                        color: isBuy ? '#fff' : '#888',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    Buy
                </button>
                <button
                    onClick={() => setSide('SELL')}
                    style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '6px',
                        border: 'none',
                        background: !isBuy ? '#ef4444' : 'transparent',
                        color: !isBuy ? '#fff' : '#888',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    Sell
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Buying Power</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                        ${buyingPower.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                    </div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                    <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Owned</div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>
                        {sharesOwned} Shares
                    </div>
                </div>
            </div>

            {/* Order Inputs */}
            <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', margin: '0 0 8px 0', fontSize: '12px', color: '#888' }}>
                    Quantity
                </label>
                <div style={{ position: 'relative' }}>
                    <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        style={{
                            width: '100%',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '8px',
                            padding: '12px 16px',
                            color: '#fff',
                            fontSize: '16px',
                            outline: 'none',
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <span style={{ color: '#888', fontSize: '14px' }}>Est. Cost</span>
                <span style={{ color: '#fff', fontSize: '14px', fontWeight: 600 }}>
                    ${estimatedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
            </div>

            {/* Action Button */}
            <button
                onClick={handleExecute}
                disabled={qtyNum <= 0}
                style={{
                    width: '100%',
                    padding: '16px',
                    background: actionColor,
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: qtyNum > 0 ? 'pointer' : 'not-allowed',
                    opacity: qtyNum > 0 ? 1 : 0.5,
                    transition: 'transform 0.1s',
                }}
            >
                {side} {symbol}
            </button>

            {statusMessage && (
                <div style={{
                    marginTop: '16px',
                    padding: '12px',
                    background: statusMessage.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: `1px solid ${statusMessage.type === 'success' ? '#22c55e' : '#ef4444'}`,
                    borderRadius: '6px',
                    color: statusMessage.type === 'success' ? '#22c55e' : '#ef4444',
                    fontSize: '13px',
                    textAlign: 'center',
                }}>
                    {statusMessage.text}
                </div>
            )}
        </div>
    );
}
