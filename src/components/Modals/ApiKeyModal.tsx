import React, { useState } from 'react';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (key: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave }) => {
    const [key, setKey] = useState('');

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '8px',
                padding: '24px',
                width: '400px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}>
                <h3 style={{ margin: '0 0 16px 0', color: '#fff', fontSize: '18px' }}>Enable Live Data</h3>
                <p style={{ margin: '0 0 20px 0', color: '#888', fontSize: '14px', lineHeight: '1.5' }}>
                    Enter your <strong>Finnhub API Key</strong> to stream real-time market data.
                    <br />
                    <a
                        href="https://finnhub.io/"
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: '#3b82f6', textDecoration: 'none' }}
                    >
                        Get a free key here
                    </a>.
                </p>

                <input
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Enter API Key"
                    style={{
                        width: '100%',
                        padding: '10px',
                        background: '#252525',
                        border: '1px solid #333',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '14px',
                        marginBottom: '20px',
                        boxSizing: 'border-box'
                    }}
                    autoFocus
                />

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '8px 16px',
                            background: 'transparent',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            color: '#aaa',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            if (key.trim()) {
                                onSave(key.trim());
                            }
                        }}
                        disabled={!key.trim()}
                        style={{
                            padding: '8px 16px',
                            background: key.trim() ? '#22c55e' : '#155d32',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fff',
                            cursor: key.trim() ? 'pointer' : 'not-allowed',
                            fontWeight: 500
                        }}
                    >
                        Save & Go Live
                    </button>
                </div>
            </div>
        </div>
    );
};
