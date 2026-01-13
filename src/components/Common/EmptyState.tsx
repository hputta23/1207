import { ReactNode } from 'react';

interface EmptyStateProps {
    icon: string;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    children?: ReactNode;
}

export function EmptyState({ icon, title, description, action, children }: EmptyStateProps) {
    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '48px 32px',
            textAlign: 'center',
        }}>
            <div style={{
                fontSize: '64px',
                marginBottom: '20px',
                opacity: 0.8,
            }}>
                {icon}
            </div>
            <h3 style={{
                margin: '0 0 12px 0',
                fontSize: '20px',
                fontWeight: 600,
                color: '#fff',
            }}>
                {title}
            </h3>
            <p style={{
                margin: '0 0 24px 0',
                fontSize: '14px',
                color: '#888',
                lineHeight: 1.6,
                maxWidth: '400px',
                marginLeft: 'auto',
                marginRight: 'auto',
            }}>
                {description}
            </p>
            {action && (
                <button
                    onClick={action.onClick}
                    style={{
                        padding: '12px 24px',
                        minHeight: '44px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'transform 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                    {action.label}
                </button>
            )}
            {children}
        </div>
    );
}
