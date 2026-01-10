import { useState } from 'react';
import { useDataSourceStore, DATA_SOURCE_INFO, type DataSourceType } from '../../services/data-source-config';

export const DataSourceSelector: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const { selectedSource, sources, selectSource, updateApiKey } = useDataSourceStore();

    const currentSourceInfo = DATA_SOURCE_INFO[selectedSource];
    const availableSources = Object.keys(sources).filter(
        (key) => sources[key as DataSourceType].enabled
    ) as DataSourceType[];

    return (
        <div style={{ position: 'relative' }}>
            {/* Main Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 12px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '6px',
                    color: '#aaa',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.color = '#fff';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#333';
                    e.currentTarget.style.color = '#aaa';
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                </svg>
                <span>{currentSourceInfo.name}</span>
                <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                >
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            zIndex: 99,
                        }}
                        onClick={() => setIsOpen(false)}
                    />
                    <div
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            marginTop: '4px',
                            minWidth: '280px',
                            background: '#1a1a1a',
                            border: '1px solid #333',
                            borderRadius: '8px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                            zIndex: 100,
                            overflow: 'hidden',
                        }}
                    >
                        {/* Header */}
                        <div
                            style={{
                                padding: '12px',
                                borderBottom: '1px solid #2a2a2a',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#fff' }}>
                                Data Source
                            </span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowSettings(!showSettings);
                                }}
                                style={{
                                    padding: '4px 8px',
                                    background: 'transparent',
                                    border: '1px solid #333',
                                    borderRadius: '4px',
                                    color: '#888',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                }}
                            >
                                ⚙️ Settings
                            </button>
                        </div>

                        {!showSettings ? (
                            /* Source List */
                            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                {availableSources.map((source) => {
                                    const info = DATA_SOURCE_INFO[source];
                                    const isSelected = source === selectedSource;

                                    return (
                                        <div
                                            key={source}
                                            onClick={() => {
                                                selectSource(source);
                                                setIsOpen(false);
                                            }}
                                            style={{
                                                padding: '10px 12px',
                                                background: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent',
                                                cursor: 'pointer',
                                                transition: 'all 0.15s ease',
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isSelected) e.currentTarget.style.background = '#252525';
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isSelected) e.currentTarget.style.background = 'transparent';
                                            }}
                                        >
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    marginBottom: '4px',
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: '13px',
                                                        fontWeight: 500,
                                                        color: isSelected ? '#3b82f6' : '#fff',
                                                    }}
                                                >
                                                    {info.name}
                                                </span>
                                                {isSelected && (
                                                    <svg
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="#3b82f6"
                                                        strokeWidth="2"
                                                    >
                                                        <path d="M20 6L9 17l-5-5" />
                                                    </svg>
                                                )}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#888', lineHeight: '1.4' }}>
                                                {info.description}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            /* Settings Panel */
                            <div style={{ padding: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '8px' }}>
                                        Configure API keys for premium data sources
                                    </div>
                                </div>

                                {(Object.keys(sources) as DataSourceType[])
                                    .filter((source) => DATA_SOURCE_INFO[source].requiresApiKey)
                                    .map((source) => {
                                        const info = DATA_SOURCE_INFO[source];
                                        const config = sources[source];

                                        return (
                                            <div
                                                key={source}
                                                style={{
                                                    marginBottom: '16px',
                                                    padding: '12px',
                                                    background: '#252525',
                                                    borderRadius: '6px',
                                                    border: '1px solid #2a2a2a',
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        marginBottom: '8px',
                                                    }}
                                                >
                                                    <div>
                                                        <div style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>
                                                            {info.name}
                                                        </div>
                                                        <a
                                                            href={info.website}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            style={{
                                                                fontSize: '10px',
                                                                color: '#3b82f6',
                                                                textDecoration: 'none',
                                                            }}
                                                        >
                                                            Get API Key →
                                                        </a>
                                                    </div>
                                                    <div
                                                        style={{
                                                            padding: '2px 6px',
                                                            background: config.enabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                            border: `1px solid ${config.enabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                                                            borderRadius: '4px',
                                                            fontSize: '10px',
                                                            color: config.enabled ? '#22c55e' : '#ef4444',
                                                        }}
                                                    >
                                                        {config.enabled ? 'Enabled' : 'Disabled'}
                                                    </div>
                                                </div>
                                                <input
                                                    type="password"
                                                    placeholder="Enter API key"
                                                    value={config.apiKey || ''}
                                                    onChange={(e) => updateApiKey(source, e.target.value)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        width: '100%',
                                                        padding: '8px',
                                                        background: '#1a1a1a',
                                                        border: '1px solid #333',
                                                        borderRadius: '4px',
                                                        color: '#fff',
                                                        fontSize: '12px',
                                                        outline: 'none',
                                                        boxSizing: 'border-box',
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}

                                <button
                                    onClick={() => setShowSettings(false)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        background: '#3b82f6',
                                        border: 'none',
                                        borderRadius: '6px',
                                        color: '#fff',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        cursor: 'pointer',
                                        marginTop: '8px',
                                    }}
                                >
                                    Done
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};
