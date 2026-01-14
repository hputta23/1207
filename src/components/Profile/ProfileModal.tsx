import { useState, useEffect } from 'react';
import { useUserProfileStore } from '../../services/user-profile-service';
import { useAuth } from '../../state/auth-context';
import { useThemeStore } from '../../services/theme-service';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Section = 'general' | 'subscription' | 'security' | 'api' | 'preferences' | 'danger';

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { profile, updateProfile, resetProfile } = useUserProfileStore();
    const { user, logout } = useAuth();
    const [activeSection, setActiveSection] = useState<Section>('general');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        nickname: '',
        bio: '',
        settings: { ...profile.settings }
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                nickname: profile.nickname,
                bio: profile.bio || '',
                settings: { ...profile.settings }
            });
        }
    }, [isOpen, profile]);

    if (!isOpen) return null;

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleSave = () => {
        updateProfile({
            nickname: formData.nickname,
            bio: formData.bio,
            settings: formData.settings
        });
        showToast('Settings saved successfully');
    };

    const handleSettingChange = (key: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            settings: {
                ...prev.settings,
                [key]: value
            }
        }));
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
            resetProfile();
            logout();
            onClose();
        }
    };

    const SidebarItem = ({ id, label, icon }: { id: Section, label: string, icon: string }) => (
        <button
            onClick={() => setActiveSection(id)}
            style={{
                width: '100%',
                padding: '12px 16px',
                background: activeSection === id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                border: 'none',
                borderLeft: activeSection === id ? '3px solid #3b82f6' : '3px solid transparent',
                color: activeSection === id ? '#fff' : '#94a3b8',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s',
            }}
        >
            <span style={{ fontSize: '18px' }}>{icon}</span>
            {label}
        </button>
    );

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>

                {/* Sidebar */}
                <div style={sidebarStyle}>
                    <div style={{ padding: '32px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={avatarContainerStyle}>
                                <img src={profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ color: '#fff', fontWeight: 600, fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {profile.nickname}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        background: user?.subscription === 'pro' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#334155',
                                        color: '#fff',
                                        padding: '2px 6px',
                                        borderRadius: '4px',
                                        textTransform: 'uppercase'
                                    }}>
                                        {user?.subscription || 'FREE'}
                                    </span>
                                    <span style={{ color: '#64748b', fontSize: '12px' }}>Member</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '16px 0', flex: 1 }}>
                        <SidebarItem id="general" label="General" icon="👤" />
                        <SidebarItem id="subscription" label="Subscription" icon="💳" />
                        <SidebarItem id="security" label="Security" icon="🔒" />
                        <SidebarItem id="api" label="API Keys" icon="🔑" />
                        <SidebarItem id="preferences" label="Preferences" icon="⚙️" />
                    </div>

                    <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <SidebarItem id="danger" label="Danger Zone" icon="⚠️" />
                        <div style={{ marginTop: '8px' }}>
                            <button onClick={logout} style={{ ...sidebarItemStyle, color: '#ef4444' }}>
                                <span style={{ fontSize: '18px' }}>🚪</span>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div style={contentStyle}>
                    <div style={headerStyle}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: '#fff' }}>
                                {activeSection === 'general' && 'General Settings'}
                                {activeSection === 'subscription' && 'Subscription & Billing'}
                                {activeSection === 'security' && 'Security & Login'}
                                {activeSection === 'api' && 'API Management'}
                                {activeSection === 'preferences' && 'App Preferences'}
                                {activeSection === 'danger' && 'Danger Zone'}
                            </h2>
                            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '14px' }}>
                                Manage your account settings and preferences
                            </p>
                        </div>
                        <button onClick={onClose} style={closeButtonStyle}>✕</button>
                    </div>

                    <div style={scrollAreaStyle}>
                        {activeSection === 'general' && (
                            <div style={formStackStyle}>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Display Name</label>
                                    <input
                                        style={inputStyle}
                                        value={formData.nickname}
                                        onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                                    />
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Email Address</label>
                                    <input
                                        style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }}
                                        value={user?.email || ''}
                                        readOnly
                                    />
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>Email cannot be changed</span>
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Bio</label>
                                    <textarea
                                        style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                                        value={formData.bio}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                        placeholder="Tell us a bit about yourself..."
                                    />
                                </div>
                                <SaveButton onClick={handleSave} />
                            </div>
                        )}

                        {activeSection === 'subscription' && (
                            <div style={formStackStyle}>
                                <div style={{
                                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    borderRadius: '12px',
                                    padding: '24px'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                                        <div>
                                            <div style={{ color: '#3b82f6', fontWeight: 700, letterSpacing: '1px', fontSize: '12px', marginBottom: '8px' }}>CURRENT PLAN</div>
                                            <div style={{ fontSize: '32px', fontWeight: 800, color: '#fff' }}>Pro Trader</div>
                                            <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>$49.00 / month</div>
                                        </div>
                                        <div style={{
                                            background: '#3b82f6', color: '#fff', padding: '6px 12px',
                                            borderRadius: '20px', fontSize: '12px', fontWeight: 700
                                        }}>
                                            ACTIVE
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                        <FeatureItem label="Real-time Data" active />
                                        <FeatureItem label="Advanced Charts" active />
                                        <FeatureItem label="Unlimited Backtesting" active />
                                        <FeatureItem label="API Access" active />
                                        <FeatureItem label="Level 2 Quotes" active />
                                        <FeatureItem label="Priority Support" active />
                                    </div>

                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button style={{ ...secondaryButtonStyle, flex: 1 }}>Manage Billing</button>
                                        <button style={{ ...secondaryButtonStyle, flex: 1, borderColor: 'transparent', color: '#ef4444' }}>Cancel Subscription</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'security' && (
                            <div style={formStackStyle}>
                                <div style={cardStyle}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ color: '#fff', fontWeight: 500 }}>Two-Factor Authentication</div>
                                            <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                                                Secure your account with 2FA
                                            </div>
                                        </div>
                                        <Toggle
                                            checked={formData.settings.twoFactorEnabled || false}
                                            onChange={e => handleSettingChange('twoFactorEnabled', e.target.checked)}
                                        />
                                    </div>
                                </div>
                                <div style={cardStyle}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ color: '#fff', fontWeight: 500 }}>Login History</div>
                                            <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                                                View your recent login activity
                                            </div>
                                        </div>
                                        <button style={{ ...secondaryButtonStyle, fontSize: '12px' }}>View Logs</button>
                                    </div>
                                </div>
                                <SaveButton onClick={handleSave} />
                            </div>
                        )}

                        {activeSection === 'api' && (
                            <div style={formStackStyle}>
                                <div style={{ background: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '8px', marginBottom: '16px' }}>
                                    <code style={{ display: 'block', color: '#64748b', marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>PUBLIC KEY</code>
                                    <div style={{ fontFamily: 'monospace', color: '#fff', wordBreak: 'break-all', fontSize: '14px', background: '#1e293b', padding: '12px', borderRadius: '6px' }}>
                                        pk_live_892374892374892374...
                                    </div>
                                </div>
                                <button style={primaryButtonStyle}>+ Create New Secret Key</button>
                            </div>
                        )}

                        {activeSection === 'preferences' && (
                            <div style={formStackStyle}>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Theme Mode</label>
                                    <select
                                        style={inputStyle}
                                        value={useThemeStore.getState().theme}
                                        onChange={e => {
                                            const newTheme = e.target.value as 'dark' | 'light';
                                            useThemeStore.getState().setTheme(newTheme);
                                        }}
                                    >
                                        <option value="dark">Dark Mode</option>
                                        <option value="light">Light Mode</option>
                                    </select>
                                </div>
                                <div style={cardStyle}>
                                    <div style={itemRowStyle}>
                                        <div>
                                            <div style={{ color: '#fff' }}>Notifications</div>
                                            <div style={{ color: '#94a3b8', fontSize: '12px' }}>Enable push notifications</div>
                                        </div>
                                        <Toggle
                                            checked={formData.settings.notifications}
                                            onChange={e => handleSettingChange('notifications', e.target.checked)}
                                        />
                                    </div>
                                </div>
                                <SaveButton onClick={handleSave} />
                            </div>
                        )}

                        {activeSection === 'danger' && (
                            <div style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', padding: '24px' }}>
                                <h3 style={{ color: '#ef4444', margin: '0 0 12px', fontSize: '16px' }}>Delete Account</h3>
                                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.5', margin: '0 0 24px' }}>
                                    Once you delete your account, there is no going back. Please be certain.
                                </p>
                                <button onClick={handleReset} style={{ ...secondaryButtonStyle, color: '#ef4444', borderColor: '#ef4444' }}>
                                    Delete Account
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Toast Notification */}
                {toastMessage && (
                    <div style={toastStyle}>
                        ✓ {toastMessage}
                    </div>
                )}
            </div>
        </div>
    );
}

const FeatureItem = ({ label, active }: { label: string, active: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ color: active ? '#3b82f6' : '#64748b' }}>{active ? '✓' : '•'}</div>
        <div style={{ color: active ? '#e2e8f0' : '#64748b', fontSize: '13px' }}>{label}</div>
    </div>
);

