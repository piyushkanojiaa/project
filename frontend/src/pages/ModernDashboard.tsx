import React from 'react';
import { Rocket, Satellite, AlertTriangle, TrendingUp, Activity, Zap } from 'lucide-react';
import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';

const ModernDashboard: React.FC = () => {
    return (
        <div className="min-h-screen bg-gradient-space p-8">
            {/* Header */}
            <div className="mb-8 animate-fade-in">
                <h1 className="text-5xl font-bold text-gradient-blue mb-2">
                    Modern Design System
                </h1>
                <p className="text-gray-400 text-lg">
                    Showcase of glassmorphism, neumorphism, and modern UI patterns
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Stat Card 1 - Glass Ultra */}
                <ModernCard variant="glass-ultra" glow glowColor="blue" className="animate-scale-in">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Active Satellites</p>
                            <p className="text-3xl font-bold text-white">23,755</p>
                            <p className="text-green-400 text-sm mt-1 flex items-center gap-1">
                                <TrendingUp size={14} />
                                +12.5%
                            </p>
                        </div>
                        <div className="p-3 glass-medium rounded-lg">
                            <Satellite className="text-blue-400" size={24} />
                        </div>
                    </div>
                </ModernCard>

                {/* Stat Card 2 - Neumorphic */}
                <ModernCard variant="neu" className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm mb-1">Conjunctions</p>
                            <p className="text-3xl font-bold text-white">1,247</p>
                            <p className="text-amber-400 text-sm mt-1 flex items-center gap-1">
                                <Activity size={14} />
                                Monitoring
                            </p>
                        </div>
                        <div className="p-3 neu-pressed rounded-lg">
                            <AlertTriangle className="text-amber-400" size={24} />
                        </div>
                    </div>
                </ModernCard>

                {/* Stat Card 3 - Gradient */}
                <ModernCard variant="gradient" className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm mb-1">Critical Alerts</p>
                            <p className="text-3xl font-bold text-white">42</p>
                            <p className="text-white/70 text-sm mt-1 flex items-center gap-1">
                                <Zap size={14} />
                                High Priority
                            </p>
                        </div>
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Rocket className="text-white" size={24} />
                        </div>
                    </div>
                </ModernCard>

                {/* Stat Card 4 - Glass Subtle */}
                <ModernCard variant="glass-subtle" glow glowColor="purple" className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm mb-1">System Status</p>
                            <p className="text-3xl font-bold text-white">99.9%</p>
                            <p className="text-green-400 text-sm mt-1">Operational</p>
                        </div>
                        <div className="p-3 glass-medium rounded-lg animate-pulse-glow">
                            <Activity className="text-green-400" size={24} />
                        </div>
                    </div>
                </ModernCard>
            </div>

            {/* Component Showcase */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Glassmorphism Variants */}
                <ModernCard variant="glass-ultra" className="animate-slide-in">
                    <h2 className="text-2xl font-bold text-white mb-4">Glassmorphism Variants</h2>
                    <div className="space-y-4">
                        <div className="glass-ultra p-4 rounded-lg">
                            <p className="text-white font-semibold">Ultra Glass</p>
                            <p className="text-gray-400 text-sm">Maximum blur with high saturation</p>
                        </div>
                        <div className="glass-medium p-4 rounded-lg">
                            <p className="text-white font-semibold">Medium Glass</p>
                            <p className="text-gray-400 text-sm">Balanced blur for general use</p>
                        </div>
                        <div className="glass-subtle p-4 rounded-lg">
                            <p className="text-white font-semibold">Subtle Glass</p>
                            <p className="text-gray-400 text-sm">Minimal blur for subtle effects</p>
                        </div>
                        <div className="glass-border p-4 rounded-lg">
                            <p className="text-white font-semibold">Glass Border</p>
                            <p className="text-gray-400 text-sm">Prominent border with glow</p>
                        </div>
                    </div>
                </ModernCard>

                {/* Neumorphism Variants */}
                <ModernCard variant="glass-ultra" className="animate-slide-in" style={{ animationDelay: '0.1s' }}>
                    <h2 className="text-2xl font-bold text-white mb-4">Neumorphism Variants</h2>
                    <div className="space-y-4">
                        <div className="neu-raised p-4">
                            <p className="text-white font-semibold">Raised Surface</p>
                            <p className="text-gray-400 text-sm">Elevated soft UI element</p>
                        </div>
                        <div className="neu-pressed p-4">
                            <p className="text-white font-semibold">Pressed Surface</p>
                            <p className="text-gray-400 text-sm">Inset soft UI element</p>
                        </div>
                        <div className="neu-flat p-4">
                            <p className="text-white font-semibold">Flat Neumorphic</p>
                            <p className="text-gray-400 text-sm">Flat with subtle shadows</p>
                        </div>
                        <div className="neu-concave p-4">
                            <p className="text-white font-semibold">Concave Surface</p>
                            <p className="text-gray-400 text-sm">Concave with depth</p>
                        </div>
                    </div>
                </ModernCard>
            </div>

            {/* Button Showcase */}
            <ModernCard variant="glass-ultra" className="mb-8 animate-fade-in">
                <h2 className="text-2xl font-bold text-white mb-6">Modern Buttons</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <ModernButton variant="primary" icon={<Rocket size={18} />}>
                        Primary Button
                    </ModernButton>
                    <ModernButton variant="secondary" icon={<Satellite size={18} />}>
                        Secondary Button
                    </ModernButton>
                    <ModernButton variant="neu" icon={<Activity size={18} />}>
                        Neumorphic Button
                    </ModernButton>
                    <ModernButton variant="ghost" icon={<Zap size={18} />}>
                        Ghost Button
                    </ModernButton>
                    <ModernButton variant="danger" icon={<AlertTriangle size={18} />}>
                        Danger Button
                    </ModernButton>
                    <ModernButton variant="primary" size="lg">
                        Large Button
                    </ModernButton>
                </div>
            </ModernCard>

            {/* Gradient Showcase */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="gradient-cosmic p-8 rounded-xl animate-float">
                    <h3 className="text-white font-bold text-xl mb-2">Cosmic Gradient</h3>
                    <p className="text-white/80">Purple to pink spectrum</p>
                </div>
                <div className="gradient-aurora p-8 rounded-xl animate-float" style={{ animationDelay: '0.5s' }}>
                    <h3 className="text-white font-bold text-xl mb-2">Aurora Gradient</h3>
                    <p className="text-white/80">Blue to cyan spectrum</p>
                </div>
                <div className="gradient-mesh p-8 rounded-xl">
                    <h3 className="text-white font-bold text-xl mb-2">Mesh Gradient</h3>
                    <p className="text-white/80">Animated multi-color</p>
                </div>
            </div>

            {/* Glow Effects */}
            <ModernCard variant="glass-ultra" className="animate-fade-in">
                <h2 className="text-2xl font-bold text-white mb-6">Glow Effects</h2>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="glass-medium p-6 rounded-lg glow-blue text-center">
                        <p className="text-white font-semibold">Blue Glow</p>
                    </div>
                    <div className="glass-medium p-6 rounded-lg glow-purple text-center">
                        <p className="text-white font-semibold">Purple Glow</p>
                    </div>
                    <div className="glass-medium p-6 rounded-lg glow-pink text-center">
                        <p className="text-white font-semibold">Pink Glow</p>
                    </div>
                    <div className="glass-medium p-6 rounded-lg glow-cyan text-center">
                        <p className="text-white font-semibold">Cyan Glow</p>
                    </div>
                    <div className="glass-medium p-6 rounded-lg glow-amber text-center">
                        <p className="text-white font-semibold">Amber Glow</p>
                    </div>
                </div>
            </ModernCard>

            {/* Footer */}
            <div className="mt-12 text-center">
                <p className="text-gray-400">
                    Modern Desktop App Design System • Orbital Guard AI
                </p>
            </div>
        </div>
    );
};

export default ModernDashboard;
