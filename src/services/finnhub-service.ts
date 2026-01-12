type FinnhubCallback = (data: any) => void;

class FinnhubService {
    private socket: WebSocket | null = null;
    private apiKey: string | null = null;
    private subscriptions: Set<string> = new Set();
    private callbacks: Set<FinnhubCallback> = new Set();
    private isConnected: boolean = false;
    private reconnectTimer: any = null;

    constructor() {
        // Try to load API key from storage
        this.apiKey = localStorage.getItem('finnhub_api_key');
    }

    setApiKey(key: string) {
        this.apiKey = key;
        localStorage.setItem('finnhub_api_key', key);
        this.reconnect();
    }

    getApiKey(): string | null {
        return this.apiKey;
    }

    connect() {
        if (!this.apiKey || this.isConnected) return;

        try {
            this.socket = new WebSocket(`wss://ws.finnhub.io?token=${this.apiKey}`);

            this.socket.onopen = () => {
                console.log('Finnhub WS Connected');
                this.isConnected = true;
                this.resubscribeAll();
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'trade') {
                        this.notifySubscribers(data.data);
                    }
                } catch (e) {
                    console.error('Error parsing Finnhub WS message', e);
                }
            };

            this.socket.onclose = () => {
                console.log('Finnhub WS Disconnected');
                this.isConnected = false;
                this.socket = null;
                // Auto reconnect after 5s
                if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
                this.reconnectTimer = setTimeout(() => this.connect(), 5000);
            };

            this.socket.onerror = (error) => {
                console.error('Finnhub WS Error', error);
            };

        } catch (e) {
            console.error('Failed to create WebSocket', e);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.isConnected = false;
    }

    reconnect() {
        this.disconnect();
        this.connect();
    }

    subscribe(symbol: string) {
        this.subscriptions.add(symbol);
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ 'type': 'subscribe', 'symbol': symbol }));
        } else if (!this.isConnected) {
            this.connect();
        }
    }

    unsubscribe(symbol: string) {
        this.subscriptions.delete(symbol);
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ 'type': 'unsubscribe', 'symbol': symbol }));
        }
    }

    private resubscribeAll() {
        this.subscriptions.forEach(symbol => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({ 'type': 'subscribe', 'symbol': symbol }));
            }
        });
    }

    onMessage(callback: FinnhubCallback) {
        this.callbacks.add(callback);
        return () => this.callbacks.delete(callback);
    }

    private notifySubscribers(data: any) {
        this.callbacks.forEach(cb => cb(data));
    }
}

export const finnhubService = new FinnhubService();
