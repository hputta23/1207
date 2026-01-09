import React from 'react';
import type { CrosshairState } from '../../core/interaction/crosshair-manager';

interface ChartOverlayProps {
    width: number;
    height: number;
    crosshair: CrosshairState | null;
}

export const ChartOverlay: React.FC<ChartOverlayProps> = ({ width, height, crosshair }) => {
    if (!crosshair || !crosshair.visible) return null;

    const { x, y, candle } = crosshair;

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: width,
            height: height,
            pointerEvents: 'none', // Allow clicks to pass through to canvas
            overflow: 'hidden'
        }}>
            {/* Vertical Line */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: x,
                width: 1,
                height: height,
                background: 'rgba(255, 255, 255, 0.2)',
                borderRight: '1px dashed rgba(255, 255, 255, 0.4)'
            }} />

            {/* Horizontal Line */}
            <div style={{
                position: 'absolute',
                top: y,
                left: 0,
                width: width,
                height: 1,
                background: 'rgba(255, 255, 255, 0.2)',
                borderBottom: '1px dashed rgba(255, 255, 255, 0.4)'
            }} />

            {/* Legend / Tooltip */}
            <div style={{
                position: 'absolute',
                top: 10,
                left: 10,
                background: 'rgba(0, 0, 0, 0.7)',
                padding: '4px 8px',
                borderRadius: '4px',
                color: '#ddd',
                fontFamily: 'monospace',
                fontSize: '12px',
                display: 'flex',
                gap: '12px',
                border: '1px solid #444'
            }}>
                {candle ? (
                    <>
                        <span style={{ color: candle.close >= candle.open ? '#4caf50' : '#ff5252' }}>
                            O: {candle.open.toFixed(2)}
                        </span>
                        <span style={{ color: candle.close >= candle.open ? '#4caf50' : '#ff5252' }}>
                            H: {candle.high.toFixed(2)}
                        </span>
                        <span style={{ color: candle.close >= candle.open ? '#4caf50' : '#ff5252' }}>
                            L: {candle.low.toFixed(2)}
                        </span>
                        <span style={{ color: candle.close >= candle.open ? '#4caf50' : '#ff5252' }}>
                            C: {candle.close.toFixed(2)}
                        </span>
                        <span>V: {candle.volume}</span>
                    </>
                ) : (
                    <span>No Data</span>
                )}
            </div>
        </div>
    );
};
