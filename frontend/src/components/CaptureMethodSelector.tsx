import React, { useState } from 'react';
import { Target, Magnet, Anchor, Hand, Info, Zap, Clock, TrendingUp } from 'lucide-react';
import ModernCard from './ModernCard';

interface CaptureMethod {
    id: string;
    name: string;
    icon: React.ReactNode;
    maxSize: number;
    maxVelocity: number;
    successRate: number;
    fuelMultiplier: number;
    deploymentTime: number;
    description: string;
    requiresMetallic: boolean;
}

const CAPTURE_METHODS: CaptureMethod[] = [
    {
        id: 'net',
        name: 'Net Capture',
        icon: <Target size={24} />,
        maxSize: 5.0,
        maxVelocity: 2.0,
        successRate: 85,
        fuelMultiplier: 1.2,
        deploymentTime: 30,
        description: 'Expandable net to ensnare debris. Best for medium-sized objects with moderate velocity.',
        requiresMetallic: false
    },
    {
        id: 'harpoon',
        name: 'Harpoon Capture',
        icon: <Anchor size={24} />,
        maxSize: 10.0,
        maxVelocity: 5.0,
        successRate: 75,
        fuelMultiplier: 1.5,
        deploymentTime: 10,
        description: 'Penetrating harpoon to secure debris. Effective for large, fast-moving objects.',
        requiresMetallic: false
    },
    {
        id: 'magnetic',
        name: 'Magnetic Capture',
        icon: <Magnet size={24} />,
        maxSize: 3.0,
        maxVelocity: 1.0,
        successRate: 95,
        fuelMultiplier: 1.0,
        deploymentTime: 60,
        description: 'Electromagnetic field for metallic debris. Highest success rate but requires metal.',
        requiresMetallic: true
    },
    {
        id: 'robotic',
        name: 'Robotic Arm',
        icon: <Hand size={24} />,
        maxSize: 2.0,
        maxVelocity: 0.5,
        successRate: 98,
        fuelMultiplier: 1.1,
        deploymentTime: 120,
        description: 'Precise robotic arm for controlled capture. Best for small, slow-moving debris.',
        requiresMetallic: false
    }
];

interface CaptureMethodSelectorProps {
    debrisSize?: number;
    debrisVelocity?: number;
    isMetallic?: boolean;
    onSelect?: (methodId: string) => void;
}

