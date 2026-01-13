import { useState, useEffect } from 'react';

interface ShortcutProps {
    keys: string;
    description: string;
}

function Shortcut({ keys, description }: ShortcutProps) {
    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        }}>
            <span style={{ fontSize: '14px', color: '#fff' }}>{description}</span>
            <div style={{
                display: 'inline-flex',
                gap: '4px',
                alignItems: 'center',
            }}>
                {keys.split('+').map((key, index) => (
                    <span key={index}>
                        <kbd style={{
                            display: 'inline-block',
                            padding: '4px 8px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: '#3b82f6',
                            fontFamily: 'monospace',
                        }}>
                            {key}
                        </kbd>
                        {index < keys.split('+').length - 1 && (
                            <span style={{ margin: '0 4px', color: '#666' }}>+</span>
                        )}
                    </span>
                ))}
            </div>
        </div>
    );
}

export function KeyboardShortcuts() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Open with "?" key
            if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
                setIsOpen(true);
            }
            // Close with Escape
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    if (!isOpen) {
        // Show floating help button
        return (
            <button
                onClick={() => setIsOpen(true)}
                aria-label="Show keyboard shortcuts"
                title="Keyboard shortcuts (?)"
                style={{
                    position: 'fixed',
                    bottom: '24px',
                    right: '24px',
                    width: '48px',
                    height: '48px',
                    minHeight: '48px',
                    minWidth: '48px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    border: 'none',
                    borderRadius: '50%',
                    color: '#fff',
                    fontSize: '20px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)',
                    zIndex: 999,
                    transition: 'transform 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
                ?
            </button>
        );
    }

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-title"
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
            }}
            onClick={() => setIsOpen(false)}
        >
            <div
                style={{
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '16px',
                    padding: '32px',
                    width: '90%',
                    maxWidth: '500px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '24px',
                }}>
                    <h2 id="shortcuts-title" style={{
                        margin: 0,
                        fontSize: '24px',
                        fontWeight: 700,
                        color: '#fff',
                    }}>
                        ⌨️ Keyboard Shortcuts
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        aria-label="Close shortcuts"
                        style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#888',
                            fontSize: '20px',
                            cursor: 'pointer',
                            padding: '8px 12px',
                            minHeight: '44px',
                            minWidth: '44px',
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <h3 style={{
                        margin: '0 0 12px 0',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#888',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}>
                        Navigation
                    </h3>
                    <Shortcut keys="⌘+K" description="Open quick search" />
                    <Shortcut keys="/" description="Focus search input" />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <h3 style={{
                        margin: '0 0 12px 0',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#888',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                    }}>
                        Interface
                    </h3>
                    <Shortcut keys="Esc" description="Close modals & dialogs" />
                    <Shortcut keys="?" description="Show this help dialog" />
                </div>

                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    borderRadius: '8px',
                }}>
                    <p style={{
                        margin: 0,
                        fontSize: '12px',
                        color: '#888',
                        lineHeight: 1.6,
                    }}>
                        💡 <strong style={{ color: '#3b82f6' }}>Pro tip:</strong> Press <kbd style={{
                            padding: '2px 6px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '3px',
                            fontSize: '11px',
                            fontFamily: 'monospace',
                        }}>?</kbd> anytime to see this help dialog
                    </p>
                </div>
            </div>
        </div>
    );
}
