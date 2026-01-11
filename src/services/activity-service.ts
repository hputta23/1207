export interface Activity {
    id: string;
    type: 'view_chart' | 'add_watchlist' | 'remove_watchlist' | 'view_news' | 'run_analysis';
    symbol?: string;
    timestamp: number;
    metadata?: Record<string, any>;
}

const STORAGE_KEY = 'user-activity';
const MAX_ACTIVITIES = 50; // Keep only the most recent 50 activities

class ActivityService {
    private activities: Activity[] = [];

    constructor() {
        this.loadActivities();
    }

    private loadActivities(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                this.activities = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Error loading activities:', error);
            this.activities = [];
        }
    }

    private saveActivities(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.activities));
        } catch (error) {
            console.error('Error saving activities:', error);
        }
    }

    addActivity(type: Activity['type'], symbol?: string, metadata?: Record<string, any>): void {
        const activity: Activity = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            type,
            symbol,
            timestamp: Date.now(),
            metadata,
        };

        // Add to beginning of array
        this.activities.unshift(activity);

        // Keep only the most recent activities
        if (this.activities.length > MAX_ACTIVITIES) {
            this.activities = this.activities.slice(0, MAX_ACTIVITIES);
        }

        this.saveActivities();
    }

    getRecentActivities(limit: number = 10): Activity[] {
        return this.activities.slice(0, limit);
    }

    getActivitiesBySymbol(symbol: string, limit: number = 5): Activity[] {
        return this.activities
            .filter(activity => activity.symbol === symbol)
            .slice(0, limit);
    }

    clearActivities(): void {
        this.activities = [];
        this.saveActivities();
    }

    getActivityStats(): {
        totalActivities: number;
        mostViewedStocks: { symbol: string; count: number }[];
        activityByType: Record<string, number>;
    } {
        const symbolCounts = new Map<string, number>();
        const typeCounts: Record<string, number> = {};

        this.activities.forEach(activity => {
            // Count by type
            typeCounts[activity.type] = (typeCounts[activity.type] || 0) + 1;

            // Count by symbol
            if (activity.symbol) {
                symbolCounts.set(activity.symbol, (symbolCounts.get(activity.symbol) || 0) + 1);
            }
        });

        const mostViewedStocks = Array.from(symbolCounts.entries())
            .map(([symbol, count]) => ({ symbol, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        return {
            totalActivities: this.activities.length,
            mostViewedStocks,
            activityByType: typeCounts,
        };
    }

    getFormattedTimestamp(timestamp: number): string {
        const now = Date.now();
        const diff = now - timestamp;

        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (seconds < 60) {
            return 'Just now';
        } else if (minutes < 60) {
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else if (days < 7) {
            return `${days}d ago`;
        } else {
            return new Date(timestamp).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            });
        }
    }

    getActivityIcon(type: Activity['type']): string {
        switch (type) {
            case 'view_chart':
                return '📊';
            case 'add_watchlist':
                return '⭐';
            case 'remove_watchlist':
                return '☆';
            case 'view_news':
                return '📰';
            case 'run_analysis':
                return '🔬';
            default:
                return '📌';
        }
    }

    getActivityLabel(type: Activity['type']): string {
        switch (type) {
            case 'view_chart':
                return 'Viewed chart';
            case 'add_watchlist':
                return 'Added to watchlist';
            case 'remove_watchlist':
                return 'Removed from watchlist';
            case 'view_news':
                return 'Viewed news';
            case 'run_analysis':
                return 'Ran analysis';
            default:
                return 'Unknown action';
        }
    }
}

export const activityService = new ActivityService();
