import { useState } from 'react';
import { useUserProfileStore, userProfileService } from '../../services/user-profile-service';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
    const { profile, updateProfile, resetProfile } = useUserProfileStore();
    const [isEditing, setIsEditing] = useState(false);
    const [nickname, setNickname] = useState(profile.nickname);

    if (!isOpen) return null;

    const handleSave = () => {
        updateProfile({ nickname });
        setIsEditing(false);
    };

    const handleReset = () => {
        if (confirm('Are you sure you want to reset your profile and balance? This cannot be undone.')) {
            resetProfile();
            onClose();
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        }} onClick={onClose}>
            <div style={{
                background: '#1a1a2e',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                width: '400px',
                maxWidth: '90%',
                padding: '32px',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
                position: 'relative',
            }} onClick={e => e.stopPropagation()}>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        background: 'transparent',
                        border: 'none',
                        color: '#888',
                        cursor: 'pointer',
                        fontSize: '20px',
                    }}
                >
                    ✕
                </button>

                {/* Header / Avatar */}
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                    <div style={{
                        width: '96px',
                        height: '96px',
                        margin: '0 auto 16px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '4px solid #3b82f6',
                        background: '#000',
                    }}>
                        <img
                            src={profile.avatarUrl}
                            alt="Avatar"
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                    </div>

                    {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '6px',
                                    padding: '6px 12px',
                                    color: '#fff',
                                    fontSize: '16px',
                                    textAlign: 'center',
                                    outline: 'none',
                                }}
                                autoFocus
                            />
                            <button
                                onClick={handleSave}
                                style={{
                                    background: '#22c55e',
                                    border: 'none',
                                    borderRadius: '6px',
                                    color: '#fff',
                                    padding: '6px 12px',
                                    cursor: 'pointer',
                                }}
                            >
                                ✓
                            </button>
                        </div>
                    ) : (
                        <h2
                            onClick={() => setIsEditing(true)}
                            style={{
                                margin: 0,
                                fontSize: '24px',
                                fontWeight: 700,
                                color: '#fff',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                            title="Click to edit"
                        >
                            {profile.nickname}
                            <span style={{ fontSize: '14px', opacity: 0.5 }}>✎</span>
                        </h2>
                    )}

                    <p style={{ margin: '4px 0 0', color: '#888', fontSize: '12px' }}>
                        Joined {new Date(profile.joinedAt).toLocaleDateString()}
                    </p>
                </div>

                {/* Stats Card */}
                <div style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.1) 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '24px',
                    textAlign: 'center',
                }}>
                    <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Paper Trading Balance
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 700, color: '#3b82f6', fontFamily: 'monospace' }}>
                        ${profile.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>

                {/* Account Actions */}
                <div style={{ display: 'grid', gap: '8px' }}>
                    <button
                        onClick={handleReset}
                        style={{
                            width: '100%',
                            padding: '12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '8px',
                            color: '#ef4444',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                    >
                        🗑 Reset Account
                    </button>
                </div>
            </div>
        </div>
    );
}
