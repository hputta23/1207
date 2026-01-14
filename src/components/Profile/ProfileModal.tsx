import { useState, useEffect } from 'react';
import { useUserProfileStore } from '../../services/user-profile-service';
import { useThemeStore } from '../../services/theme-service'; // Import theme store

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Section = 'general' | 'security' | 'api' | 'preferences' | 'danger';

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { profile, updateProfile, resetProfile } = useUserProfileStore();
    const [activeSection, setActiveSection] = useState<Section>('general');
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    // Form State - initialized from profile when modal opens
    const [formData, setFormData] = useState({
        nickname: '',
        email: '',
        phone: '',
        bio: '',
        settings: { ...profile.settings }
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                nickname: profile.nickname,
                email: profile.email || '',
                phone: profile.phone || '',
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
            email: formData.email,
            phone: formData.phone,
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
        if (confirm('Are you sure you want to reset your profile? This cannot be undone.')) {
            resetProfile();
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
                color: activeSection === id ? '#fff' : '#888',
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
            <span style={{ fontSize: '16px' }}>{icon}</span>
            {label}
        </button>
    );

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={e => e.stopPropagation()}>

                {/* Sidebar */}
                <div style={sidebarStyle}>
                    <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={avatarContainerStyle}>
                                <img src={profile.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ overflow: 'hidden' }}>
                                <div style={{ color: '#fff', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {profile.nickname}
                                </div>
                                <div style={{ color: '#888', fontSize: '11px' }}>Trader Account</div>
                            </div>
                        </div>
                    </div>

                    <div style={{ padding: '16px 0' }}>
                        <SidebarItem id="general" label="General" icon="👤" />
                        <SidebarItem id="security" label="Security" icon="🔒" />
                        <SidebarItem id="api" label="API Keys" icon="🔑" />
                        <SidebarItem id="preferences" label="Preferences" icon="⚙️" />
                        <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />
                        <SidebarItem id="danger" label="Danger Zone" icon="⚠️" />
                    </div>
                </div>

                {/* Main Content */}
                <div style={contentStyle}>
                    <div style={headerStyle}>
                        <h2 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>
                            {activeSection === 'general' && 'General Settings'}
                            {activeSection === 'security' && 'Security & Login'}
                            {activeSection === 'api' && 'API Management'}
                            {activeSection === 'preferences' && 'App Preferences'}
                            {activeSection === 'danger' && 'Danger Zone'}
                        </h2>
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
                                        style={inputStyle}
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Phone Number</label>
                                    <input
                                        style={inputStyle}
                                        value={formData.phone}
                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Bio</label>
                                    <textarea
                                        style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                                        value={formData.bio}
                                        onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    />
                                </div>
                                <SaveButton onClick={handleSave} />
                            </div>
                        )}

                        {activeSection === 'security' && (
                            <div style={formStackStyle}>
                                <div style={cardStyle}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ color: '#fff', fontWeight: 500 }}>Two-Factor Authentication</div>
                                            <div style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
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
                                            <div style={{ color: '#888', fontSize: '13px', marginTop: '4px' }}>
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
                                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                                    <code style={{ display: 'block', color: '#3b82f6', marginBottom: '8px', fontSize: '12px' }}>PUBLIC KEY</code>
                                    <div style={{ fontFamily: 'monospace', color: '#fff', wordBreak: 'break-all' }}>
                                        pk_live_892374892374892374...
                                    </div>
                                </div>
                                <button style={primaryButtonStyle}>+ Create New API Key</button>
                                <div style={{ marginTop: '24px' }}>
                                    <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Active Keys</div>
                                    <div style={cardStyle}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div style={{ color: '#fff', fontFamily: 'monospace' }}>Read-Only Key</div>
                                            <div style={{ color: '#22c55e', fontSize: '12px' }}>Active</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeSection === 'preferences' && (
                            <div style={formStackStyle}>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Interface Language</label>
                                    <select
                                        style={inputStyle}
                                        value={formData.settings.language}
                                        onChange={e => handleSettingChange('language', e.target.value)}
                                    >
                                        <option value="en">English (US)</option>
                                        <option value="es">Español</option>
                                        <option value="fr">Français</option>
                                    </select>
                                </div>
                                <div style={formGroupStyle}>
                                    <label style={labelStyle}>Theme Mode</label>
                                    <select
                                        style={inputStyle}
                                        value={useThemeStore.getState().theme}
                                        onChange={e => {
                                            const newTheme = e.target.value as 'dark' | 'light';
                                            useThemeStore.getState().setTheme(newTheme);
                                            // Sync with profile setting if we want to persist it there too, 
                                            // but for now userProfile logic doesn't strictly drive the app theme directly in App.tsx 
                                            // (App.tsx uses useThemeStore). WE should probably sync them.
                                            // Ideally, updateProfile should also update the local store theme.
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
                                            <div style={{ color: '#888', fontSize: '12px' }}>Enable push notifications</div>
                                        </div>
                                        <Toggle
                                            checked={formData.settings.notifications}
                                            onChange={e => handleSettingChange('notifications', e.target.checked)}
                                        />
                                    </div>
                                </div>
                                <div style={cardStyle}>
                                    <div style={itemRowStyle}>
                                        <div>
                                            <div style={{ color: '#fff' }}>Sound Effects</div>
                                            <div style={{ color: '#888', fontSize: '12px' }}>Play trade confirmation sounds</div>
                                        </div>
                                        <Toggle
                                            checked={formData.settings.soundEnabled}
                                            onChange={e => handleSettingChange('soundEnabled', e.target.checked)}
                                        />
                                    </div>
                                </div>
                                <SaveButton onClick={handleSave} />
                            </div>
                        )}

                        {activeSection === 'danger' && (
                            <div style={{ border: '1px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px', padding: '24px' }}>
                                <h3 style={{ color: '#ef4444', margin: '0 0 12px' }}>Delete Account</h3>
                                <p style={{ color: '#888', fontSize: '14px', lineHeight: '1.5', margin: '0 0 24px' }}>
                                    Once you delete your account, there is no going back. Please be certain.
                                </p>
                                <button onClick={handleReset} style={{ ...secondaryButtonStyle, color: '#ef4444', borderColor: '#ef4444' }}>
                                    Reset Profile & Balance
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
    width: '800px',
    height: '600px',
    background: '#0f1115', // Darker background for "Pro" feel
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '12px',
    boxShadow: '0 24px 48px rgba(0,0,0,0.6)',
    overflow: 'hidden',
    position: 'relative',
};

const sidebarStyle: React.CSSProperties = {
    width: '240px',
    background: '#13161c',
    borderRight: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    flexDirection: 'column',
};

const contentStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#0f1115',
};

const headerStyle: React.CSSProperties = {
    padding: '24px 32px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    maxWidth: '480px',
};

const formGroupStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
};

const labelStyle: React.CSSProperties = {
    color: '#888',
    fontSize: '13px',
    fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
    background: 'rgba(0,0,0,0.2)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    padding: '10px 12px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
};

const cardStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: '8px',
    padding: '16px',
};

const avatarContainerStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
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
    color: '#888',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
};

const primaryButtonStyle: React.CSSProperties = {
    background: '#3b82f6',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    padding: '10px 16px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.2s',
};

const secondaryButtonStyle: React.CSSProperties = {
    background: 'transparent',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '6px',
    padding: '8px 12px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
};

const toastStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: '24px',
    right: '24px',
    background: '#10b981',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '6px',
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
    <label style={{ position: 'relative', display: 'inline-block', width: '36px', height: '20px' }}>
        <input type="checkbox" checked={checked} onChange={onChange} style={{ opacity: 0, width: 0, height: 0 }} />
        <span style={{
            position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: checked ? '#3b82f6' : 'rgba(255,255,255,0.2)',
            transition: '.3s', borderRadius: '20px',
        }} />
        <span style={{
            position: 'absolute', content: '""', height: '14px', width: '14px', left: '3px', bottom: '3px',
            backgroundColor: 'white', transition: '.3s', borderRadius: '50%',
            transform: checked ? 'translateX(16px)' : 'translateX(0)'
        }} />
    </label>
);
