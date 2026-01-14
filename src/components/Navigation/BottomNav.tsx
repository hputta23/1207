import { useNavigate, useLocation } from 'react-router-dom';

export function BottomNav() {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { label: 'Dash', path: '/', icon: '🏠' },
        { label: 'Charts', path: '/charts', icon: '📈' },
        { label: 'Market', path: '/news', icon: '📰' }, // Combined News/Watchlist landing? Or just News
        { label: 'Trade', path: '/trading', icon: '⚡' },
        { label: 'More', path: '/analytics', icon: '📊' }
    ];

    return (
        <div className="bottom-nav">
            {navItems.map(item => {
                const isActive = location.pathname === item.path;
                return (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            padding: '8px 0',
                            color: isActive ? '#3b82f6' : '#888',
                            cursor: 'pointer'
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>{item.icon}</span>
                        <span style={{ fontSize: '10px', fontWeight: isActive ? 600 : 500 }}>{item.label}</span>
                    </button>
                );
            })}
            <style>{`
                .bottom-nav {
                    display: none;
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 60px;
                    background: #141414; /* Darker than body */
                    border-top: 1px solid rgba(255,255,255,0.1);
                    z-index: 1000;
                    padding-bottom: env(safe-area-inset-bottom);
                }
                @media (max-width: 768px) {
                    .bottom-nav { display: flex; }
                    /* Add padding to page content so it doesn't get hidden behind nav */
                    .page-container { padding-bottom: 70px !important; }
                }
            `}</style>
        </div>
    );
}