export const CaptureMethodSelector: React.FC<CaptureMethodSelectorProps> = ({
    debrisSize = 0,
    debrisVelocity = 0,
    isMetallic = false,
    onSelect
}) => {
    const [selected, setSelected] = useState<string | null>(null);
    const [showDetails, setShowDetails] = useState(false);

    const handleSelect = (methodId: string) => {
        setSelected(methodId);
        if (onSelect) {
            onSelect(methodId);
        }
    };

    const isMethodViable = (method: CaptureMethod): boolean => {
        if (debrisSize === 0 && debrisVelocity === 0) return true;

        const sizeOk = debrisSize <= method.maxSize;
        const velocityOk = debrisVelocity <= method.maxVelocity;
        const metallicOk = !method.requiresMetallic || isMetallic;

        return sizeOk && velocityOk && metallicOk;
    };

    const getOptimalMethod = (): CaptureMethod | null => {
        if (debrisSize === 0 && debrisVelocity === 0) return null;

        const viable = CAPTURE_METHODS.filter(isMethodViable);
        if (viable.length === 0) return null;

        // Score based on success rate / fuel multiplier
        return viable.reduce((best, current) => {
            const currentScore = current.successRate / current.fuelMultiplier;
            const bestScore = best.successRate / best.fuelMultiplier;
            return currentScore > bestScore ? current : best;
        });
    };

    const optimal = getOptimalMethod();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Capture Mechanisms</h3>
                    <p className="text-gray-400 text-sm">Select optimal debris capture method</p>
                </div>
                <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="glass-subtle px-4 py-2 rounded-lg text-sm text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-2"
                >
                    <Info size={16} />
                    {showDetails ? 'Hide' : 'Show'} Details
                </button>
            </div>

            {/* Debris Parameters (if provided) */}
            {(debrisSize > 0 || debrisVelocity > 0) && (
                <ModernCard variant="glass-subtle" className="animate-fade-in">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Debris Size</p>
                            <p className="text-white font-semibold">{debrisSize.toFixed(1)}m</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Relative Velocity</p>
                            <p className="text-white font-semibold">{debrisVelocity.toFixed(1)}m/s</p>
                        </div>
                        <div>
                            <p className="text-gray-400 text-xs mb-1">Material</p>
                            <p className="text-white font-semibold">{isMetallic ? 'Metallic' : 'Non-metallic'}</p>
                        </div>
                    </div>
                    {optimal && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50">
                            <p className="text-sm text-green-400 flex items-center gap-2">
                                <Zap size={14} />
                                Optimal: <span className="font-semibold">{optimal.name}</span>
                            </p>
                        </div>
                    )}
                </ModernCard>
            )}

            {/* Capture Methods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {CAPTURE_METHODS.map((method) => {
                    const viable = isMethodViable(method);
                    const isOptimal = optimal?.id === method.id;

                    return (
                        <ModernCard
                            key={method.id}
                            variant={
                                isOptimal ? 'glass-border' :
                                    selected === method.id ? 'glass-ultra' :
                                        'glass-medium'
                            }
                            glow={isOptimal || selected === method.id}
                            glowColor={isOptimal ? 'green' : 'blue'}
                            onClick={() => viable && handleSelect(method.id)}
                            className={`
                ${viable ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}
                ${isOptimal ? 'border-green-500/50' : ''}
              `}
                        >
                            <div className="space-y-4">
                                {/* Header */}
                                <div className="flex items-start gap-4">
                                    <div className={`
                    p-3 rounded-lg
                    ${viable ? 'glass-subtle' : 'bg-gray-800'}
                    ${isOptimal ? 'text-green-400' : 'text-blue-400'}
                  `}>
                                        {method.icon}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-semibold text-white">{method.name}</h4>
                                            {isOptimal && (
                                                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                                                    Optimal
                                                </span>
                                            )}
                                            {!viable && (
                                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                                                    Not Viable
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-400">{method.description}</p>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="glass-subtle p-3 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Target size={14} className="text-gray-400" />
                                            <span className="text-xs text-gray-400">Max Size</span>
                                        </div>
                                        <p className="text-white font-semibold">{method.maxSize}m</p>
                                    </div>

                                    <div className="glass-subtle p-3 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Zap size={14} className="text-gray-400" />
                                            <span className="text-xs text-gray-400">Max Velocity</span>
                                        </div>
                                        <p className="text-white font-semibold">{method.maxVelocity}m/s</p>
                                    </div>

                                    <div className="glass-subtle p-3 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <TrendingUp size={14} className="text-gray-400" />
                                            <span className="text-xs text-gray-400">Success Rate</span>
                                        </div>
                                        <p className="text-green-400 font-semibold">{method.successRate}%</p>
                                    </div>

                                    <div className="glass-subtle p-3 rounded-lg">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Clock size={14} className="text-gray-400" />
                                            <span className="text-xs text-gray-400">Deploy Time</span>
                                        </div>
                                        <p className="text-white font-semibold">{method.deploymentTime}s</p>
                                    </div>
                                </div>

                                {/* Additional Details */}
                                {showDetails && (
                                    <div className="pt-3 border-t border-gray-700/50 space-y-2 animate-fade-in">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-400">Fuel Multiplier:</span>
                                            <span className="text-amber-400 font-semibold">{method.fuelMultiplier}x</span>
                                        </div>
                                        {method.requiresMetallic && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Magnet size={14} className="text-purple-400" />
                                                <span className="text-purple-400">Requires metallic debris</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </ModernCard>
                    );
                })}
            </div>

            {/* No Viable Methods Warning */}
            {debrisSize > 0 && !optimal && (
                <ModernCard variant="glass-medium" className="border-2 border-red-500/30 animate-scale-in">
                    <div className="flex items-start gap-3">
                        <Info className="text-red-400 flex-shrink-0 mt-1" size={20} />
                        <div>
                            <p className="text-white font-semibold mb-1">No Viable Capture Method</p>
                            <p className="text-gray-400 text-sm mb-2">
                                Debris parameters exceed all method capabilities.
                            </p>
                            <div className="space-y-1 text-sm">
                                {debrisSize > 10 && (
                                    <p className="text-amber-400">• Consider breaking debris into smaller pieces first</p>
                                )}
                                {debrisVelocity > 5 && (
                                    <p className="text-amber-400">• Perform velocity matching maneuver before capture</p>
                                )}
                            </div>
                        </div>
                    </div>
                </ModernCard>
            )}
        </div>
    );
};

export default CaptureMethodSelector;
