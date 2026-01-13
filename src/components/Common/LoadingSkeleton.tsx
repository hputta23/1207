interface LoadingSkeletonProps {
    width?: string;
    height?: string;
    borderRadius?: string;
    style?: React.CSSProperties;
}

export function LoadingSkeleton({
    width = '100%',
    height = '20px',
    borderRadius = '4px',
    style = {}
}: LoadingSkeletonProps) {
    return (
        <div
            style={{
                width,
                height,
                borderRadius,
                background: 'linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 100%)',
                backgroundSize: '200% 100%',
                animation: 'skeleton-loading 1.5s ease-in-out infinite',
                ...style,
            }}
        />
    );
}

export function WatchlistCardSkeleton() {
    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
        }}>
            <LoadingSkeleton width="80px" height="28px" borderRadius="8px" style={{ marginBottom: '16px' }} />
            <LoadingSkeleton width="120px" height="32px" style={{ marginBottom: '8px' }} />
            <LoadingSkeleton width="150px" height="24px" style={{ marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '8px' }}>
                <LoadingSkeleton width="100%" height="44px" borderRadius="6px" />
                <LoadingSkeleton width="100%" height="44px" borderRadius="6px" />
                <LoadingSkeleton width="44px" height="44px" borderRadius="6px" />
            </div>
        </div>
    );
}

// Add CSS animation
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
        @keyframes skeleton-loading {
            0% {
                background-position: 200% 0;
            }
            100% {
                background-position: -200% 0;
            }
        }
    `;
    document.head.appendChild(styleSheet);
}
