import React from 'react';
import { Satellite, Brain, Shield, Zap, Target, TrendingUp, Star, Rocket } from 'lucide-react';
import PageLayout from '../components/layouts/PageLayout';
import StarsBackground from '../components/ui/stars-background';
import { BentoGrid, BentoGridItem } from '../components/ui/bento-grid';
import SpotlightCard from '../components/ui/spotlight-card';
import AnimatedCounter from '../components/ui/animated-counter';
import ParticleButton from '../components/ui/particle-button';
import { useNavigate } from 'react-router-dom';

const AboutPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <PageLayout>
            {/* Premium Stars Background */}
            <div className="fixed inset-0 z-0">
                <StarsBackground starDensity={0.00015} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80"></div>
            </div>

            {/* Hero Section */}
            <div className="pt-24 pb-20 px-6 relative z-10">
                <div className="max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-5 py-2 bg-purple-500/10 border border-purple-400/30 rounded-full mb-8 backdrop-blur-lg">
                        <Star className="w-4 h-4 text-purple-300" />
                        <span className="text-sm font-semibold text-purple-100">
                            Mission: Make Space Safer with AI
                        </span>
                    </div>

                    <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                        About Orbital Guard AI
                    </h1>

                    <p className="text-2xl text-slate-300 leading-relaxed mb-8">
                        The world's first <span className="text-purple-400 font-bold">open-source AI-powered</span> satellite collision prediction system.
                        We're making space safer, one prediction at a time.
                    </p>
                </div>
            </div>

            {/* Problem Statement - Spotlight Cards */}
            <div className="py-20 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
                        The Space Debris Crisis
                    </h2>
                    <p className="text-2xl text-slate-300 text-center mb-16">
                        A growing threat to our orbital infrastructure
                    </p>

                    <div className="grid md:grid-cols-4 gap-6 mb-12">
                        <SpotlightCard className="text-center p-8" spotlightColor="rgba(59, 130, 246, 0.2)">
                            <AnimatedCounter
                                to={34000}
                                duration={2500}
                                className="text-5xl text-blue-400 mb-3"
                            />
                            <p className="text-lg text-slate-300 font-semibold">Tracked Objects</p>
                            <p className="text-sm text-slate-400 mt-2">Orbiting Earth right now</p>
                        </SpotlightCard>

                        <SpotlightCard className="text-center p-8" spotlightColor="rgba(239, 68, 68, 0.2)">
                            <AnimatedCounter
                                to={130}
                                duration={2500}
                                suffix="M"
                                className="text-5xl text-red-400 mb-3"
                            />
                            <p className="text-lg text-slate-300 font-semibold">Debris Fragments</p>
                            <p className="text-sm text-slate-400 mt-2">Too small to track</p>
                        </SpotlightCard>

                        <SpotlightCard className="text-center p-8" spotlightColor="rgba(168, 85, 247, 0.2)">
                            <AnimatedCounter
                                to={17500}
                                duration={2500}
                                className="text-5xl text-purple-400 mb-3"
                            />
                            <p className="text-lg text-slate-300 font-semibold">mph Speed</p>
                            <p className="text-sm text-slate-400 mt-2">Average collision velocity</p>
                        </SpotlightCard>

                        <SpotlightCard className="text-center p-8" spotlightColor="rgba(234, 179, 8, 0.2)">
                            <div className="text-5xl text-yellow-400 mb-3 font-bold">$100M+</div>
                            <p className="text-lg text-slate-300 font-semibold">Per Collision</p>
                            <p className="text-sm text-slate-400 mt-2">Economic impact</p>
                        </SpotlightCard>
                    </div>

                    <SpotlightCard className="p-10">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                            <div>
                                <h3 className="text-3xl font-bold mb-6 text-red-300">The Kessler Syndrome Threat</h3>
                                <div className="space-y-4 text-lg text-slate-300">
                                    <p>
                                        Each collision creates <span className="text-red-400 font-bold">thousands of new fragments</span>,
                                        triggering a cascade effect that could make entire orbital regions unusable.
                                    </p>
                                    <p>
                                        Traditional detection requires <span className="text-yellow-400 font-bold">billions of pairwise checks</span> daily.
                                        Manual analysis at this scale is impossible.
                                    </p>
                                    <p className="text-purple-300 font-semibold">
                                        We need AI to predict, not just detect.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-center">
                                <div className="relative w-64 h-64">
                                    <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full blur-3xl"></div>
                                    <div className="relative z-10 flex items-center justify-center h-full">
                                        <Satellite className="w-32 h-32 text-red-400 animate-pulse" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SpotlightCard>
                </div>
            </div>

            {/* Our Solution - Bento Grid */}
            <div className="py-20 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                        Our AI-First Solution
                    </h2>
                    <p className="text-2xl text-slate-300 text-center mb-16">
                        Deep learning meets orbital mechanics
                    </p>

                    <BentoGrid>
                        {/* Large Card - AI Core */}
                        <BentoGridItem
                            className="md:col-span-2 md:row-span-2"
                            title="PyTorch Deep Learning Engine"
                            description="125K parameter neural network predicts collision probability 24-48 hours in advance. Uses SHAP for explainable AI - you always know why the system flagged a potential collision."
                            header={
                                <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-900/40 to-pink-900/40">
                                    <div className="text-center">
                                        <Brain className="w-32 h-32 text-purple-400 mx-auto mb-4" />
                                        <div className="text-6xl font-bold text-purple-300">125K</div>
                                        <div className="text-xl text-purple-200">Parameters</div>
                                    </div>
                                </div>
                            }
                            icon={<Brain className="w-6 h-6" />}
                        />

                        {/* SGP4 */}
                        <BentoGridItem
                            title="SGP4 Propagation"
                            description="Industry-standard orbital mechanics with ±1km accuracy"
                            header={
                                <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-900/40 to-cyan-900/40">
                                    <Satellite className="w-20 h-20 text-blue-400" />
                                </div>
                            }
                            icon={<Satellite className="w-6 h-6" />}
                        />

                        {/* Multi-Stage Screening */}
                        <BentoGridItem
                            title="Multi-Stage Screening"
                            description="99% computational load reduction via smart filtering"
                            header={
                                <div className="flex items-center justify-center h-full bg-gradient-to-br from-green-900/40 to-emerald-900/40">
                                    <Target className="w-20 h-20 text-green-400" />
                                </div>
                            }
                            icon={<Target className="w-6 h-6" />}
                        />

                        {/* Real-time */}
                        <BentoGridItem
                            title="Real-time Processing"
                            description="60 FPS rendering with <16ms frame latency"
                            header={
                                <div className="flex items-center justify-center h-full bg-gradient-to-br from-yellow-900/40 to-orange-900/40">
                                    <Zap className="w-20 h-20 text-yellow-400" />
                                </div>
                            }
                            icon={<Zap className="w-6 h-6" />}
                        />

                        {/* Safety First */}
                        <BentoGridItem
                            title="Collision Avoidance"
                            description="Automated maneuver planning and risk assessment"
                            header={
                                <div className="flex items-center justify-center h-full bg-gradient-to-br from-pink-900/40 to-red-900/40">
                                    <Shield className="w-20 h-20 text-pink-400" />
                                </div>
                            }
                            icon={<Shield className="w-6 h-6" />}
                        />
                    </BentoGrid>
                </div>
            </div>

            {/* Technical Achievements */}
            <div className="py-20 px-6 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-5xl font-bold text-center mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        Technical Achievements
                    </h2>
                    <p className="text-2xl text-slate-300 text-center mb-16">
                        Production-grade performance backed by research
                    </p>

                    <div className="grid md:grid-cols-2 gap-8">
                        <SpotlightCard className="p-8">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-3 h-3 bg-blue-400 rounded-full mt-2 flex-shrink-0 shadow-lg shadow-blue-400/50"></div>
                                <div>
                                    <h3 className="text-2xl font-bold text-blue-300 mb-3">Production-Ready SGP4</h3>
                                    <p className="text-lg text-slate-300">
                                        Validated satellite.js implementation with TLE parsing and orbital propagation matching NASA standards
                                    </p>
                                </div>
                            </div>
                        </SpotlightCard>

                        <SpotlightCard className="p-8">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-3 h-3 bg-purple-400 rounded-full mt-2 flex-shrink-0 shadow-lg shadow-purple-400/50"></div>
                                <div>
                                    <h3 className="text-2xl font-bold text-purple-300 mb-3">Google Earth-Like Visualization</h3>
                                    <p className="text-lg text-slate-300">
                                        Three.js-powered 3D globe with NASA Blue Marble textures, atmospheric shader, and smooth 60 FPS camera controls
                                    </p>
                                </div>
                            </div>
                        </SpotlightCard>

                        <SpotlightCard className="p-8">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-3 h-3 bg-pink-400 rounded-full mt-2 flex-shrink-0 shadow-lg shadow-pink-400/50"></div>
                                <div>
                                    <h3 className="text-2xl font-bold text-pink-300 mb-3">Deep Learning Pipeline</h3>
                                    <p className="text-lg text-slate-300">
                                        PyTorch model training with 10K+ synthetic collision scenarios, batch normalization, and early stopping
                                    </p>
                                </div>
                            </div>
                        </SpotlightCard>

                        <SpotlightCard className="p-8">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-3 h-3 bg-green-400 rounded-full mt-2 flex-shrink-0 shadow-lg shadow-green-400/50"></div>
                                <div>
                                    <h3 className="text-2xl font-bold text-green-300 mb-3">Explainable AI (XAI)</h3>
                                    <p className="text-lg text-slate-300">
                                        SHAP values provide natural language explanations: "High risk due to low relative velocity and close approach"
                                    </p>
                                </div>
                            </div>
                        </SpotlightCard>
                    </div>
                </div>
            </div>

            {/* Mission & Values */}
            <div className="py-20 px-6 relative z-10">
                <div className="max-w-5xl mx-auto">
                    <SpotlightCard className="p-12" spotlightColor="rgba(139, 92, 246, 0.2)">
                        <div className="text-center">
                            <Rocket className="w-20 h-20 text-purple-400 mx-auto mb-6" />
                            <h2 className="text-4xl font-bold mb-6 text-white">Our Mission</h2>
                            <p className="text-2xl text-slate-300 leading-relaxed mb-8">
                                Make AI-powered collision prediction accessible to <span className="text-purple-400 font-bold">everyone</span>.
                                No $50K/year licenses. No enterprise barriers. Just open-source innovation.
                            </p>
                            <div className="grid md:grid-cols-3 gap-6 mb-10">
                                <div>
                                    <div className="text-4xl font-bold text-blue-400 mb-2">Free</div>
                                    <div className="text-slate-400">Open-Source Forever</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-bold text-purple-400 mb-2">AI-First</div>
                                    <div className="text-slate-400">Deep Learning Core</div>
                                </div>
                                <div>
                                    <div className="text-4xl font-bold text-pink-400 mb-2">Educational</div>
                                    <div className="text-slate-400">Perfect for Hackathons</div>
                                </div>
                            </div>
                            <ParticleButton
                                onClick={() => navigate('/dashboard')}
                                className="text-xl px-10 py-5"
                            >
                                Explore the Platform →
                            </ParticleButton>
                        </div>
                    </SpotlightCard>
                </div>
            </div>
        </PageLayout>
    );
};

export default AboutPage;
