import React, { useEffect, useRef, useState } from 'react';
import { DeterministicRenderer } from '../../core/renderer/deterministic-renderer';
import { TransformManager } from '../../core/interaction/transform-manager';
import { InputHandler } from '../../core/interaction/input-handler';
import { CrosshairManager, type CrosshairState } from '../../core/interaction/crosshair-manager';
import { ChartOverlay } from '../Overlay/ChartOverlay';
import type { RenderState, Theme } from '../../core/renderer/types';
import { TimeSyncManager } from '../../core/synchronization/time-sync-manager';

interface IndicatorDataItem {
    id: string;
    name: string;
    color: string;
    points: any[];
}

interface ChartContainerProps {
    id: string; // Unique chart ID
    width: number;
    height: number;
    theme: Theme;
    initialTransform?: { x: number; y: number; scale: number };
    syncManager?: TimeSyncManager; // Optional sync manager
    data: any[]; // Changed to accept data prop
    indicatorData?: {
        sma?: any[];
        ema?: any[];
        indicatorList?: IndicatorDataItem[];
    };
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
    id,
    width,
    height,
    theme,
    initialTransform = { x: 0, y: 0, scale: 1 },
    syncManager,
    data,
    indicatorData
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rendererRef = useRef<DeterministicRenderer | null>(null);
    const transformManagerRef = useRef<TransformManager | null>(null);
    const inputHandlerRef = useRef<InputHandler | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // UI State for Overlay
    const [crosshair, setCrosshair] = useState<CrosshairState | null>(null);

    // Initialize Engine
    useEffect(() => {
        if (!canvasRef.current) return;

        // 1. Renderer (might fail if WebGL not supported)
        try {
            rendererRef.current = new DeterministicRenderer(canvasRef.current);
        } catch (e) {
            console.error(`Chart ${id} - Renderer failed to initialize (WebGL error likely):`, e);
        }

        let unsubscribeLocal: (() => void) | undefined;
        let unsubscribeSync: (() => void) | undefined;

        try {
            // 2. Transform (Interaction)
            transformManagerRef.current = new TransformManager(initialTransform);

            // 3. Input
            inputHandlerRef.current = new InputHandler(transformManagerRef.current);
            inputHandlerRef.current.attach(canvasRef.current);

            // Handle Hover for Crosshair
            inputHandlerRef.current.onMove = (mouseX, mouseY) => {
                if (!transformManagerRef.current) return;

                const viewport = {
                    x: transformManagerRef.current.getState().x,
                    y: transformManagerRef.current.getState().y,
                    width,
                    height,
                    scale: transformManagerRef.current.getState().scale
                };

                const state = CrosshairManager.calculate(
                    mouseX,
                    mouseY,
                    viewport,
                    data,
                    width,
                    height
                );

                setCrosshair(state);
            };

            // 4. Subscribe to Local Transform Changes
            unsubscribeLocal = transformManagerRef.current.subscribe((state) => {
                // Broadcast to Sync Manager if exists
                if (syncManager) {
                    syncManager.update({
                        centerX: state.x,
                        scale: state.scale
                    }, id);
                }
                renderFrame();
            });

            // 5. Subscribe to Sync Manager (Incoming Changes)
            if (syncManager) {
                unsubscribeSync = syncManager.subscribe((syncState, sourceId) => {
                    if (sourceId === id) return; // Ignore own updates

                    // Apply sync state to local transform
                    // NOTE: We assume 'centerX' maps directly to 'x' for now.
                    if (transformManagerRef.current) {
                        transformManagerRef.current.setState({
                            x: syncState.centerX,
                            scale: syncState.scale
                        });
                        // Render is triggered by the local subscribe above,
                        // or we can force it here if setState doesn't emit when value is same?
                        // Our TransformManager emits on setState.
                    }
                });
            }

            renderFrame();

        } catch (e) {
            console.error(`Chart ${id} failed to initialize interaction:`, e);
        }

        return () => {
            if (unsubscribeLocal) unsubscribeLocal();
            if (unsubscribeSync) unsubscribeSync();
            inputHandlerRef.current?.detach();
        };
    }, [syncManager]); // Re-init if syncManager changes (unlikely)

    // Handle Resizing, Props Updates, & DATA
    useEffect(() => {
        // Update crosshair data calculation if data changes while hovering?
        // Ideally we refetch the crosshair state, but onMove handles it for now.
        // We do need to update the binding if 'data' prop reference changes in the generic closure?
        // Actually, the onMove closure 'data' is stale if not updated.
        // Simpler fix: Use a ref for data or re-bind inputHandler.onMove.
        // For this demo, let's just re-bind.

        if (inputHandlerRef.current) {
            inputHandlerRef.current.onMove = (mouseX, mouseY) => {
                if (!transformManagerRef.current) return;
                const viewport = {
                    x: transformManagerRef.current.getState().x,
                    y: transformManagerRef.current.getState().y,
                    width,
                    height,
                    scale: transformManagerRef.current.getState().scale
                };
                const state = CrosshairManager.calculate(mouseX, mouseY, viewport, data, width, height);
                setCrosshair(state);
            };
        }

        if (canvasRef.current && rendererRef.current) {
            canvasRef.current.width = width;
            canvasRef.current.height = height;
            // Trigger render when data changes
            renderFrame();
        }
    }, [width, height, theme, data]);

    const renderFrame = () => {
        if (!rendererRef.current || !canvasRef.current || !transformManagerRef.current) return;

        try {
            const currentTransform = transformManagerRef.current.getState();

            const state: RenderState = {
                viewport: {
                    x: currentTransform.x,
                    y: currentTransform.y,
                    width: width,
                    height: height,
                    scale: currentTransform.scale
                },
                data: {
                    candles: data, // Use data from props
                    indicators: indicatorData, // Legacy format
                    indicatorList: indicatorData?.indicatorList, // New dynamic format
                    minPrice: 0, // Auto-calculated by renderer
                    maxPrice: 2000,
                    minTime: 0,
                    maxTime: 50
                },
                theme: theme,
                timestamp: Date.now()
            };

            rendererRef.current.render(state);
        } catch (e) {
            console.error('Render frame failed:', e);
        }
    };

    return (
        <div
            ref={containerRef}
            style={{
                width,
                height,
                position: 'relative',
                overflow: 'hidden',
                background: theme.background,
                cursor: 'crosshair'
            }}
            onMouseLeave={() => setCrosshair(null)}
        >
            <canvas
                ref={canvasRef}
                style={{ display: 'block' }}
            />
            {/* Overlay Layer */}
            <ChartOverlay width={width} height={height} crosshair={crosshair} />
        </div>
    );
};
