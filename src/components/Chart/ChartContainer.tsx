import React, { useEffect, useRef, useState } from 'react';
import { DeterministicRenderer } from '../../core/renderer/deterministic-renderer';
import { TransformManager } from '../../core/interaction/transform-manager';
import { InputHandler } from '../../core/interaction/input-handler';
import { CrosshairManager, type CrosshairState } from '../../core/interaction/crosshair-manager';
import { ChartOverlay } from '../Overlay/ChartOverlay';
import type { RenderState, Theme } from '../../core/renderer/types';
import { TimeSyncManager } from '../../core/synchronization/time-sync-manager';

import { CanvasCandlestickRenderer } from '../../core/renderers/canvas-candlestick-renderer';

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
    const rendererRef = useRef<DeterministicRenderer | CanvasCandlestickRenderer | null>(null);
    const transformManagerRef = useRef<TransformManager | null>(null);
    const inputHandlerRef = useRef<InputHandler | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // UI State
    const [crosshair, setCrosshair] = useState<CrosshairState | null>(null);
    const [renderError, setRenderError] = useState<string | null>(null);
    const [isFallback, setIsFallback] = useState(false);

    // Initialize Engine
    useEffect(() => {
        if (!canvasRef.current) return;

        // 1. Renderer Initialization (WebGL -> 2D Fallback)
        try {
            rendererRef.current = new DeterministicRenderer(canvasRef.current);
            setRenderError(null);
            setIsFallback(false);
            console.log(`[Chart ${id}] WebGL renderer initialized successfully.`);
        } catch (e) {
            console.warn(`[Chart ${id}] WebGL renderer failed, attempting 2D fallback:`, e);

            // Fallback to 2D Renderer
            try {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) {
                    rendererRef.current = new CanvasCandlestickRenderer(ctx);
                    setIsFallback(true);
                    setRenderError(null); // Clear error since we have a fallback
                    console.log(`[Chart ${id}] 2D renderer initialized as fallback.`);
                } else {
                    throw new Error('Could not get 2D context');
                }
            } catch (fallbackError) {
                const errorMsg = fallbackError instanceof Error ? fallbackError.message : 'Unknown Renderer error';
                console.error(`[Chart ${id}] Both WebGL and 2D renderers failed:`, fallbackError);
                setRenderError(errorMsg);
                return; // Stop initialization
            }
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
                    if (transformManagerRef.current) {
                        transformManagerRef.current.setState({
                            x: syncState.centerX,
                            scale: syncState.scale
                        });
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
    }, [syncManager]); // Re-init if syncManager changes

    // Handle Resizing & Data
    useEffect(() => {
        // Re-bind input handler if needed (simplified for this update)
        if (inputHandlerRef.current && transformManagerRef.current) {
            inputHandlerRef.current.onMove = (mouseX, mouseY) => {
                const viewport = {
                    x: transformManagerRef.current!.getState().x,
                    y: transformManagerRef.current!.getState().y,
                    width,
                    height,
                    scale: transformManagerRef.current!.getState().scale
                };
                const state = CrosshairManager.calculate(mouseX, mouseY, viewport, data, width, height);
                setCrosshair(state);
            };
        }

        if (canvasRef.current && rendererRef.current) {
            // Resize canvas (important for 2D context to prevent blur/stretch)
            // But DeterministicRenderer (WebGL) typically handles viewport in render()
            // CanvasCandlestickRenderer relies on canvas dimensions.
            canvasRef.current.width = width;
            canvasRef.current.height = height;
            renderFrame();
        }
    }, [width, height, theme, data]);

    const renderFrame = () => {
        if (!rendererRef.current || !canvasRef.current || !transformManagerRef.current) return;

        try {
            const currentTransform = transformManagerRef.current.getState();

            // Construct state (shared interface might need adjustment if Renderers diverge)
            // DeterministicRenderer expects RenderState.
            // CanvasCandlestickRenderer expects (candles, viewport, bounds).
            // We need to branch logic based on isFallback.

            const viewport = {
                x: currentTransform.x,
                y: currentTransform.y,
                width: width,
                height: height,
                scale: currentTransform.scale
            };

            if (isFallback) {
                // 2D Rendering
                const renderer = rendererRef.current as CanvasCandlestickRenderer;
                const _renderer = rendererRef.current as any; // Type assertion helper

                // Manually clear for 2D
                if (_renderer.ctx) {
                    const ctx = _renderer.ctx as CanvasRenderingContext2D;
                    ctx.fillStyle = theme.background;
                    ctx.fillRect(0, 0, width, height);
                }

                // Calculate View-adjusted subset of candles? 
                // The 2D renderer 'render' method takes ALL candles and does its own mapping?
                // Let's check CanvasCandlestickRenderer signature: render(candles, viewport, bounds)

                const bounds = (renderer as any).calculateBounds ? (renderer as any).calculateBounds(data) : { minPrice: 0, maxPrice: 100 };

                renderer.render(data, viewport, bounds);

            } else {
                // WebGL Rendering
                const state: RenderState = {
                    viewport,
                    data: {
                        candles: data,
                        indicators: indicatorData,
                        indicatorList: indicatorData?.indicatorList,
                        minPrice: 0,
                        maxPrice: 2000,
                        minTime: 0,
                        maxTime: 50
                    },
                    theme: theme,
                    timestamp: Date.now()
                };
                (rendererRef.current as DeterministicRenderer).render(state);
            }

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
            {renderError ? (
                /* Error Fallback UI */
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    height: '100%', padding: '40px', textAlign: 'center', color: '#888',
                }}>
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '16px', opacity: 0.5 }}>
                        <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 600, color: '#aaa' }}>
                        Chart Unavailable
                    </h3>
                    <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, maxWidth: '400px' }}>{renderError}</p>
                </div>
            ) : (
                <>
                    <canvas ref={canvasRef} style={{ display: 'block' }} />
                    <ChartOverlay width={width} height={height} crosshair={crosshair} />
                    {isFallback && (
                        <div style={{
                            position: 'absolute', bottom: '8px', right: '8px',
                            fontSize: '10px', color: '#666', pointerEvents: 'none'
                        }}>
                            2D Rendering Mode
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
