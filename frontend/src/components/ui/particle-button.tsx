import React, { useRef, useState } from 'react';
import { cn } from '../../lib/utils';

interface ParticleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    className?: string;
    particleColor?: string;
}

export const ParticleButton: React.FC<ParticleButtonProps> = ({
    children,
    className,
    particleColor = '#3b82f6',
    ...props
}) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);

    const createParticles = (e: React.MouseEvent<HTMLButtonElement>) => {
        const button = buttonRef.current;
        if (!button) return;

        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const newParticles = Array.from({ length: 6 }, (_, i) => ({
            id: Date.now() + i,
            x,
            y,
        }));

        setParticles((prev) => [...prev, ...newParticles]);

        setTimeout(() => {
            setParticles((prev) => prev.filter((p) => !newParticles.some((np) => np.id === p.id)));
        }, 1000);
    };

    return (
        <button
            ref={buttonRef}
            onClick={(e) => {
                createParticles(e);
                props.onClick?.(e);
            }}
            className={cn(
                'relative overflow-hidden px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-xl font-bold text-lg transition-all shadow-2xl shadow-blue-500/50 hover:shadow-purple-500/50 hover:scale-105 text-white',
                className
            )}
            {...props}
        >
            {particles.map((particle) => (
                <span
                    key={particle.id}
                    className="absolute pointer-events-none"
                    style={{
                        left: particle.x,
                        top: particle.y,
                        width: '6px',
                        height: '6px',
                        background: particleColor,
                        borderRadius: '50%',
                        animation: `particle-burst 1s ease-out forwards`,
                        transform: 'translate(-50%, -50%)',
                    }}
                />
            ))}
            {children}
        </button>
    );
};

export default ParticleButton;
