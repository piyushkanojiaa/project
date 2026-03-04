import React, { useState, useEffect } from 'react';
import { AlertTriangle, Zap, TrendingUp, Target, Fuel, Clock } from 'lucide-react';
import AnimatedCounter from './ui/animated-counter';
import SpotlightCard from './ui/spotlight-card';
import {
    getConjunctionAnalysis,
    formatProbability,
    formatTimeToTCA,
    getRiskColor,
    calculateAgreement,
    type ConjunctionAnalysis,
} from '../services/api';
import { RiskTrendsChart } from './RiskTrendsChart';
import ConjunctionDetailModal from './ConjunctionDetailModal';

interface AdvancedAnalyticsPanelProps {
    onSelectConjunction?: (conjunction: ConjunctionAnalysis) => void;
}

const AdvancedAnalyticsPanel: React.FC<AdvancedAnalyticsPanelProps> = ({ onSelectConjunction }) => {
    const [conjunctions, setConjunctions] = useState<ConjunctionAnalysis[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [selectedConjunction, setSelectedConjunction] = useState<ConjunctionAnalysis | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Fetch conjunction data
    const fetchData = async () => {
        const data = await getConjunctionAnalysis(86400); // 24-hour horizon
        setConjunctions(data);
        setLoading(false);
        setLastUpdate(new Date());
    };

    useEffect(() => {
        fetchData();

        // Auto-refresh every 10 seconds
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    // Get top conjunction for display
    const topConjunction = conjunctions.length > 0 ? conjunctions[0] : null;
    const highRiskCount = conjunctions.filter(c => c.risk_level === 'CRITICAL' || c.risk_level === 'HIGH').length;
    const mediumRiskCount = conjunctions.filter(c => c.risk_level === 'MEDIUM').length;

    return (
        <div className="w-full px-6 py-8 bg-gradient-to-b from-black via-gray-900 to-black">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h2 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                        Advanced Collision Analytics
                    </h2>
                    <p className="text-slate-400">
                        Real-time conjunction analysis powered by Foster 3D PoC + ML predictions
                    </p>
                    <div className="text-sm text-slate-500 mt-2">
                        Last updated: {lastUpdate.toLocaleTimeString()} • {conjunctions.length} conjunctions tracked
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20">
                        <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                        <p className="text-slate-400 mt-4">Analyzing orbital conjunctions...</p>
                    </div>
                ) : conjunctions.length === 0 ? (
                    <div className="text-center py-20">
                        <Target className="w-16 h-16 mx-auto text-green-500 mb-4" />
                        <h3 className="text-2xl font-bold text-green-400 mb-2">All Clear!</h3>
                        <p className="text-slate-400">No high-risk conjunctions detected in the next 24 hours</p>
                    </div>
                ) : (
                    <>
                        {/* Top Conjunction Stats */}
                        {topConjunction && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                {/* Foster 3D PoC */}
                                <SpotlightCard className="p-6" spotlightColor={getRiskColor(topConjunction.risk_level)}>
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-slate-400 font-semibold">Foster 3D PoC</span>
                                        <Zap className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div className="text-3xl font-bold mb-2" style={{ color: getRiskColor(topConjunction.risk_level) }}>
                                        <AnimatedCounter
                                            to={topConjunction.poc_analytic}
                                            decimals={6}
                                            duration={1000}
                                        />
                                    </div>
                                    <div className="text-sm text-slate-300">
                                        {formatProbability(topConjunction.poc_analytic)}
                                    </div>
                                </SpotlightCard>

                                {/* ML Prediction */}
                                <SpotlightCard className="p-6" spotlightColor="rgba(139, 92, 246, 0.3)">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-slate-400 font-semibold">ML Prediction</span>
                                        <TrendingUp className="w-5 h-5 text-purple-400" />
                                    </div>
                                    <div className="text-3xl font-bold mb-2" style={{ color: getRiskColor(topConjunction.risk_level) }}>
                                        <AnimatedCounter
                                            to={topConjunction.poc_ml}
                                            decimals={6}
                                            duration={1000}
                                        />
                                    </div>
                                    <div className="text-sm text-slate-300">
                                        {formatProbability(topConjunction.poc_ml)}
                                    </div>
                                </SpotlightCard>

                                {/* Agreement */}
                                <SpotlightCard className="p-6" spotlightColor="rgba(16, 185, 129, 0.3)">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-slate-400 font-semibold">Model Agreement</span>
                                        <Target className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div className="text-3xl font-bold mb-2 text-green-400">
                                        <AnimatedCounter
                                            to={calculateAgreement(topConjunction.poc_analytic, topConjunction.poc_ml)}
                                            decimals={0}
                                            duration={1000}
                                        />%
                                    </div>
                                    <div className="text-sm text-slate-300">
                                        Foster vs ML
                                    </div>
                                </SpotlightCard>

                                {/* TCA */}
                                <SpotlightCard className="p-6" spotlightColor="rgba(245, 158, 11, 0.3)">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-sm text-slate-400 font-semibold">Time to TCA</span>
                                        <Clock className="w-5 h-5 text-amber-400" />
                                    </div>
                                    <div className="text-3xl font-bold mb-2 text-amber-400">
                                        {formatTimeToTCA(topConjunction.time_to_tca)}
                                    </div>
                                    <div className="text-sm text-slate-300">
                                        Miss: {topConjunction.miss_distance.toFixed(0)}m
                                    </div>
                                </SpotlightCard>
                            </div>
                        )}

                        {/* Risk Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-gradient-to-r from-red-600/20 to-red-600/10 border border-red-500/30 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-red-300 mb-1">Critical/High Risk</div>
                                        <div className="text-3xl font-bold text-red-400">{highRiskCount}</div>
                                    </div>
                                    <AlertTriangle className="w-10 h-10 text-red-500" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-yellow-600/20 to-yellow-600/10 border border-yellow-500/30 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-yellow-300 mb-1">Medium Risk</div>
                                        <div className="text-3xl font-bold text-yellow-400">{mediumRiskCount}</div>
                                    </div>
                                    <AlertTriangle className="w-10 h-10 text-yellow-500" />
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-green-600/20 to-green-600/10 border border-green-500/30 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm text-green-300 mb-1">Total Tracked</div>
                                        <div className="text-3xl font-bold text-green-400">{conjunctions.length}</div>
                                    </div>
                                    <Target className="w-10 h-10 text-green-500" />
                                </div>
                            </div>
                        </div>

                        {/* High Risk Conjunctions List */}
                        <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6 backdrop-blur-sm">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
                                <AlertTriangle className="w-6 h-6 text-red-400" />
                                High Risk Conjunctions (Top 5)
                            </h3>

                            <div className="space-y-3">
                                {conjunctions.slice(0, 5).map((conjunction) => (
                                    <div
                                        key={conjunction.conjunction_id}
                                        onClick={() => {
                                            setSelectedConjunction(conjunction);
                                            setIsModalOpen(true);
                                            if (onSelectConjunction) {
                                                onSelectConjunction(conjunction);
                                            }
                                        }}
                                        className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg hover:bg-gray-700/50 transition cursor-pointer"
                                        style={{ borderLeftColor: getRiskColor(conjunction.risk_level), borderLeftWidth: '4px' }}
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                            {/* Conjunction Info */}
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="font-bold text-lg text-white">
                                                        {conjunction.satellite_name}
                                                    </span>
                                                    <span className="text-slate-500">vs</span>
                                                    <span className="font-semibold text-slate-300">
                                                        {conjunction.debris_name}
                                                    </span>
                                                </div>

                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-slate-500">TCA:</span>{' '}
                                                        <span className="text-white font-semibold">{formatTimeToTCA(conjunction.time_to_tca)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500">Miss:</span>{' '}
                                                        <span className="text-white font-semibold">{conjunction.miss_distance.toFixed(0)}m</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500">PoC:</span>{' '}
                                                        <span className="text-white font-semibold">{conjunction.poc_ml.toExponential(2)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-500">Risk:</span>{' '}
                                                        <span
                                                            className="font-bold"
                                                            style={{ color: getRiskColor(conjunction.risk_level) }}
                                                        >
                                                            {conjunction.risk_level}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Maneuver Required */}
                                            {conjunction.maneuver_required && (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-600/20 border border-amber-500/40 rounded-lg">
                                                    <Fuel className="w-4 h-4 text-amber-400" />
                                                    <span className="text-sm text-amber-300 font-semibold">Maneuver Required</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Risk Trends Chart */}
                        <div className="mt-8">
                            <RiskTrendsChart conjunctions={conjunctions} />
                        </div>
                    </>
                )}
            </div>

            {/* Conjunction Detail Modal */}
            <ConjunctionDetailModal
                conjunction={selectedConjunction}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedConjunction(null);
                }}
            />
        </div>
    );
};

export default AdvancedAnalyticsPanel;
