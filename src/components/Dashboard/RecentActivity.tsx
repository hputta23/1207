import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { activityService, type Activity } from '../../services/activity-service';

export function RecentActivity() {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Load initial activities
        setActivities(activityService.getRecentActivities(8));

        // Update every 2 seconds to catch new activities
        const interval = setInterval(() => {
            setActivities(activityService.getRecentActivities(8));
        }, 2000);

        return () => clearInterval(interval);
    }, []);

    const handleActivityClick = (activity: Activity) => {
        if (activity.symbol) {
            if (activity.type === 'view_news') {
                navigate(`/news?symbol=${activity.symbol}`);
            } else if (activity.type === 'run_analysis') {
                navigate(`/analytics?symbol=${activity.symbol}`);
            } else {
                navigate(`/charts?symbol=${activity.symbol}`);
            }
        }
    };

    const handleClearAll = () => {
        if (window.confirm('Clear all activity history?')) {
            activityService.clearActivities();
            setActivities([]);
        }
    };

    if (activities.length === 0) {
        return (
            <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '32px',
                textAlign: 'center',
                marginBottom: '32px',
            }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 600, color: '#fff' }}>
                    No Recent Activity
                </h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#888' }}>
                    Your recent actions will appear here
                </p>
            </div>
        );
    }

    return (
        <div style={{ marginBottom: '32px' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
            }}>
                <h2 style={{
                    margin: 0,
                    fontSize: '20px',
                    fontWeight: 600,
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    📋 Recent Activity
                    <span style={{
                        fontSize: '12px',
                        color: '#888',
                        fontWeight: 400,
                    }}>
                        ({activities.length} {activities.length === 1 ? 'action' : 'actions'})
                    </span>
                </h2>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        onClick={handleClearAll}
                        style={{
                            padding: '6px 12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '6px',
                            color: '#ef4444',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                        }}
                    >
                        Clear All
                    </button>
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        style={{
                            padding: '6px 12px',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: '#fff',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                        }}
                    >
                        {isCollapsed ? 'Show' : 'Hide'}
                    </button>
                </div>
            </div>

            {/* Activity Timeline */}
            {!isCollapsed && (
                <div style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                }}>
                    {activities.map((activity, index) => {
                        const isClickable = activity.symbol !== undefined;
                        const icon = activityService.getActivityIcon(activity.type);
                        const label = activityService.getActivityLabel(activity.type);
                        const timeAgo = activityService.getFormattedTimestamp(activity.timestamp);

                        return (
                            <div
                                key={activity.id}
                                onClick={() => isClickable && handleActivityClick(activity)}
                                style={{
                                    padding: '16px 20px',
                                    borderBottom: index < activities.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none',
                                    cursor: isClickable ? 'pointer' : 'default',
                                    transition: 'background 0.15s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                }}
                                onMouseEnter={(e) => {
                                    if (isClickable) {
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'transparent';
                                }}
                            >
                                {/* Icon */}
                                <div style={{
                                    minWidth: '40px',
                                    height: '40px',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    border: '1px solid rgba(59, 130, 246, 0.2)',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px',
                                }}>
                                    {icon}
                                </div>

                                {/* Content */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{
                                        fontSize: '14px',
                                        color: '#fff',
                                        marginBottom: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        flexWrap: 'wrap',
                                    }}>
                                        <span>{label}</span>
                                        {activity.symbol && (
                                            <span style={{
                                                fontWeight: 700,
                                                fontFamily: 'monospace',
                                                color: '#3b82f6',
                                                background: 'rgba(59, 130, 246, 0.1)',
                                                padding: '2px 8px',
                                                borderRadius: '4px',
                                            }}>
                                                {activity.symbol}
                                            </span>
                                        )}
                                    </div>

                                    <div style={{
                                        fontSize: '12px',
                                        color: '#666',
                                    }}>
                                        {timeAgo}
                                    </div>
                                </div>

                                {/* Arrow for clickable items */}
                                {isClickable && (
                                    <div style={{
                                        color: '#666',
                                        fontSize: '16px',
                                    }}>
                                        →
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* View All Link */}
            {!isCollapsed && activities.length >= 8 && (
                <div style={{
                    textAlign: 'center',
                    marginTop: '12px',
                }}>
                    <button
                        onClick={() => {
                            // Could navigate to a full activity page
                            console.log('View all activities');
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#3b82f6',
                            fontSize: '13px',
                            cursor: 'pointer',
                            textDecoration: 'underline',
                        }}
                    >
                        View full history
                    </button>
                </div>
            )}
        </div>
    );
}
