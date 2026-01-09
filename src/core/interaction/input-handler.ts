import { TransformManager } from './transform-manager';

export class InputHandler {
    private element: HTMLElement | null = null;
    private isDragging = false;
    private lastX = 0;
    private lastY = 0;
    public onMove?: (x: number, y: number) => void;

    private transformManager: TransformManager;

    constructor(transformManager: TransformManager) {
        this.transformManager = transformManager;
    }

    public attach(element: HTMLElement) {
        if (this.element) {
            this.detach();
        }
        this.element = element;
        element.addEventListener('mousedown', this.onMouseDown);
        window.addEventListener('mousemove', this.onMouseMove);
        window.addEventListener('mouseup', this.onMouseUp);
        element.addEventListener('wheel', this.onWheel, { passive: false });
    }

    public detach() {
        if (!this.element) return;
        this.element.removeEventListener('mousedown', this.onMouseDown);
        this.element.removeEventListener('wheel', this.onWheel);
        window.removeEventListener('mousemove', this.onMouseMove);
        window.removeEventListener('mouseup', this.onMouseUp);
        this.element = null;
    }

    private onMouseDown = (e: MouseEvent) => {
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    };

    private onMouseMove = (e: MouseEvent) => {
        if (this.element) {
            const rect = this.element.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Emit generic move event for crosshair
            if (this.onMove) {
                this.onMove(x, y);
            }

            if (this.isDragging) {
                const dx = e.clientX - this.lastX;
                const dy = e.clientY - this.lastY;
                this.transformManager.pan(dx, dy);
                this.lastX = e.clientX;
                this.lastY = e.clientY;
            }
        }
    };

    private onMouseUp = () => {
        this.isDragging = false;
    };

    private onWheel = (e: WheelEvent) => {
        e.preventDefault();
        if (!this.element) return;
        const rect = this.element.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Determine zoom direction
        const delta = e.deltaY;

        this.transformManager.zoom(delta, mouseX, mouseY, rect.width, rect.height);
    };
}
