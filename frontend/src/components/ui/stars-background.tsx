import React, { useEffect, useRef } from 'react';

interface StarsBackgroundProps {
    starDensity?: number;
    allStarsTwinkle?: boolean;
    twinkleProbability?: number;
    minTwinkleSpeed?: number;
    maxTwinkleSpeed?: number;
    className?: string;
}

export const StarsBackground: React.FC<StarsBackgroundProps> = ({
    starDensity = 0.00015,
    allStarsTwinkle = true,
    twinkleProbability = 0.7,
    minTwinkleSpeed = 0.5,
    maxTwinkleSpeed = 1,
    className = '',
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let stars: Array<{
            x: number;
            y: number;
            radius: number;
            opacity: number;
            twinkleSpeed: number | null;
        }> = [];

        const resizeCanvas = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const createStars = () => {
            const starCount = Math.floor(canvas.width * canvas.height * starDensity);
            stars = [];

            for (let i = 0; i < starCount; i++) {
                stars.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 1.5,
                    opacity: Math.random(),
                    twinkleSpeed:
                        allStarsTwinkle || Math.random() < twinkleProbability
                            ? minTwinkleSpeed + Math.random() * (maxTwinkleSpeed - minTwinkleSpeed)
                            : null,
                });
            }
        };

        const drawStars = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            stars.forEach((star) => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.fill();

                if (star.twinkleSpeed !== null) {
                    star.opacity += star.twinkleSpeed * 0.01;
                    if (star.opacity > 1 || star.opacity < 0) {
                        star.twinkleSpeed *= -1;
                    }
                    star.opacity = Math.max(0, Math.min(1, star.opacity));
                }
            });

            animationFrameId = requestAnimationFrame(drawStars);
        };

        resizeCanvas();
        createStars();
        drawStars();

        const handleResize = () => {
            resizeCanvas();
            createStars();
        };

        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, [starDensity, allStarsTwinkle, twinkleProbability, minTwinkleSpeed, maxTwinkleSpeed]);

    return (
        <canvas
            ref={canvasRef}
            className={`fixed inset-0 z-0 ${className}`}
            style={{ pointerEvents: 'none' }}
        />
    );
};

export default StarsBackground;
