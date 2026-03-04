import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, BarChart3, Map } from 'lucide-react';
import HistoricalTrendsPanel from '../components/HistoricalTrendsPanel';
import EnhancedDeckGLAnalytics from '../components/EnhancedDeckGLAnalytics';

const AnalyticsPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'trends' | 'map'>('trends');

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
            {/* Header */}
            <div className="border-b border-gray-700/50 bg-black/30 backdrop-blur-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                to="/dashboard"
                                className="p-2 hover:bg-gray-700 rounded-lg transition"
                            >
                                <ArrowLeft className="w-6 h-6 text-gray-400" />
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                                    <BarChart3 className="w-8 h-8 text-blue-400" />
                                    Advanced Analytics
                                </h1>
                                <p className="text-gray-400 mt-1">
                                    {activeTab === 'trends'
                                        ? 'Track conjunction trends and risk evolution over time'
                                        : 'Interactive spatial analysis with deck.gl visualization'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="px-4 py-2 bg-green-600/20 border border-green-500/50 rounded-lg">
                                <div className="text-xs text-green-300">Database</div>
                                <div className="text-sm font-semibold text-white">SQLite Active</div>
                            </div>
                        </div>
                    </div>

                    {/* Tab Navigation */}
                    <div className="mt-6 flex gap-2">
                        <button
                            onClick={() => setActiveTab('trends')}
                            className={`
                                px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2
                                ${activeTab === 'trends'
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                                    : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50'
                                }
                            `}
                        >
                            <TrendingUp className="w-5 h-5" />
                            Historical Trends
                        </button>
                        <button
                            onClick={() => setActiveTab('map')}
                            className={`
                                px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2
                                ${activeTab === 'map'
                                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50'
                                    : 'bg-gray-700/30 text-gray-400 hover:bg-gray-700/50'
                                }
                            `}
                        >
                            <Map className="w-5 h-5" />
                            Interactive Map
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === 'trends' ? (
                    <HistoricalTrendsPanel days={7} />
                ) : (
                    <div>
                        <div className="mb-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                            <div className="flex items-start gap-3">
                                <div className="text-2xl">🚀</div>
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-1">
                                        Enhanced deck.gl Spatial Analytics
                                    </h3>
                                    <p className="text-sm text-gray-300">
                                        Interactive visualization with advanced filtering, time-series playback,
                                        and multiple layer types. Alternative to Kepler.gl with full React 18 compatibility.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <EnhancedDeckGLAnalytics />
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="mt-12 border-t border-gray-700/50 bg-black/20 backdrop-blur-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between text-sm text-gray-400">
                        <div>
                            Orbital Guard AI - Advanced Analytics Dashboard
                        </div>
                        <div className="flex items-center gap-2">
                            {activeTab === 'trends' ? (
                                <>
                                    <TrendingUp className="w-4 h-4 text-blue-400" />
                                    <span>Powered by SQLite + Recharts</span>
                                </>
                            ) : (
                                <>
                                    <Map className="w-4 h-4 text-cyan-400" />
                                    <span>Powered by deck.gl + WebGL</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnalyticsPage;
