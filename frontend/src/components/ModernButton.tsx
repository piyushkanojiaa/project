import React from 'react';

interface ModernButtonProps {
    variant?: 'primary' | 'secondary' | 'neu' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}

export const ModernButton: React.FC<ModernButtonProps> = ({
    variant = 'primary',
    size = 'md',
    icon,
    children,
    onClick,
    disabled = false,
    className = ''
}) => {
    const getVariantClass = () => {
        switch (variant) {
            case 'primary':
                return 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl';
            case 'secondary':
                return 'glass-medium border-2 border-blue-500/30 hover:border-blue-500/50 text-white';
            case 'neu':
                return 'neu-raised text-white hover:neu-pressed';
            case 'ghost':
                return 'bg-transparent hover:glass-subtle text-white border border-gray-600 hover:border-gray-400';
            case 'danger':
                return 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-lg hover:shadow-xl';
            default:
                return '';
        }
    };

    const getSizeClass = () => {
        switch (size) {
            case 'sm':
                return 'px-4 py-2 text-sm';
            case 'lg':
                return 'px-8 py-4 text-lg';
            default:
                return 'px-6 py-3 text-base';
        }
    };

    return (
        <button
            className={`
        ${getVariantClass()}
        ${getSizeClass()}
        rounded-lg font-semibold
        transition-all duration-300
        transform hover:scale-105 active:scale-95
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        flex items-center gap-2 justify-center
        ${className}
      `}
            onClick={onClick}
            disabled={disabled}
        >
            {icon && <span className="flex-shrink-0">{icon}</span>}
            {children}
        </button>
    );
};

export default ModernButton;
