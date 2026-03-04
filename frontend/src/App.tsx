import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Satellite, Activity, AlertTriangle, Globe, Layers } from 'lucide-react';
import { NotificationSystem, notify } from './components/NotificationSystem';
import SimulationScene from './components/SimulationScene';
import SimulationScene3D from './components/SimulationScene3D';
import AdvancedAnalyticsPanel from './components/AdvancedAnalyticsPanel';
import VoiceControl from './components/VoiceControl';
import CaptureMethodSelector from './components/CaptureMethodSelector';
import { SatelliteData } from './tleData';

function App() {
    const [selectedSat, setSelectedSat] = useState<SatelliteData | null>(null);
    const [alerts, setAlerts] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('3d'); // Default to 3D

    return (
        <div className="h-screen flex flex-col bg-black text-white overflow-hidden">
            {/* Navigation Bar */}
            <nav className="bg-black/80 backdrop-blur-lg border-b border-gray-800 px-6 py-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2">
                        <Globe className="w-6 h-6 text-blue-400" />
                        <span className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            Orbital Guard AI
                        </span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link to="/" className="text-sm text-gray-300 hover:text-white transition">Home</Link>
                        <Link to="/about" className="text-sm text-gray-300 hover:text-white transition">About</Link>
                        <Link to="/analytics" className="text-sm text-gray-300 hover:text-white transition">Analytics</Link>
                        <span className="text-sm text-white font-semibold">Dashboard</span>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 bg-gray-950 border-r border-gray-800 flex flex-col">
                    {/* Header */}
                    <div className="p-6 border-b border-gray-800">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                <Activity className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                                    Orbital Guard AI
                                </h1>
                                <p className="text-xs text-gray-500">Space Debris Monitoring</p>
                            </div>
                        </div>

                        {/* Enhanced Status Panel */}
                        <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 rounded-lg p-4 border border-gray-700">
                            <h2 className="text-xs font-semibold text-gray-400 uppercase mb-3 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-green-400" />
                                System Status
                                <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            </h2>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-blue-900/20 rounded p-2 border border-blue-500/20">
                                    <div className="text-[10px] text-blue-400 mb-1">TRACKED OBJECTS</div>
                                    <div className="text-2xl font-bold font-mono text-blue-300">18</div>
                                </div>
                                <div className="bg-green-900/20 rounded p-2 border border-green-500/20">
                                    <div className="text-[10px] text-green-400 mb-1">ACTIVE SATS</div>
                                    <div className="text-2xl font-bold font-mono text-green-300">3</div>
                                </div>
                                <div className="bg-purple-900/20 rounded p-2 border border-purple-500/20">
                                    <div className="text-[10px] text-purple-400 mb-1">PROPAGATOR</div>
                                    <div className="text-sm font-bold font-mono text-purple-300">SGP4/JS</div>
                                </div>
                                <div className="bg-yellow-900/20 rounded p-2 border border-yellow-500/20">
                                    <div className="text-[10px] text-yellow-400 mb-1">STATUS</div>
                                    <div className="text-sm font-bold font-mono text-yellow-300">LIVE</div>
                                </div>
                            </div>

                            {/* Risk Gauge */}
                            <div className="mt-3 pt-3 border-t border-gray-700">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] text-gray-400">COLLISION RISK</span>
                                    <span className="text-xs font-mono text-green-400">
                                        {alerts.length > 0 ? 'ELEVATED' : 'LOW'}
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-500 ${alerts.length > 2 ? 'bg-red-500 w-3/4' :
                                            alerts.length > 0 ? 'bg-yellow-500 w-1/2' :
                                                'bg-green-500 w-1/4'
                                            }`}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        {/* Selected Object Info */}
                        {selectedSat ? (
                            <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-500/30">
                                <h2 className="text-sm font-bold text-blue-300 flex items-center gap-2 mb-3">
                                    <Satellite className="w-4 h-4" /> {selectedSat.name}
                                </h2>
                                <div className="space-y-2 text-xs font-mono text-gray-300">
                                    <div className="flex justify-between">
                                        <span>NORAD ID:</span>
                                        <span>{selectedSat.id}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Type:</span>
                                        <span className={selectedSat.type === 'debris' ? 'text-red-400' : 'text-green-400'}>
                                            {selectedSat.type.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Epoch:</span>
                                        <span className="text-xs opacity-70">Real-time SGP4</span>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-blue-500/20">
                                        <div className="text-gray-500 mb-1 text-[10px]">TLE Line 1</div>
                                        <div className="text-[9px] opacity-50 break-all">{selectedSat.tle1.substring(0, 40)}...</div>
                                    </div>
                                    <div className="mt-1">
                                        <div className="text-gray-500 mb-1 text-[10px]">TLE Line 2</div>
                                        <div className="text-[9px] opacity-50 break-all">{selectedSat.tle2.substring(0, 40)}...</div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-600 text-sm border-2 border-dashed border-gray-800 rounded-lg">
                                Select an object to view telemetry
                            </div>
                        )}

                        {/* Alerts Panel */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-2">
                                    <AlertTriangle className="w-3 h-3 text-red-500" />
                                    Active Alerts
                                    {alerts.length > 0 && (
                                        <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-[10px] font-bold animate-pulse">
                                            {alerts.length}
                                        </span>
                                    )}
                                </h2>
                                {alerts.length > 0 && (
                                    <button
                                        onClick={() => setAlerts([])}
                                        className="text-xs text-gray-500 hover:text-gray-300 transition"
                                    >
                                        Clear
                                    </button>
                                )}
                            </div>
                            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                                {alerts.length > 0 ? (
                                    alerts.map((alert, i) => (
                                        <div
                                            key={i}
                                            className="bg-red-900/20 border border-red-500/30 p-2 rounded text-xs text-red-200 font-mono animate-pulse hover:bg-red-900/30 transition group relative"
                                        >
                                            <div className="flex items-start gap-2">
                                                <span className="text-red-400 flex-shrink-0">🔴</span>
                                                <span className="flex-1">{alert}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="bg-green-900/10 border border-green-500/20 p-3 rounded text-center">
                                        <div className="text-2xl mb-1">✅</div>
                                        <div className="text-xs text-green-400 font-semibold">All Clear</div>
                                        <div className="text-[10px] text-gray-500 mt-1">No collision risks detected</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Voice Control Section */}
                        <div className="space-y-2">
                            <h2 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-2">
                                🎤 Voice Control
                            </h2>
                            <div className="scale-90 origin-top-left -ml-2">
                                <VoiceControl onCommand={(cmd, action) => {
                                    notify(`Voice: ${action}`, 'info');
                                }} />
                            </div>
                        </div>

                        {/* Capture Mechanisms Section - Compact */}
                        <div className="space-y-2">
                            <h2 className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-2">
                                🎯 Capture Methods
                            </h2>
                            <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="bg-blue-900/20 p-2 rounded border border-blue-500/20">
                                        <div className="text-blue-400 font-semibold mb-1">Net</div>
                                        <div className="text-gray-400 text-[10px]">85% • 5m</div>
                                    </div>
                                    <div className="bg-purple-900/20 p-2 rounded border border-purple-500/20">
                                        <div className="text-purple-400 font-semibold mb-1">Harpoon</div>
                                        <div className="text-gray-400 text-[10px]">75% • 10m</div>
                                    </div>
                                    <div className="bg-pink-900/20 p-2 rounded border border-pink-500/20">
                                        <div className="text-pink-400 font-semibold mb-1">Magnetic</div>
                                        <div className="text-gray-400 text-[10px]">95% • 3m</div>
                                    </div>
                                    <div className="bg-green-900/20 p-2 rounded border border-green-500/20">
                                        <div className="text-green-400 font-semibold mb-1">Robotic</div>
                                        <div className="text-gray-400 text-[10px]">98% • 2m</div>
                                    </div>
                                </div>
                                <Link
                                    to="/features"
                                    className="mt-2 block text-center text-xs text-blue-400 hover:text-blue-300 transition"
                                >
                                    View Full Details →
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 border-t border-gray-800 text-xs text-center text-gray-600">
                        <div className="font-semibold text-gray-500">Orbital Guard AI</div>
                        <div className="mt-1">Space Debris Detection & Avoidance System v1.0</div>
                        <div className="mt-1 text-[10px] text-gray-700">Powered by SGP4 • Real-time Orbital Mechanics</div>
                    </div>
                </div>

                {/* Main Visualization - Scrollable */}
                <div className="flex-1 overflow-y-auto bg-black relative">
                    {/* View Mode Switcher */}
                    <div className="absolute top-4 left-4 z-10 bg-black/70 backdrop-blur-lg border border-gray-700 rounded-lg p-2 flex gap-2">
                        <button
                            onClick={() => setViewMode('2d')}
                            className={`px-3 py-2 rounded text-xs font-semibold transition flex items-center gap-2 ${viewMode === '2d'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                            title="2D Canvas View"
                        >
                            <Layers className="w-4 h-4" />
                            2D
                        </button>
                        <button
                            onClick={() => setViewMode('3d')}
                            className={`px-3 py-2 rounded text-xs font-semibold transition flex items-center gap-2 ${viewMode === '3d'
                                ? 'bg-purple-600 text-white'
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                            title="3D WebGL View (Google Earth Style)"
                        >
                            <Globe className="w-4 h-4" />
                            3D
                        </button>
                    </div>

                    {/* 3D/2D Visualization Container */}
                    <div className="relative h-screen">
                        {/* Render appropriate scene */}
                        {viewMode === '2d' ? (
                            <SimulationScene
                                onSelectSat={setSelectedSat}
                                onAlert={setAlerts}
                            />
                        ) : (
                            <SimulationScene3D
                                onSelectSat={setSelectedSat}
                                onAlert={setAlerts}
                            />
                        )}

                        {/* Overlay Controls */}
                        <div className="absolute top-4 right-4 flex gap-2">
                            <div className="bg-black/50 backdrop-blur px-3 py-1 rounded border border-gray-700 text-xs font-mono">
                                <span className="text-gray-400">MODE:</span> {viewMode.toUpperCase()}
                            </div>
                            <div className="bg-black/50 backdrop-blur px-3 py-1 rounded border border-gray-700 text-xs font-mono">
                                <span className="text-gray-400">FOV:</span> 45°
                            </div>
                            <div className="bg-black/50 backdrop-blur px-3 py-1 rounded border border-gray-700 text-xs font-mono">
                                <span className="text-gray-400">CAM:</span> ORBIT
                            </div>
                        </div>
                    </div>

                    {/* Advanced Analytics Panel */}
                    <AdvancedAnalyticsPanel
                        onSelectConjunction={(conjunction) => {
                            // TODO: Focus 3D view on selected conjunction
                            console.log('Selected conjunction:', conjunction);

                            // Trigger notification
                            notify({
                                type: conjunction.risk_level.toLowerCase() as any,
                                title: `${conjunction.risk_level} Risk Conjunction`,
                                message: `${conjunction.satellite_name} vs ${conjunction.debris_name} - PoC: ${(conjunction.poc_ml * 100).toFixed(4)}%`,
                                conjunctionId: conjunction.conjunction_id
                            });
                        }}
                    />
                </div>
            </div>

            {/* Notification System */}
            <NotificationSystem />
        </div>
    );
}

export default App;
