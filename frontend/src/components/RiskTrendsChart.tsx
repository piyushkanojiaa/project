import React from 'react';
import { TrendingUp, AlertTriangle, Activity } from 'lucide-react';

interface RiskTrendsProps {
    conjunctions: any[];
}

export const RiskTrendsChart: React.FC<RiskTrendsProps> = ({ conjunctions }) => {
    // Calculate risk distribution
    const riskCounts = {
        CRITICAL: conjunctions.filter(c => c.risk_level === 'CRITICAL').length,
        HIGH: conjunctions.filter(c => c.risk_level === 'HIGH').length,
        MEDIUM: conjunctions.filter(c => c.risk_level === 'MEDIUM').length,
        LOW: conjunctions.filter(c => c.risk_level === 'LOW').length,
    };

    const total = conjunctions.length;
    const maxCount = Math.max(...Object.values(riskCounts));

    // Calculate percentages for bar chart
    const getRiskPercentage = (count: number) => total > 0 ? (count / total) * 100 : 0;

    const riskData = [
        { label: 'CRITICAL', count: riskCounts.CRITICAL, color: 'bg-red-500', textColor: 'text-red-400', percentage: getRiskPercentage(riskCounts.CRITICAL) },
        { label: 'HIGH', count: riskCounts.HIGH, color: 'bg-orange-500', textColor: 'text-orange-400', percentage: getRiskPercentage(riskCounts.HIGH) },
        { label: 'MEDIUM', count: riskCounts.MEDIUM, color: 'bg-yellow-500', textColor: 'text-yellow-400', percentage: getRiskPercentage(riskCounts.MEDIUM) },
        { label: 'LOW', count: riskCounts.LOW, color: 'bg-green-500', textColor: 'text-green-400', percentage: getRiskPercentage(riskCounts.LOW) },
    ];

    // Calculate average PoC
    const avgPoc = total > 0
        ? conjunctions.reduce((sum, c) => sum + (c.poc_ml || 0), 0) / total
        : 0;

    // Average miss distance
    const avgMissDistance = total > 0
        ? conjunctions.reduce((sum, c) => sum + (c.miss_distance || 0), 0) / total
        : 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution Bar Chart */}
            <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg border border-gray-700/50 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-6">
                    <Activity className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Risk Distribution</h3>
                </div>

                <div className="space-y-4">
                    {riskData.map((risk) => (
                        <div key={risk.label} className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className={`font-medium ${risk.textColor}`}>{risk.label}</span>
                                <span className="text-gray-400">{risk.count} ({risk.percentage.toFixed(1)}%)</span>
                            </div>
                            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${risk.color} rounded-full transition-all duration-500 ease-out`}
                                    style={{ width: `${risk.percentage}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400">
                        Total Events: <span className="text-white font-semibold">{total}</span>
                    </div>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
                {/* Average PoC */}
                <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 backdrop-blur-lg border border-purple-500/30 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        <span className="text-xs text-purple-300 uppercase tracking-wider">Avg PoC</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {avgPoc.toExponential(2)}
                    </div>
                    <div className="text-xs text-purple-300 mt-2">
                        {avgPoc > 0 ? `1 in ${(1 / avgPoc).toFixed(0)}` : 'N/A'}
                    </div>
                </div>

                {/* Average Miss Distance */}
                <div className="bg-gradient-to-br from-cyan-900/40 to-cyan-800/20 backdrop-blur-lg border border-cyan-500/30 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs text-cyan-300 uppercase tracking-wider">Avg Miss</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {avgMissDistance.toFixed(2)}
                    </div>
                    <div className="text-xs text-cyan-300 mt-2">
                        kilometers
                    </div>
                </div>

                {/* High Risk Count */}
                <div className="bg-gradient-to-br from-red-900/40 to-red-800/20 backdrop-blur-lg border border-red-500/30 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-xs text-red-300 uppercase tracking-wider">High Risk</span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {riskCounts.CRITICAL + riskCounts.HIGH}
                    </div>
                    <div className="text-xs text-red-300 mt-2">
                        require action
                    </div>
                </div>

                {/* Safe Count */}
                <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 backdrop-blur-lg border border-green-500/30 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4 text-green-400" />
                        <span className="text-xs text-green-300 uppercase tracking-wider">Safe</span>
                    </div>
                    <div className="text-3xl font-bold text-white">
                        {riskCounts.MEDIUM + riskCounts.LOW}
                    </div>
                    <div className="text-xs text-green-300 mt-2">
                        monitored
                    </div>
                </div>
            </div>
        </div>
    );
};
