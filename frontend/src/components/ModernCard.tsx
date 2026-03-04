import React from 'react';

interface ModernCardProps {
    variant?: 'glass' | 'glass-ultra' | 'glass-medium' | 'glass-subtle' | 'glass-border' | 'neu' | 'gradient';
    glow?: boolean;
    glowColor?: 'blue' | 'purple' | 'pink' | 'cyan' | 'amber' | 'green';
    className?: string;
    children: React.ReactNode;
    onClick?: () => void;
    style?: React.CSSProperties;
}

export const ModernCard: React.FC<ModernCardProps> = ({
    variant = 'glass',
    glow = false,
    glowColor = 'blue',
    className = '',
    children,
    onClick,
    style
}) => {
    const getVariantClass = () => {
        switch (variant) {
            case 'glass-ultra':
                return 'glass-ultra';
            case 'glass-medium':
                return 'glass-medium';
            case 'glass-subtle':
                return 'glass-subtle';
            case 'glass-border':
                return 'glass-border';
            case 'neu':
                return 'neu-raised';
            case 'gradient':
                return 'gradient-cosmic';
            default:
                return 'glass-medium';
        }
    };

    const getGlowClass = () => {
        if (!glow) return '';
        return `glow-${glowColor}`;
    };

    return (
        <div
            className={`
        ${getVariantClass()}
        ${getGlowClass()}
        rounded-xl p-6
        transition-all duration-300
        hover:scale-[1.02]
        cursor-${onClick ? 'pointer' : 'default'}
        ${className}
      `}
            onClick={onClick}
            style={style}
        >
            {children}
        </div>
    );
};

export default ModernCard;
