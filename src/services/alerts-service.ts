import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AlertType = 'above' | 'below' | 'percent_change';
export type AlertStatus = 'active' | 'triggered' | 'expired';

export interface PriceAlert {
    id: string;
    symbol: string;
    type: AlertType;
    targetPrice?: number;
    percentChange?: number;
    currentPrice: number;
    status: AlertStatus;
    createdAt: number;
    triggeredAt?: number;
    note?: string;
}

interface AlertsState {
    alerts: PriceAlert[];
    addAlert: (alert: Omit<PriceAlert, 'id' | 'status' | 'createdAt'>) => void;
    removeAlert: (id: string) => void;
    checkAlerts: (symbol: string, currentPrice: number) => PriceAlert[];
    getActiveAlerts: () => PriceAlert[];
    getTriggeredAlerts: () => PriceAlert[];
    clearTriggered: () => void;
    updateAlertStatus: (id: string, status: AlertStatus, triggeredAt?: number) => void;
}

export const useAlertsStore = create<AlertsState>()(
    persist(
        (set, get) => ({
            alerts: [],

            addAlert: (alert: Omit<PriceAlert, 'id' | 'status' | 'createdAt'>) => {
                const id = 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                const newAlert: PriceAlert = {
                    ...alert,
                    id,
                    status: 'active',
                    createdAt: Date.now(),
                };

                set((state) => ({
                    alerts: [...state.alerts, newAlert],
                }));
            },

            removeAlert: (id: string) => {
                set((state) => ({
                    alerts: state.alerts.filter((alert) => alert.id !== id),
                }));
            },

            checkAlerts: (symbol: string, currentPrice: number) => {
                const { alerts } = get();
                const triggeredAlerts: PriceAlert[] = [];

                alerts.forEach((alert) => {
                    if (alert.symbol === symbol && alert.status === 'active') {
                        let triggered = false;

                        switch (alert.type) {
                            case 'above':
                                if (alert.targetPrice && currentPrice >= alert.targetPrice) {
                                    triggered = true;
                                }
                                break;
                            case 'below':
                                if (alert.targetPrice && currentPrice <= alert.targetPrice) {
                                    triggered = true;
                                }
                                break;
                            case 'percent_change':
                                if (alert.percentChange) {
                                    const percentDiff = ((currentPrice - alert.currentPrice) / alert.currentPrice) * 100;
                                    if (Math.abs(percentDiff) >= Math.abs(alert.percentChange)) {
                                        triggered = true;
                                    }
                                }
                                break;
                        }

                        if (triggered) {
                            get().updateAlertStatus(alert.id, 'triggered', Date.now());
                            triggeredAlerts.push({ ...alert, status: 'triggered', triggeredAt: Date.now() });
                        }
                    }
                });

                return triggeredAlerts;
            },

            getActiveAlerts: () => {
                return get().alerts.filter((alert) => alert.status === 'active');
            },

            getTriggeredAlerts: () => {
                return get().alerts.filter((alert) => alert.status === 'triggered');
            },

            clearTriggered: () => {
                set((state) => ({
                    alerts: state.alerts.filter((alert) => alert.status !== 'triggered'),
                }));
            },

            updateAlertStatus: (id: string, status: AlertStatus, triggeredAt?: number) => {
                set((state) => ({
                    alerts: state.alerts.map((alert) =>
                        alert.id === id
                            ? { ...alert, status, triggeredAt }
                            : alert
                    ),
                }));
            },
        }),
        {
            name: 'terminal-pro-alerts',
        }
    )
);

// Notification helper
export const showAlertNotification = (alert: PriceAlert) => {
    if ('Notification' in window && Notification.permission === 'granted') {
        const title = alert.symbol + ' Price Alert';
        let body = '';

        switch (alert.type) {
            case 'above':
                body = 'Price is now above $' + alert.targetPrice?.toFixed(2);
                break;
            case 'below':
                body = 'Price is now below $' + alert.targetPrice?.toFixed(2);
                break;
            case 'percent_change':
                body = 'Price changed by ' + alert.percentChange + '%';
                break;
        }

        new Notification(title, {
            body,
            icon: '/favicon.ico',
        });
    }
};

// Request notification permission
export const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
    }
};
