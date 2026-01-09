import React, { useState, useRef, useEffect, useCallback } from 'react';

// Popular tickers for suggestions
const POPULAR_TICKERS = [
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF Trust', exchange: 'NYSE' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', exchange: 'NASDAQ' },
    { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
    { symbol: 'TSLA', name: 'Tesla Inc.', exchange: 'NASDAQ' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },
    { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
    { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.', exchange: 'NYSE' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE' },
    { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE' },
    { symbol: 'UNH', name: 'UnitedHealth Group Inc.', exchange: 'NYSE' },
    { symbol: 'XOM', name: 'Exxon Mobil Corporation', exchange: 'NYSE' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE' },
    { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE' },
    { symbol: 'PG', name: 'Procter & Gamble Co.', exchange: 'NYSE' },
    { symbol: 'MA', name: 'Mastercard Inc.', exchange: 'NYSE' },
    { symbol: 'HD', name: 'The Home Depot Inc.', exchange: 'NYSE' },
    { symbol: 'CVX', name: 'Chevron Corporation', exchange: 'NYSE' },
    { symbol: 'ES=F', name: 'E-Mini S&P 500 Future', exchange: 'CME' },
    { symbol: 'NQ=F', name: 'E-Mini NASDAQ 100 Future', exchange: 'CME' },
    { symbol: 'GC=F', name: 'Gold Future', exchange: 'COMEX' },
    { symbol: 'CL=F', name: 'Crude Oil Future', exchange: 'NYMEX' },
    { symbol: 'BTC-USD', name: 'Bitcoin USD', exchange: 'CRYPTO' },
    { symbol: 'ETH-USD', name: 'Ethereum USD', exchange: 'CRYPTO' },
];

interface TickerSearchProps {
    currentSymbol: string;
    onSymbolChange: (symbol: string) => void;
    chartId?: string; // Optional chart identifier
}

export const TickerSearch: React.FC<TickerSearchProps> = ({
    currentSymbol,
    onSymbolChange,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Filter tickers based on search
    const filteredTickers = searchValue
        ? POPULAR_TICKERS.filter(
            t =>
                t.symbol.toLowerCase().includes(searchValue.toLowerCase()) ||
                t.name.toLowerCase().includes(searchValue.toLowerCase())
        )
        : POPULAR_TICKERS;

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node) &&
                inputRef.current &&
                !inputRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = useCallback((symbol: string) => {
        onSymbolChange(symbol);
        setSearchValue('');
        setIsOpen(false);
        setSelectedIndex(0);
    }, [onSymbolChange]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => Math.min(prev + 1, filteredTickers.length - 1));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => Math.max(prev - 1, 0));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (filteredTickers[selectedIndex]) {
                handleSelect(filteredTickers[selectedIndex].symbol);
            } else if (searchValue.trim()) {
                handleSelect(searchValue.toUpperCase().trim());
            }
        } else if (e.key === 'Escape') {
            setIsOpen(false);
            setSearchValue('');
        }
    };

    return (
        <div
            style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                zIndex: 100,
            }}
        >
            {/* Current Symbol Display / Search Toggle */}
            <div
                onClick={() => {
                    setIsOpen(true);
                    setTimeout(() => inputRef.current?.focus(), 10);
                }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    background: isOpen ? '#1e1e1e' : 'transparent',
                    border: '1px solid',
                    borderColor: isOpen ? '#3b82f6' : '#333',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    minWidth: '180px',
                }}
                onMouseEnter={(e) => {
                    if (!isOpen) {
                        e.currentTarget.style.borderColor = '#555';
                        e.currentTarget.style.background = '#1a1a1a';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isOpen) {
                        e.currentTarget.style.borderColor = '#333';
                        e.currentTarget.style.background = 'transparent';
                    }
                }}
            >
                {/* Search Icon */}
                <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#888"
                    strokeWidth="2"
                >
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                </svg>

                {isOpen ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={searchValue}
                        onChange={(e) => {
                            setSearchValue(e.target.value);
                            setSelectedIndex(0);
                        }}
                        onKeyDown={handleKeyDown}
                        placeholder="Search symbol..."
                        style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: '#fff',
                            fontSize: '13px',
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            width: '140px',
                        }}
                        autoFocus
                    />
                ) : (
                    <span
                        style={{
                            color: '#fff',
                            fontSize: '13px',
                            fontWeight: 600,
                            fontFamily: 'Inter, -apple-system, sans-serif',
                            letterSpacing: '0.5px',
                        }}
                    >
                        {currentSymbol}
                    </span>
                )}

                {/* Dropdown Arrow */}
                <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#666"
                    strokeWidth="2"
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.2s ease',
                        marginLeft: 'auto',
                    }}
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div
                    ref={dropdownRef}
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        marginTop: '4px',
                        width: '320px',
                        maxHeight: '320px',
                        overflowY: 'auto',
                        background: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '8px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
                        zIndex: 1000,
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid #2a2a2a',
                            color: '#666',
                            fontSize: '11px',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                        }}
                    >
                        {searchValue ? 'Search Results' : 'Popular Symbols'}
                    </div>

                    {/* Results */}
                    {filteredTickers.length === 0 ? (
                        <div
                            style={{
                                padding: '16px 12px',
                                color: '#666',
                                fontSize: '13px',
                                textAlign: 'center',
                            }}
                        >
                            No results found. Press Enter to search "{searchValue}"
                        </div>
                    ) : (
                        filteredTickers.slice(0, 10).map((ticker, index) => (
                            <div
                                key={ticker.symbol}
                                onClick={() => handleSelect(ticker.symbol)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 12px',
                                    cursor: 'pointer',
                                    background: index === selectedIndex ? '#252525' : 'transparent',
                                    borderLeft: index === selectedIndex ? '2px solid #3b82f6' : '2px solid transparent',
                                    transition: 'all 0.1s ease',
                                }}
                                onMouseEnter={(e) => {
                                    setSelectedIndex(index);
                                    e.currentTarget.style.background = '#252525';
                                }}
                                onMouseLeave={(e) => {
                                    if (index !== selectedIndex) {
                                        e.currentTarget.style.background = 'transparent';
                                    }
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                    <span
                                        style={{
                                            color: '#fff',
                                            fontSize: '13px',
                                            fontWeight: 600,
                                            fontFamily: 'SF Mono, Consolas, monospace',
                                        }}
                                    >
                                        {ticker.symbol}
                                    </span>
                                    <span
                                        style={{
                                            color: '#888',
                                            fontSize: '11px',
                                            maxWidth: '200px',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}
                                    >
                                        {ticker.name}
                                    </span>
                                </div>
                                <span
                                    style={{
                                        color: '#555',
                                        fontSize: '10px',
                                        fontWeight: 500,
                                        padding: '2px 6px',
                                        background: '#222',
                                        borderRadius: '3px',
                                    }}
                                >
                                    {ticker.exchange}
                                </span>
                            </div>
                        ))
                    )}

                    {/* Footer hint */}
                    <div
                        style={{
                            padding: '8px 12px',
                            borderTop: '1px solid #2a2a2a',
                            color: '#555',
                            fontSize: '10px',
                            display: 'flex',
                            gap: '12px',
                        }}
                    >
                        <span>
                            <kbd style={{ background: '#252525', padding: '1px 4px', borderRadius: '2px' }}>↑↓</kbd> Navigate
                        </span>
                        <span>
                            <kbd style={{ background: '#252525', padding: '1px 4px', borderRadius: '2px' }}>Enter</kbd> Select
                        </span>
                        <span>
                            <kbd style={{ background: '#252525', padding: '1px 4px', borderRadius: '2px' }}>Esc</kbd> Close
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
