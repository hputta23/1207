import { useState, useEffect, useRef } from 'react';

export interface Dimensions {
    width: number;
    height: number;
}

export function useDimensions<T extends HTMLElement>() {
    const ref = useRef<T>(null);
    const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });

    useEffect(() => {
        if (!ref.current) return;

        const observer = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const { width, height } = entry.contentRect;
                setDimensions({ width, height });
            }
        });

        observer.observe(ref.current);

        return () => observer.disconnect();
    }, []);

    return { ref, dimensions };
}
