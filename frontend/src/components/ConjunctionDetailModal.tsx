import React, { useEffect, useRef } from 'react';
import { X, AlertTriangle, Target, Fuel, Clock, Download } from 'lucide-react';
import ConjunctionPlayback from './ConjunctionPlayback';

interface ConjunctionDetailModalProps {
    conjunction: any;
    isOpen: boolean;
    onClose: () => void;
}

export const ConjunctionDetailModal: React.FC<ConjunctionDetailModalProps> = ({
    conjunction,
    isOpen,
    onClose
}) => {
    const [animationTime, setAnimationTime] = React.useState(0);

    useEffect(() => {
        // Prevent body scroll when modal is open
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !conjunction) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const getRiskColor = (level: string) => {
        switch (level) {
            case 'CRITICAL': return '#ef4444';
            case 'HIGH': return '#f97316';
            case 'MEDIUM': return '#eab308';
            default: return '#22c55e';
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={handleBackdropClick}
        >
            <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <div className="flex items-center gap-4">
                        <div
                            className="w-3 h-3 rounded-full animate-pulse"
                            style={{ backgroundColor: getRiskColor(conjunction.risk_level) }}
                        />
                        <div>
                            <h2 className="text-2xl font-bold text-white">Conjunction Event</h2>
                            <p className="text-gray-400 text-sm mt-1">
                                {conjunction.satellite_name} vs {conjunction.debris_name}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                window.open(`http://localhost:8000/api/conjunctions/${conjunction.conjunction_id}/report`, '_blank');
                            }}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition flex items-center gap-2"
                        >
                            <Download className="w-4 h-4" />
                            <span>Download PDF Report</span>
                        </button>

                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-700 rounded-lg transition"
                        >
                            <X className="w-6 h-6 text-gray-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column: Details */}
                        <div className="space-y-6">
                            {/* Risk Level Card */}
                            <div
                                className="p-6 rounded-lg border-2"
                                style={{
                                    backgroundColor: `${getRiskColor(conjunction.risk_level)}15`,
                                    borderColor: getRiskColor(conjunction.risk_level)
                                }}
                            >
                                <div className="flex items-center gap-3 mb-4">
                                    <AlertTriangle
                                        className="w-8 h-8"
                                        style={{ color: getRiskColor(conjunction.risk_level) }}
                                    />
                                    <div>
                                        <h3 className="text-lg font-bold text-white">
                                            {conjunction.risk_level} RISK
                                        </h3>
                                        <p className="text-sm text-gray-300">Collision Probability</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-400">Foster 3D PoC:</span>
                                        <p className="text-white font-mono font-semibold">
                                            {conjunction.poc_analytic.toExponential(3)}
                                        </p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">ML Prediction:</span>
                                        <p className="text-white font-mono font-semibold">
                                            {conjunction.poc_ml.toExponential(3)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Orbital Parameters */}
                            <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                    <Target className="w-5 h-5 text-blue-400" />
                                    Orbital Parameters
                                </h3>

                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Miss Distance:</span>
                                        <span className="text-white font-semibold">
                                            {conjunction.miss_distance.toFixed(3)} km
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Relative Velocity:</span>
                                        <span className="text-white font-semibold">
                                            {conjunction.relative_velocity.toFixed(2)} km/s
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Time to TCA:</span>
                                        <span className="text-white font-semibold">
                                            {(conjunction.time_to_tca / 3600).toFixed(2)} hours
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Crossing Angle:</span>
                                        <span className="text-white font-semibold">
                                            {conjunction.crossing_angle?.toFixed(1) || 'N/A'}°
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Maneuver Info */}
                            {conjunction.maneuver_required && (
                                <div className="bg-amber-900/30 p-6 rounded-lg border-2 border-amber-500/50">
                                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                                        <Fuel className="w-5 h-5 text-amber-400" />
                                        Maneuver Required
                                    </h3>

                                    <div className="space-y-2 text-sm">
                                        <p className="text-amber-200">
                                            A collision avoidance maneuver is recommended to reduce risk.
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-amber-500/30">
                                            <div className="flex justify-between text-amber-100">
                                                <span>Estimated ΔV Required:</span>
                                                <span className="font-semibold">~0.5 m/s</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column: 3D Visualization Placeholder */}
                        <div className="space-y-6">
                            <div className="bg-black/50 rounded-lg border border-gray-700 p-8 h-64 flex items-center justify-center">
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto mb-4 animate-pulse" />
                                    <p className="text-gray-400 text-sm">3D Visualization</p>
                                    <p className="text-gray-500 text-xs mt-1">
                                        Animation at: {animationTime.toFixed(1)}s from TCA
                                    </p>
                                </div>
                            </div>

                            {/* Objects Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-900/30 p-4 rounded-lg border border-blue-500/30">
                                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                        Primary
                                    </h4>
                                    <p className="text-blue-200 text-sm">{conjunction.satellite_name}</p>
                                    <p className="text-blue-300 text-xs mt-1">ID: {conjunction.satellite_id}</p>
                                </div>

                                <div className="bg-red-900/30 p-4 rounded-lg border border-red-500/30">
                                    <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                                        Secondary
                                    </h4>
                                    <p className="text-red-200 text-sm">{conjunction.debris_name}</p>
                                    <p className="text-red-300 text-xs mt-1">ID: {conjunction.debris_id}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Playback Controls - Full Width */}
                    <div className="mt-6">
                        <ConjunctionPlayback
                            conjunction={conjunction}
                            onTimeUpdate={setAnimationTime}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConjunctionDetailModal;
