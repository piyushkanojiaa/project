import React, { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

interface AnimatedCounterProps {
    from?: number;
    to: number;
    duration?: number;
    suffix?: string;
    prefix?: string;
    className?: string;
    decimals?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
    from = 0,
    to,
    duration = 2000,
    suffix = '',
    prefix = '',
    className = '',
    decimals = 0,
}) => {
    const [count, setCount] = useState(from);
    const [isVisible, setIsVisible] = useState(false);
    const elementRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !isVisible) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (elementRef.current) {
            observer.observe(elementRef.current);
        }

        return () => {
            if (elementRef.current) {
                observer.unobserve(elementRef.current);
            }
        };
    }, [isVisible]);

    useEffect(() => {
        if (!isVisible) return;

        const startTime = Date.now();
        const difference = to - from;

        const animate = () => {
            const currentTime = Date.now();
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing function (easeOutCubic)
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentCount = from + difference * easedProgress;

            setCount(currentCount);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(to);
            }
        };

        requestAnimationFrame(animate);
    }, [isVisible, from, to, duration]);

    return (
        <div ref={elementRef} className={cn('font-bold', className)}>
            {prefix}
            {count.toFixed(decimals)}
            {suffix}
        </div>
    );
};

export default AnimatedCounter;
