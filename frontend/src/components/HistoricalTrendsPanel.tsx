import React, { useEffect, useState } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { TrendingUp, BarChart3, Activity, AlertTriangle } from 'lucide-react';

interface HistoricalTrendsProps {
    days?: number;
}

interface TrendData {
    date: string;
    total_conjunctions: number;
    critical_count: number;
    high_count: number;
    medium_count: number;
    low_count: number;
    avg_poc: number;
    max_poc: number;
}

export const HistoricalTrendsPanel: React.FC<HistoricalTrendsProps> = ({ days = 7 }) => {
    const [trendData, setTrendData] = useState<TrendData[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPeriod, setSelectedPeriod] = useState(days);

    useEffect(() => {
        fetchTrendData();
    }, [selectedPeriod]);

    const fetchTrendData = async () => {
        try {
            const response = await fetch(`http://localhost:8000/api/history/trends?days=${selectedPeriod}`);
            if (response.ok) {
                const data = await response.json();
                setTrendData(data);
            }
        } catch (error) {
            console.error('Error fetching trend data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    // Custom tooltip for charts
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-900/95 backdrop-blur-lg border border-gray-700 rounded-lg p-3 shadow-xl">
                    <p className="text-white font-semibold mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }} className="text-sm">
                            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(4) : entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Header with period selector */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Activity className="w-6 h-6 text-blue-400" />
                    <h2 className="text-2xl font-bold text-white">Historical Trends</h2>
                </div>
                <div className="flex gap-2">
                    {[7, 14, 30].map(period => (
                        <button
                            key={period}
                            onClick={() => setSelectedPeriod(period)}
                            className={`px-4 py-2 rounded-lg font-semibold transition ${selectedPeriod === period
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {period} Days
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1: PoC Evolution Over Time */}
                <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                        <h3 className="text-lg font-semibold text-white">PoC Evolution</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                                dataKey="date"
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />
                            <YAxis
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                                tickFormatter={(value) => value.toExponential(1)}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ color: '#fff' }} />
                            <Line
                                type="monotone"
                                dataKey="avg_poc"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                dot={{ fill: '#8b5cf6', r: 4 }}
                                name="Avg PoC"
                            />
                            <Line
                                type="monotone"
                                dataKey="max_poc"
                                stroke="#ef4444"
                                strokeWidth={2}
                                dot={{ fill: '#ef4444', r: 4 }}
                                name="Max PoC"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Chart 2: Conjunction Rate by Risk Level */}
                <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-semibold text-white">Conjunctions by Risk Level</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                                dataKey="date"
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />
                            <YAxis
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ color: '#fff' }} />
                            <Bar dataKey="critical_count" stackId="a" fill="#ef4444" name="Critical" />
                            <Bar dataKey="high_count" stackId="a" fill="#f97316" name="High" />
                            <Bar dataKey="medium_count" stackId="a" fill="#eab308" name="Medium" />
                            <Bar dataKey="low_count" stackId="a" fill="#22c55e" name="Low" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Chart 3: Total Conjunctions Trend */}
                <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="w-5 h-5 text-cyan-400" />
                        <h3 className="text-lg font-semibold text-white">Total Conjunctions Trend</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <AreaChart data={trendData}>
                            <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                                dataKey="date"
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />
                            <YAxis
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area
                                type="monotone"
                                dataKey="total_conjunctions"
                                stroke="#06b6d4"
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                                strokeWidth={2}
                                name="Total Events"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Chart 4: Risk Alert Indicator */}
                <div className="bg-gradient-to-br from-gray-900/90 to-gray-800/90 backdrop-blur-lg border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                        <h3 className="text-lg font-semibold text-white">High-Risk Events</h3>
                    </div>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis
                                dataKey="date"
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />
                            <YAxis
                                stroke="#9ca3af"
                                tick={{ fill: '#9ca3af', fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ color: '#fff' }} />
                            <Line
                                type="monotone"
                                dataKey="critical_count"
                                stroke="#ef4444"
                                strokeWidth={3}
                                dot={{ fill: '#ef4444', r: 5 }}
                                name="Critical"
                            />
                            <Line
                                type="monotone"
                                dataKey="high_count"
                                stroke="#f97316"
                                strokeWidth={2}
                                dot={{ fill: '#f97316', r: 4 }}
                                name="High"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Summary Stats */}
            {trendData.length > 0 && (
                <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 backdrop-blur-lg border border-blue-500/30 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Period Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <div className="text-sm text-gray-400">Total Events</div>
                            <div className="text-2xl font-bold text-white">
                                {trendData.reduce((sum, d) => sum + d.total_conjunctions, 0)}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400">Critical + High</div>
                            <div className="text-2xl font-bold text-red-400">
                                {trendData.reduce((sum, d) => sum + d.critical_count + d.high_count, 0)}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400">Peak Daily Events</div>
                            <div className="text-2xl font-bold text-cyan-400">
                                {Math.max(...trendData.map(d => d.total_conjunctions))}
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-400">Avg Daily PoC</div>
                            <div className="text-2xl font-bold text-purple-400">
                                {(trendData.reduce((sum, d) => sum + d.avg_poc, 0) / trendData.length).toExponential(2)}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HistoricalTrendsPanel;
