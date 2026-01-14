import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './state/auth-context';
import { Dashboard } from './pages/Dashboard';
import { ChartsPage } from './pages/ChartsPage';
import { NewsTab } from './pages/NewsTab';
import { WatchlistTab } from './pages/WatchlistTab';
import { TradingPage } from './pages/TradingPage';
import { AnalyticsTab } from './pages/AnalyticsTab';
import { WhatIfTab } from './pages/WhatIfTab';
import { ThemeToggle } from './components/Theme/ThemeToggle';
import { useThemeStore, getThemeColors } from './services/theme-service';
import { AlertsBadge } from './components/Alerts/AlertsBadge';
import { ProfileModal } from './components/Profile/ProfileModal';
import { useUserProfileStore } from './services/user-profile-service';
import { useState } from 'react';
import './App.css';

// Inner App Component to use Auth Hook
function AppContent() {
  const { user, login } = useAuth();
  const location = useLocation();
  const { theme } = useThemeStore();
  const { profile } = useUserProfileStore();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const colors = getThemeColors(theme);

  if (!user) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
        color: '#fff',
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '40px',
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 700,
          }}>
            T
          </div>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '28px',
              fontWeight: 700,
              letterSpacing: '-0.5px',
            }}>
              Terminal Pro
            </h1>
            <p style={{
              margin: 0,
              fontSize: '13px',
              color: '#666',
              fontWeight: 400,
            }}>
              Enterprise Trading Platform
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div style={{
          background: '#141414',
          border: '1px solid #2a2a2a',
          borderRadius: '16px',
          padding: 'clamp(24px, 5vw, 40px)',
          width: 'clamp(280px, 90vw, 360px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '20px',
            fontWeight: 600,
          }}>
            Welcome back
          </h2>
          <p style={{
            margin: '0 0 24px 0',
            fontSize: '14px',
            color: '#666',
          }}>
            Sign in to access your trading workspace
          </p>

          <button
            onClick={() => login('trader_1')}
            style={{
              width: '100%',
              padding: '14px 20px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              border: 'none',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            Sign in as Trader
          </button>

          <p style={{
            margin: '16px 0 0 0',
            fontSize: '12px',
            color: '#555',
            textAlign: 'center',
          }}>
            Demo mode - No credentials required
          </p>
        </div>

        {/* Footer */}
        <p style={{
          position: 'absolute',
          bottom: '20px',
          fontSize: '11px',
          color: '#444',
        }}>
          Project 1207 - Enterprise Financial Charting Platform
        </p>
      </div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: colors.background, transition: 'background 0.3s ease' }}>
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
        overflowX: 'auto', // Allow horizontal scroll on mobile
        scrollbarWidth: 'none', // Hide scrollbar Firefox
        msOverflowStyle: 'none', // Hide scrollbar IE/Edge
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
          <nav style={{ display: 'flex', gap: 'clamp(4px, 1vw, 8px)', overflowX: 'auto', whiteSpace: 'nowrap' }}>
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
              Trade
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
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/charts" element={<ChartsPage />} />
          <Route path="/news" element={<NewsTab />} />
          <Route path="/watchlist" element={<WatchlistTab />} />
          <Route path="/trading" element={<TradingPage />} />
          <Route path="/analytics" element={<AnalyticsTab />} />
          <Route path="/what-if" element={<WhatIfTab />} />
        </Routes>
      </div>

      {/* Theme Toggle */}
      <ThemeToggle />
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
