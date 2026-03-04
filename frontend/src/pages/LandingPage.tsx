import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Satellite, Shield, Zap, Brain, Rocket, TrendingUp } from 'lucide-react';
import PageLayout from '../components/layouts/PageLayout';
import AnimatedShaderHero from '../components/ui/animated-shader-hero';
import { BentoGrid, BentoGridItem } from '../components/ui/bento-grid';
import SpotlightCard from '../components/ui/spotlight-card';
import AnimatedCounter from '../components/ui/animated-counter';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <PageLayout showFooter={true}>
            {/* Premium Animated Shader Hero */}
            <AnimatedShaderHero
                trustBadge={{
                    text: "World's First Open-Source AI Collision Predictor",
                    icons: ["🛰️"]
                }}
                headline={{
                    line1: "Deep Learning",
                    line2: "Satellite Collision Prediction"
                }}
                subtitle="While others track satellites, we predict collisions using PyTorch AI. The first open-source deep learning system for space debris collision forecasting."
                buttons={{
                    primary: {
                        text: "Launch Dashboard →",
                        onClick: () => navigate('/login')
                    },
                    secondary: {
                        text: "Explore Features",
                        onClick: () => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                    }
                }}
            />

            {/* AI Comparison Section */}
            <div className="py-24 px-6 relative z-10 bg-black">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            Why AI Matters
                        </h2>
                        <p className="text-2xl text-slate-300">
                            Commercial systems detect. <span className="text-purple-400 font-bold">We predict.</span>
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <SpotlightCard className="group hover:scale-105 transition-transform duration-300">
                            <h3 className="text-2xl font-bold mb-3 text-gray-300">Commercial Systems</h3>
                            <p className="text-lg text-gray-400 mb-6 font-semibold">AGI STK, LeoLabs</p>
                            <div className="flex items-center gap-2 text-red-400 mb-4">
                                <span className="text-3xl font-bold">$50K+</span>
                                <span className="text-sm">/year</span>
                            </div>
                            <ul className="space-y-3 text-base text-gray-300">
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-500">•</span>
                                    <span>Physics-based detection</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-500">•</span>
                                    <span>React to current data</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-gray-500">•</span>
                                    <span>Enterprise only</span>
                                </li>
                            </ul>
                        </SpotlightCard>

                        <SpotlightCard className="group hover:scale-105 transition-transform duration-300" spotlightColor="rgba(59, 130, 246, 0.2)">
                            <h3 className="text-2xl font-bold mb-3 text-blue-300">Open-Source Trackers</h3>
                            <p className="text-lg text-blue-200 mb-6 font-semibold">KeepTrack.space</p>
                            <div className="flex items-center gap-2 text-green-400 mb-4">
                                <span className="text-3xl font-bold">Free</span>
                            </div>
                            <ul className="space-y-3 text-base text-blue-100">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400">✓</span>
                                    <span>50K satellites tracked</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400">✓</span>
                                    <span>Production-grade</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-red-400">✗</span>
                                    <span className="text-gray-400">No AI prediction</span>
                                </li>
                            </ul>
                        </SpotlightCard>

                        <SpotlightCard
                            className="group hover:scale-105 transition-transform duration-300 ring-2 ring-purple-500/50 glow-purple"
                            spotlightColor="rgba(139, 92, 246, 0.25)"
                        >
                            <h3 className="text-2xl font-bold mb-3 text-purple-200">Orbital Guard AI</h3>
                            <p className="text-lg text-purple-100 mb-6 font-bold">That's Us! 🚀</p>
                            <div className="flex items-center gap-2 text-green-400 mb-4">
                                <span className="text-3xl font-bold">Free</span>
                                <span className="text-sm">& Open-Source</span>
                            </div>
                            <ul className="space-y-3 text-base text-purple-50">
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-400">★</span>
                                    <span className="font-bold">PyTorch Deep Learning</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-400">★</span>
                                    <span className="font-bold">Predict 24-48hrs ahead</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-400">★</span>
                                    <span className="font-bold">Explainable AI (XAI)</span>
                                </li>
                            </ul>
                        </SpotlightCard>
                    </div>

                    <div className="mt-12 p-8 glass rounded-2xl text-center glow-purple">
                        <p className="text-3xl font-bold text-white">
                            <span className="text-yellow-400">Result:</span> Earlier warnings = More time to react = Safer satellites
                        </p>
                    </div>
                </div>
            </div>

            {/* Bento Grid Features */}
            <div id="features" className="py-24 px-6 relative z-10 bg-gradient-to-b from-black to-slate-950">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-400 to-blue-400 bg-clip-text text-transparent">
                            Advanced Capabilities
                        </h2>
                        <p className="text-2xl text-slate-300">
                            Production-grade orbital intelligence powered by AI
                        </p>
                    </div>

                    <BentoGrid className="max-w-7xl mx-auto">
                        <BentoGridItem
                            className="md:col-span-2 md:row-span-2"
                            title="AI-Powered Collision Prediction"
                            description="125K parameter Deep Neural Network predicts collision probability 24-48 hours in advance with explainable AI reasoning powered by PyTorch and SHAP."
                            header={
                                <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-900/30 to-pink-900/30">
                                    <Brain className="w-32 h-32 text-purple-400" />
                                </div>
                            }
                            icon={<Brain className="w-6 h-6" />}
                        />

                        <BentoGridItem
                            title="Real-time Tracking"
                            description="Monitor 18+ orbital objects with ±1km accuracy using SGP4 propagation"
                            header={
                                <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-900/30 to-cyan-900/30">
                                    <Satellite className="w-20 h-20 text-blue-400" />
                                </div>
                            }
                            icon={<Satellite className="w-6 h-6" />}
                        />

                        <BentoGridItem
                            title="Google Earth-Like 3D"
                            description="Photorealistic visualization with NASA textures at 60 FPS"
                            header={
                                <div className="flex items-center justify-center h-full bg-gradient-to-br from-pink-900/30 to-red-900/30">
                                    <Rocket className="w-20 h-20 text-pink-400" />
                                </div>
                            }
                            icon={<Rocket className="w-6 h-6" />}
                        />

                        <BentoGridItem
                            title="High Performance"
                            description="60 FPS rendering with <16ms frame latency"
                            header={
                                <div className="flex items-center justify-center h-full bg-gradient-to-br from-green-900/30 to-emerald-900/30">
                                    <TrendingUp className="w-20 h-20 text-green-400" />
                                </div>
                            }
                            icon={<TrendingUp className="w-6 h-6" />}
                        />

                        <BentoGridItem
                            title="Collision Avoidance"
                            description="Multi-stage screening with automated maneuver planning"
                            header={
                                <div className="flex items-center justify-center h-full bg-gradient-to-br from-yellow-900/30 to-orange-900/30">
                                    <Shield className="w-20 h-20 text-yellow-400" />
                                </div>
                            }
                            icon={<Shield className="w-6 h-6" />}
                        />
                    </BentoGrid>
                </div>
            </div>

            {/* Animated Stats */}
            <div id="technology" className="py-24 px-6 relative z-10 bg-slate-950">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                            Performance Metrics
                        </h2>
                        <p className="text-2xl text-slate-300">
                            Production-grade performance you can count on
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8">
                        <SpotlightCard className="text-center p-10">
                            <AnimatedCounter
                                to={60}
                                duration={2000}
                                suffix=" FPS"
                                className="text-6xl text-blue-400 mb-4"
                            />
                            <p className="text-lg text-slate-300">Real-time Rendering</p>
                        </SpotlightCard>

                        <SpotlightCard className="text-center p-10">
                            <AnimatedCounter
                                to={18}
                                duration={2000}
                                className="text-6xl text-purple-400 mb-4"
                            />
                            <p className="text-lg text-slate-300">Objects Tracked</p>
                        </SpotlightCard>

                        <SpotlightCard className="text-center p-10">
                            <div className="text-6xl text-pink-400 mb-4 font-bold">
                                ±1km
                            </div>
                            <p className="text-lg text-slate-300">SGP4 Accuracy</p>
                        </SpotlightCard>

                        <SpotlightCard className="text-center p-10">
                            <div className="text-6xl text-green-400 mb-4 font-bold">
                                &lt;16ms
                            </div>
                            <p className="text-lg text-slate-300">Frame Latency</p>
                        </SpotlightCard>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="py-24 px-6 relative z-10 bg-black">
                <div className="max-w-4xl mx-auto">
                    <SpotlightCard className="text-center p-16">
                        <h2 className="text-5xl font-bold mb-6 text-white">
                            Ready to Explore?
                        </h2>
                        <p className="text-2xl text-slate-300 mb-10">
                            Join the future of satellite collision prediction
                        </p>
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="px-12 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-full font-bold text-2xl transition-all duration-300 hover:scale-105 shadow-2xl shadow-blue-500/50 text-white"
                        >
                            Launch Dashboard →
                        </button>
                    </SpotlightCard>
                </div>
            </div>
        </PageLayout>
    );
};

export default LandingPage;