// STYLES & COMPONENTS

const overlayStyle: React.CSSProperties = {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(8px)',
    zIndex: 2000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const modalStyle: React.CSSProperties = {
    display: 'flex',
    width: '900px',
    height: '650px',
    background: '#0a0a0a',
    border: '1px solid #1e293b',
    borderRadius: '16px',
    boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
    overflow: 'hidden',
    position: 'relative',
};

const sidebarStyle: React.CSSProperties = {
    width: '260px',
    background: '#0a0a0a',
    borderRight: '1px solid #1e293b',
    display: 'flex',
    flexDirection: 'column',
};

const contentStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#0a0a0a',
};

const headerStyle: React.CSSProperties = {
    padding: '32px',
    borderBottom: '1px solid #1e293b',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
};

const scrollAreaStyle: React.CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '32px',
};

const formStackStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    maxWidth: '520px',
};

const formGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
};

const labelStyle: React.CSSProperties = {
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '12px 16px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
};

const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid #1e293b',
    borderRadius: '8px',
    padding: '20px',
};

const avatarContainerStyle: React.CSSProperties = {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid rgba(255,255,255,0.1)',
};

const itemRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

const closeButtonStyle: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '4px',
    lineHeight: 1,
};

const primaryButtonStyle: React.CSSProperties = {
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
};

const secondaryButtonStyle: React.CSSProperties = {
    background: 'transparent',
    color: '#fff',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '10px 16px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
};

const sidebarItemStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    background: 'transparent',
    border: 'none',
    textAlign: 'left',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.2s',
};

const toastStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '24px',
    right: '24px',
    background: '#10b981',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    fontSize: '14px',
    fontWeight: 600,
    animation: 'slideUp 0.3s ease-out',
    zIndex: 100,
};

const SaveButton = ({ onClick }: { onClick: () => void }) => (
    <div style={{ paddingTop: '16px' }}>
        <button onClick={onClick} style={{ ...primaryButtonStyle, width: '100%' }}>Save Changes</button>
    </div>
);

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (e: any) => void }) => (
    <label style={{ position: 'relative', display: 'inline-block', width: '40px', height: '22px' }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
        <span style={{
            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: checked ? '#3b82f6' : '#334155',
            transition: '.3s', borderRadius: '22px',
        }} />
        <span style={{
            position: 'absolute', content: '""', height: '16px', width: '16px', left: '3px', bottom: '3px',
            backgroundColor: 'white', transition: '.3s', borderRadius: '50%',
            transform: checked ? 'translateX(18px)' : 'translateX(0)'
        }} />
    </label>
);
