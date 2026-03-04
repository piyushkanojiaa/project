/**
 * Live Connection Status Indicator
 * 
 * Shows WebSocket connection status
 */

import React from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';

interface ConnectionStatusProps {
    isConnected: boolean;
    className?: string;
}

export default function ConnectionStatus({ isConnected, className = '' }: ConnectionStatusProps) {
    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {isConnected ? (
                <>
                    <div className="relative flex items-center">
                        <Wifi className="w-4 h-4 text-green-400" />
                        <span className="absolute w-2 h-2 bg-green-400 rounded-full animate-ping opacity-75" />
                    </div>
                    <span className="text-xs text-green-400 font-medium">
                        Live
                    </span>
                </>
            ) : (
                <>
                    <WifiOff className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-red-400 font-medium">
                        Disconnected
                    </span>
                </>
            )}
        </div>
    );
}

/**
 * Live Statistics Display with Real-Time Updates
 */
interface LiveStatsProps {
    stats: {
        totalConjunctions: number;
        averageProbability: number;
        byRiskLevel: Array<{
            riskLevel: string;
            count: number;
        }>;
    } | null;
    isLive: boolean;
}

export function LiveStats({ stats, isLive }: LiveStatsProps) {
    if (!stats) {
        return (
            <div className="animate-pulse space-y-4">
                <div className="h-20 bg-white/5 rounded"></div>
                <div className="h-20 bg-white/5 rounded"></div>
                <div className="h-20 bg-white/5 rounded"></div>
            </div>
        );
    }

    const criticalCount = stats.byRiskLevel.find(r => r.riskLevel === 'CRITICAL')?.count || 0;
    const highCount = stats.byRiskLevel.find(r => r.riskLevel === 'HIGH')?.count || 0;

    return (
        <div className="space-y-4">
            {/* Live Indicator */}
            {isLive && (
                <div className="flex items-center justify-between p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-400 animate-pulse" />
                        <span className="text-green-400 text-sm font-medium">
                            Updating live every 60s
                        </span>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/5 p-4 rounded-lg">
                    <div className="text-gray-400 text-sm">Total</div>
                    <div className="text-white text-2xl font-bold">
                        {stats.totalConjunctions}
                    </div>
                </div>

                <div className="bg-red-500/10 p-4 rounded-lg border border-red-500/30">
                    <div className="text-red-400 text-sm">Critical</div>
                    <div className="text-red-400 text-2xl font-bold">
                        {criticalCount}
                    </div>
                </div>

                <div className="bg-orange-500/10 p-4 rounded-lg border border-orange-500/30">
                    <div className="text-orange-400 text-sm">High</div>
                    <div className="text-orange-400 text-2xl font-bold">
                        {highCount}
                    </div>
                </div>
            </div>

            {/* Average Probability */}
            <div className="bg-white/5 p-4 rounded-lg">
                <div className="text-gray-400 text-sm mb-2">Average Probability</div>
                <div className="flex items-baseline gap-2">
                    <span className="text-cyan-400 text-xl font-bold">
                        {(stats.averageProbability * 100).toFixed(4)}%
                    </span>
                    <span className="text-gray-500 text-xs">
                        ({stats.averageProbability.toExponential(2)})
                    </span>
                </div>
            </div>
        </div>
    );
}
