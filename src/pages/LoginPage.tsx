import { useState } from 'react';
import { useAuth } from '../state/auth-context';

export function LoginPage() {
    const { login, signup, isLoading, error, clearError } = useAuth();
    const [isLogin, setIsLogin] = useState(true);

    // Form State
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isLogin) {
            await login(email, password);
        } else {
            await signup(name, email, password);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        clearError();
        setEmail('');
        setPassword('');
        setName('');
    };

    return (
        <div style={{
            display: 'flex',
            height: '100vh',
            width: '100vw',
            overflow: 'hidden',
            background: '#0a0a0a',
            color: '#fff',
        }}>
            {/* Left Side - Brand / Visual */}
            <div className="login-brand-panel" style={{
                flex: '1',
                background: 'linear-gradient(135deg, #0f172a 0%, #172554 100%)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '60px',
                overflow: 'hidden'
            }}>
                {/* Decorative Elements */}
                <div style={{
                    position: 'absolute',
                    top: '20%',
                    right: '-10%',
                    width: '400px',
                    height: '400px',
                    background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, rgba(0,0,0,0) 70%)',
                    borderRadius: '50%',
                    zIndex: 1
                }} />

                <div style={{ position: 'relative', zIndex: 10 }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        borderRadius: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        fontWeight: 700,
                        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.4)',
                        marginBottom: '32px'
                    }}>
                        T
                    </div>

                    <h1 style={{
                        fontSize: '48px',
                        fontWeight: 800,
                        marginBottom: '24px',
                        lineHeight: 1.1,
                        background: 'linear-gradient(to right, #fff, #94a3b8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Professional <br /> Trading <br /> Intelligence.
                    </h1>

                    <p style={{
                        fontSize: '18px',
                        color: '#94a3b8',
                        lineHeight: 1.6,
                        maxWidth: '480px'
                    }}>
                        Access real-time market data, advanced analytics, and institutional-grade tools in one unified platform.
                    </p>

                    <div style={{ marginTop: '60px', display: 'flex', gap: '32px' }}>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>$2B+</div>
                            <div style={{ color: '#64748b', fontSize: '14px' }}>Daily Volume</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>50k+</div>
                            <div style={{ color: '#64748b', fontSize: '14px' }}>Active Traders</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#fff' }}>0.01s</div>
                            <div style={{ color: '#64748b', fontSize: '14px' }}>Latency</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile / Left Panel Style helper */}
            <style>{`
                @media (max-width: 900px) {
                    .login-brand-panel { display: none !important; }
                }
            `}</style>

            {/* Right Side - Form */}
            <div style={{
                flex: '0 0 500px',
                maxWidth: '100%',
                background: '#0a0a0a',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center', // Centering vertically
                alignItems: 'center',     // Centering horizontally
                padding: '40px',
            }}>
                <div style={{ width: '100%', maxWidth: '380px' }}>
                    <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '28px', fontWeight: 700, marginBottom: '8px', color: '#fff' }}>
                            {isLogin ? 'Welcome back' : 'Create an account'}
                        </h2>
                        <p style={{ color: '#64748b', fontSize: '14px' }}>
                            {isLogin
                                ? 'Enter your credentials to access your workspace'
                                : 'Start your 30-day free trial today'
                            }
                        </p>
                    </div>

                    {error && (
                        <div style={{
                            padding: '12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            fontSize: '13px',
                            marginBottom: '24px',
                            textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {!isLogin && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="John Doe"
                                    style={{
                                        padding: '12px 16px',
                                        background: '#1e293b',
                                        border: '1px solid #334155',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '14px',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@company.com"
                                style={{
                                    padding: '12px 16px',
                                    background: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label style={{ fontSize: '13px', fontWeight: 500, color: '#94a3b8' }}>Password</label>
                                {isLogin && (
                                    <a href="#" style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none' }}>Forgot password?</a>
                                )}
                            </div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                style={{
                                    padding: '12px 16px',
                                    background: '#1e293b',
                                    border: '1px solid #334155',
                                    borderRadius: '8px',
                                    color: '#fff',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                marginTop: '8px',
                                padding: '14px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: isLoading ? 'not-allowed' : 'pointer',
                                opacity: isLoading ? 0.7 : 1,
                                transition: 'all 0.2s',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            {isLoading ? (
                                <span className="spinner" style={{
                                    width: '18px', height: '18px',
                                    border: '2px solid #fff', borderTopColor: 'transparent',
                                    borderRadius: '50%', display: 'inline-block',
                                    animation: 'spin 0.8s linear infinite'
                                }} />
                            ) : (
                                isLogin ? 'Sign In' : 'Create Account'
                            )}
                        </button>
                        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                    </form>

                    <div style={{ marginTop: '32px', textAlign: 'center' }}>
                        <span style={{ color: '#64748b', fontSize: '14px' }}>
                            {isLogin ? "Don't have an account? " : "Already have an account? "}
                        </span>
                        <button
                            onClick={toggleMode}
                            style={{
                                background: 'none',
                                border: 'none',
                                color: '#3b82f6',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer'
                            }}
                        >
                            {isLogin ? 'Sign up' : 'Sign in'}
                        </button>
                    </div>

                    <div style={{
                        marginTop: '40px',
                        paddingTop: '24px',
                        borderTop: '1px solid #1e293b',
                        textAlign: 'center',
                        color: '#64748b',
                        fontSize: '12px'
                    }}>
                        By clicking continue, you agree to our <a href="#" style={{ color: '#94a3b8' }}>Terms of Service</a> and <a href="#" style={{ color: '#94a3b8' }}>Privacy Policy</a>.
                    </div>
                </div>
            </div>
        </div>
    );
}
