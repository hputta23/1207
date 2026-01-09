// import type { Viewport } from '../renderer/types';

export interface TransformState {
    x: number;
    y: number;
    scale: number;
}

export class TransformManager {
    private state: TransformState;
    private listeners: Set<(state: TransformState) => void> = new Set();

    // Configuration
    private minScale = 0.1;
    private maxScale = 10.0;

    constructor(initialState: TransformState = { x: 0, y: 0, scale: 1 }) {
        this.state = { ...initialState };
    }

    public getState(): TransformState {
        return { ...this.state };
    }

    public setState(newState: Partial<TransformState>): void {
        this.state = { ...this.state, ...newState };
        this.notifyListeners();
    }

    public subscribe(listener: (state: TransformState) => void): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    private notifyListeners(): void {
        this.listeners.forEach(listener => listener(this.state));
    }

    // --- Interaction Math ---

    public pan(dx: number, dy: number): void {
        // Pan logic: Move the camera.
        // If we want to move the viewport "right", we subtract x.
        // Ideally, dx/dy are delta screen pixels.
        // We need to convert screen delta to world delta if we were working in world coords,
        // but here we are just updating the viewport offset.
        // If Viewport X is "camera position", then dragging mouse right (positive dx)
        // should move camera left (decrement x) to reveal left side, OR move camera right?
        // Dragging content right -> Camera moves left.

        // Let's stick to: Viewport X/Y is the top-left corner of the view in World Space.
        // If I drag mouse right (+dx), I want to see content to the left.
        // So I should move X by -dx / scale ??
        // Or simply: Viewport X/Y is just the offset.

        // Let's assume standard intuitive drag:
        // Drag Right -> Content moves Right -> Viewport (Camera) moves LEFT.
        // So X -= dx

        this.state.x -= dx; // / this.state.scale; // If we want 1-to-1 pixel dragging
        this.state.y -= dy; // / this.state.scale;

        this.notifyListeners();
    }

    public zoom(delta: number, pivotX: number, pivotY: number, _containerWidth: number, _containerHeight: number): void {
        // Zoom logic centered on pivot (screen coordinates)
        const oldScale = this.state.scale;
        const newScale = Math.min(Math.max(oldScale * (1 - delta * 0.001), this.minScale), this.maxScale);

        if (newScale === oldScale) return;

        // Calculate world coordinates of the pivot before zoom
        // WorldX = ScreenX / Scale + ViewportX
        // Wait, calculateView matrix was: Translate(-x, -y) then Scale(s)
        // Screen = (World - Viewport) * Scale
        // World = Screen / Scale + Viewport

        const worldPivotX = pivotX / oldScale + this.state.x;
        const worldPivotY = pivotY / oldScale + this.state.y;

        // Update scale
        this.state.scale = newScale;

        // We want the Pivot point to remain at the same Screen location.
        // NewScreen = (World - NewViewport) * NewScale = PivotScreen
        // World - NewViewport = PivotScreen / NewScale
        // NewViewport = World - PivotScreen / NewScale

        this.state.x = worldPivotX - pivotX / newScale;
        this.state.y = worldPivotY - pivotY / newScale;

        this.notifyListeners();
    }
}
