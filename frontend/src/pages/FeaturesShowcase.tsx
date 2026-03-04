import React from 'react';
import { Mic, Target, Satellite, Activity } from 'lucide-react';
import VoiceControl from '../components/VoiceControl';
import CaptureMethodSelector from '../components/CaptureMethodSelector';
import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';

const FeaturesShowcase: React.FC = () => {
    const [debrisSize, setDebrisSize] = React.useState(3.5);
    const [debrisVelocity, setDebrisVelocity] = React.useState(1.2);
    const [isMetallic, setIsMetallic] = React.useState(false);

    const handleVoiceCommand = (command: string, action: string) => {
        console.log('Voice command:', command, 'Action:', action);
        // Handle voice commands - could navigate, fetch data, etc.
    };

    const handleCaptureSelect = (methodId: string) => {
        console.log('Selected capture method:', methodId);
    };

    return (
        <div className="min-h-screen bg-gradient-space p-8">
            {/* Header */}
            <div className="mb-8 animate-fade-in">
                <h1 className="text-5xl font-bold text-gradient-blue mb-2">
                    Advanced Features Showcase
                </h1>
                <p className="text-gray-400 text-lg">
                    Voice Control & Multi-Modal Capture Mechanisms
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <ModernCard variant="glass-ultra" glow glowColor="blue" className="animate-scale-in">
                    <div className="flex items-center gap-4">
                        <div className="p-3 glass-medium rounded-lg">
                            <Mic className="text-blue-400" size={24} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Voice Commands</p>
                            <p className="text-2xl font-bold text-white">7+</p>
                        </div>
                    </div>
                </ModernCard>

                <ModernCard variant="glass-ultra" glow glowColor="purple" className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 glass-medium rounded-lg">
                            <Target className="text-purple-400" size={24} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Capture Methods</p>
                            <p className="text-2xl font-bold text-white">4</p>
                        </div>
                    </div>
                </ModernCard>

                <ModernCard variant="glass-ultra" glow glowColor="green" className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 glass-medium rounded-lg">
                            <Activity className="text-green-400" size={24} />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">Success Rate</p>
                            <p className="text-2xl font-bold text-white">98%</p>
                        </div>
                    </div>
                </ModernCard>
            </div>

            {/* Voice Control Section */}
            <div className="mb-8 animate-slide-in">
                <VoiceControl onCommand={handleVoiceCommand} />
            </div>

            {/* Debris Parameters Control */}
            <ModernCard variant="glass-ultra" className="mb-8 animate-slide-in" style={{ animationDelay: '0.1s' }}>
                <h3 className="text-xl font-bold text-white mb-4">Debris Parameters</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Debris Size (m)</label>
                        <input
                            type="range"
                            min="0.5"
                            max="12"
                            step="0.5"
                            value={debrisSize}
                            onChange={(e) => setDebrisSize(parseFloat(e.target.value))}
                            className="w-full"
                        />
                        <p className="text-white font-semibold mt-1">{debrisSize.toFixed(1)}m</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Relative Velocity (m/s)</label>
                        <input
                            type="range"
                            min="0.1"
                            max="6"
                            step="0.1"
                            value={debrisVelocity}
                            onChange={(e) => setDebrisVelocity(parseFloat(e.target.value))}
                            className="w-full"
                        />
                        <p className="text-white font-semibold mt-1">{debrisVelocity.toFixed(1)}m/s</p>
                    </div>

                    <div>
                        <label className="text-sm text-gray-400 mb-2 block">Material Type</label>
                        <div className="flex gap-4 mt-3">
                            <button
                                onClick={() => setIsMetallic(false)}
                                className={`px-4 py-2 rounded-lg transition-all ${!isMetallic ? 'bg-blue-600 text-white' : 'glass-subtle text-gray-400'
                                    }`}
                            >
                                Non-metallic
                            </button>
                            <button
                                onClick={() => setIsMetallic(true)}
                                className={`px-4 py-2 rounded-lg transition-all ${isMetallic ? 'bg-purple-600 text-white' : 'glass-subtle text-gray-400'
                                    }`}
                            >
                                Metallic
                            </button>
                        </div>
                    </div>
                </div>
            </ModernCard>

            {/* Capture Methods Section */}
            <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
                <CaptureMethodSelector
                    debrisSize={debrisSize}
                    debrisVelocity={debrisVelocity}
                    isMetallic={isMetallic}
                    onSelect={handleCaptureSelect}
                />
            </div>

            {/* Feature Highlights */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                <ModernCard variant="glass-medium" className="animate-fade-in">
                    <h3 className="text-xl font-bold text-white mb-3">🎤 Voice Control Features</h3>
                    <ul className="space-y-2 text-gray-300">
                        <li>• Natural language command processing</li>
                        <li>• 7+ command types supported</li>
                        <li>• Real-time voice feedback</li>
                        <li>• WebSocket integration</li>
                        <li>• Browser-based (Web Speech API)</li>
                    </ul>
                </ModernCard>

                <ModernCard variant="glass-medium" className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <h3 className="text-xl font-bold text-white mb-3">🎯 Capture Mechanisms</h3>
                    <ul className="space-y-2 text-gray-300">
                        <li>• 4 capture methods (Net, Harpoon, Magnetic, Robotic)</li>
                        <li>• Optimal method selection algorithm</li>
                        <li>• Fuel cost calculations</li>
                        <li>• Success rate predictions</li>
                        <li>• Real-time viability checking</li>
                    </ul>
                </ModernCard>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center">
                <p className="text-gray-400">
                    Advanced Features • Orbital Guard AI • Integrated from SpaceGuard AI Analysis
                </p>
            </div>
        </div>
    );
};

export default FeaturesShowcase;
