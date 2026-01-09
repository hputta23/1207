import React, { useState, useRef, useEffect } from 'react';

// Available indicators
const INDICATORS = [
    { id: 'sma', name: 'SMA', fullName: 'Simple Moving Average', defaultPeriod: 20, color: '#f59e0b' },
    { id: 'ema', name: 'EMA', fullName: 'Exponential Moving Average', defaultPeriod: 20, color: '#3b82f6' },
    { id: 'sma50', name: 'SMA 50', fullName: 'Simple Moving Average (50)', defaultPeriod: 50, color: '#22c55e' },
    { id: 'sma200', name: 'SMA 200', fullName: 'Simple Moving Average (200)', defaultPeriod: 200, color: '#ef4444' },
    { id: 'ema12', name: 'EMA 12', fullName: 'Exponential Moving Average (12)', defaultPeriod: 12, color: '#8b5cf6' },
    { id: 'ema26', name: 'EMA 26', fullName: 'Exponential Moving Average (26)', defaultPeriod: 26, color: '#ec4899' },
];

export interface IndicatorConfig {
    id: string;
    name: string;
    period: number;
    color: string;
    enabled: boolean;
}

interface IndicatorSelectorProps {
    selectedIndicators: IndicatorConfig[];
    onIndicatorsChange: (indicators: IndicatorConfig[]) => void;
}

export const IndicatorSelector: React.FC<IndicatorSelectorProps> = ({
    selectedIndicators,
    onIndicatorsChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleIndicator = (indicator: typeof INDICATORS[0]) => {
        const existing = selectedIndicators.find(i => i.id === indicator.id);
        if (existing) {
            // Remove indicator
            onIndicatorsChange(selectedIndicators.filter(i => i.id !== indicator.id));
        } else {
            // Add indicator
            onIndicatorsChange([
                ...selectedIndicators,
                {
                    id: indicator.id,
                    name: indicator.name,
                    period: indicator.defaultPeriod,
                    color: indicator.color,
                    enabled: true,
                }
            ]);
        }
    };

    const isSelected = (id: string) => selectedIndicators.some(i => i.id === id);

    return (
        <div ref={dropdownRef} style={{ position: 'relative' }}>
            {/* Trigger Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '4px 10px',
                    background: isOpen ? '#252525' : '#1a1a1a',
                    border: '1px solid',
                    borderColor: isOpen ? '#3b82f6' : '#2a2a2a',
                    borderRadius: '4px',
                    color: '#aaa',
                    fontSize: '11px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                    if (!isOpen) e.currentTarget.style.borderColor = '#444';
                }}
                onMouseLeave={(e) => {
                    if (!isOpen) e.currentTarget.style.borderColor = '#2a2a2a';
                }}
            >
                {/* Chart Icon */}
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18" />
                    <path d="M18 9l-5 5-4-4-3 3" />
                </svg>
                <span>Indicators</span>
                {selectedIndicators.length > 0 && (
                    <span style={{
                        background: '#3b82f6',
                        color: '#fff',
                        padding: '1px 5px',
                        borderRadius: '10px',
                        fontSize: '9px',
                        fontWeight: 600,
                    }}>
                        {selectedIndicators.length}
                    </span>
                )}
                <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                    }}
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '4px',
                    width: '280px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                    zIndex: 1000,
                    overflow: 'hidden',
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid #2a2a2a',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}>
                        <span style={{ color: '#888', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Technical Indicators
                        </span>
                        {selectedIndicators.length > 0 && (
                            <button
                                onClick={() => onIndicatorsChange([])}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#666',
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                }}
                            >
                                Clear all
                            </button>
                        )}
                    </div>

                    {/* Indicator List */}
                    <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                        {INDICATORS.map((indicator) => {
                            const selected = isSelected(indicator.id);
                            return (
                                <div
                                    key={indicator.id}
                                    onClick={() => toggleIndicator(indicator)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '10px 12px',
                                        cursor: 'pointer',
                                        background: selected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                        borderLeft: selected ? `3px solid ${indicator.color}` : '3px solid transparent',
                                        transition: 'all 0.1s ease',
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!selected) e.currentTarget.style.background = '#222';
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!selected) e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {/* Color indicator */}
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '3px',
                                            background: indicator.color,
                                            opacity: selected ? 1 : 0.5,
                                        }} />
                                        <div>
                                            <div style={{
                                                color: selected ? '#fff' : '#ccc',
                                                fontSize: '13px',
                                                fontWeight: 500,
                                            }}>
                                                {indicator.name}
                                            </div>
                                            <div style={{
                                                color: '#666',
                                                fontSize: '10px',
                                            }}>
                                                {indicator.fullName}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Checkbox */}
                                    <div style={{
                                        width: '18px',
                                        height: '18px',
                                        borderRadius: '4px',
                                        border: `2px solid ${selected ? indicator.color : '#444'}`,
                                        background: selected ? indicator.color : 'transparent',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s ease',
                                    }}>
                                        {selected && (
                                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                                                <path d="M20 6L9 17l-5-5" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Selected indicators summary */}
                    {selectedIndicators.length > 0 && (
                        <div style={{
                            padding: '8px 12px',
                            borderTop: '1px solid #2a2a2a',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '4px',
                        }}>
                            {selectedIndicators.map((ind) => (
                                <span
                                    key={ind.id}
                                    style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        padding: '2px 8px',
                                        background: '#252525',
                                        borderRadius: '3px',
                                        fontSize: '10px',
                                        color: '#aaa',
                                    }}
                                >
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: ind.color }} />
                                    {ind.name}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
