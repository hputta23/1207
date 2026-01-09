import React, { useState, useRef } from 'react';

interface SimpleSplitPaneProps {
    orientation?: 'horizontal' | 'vertical'; // vertical = stacked (top/bottom)
    initialRatio?: number;
    children: [React.ReactNode, React.ReactNode];
}

export const SimpleSplitPane: React.FC<SimpleSplitPaneProps> = ({
    orientation = 'vertical',
    initialRatio = 0.5,
    children
}) => {
    const [ratio, setRatio] = useState(initialRatio);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = orientation === 'vertical' ? 'row-resize' : 'col-resize';
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        let newRatio = 0.5;

        if (orientation === 'vertical') {
            const relativeY = e.clientY - rect.top;
            newRatio = Math.max(0.1, Math.min(0.9, relativeY / rect.height));
        } else {
            const relativeX = e.clientX - rect.left;
            newRatio = Math.max(0.1, Math.min(0.9, relativeX / rect.width));
        }

        setRatio(newRatio);
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
    };

    const styleA: React.CSSProperties = orientation === 'vertical'
        ? { height: `${ratio * 100}%`, width: '100%' }
        : { width: `${ratio * 100}%`, height: '100%' };

    const styleB: React.CSSProperties = orientation === 'vertical'
        ? { height: `${(1 - ratio) * 100}%`, width: '100%' }
        : { width: `${(1 - ratio) * 100}%`, height: '100%' };

    const resizerStyle: React.CSSProperties = {
        position: 'absolute',
        zIndex: 10,
        backgroundColor: '#444',
        ...(orientation === 'vertical'
            ? {
                top: `${ratio * 100}%`,
                left: 0,
                width: '100%',
                height: '4px',
                cursor: 'row-resize',
                transform: 'translateY(-2px)'
            }
            : {
                left: `${ratio * 100}%`,
                top: 0,
                width: '4px',
                height: '100%',
                cursor: 'col-resize',
                transform: 'translateX(-2px)'
            }
        )
    };

    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: orientation === 'vertical' ? 'column' : 'row' }}>
            <div style={{ ...styleA, overflow: 'hidden' }}>
                {children[0]}
            </div>

            <div
                style={resizerStyle}
                onMouseDown={handleMouseDown}
            />

            <div style={{ ...styleB, overflow: 'hidden' }}>
                {children[1]}
            </div>
        </div>
    );
};
