import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './state/auth-context';
import { ThemeToggle } from './components/Theme/ThemeToggle';
import { useThemeStore, getThemeColors } from './services/theme-service';
import { AlertsBadge } from './components/Alerts/AlertsBadge';
import { ProfileModal } from './components/Profile/ProfileModal';
import { useUserProfileStore } from './services/user-profile-service';
import { useState, lazy, Suspense } from 'react';
import { BottomNav } from './components/Navigation/BottomNav';
import './App.css';

// Lazy Load Pages for Performance
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const ChartsPage = lazy(() => import('./pages/ChartsPage').then(module => ({ default: module.ChartsPage })));
const NewsTab = lazy(() => import('./pages/NewsTab').then(module => ({ default: module.NewsTab })));
const WatchlistTab = lazy(() => import('./pages/WatchlistTab').then(module => ({ default: module.WatchlistTab })));
const TradingPage = lazy(() => import('./pages/TradingPage').then(module => ({ default: module.TradingPage })));
const AnalyticsTab = lazy(() => import('./pages/AnalyticsTab').then(module => ({ default: module.AnalyticsTab })));
const WhatIfTab = lazy(() => import('./pages/WhatIfTab').then(module => ({ default: module.WhatIfTab })));

// Loading Component
const LoadingScreen = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', minHeight: '50vh' }}>
    <div className="spinner" style={{ width: '40px', height: '40px', border: '3px solid rgba(59,130,246,0.3)', borderTopColor: '#3b82f6', borderRadius: '50%' }}></div>
  </div>
);

import { LoginPage } from './pages/LoginPage';

// ... (previous imports)

// Inner App Component to use Auth Hook
function AppContent() {
  const { user } = useAuth();
  const location = useLocation();
  const { theme } = useThemeStore();
  const { profile } = useUserProfileStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const colors = getThemeColors(theme);

  if (!user) {
    return <LoginPage />;
  }

  return (
    // ... authenticated app structure
    <div style={{ width: '100vw', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: colors.background, transition: 'background 0.3s ease' }}>

      {/* Mobile Nav Hiding CSS */}
      <style>{`
          @media (max-width: 768px) {
              .desktop-nav-links { display: none !important; }
          }
      `}</style>

      {/* Top Navigation Bar */}
      <div style={{
        minHeight: '50px',
        background: theme === 'dark' ? '#111' : '#f8f9fa',
        borderBottom: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        padding: 'clamp(8px, 2vw, 20px)',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
      }}>
        <style>{`
          /* Hide scrollbar Chrome/Safari/Webkit */
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {/* Left: Logo & Nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexShrink: 0 }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <div style={{
              width: '28px',
              height: '28px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '14px',
              fontWeight: 700,
              color: '#fff',
            }}>
              T
            </div>
            <span style={{
              color: colors.text,
              fontSize: '16px',
              fontWeight: 600,
              letterSpacing: '-0.3px',
            }}>
              Terminal Pro
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="desktop-nav-links" style={{ display: 'flex', gap: 'clamp(4px, 1vw, 8px)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
            <Link
              to="/"
              style={{
                padding: '8px 16px',
                background: location.pathname === '/' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: location.pathname === '/' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                borderRadius: '6px',
                color: location.pathname === '/' ? '#3b82f6' : '#888',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Dashboard
            </Link>
            <Link
              to="/charts"
              style={{
                padding: '8px 16px',
                background: location.pathname === '/charts' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: location.pathname === '/charts' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                borderRadius: '6px',
                color: location.pathname === '/charts' ? '#3b82f6' : '#888',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Charts
            </Link>
            <Link
              to="/news"
              style={{
                padding: '8px 16px',
                background: location.pathname === '/news' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: location.pathname === '/news' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                borderRadius: '6px',
                color: location.pathname === '/news' ? '#3b82f6' : '#888',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              News
            </Link>
            <Link
              to="/watchlist"
              style={{
                padding: '8px 16px',
                background: location.pathname === '/watchlist' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: location.pathname === '/watchlist' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                borderRadius: '6px',
                color: location.pathname === '/watchlist' ? '#3b82f6' : '#888',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Watchlist
            </Link>
            <Link
              to="/trading"
              style={{
                padding: '8px 16px',
                background: location.pathname === '/trading' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: location.pathname === '/trading' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                borderRadius: '6px',
                color: location.pathname === '/trading' ? '#3b82f6' : '#888',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Paper Trade
            </Link>
            <Link
              to="/analytics"
              style={{
                padding: '8px 16px',
                background: location.pathname === '/analytics' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: location.pathname === '/analytics' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                borderRadius: '6px',
                color: location.pathname === '/analytics' ? '#3b82f6' : '#888',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Analytics
            </Link>
            <Link
              to="/what-if"
              style={{
                padding: '8px 16px',
                background: location.pathname === '/what-if' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: location.pathname === '/what-if' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                borderRadius: '6px',
                color: location.pathname === '/what-if' ? '#3b82f6' : '#888',
                fontSize: '14px',
                fontWeight: 500,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              What If?
            </Link>
          </nav>
        </div>

        {/* Right: User Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <AlertsBadge />

          {/* Profile Trigger */}
          <div
            onClick={() => setIsProfileOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              background: '#1a1a1a',
              borderRadius: '6px',
              cursor: 'pointer',
              border: '1px solid transparent',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
              e.currentTarget.style.background = '#222';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent';
              e.currentTarget.style.background = '#1a1a1a';
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '1px solid rgba(59, 130, 246, 0.3)',
            }}>
              <img src={profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ color: '#fff', fontSize: '12px', fontWeight: 500, lineHeight: 1 }}>
                {profile.nickname}
              </span>
              <span style={{ color: '#3b82f6', fontSize: '10px', fontWeight: 600, fontFamily: 'monospace' }}>
                ${profile.balance.toLocaleString('en-US', { notation: 'compact', maximumFractionDigits: 1 })}
              </span>
            </div>
          </div>
        </div>

        <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1 }}>
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/charts" element={<ChartsPage />} />
            <Route path="/news" element={<NewsTab />} />
            <Route path="/watchlist" element={<WatchlistTab />} />
            <Route path="/trading" element={<TradingPage />} />
            <Route path="/analytics" element={<AnalyticsTab />} />
            <Route path="/what-if" element={<WhatIfTab />} />
          </Routes>
        </Suspense>
      </div>

      {/* Theme Toggle Removed - Moved to Profile Preferences */}
      <BottomNav />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
