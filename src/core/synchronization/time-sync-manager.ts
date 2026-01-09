export interface ViewState {
    // Defines the "Time" window.
    // For now, these map directly to Transform x/scale
    // In the future, this will be timestamp-based.
    centerX: number;
    scale: number;
}

type SyncListener = (state: ViewState, sourceId: string) => void;

export class TimeSyncManager {
    private listeners = new Set<SyncListener>();
    private state: ViewState = { centerX: 0, scale: 1 };
    private isUpdating = false;

    public subscribe(listener: SyncListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    public update(newState: Partial<ViewState>, sourceId: string): void {
        if (this.isUpdating) return;

        this.isUpdating = true;
        this.state = { ...this.state, ...newState };

        this.listeners.forEach(listener => listener(this.state, sourceId));
        this.isUpdating = false;
    }

    public getState(): ViewState {
        return { ...this.state };
    }
}
