import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, FastForward, Rewind } from 'lucide-react';

interface ConjunctionPlaybackProps {
    conjunction: any;
    onTimeUpdate?: (time: number) => void;
    onPlayStateChange?: (isPlaying: boolean) => void;
}

export const ConjunctionPlayback: React.FC<ConjunctionPlaybackProps> = ({
    conjunction,
    onTimeUpdate,
    onPlayStateChange
}) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [speed, setSpeed] = useState(1); // 1x, 10x, 100x

    // Calculate time range: -15min before TCA to +15min after
    const timeRange = {
        start: -900, // -15 minutes in seconds
        end: 900,    // +15 minutes in seconds
        tca: 0       // TCA at t=0
    };

    const totalDuration = timeRange.end - timeRange.start;

    useEffect(() => {
        let intervalId: number | undefined;

        if (isPlaying) {
            intervalId = window.setInterval(() => {
                setCurrentTime(prev => {
                    const next = prev + (0.1 * speed); // 100ms * speed

                    // Loop back if we reach the end
                    if (next > timeRange.end) {
                        return timeRange.start;
                    }

                    // Notify parent component
                    if (onTimeUpdate) {
                        onTimeUpdate(next);
                    }

                    return next;
                });
            }, 100);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [isPlaying, speed, onTimeUpdate]);

    useEffect(() => {
        if (onPlayStateChange) {
            onPlayStateChange(isPlaying);
        }
    }, [isPlaying, onPlayStateChange]);

    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };

    const handleReset = () => {
        setCurrentTime(timeRange.start);
        setIsPlaying(false);
    };

    const handleSkipToTCA = () => {
        setCurrentTime(timeRange.tca);
    };

    const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percentage = x / rect.width;
        const newTime = timeRange.start + (totalDuration * percentage);
        setCurrentTime(newTime);
    };

    const getProgressPercentage = () => {
        return ((currentTime - timeRange.start) / totalDuration) * 100;
    };

    const formatTime = (seconds: number) => {
        const absSeconds = Math.abs(seconds);
        const mins = Math.floor(absSeconds / 60);
        const secs = Math.floor(absSeconds % 60);
        const sign = seconds < 0 ? '-' : '+';
        return `${sign}${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const speedOptions = [
        { value: 1, label: '1x' },
        { value: 10, label: '10x' },
        { value: 100, label: '100x' },
        { value: 1000, label: '1000x' }
    ];

    return (
        <div className="bg-gradient-to-br from-gray-900/95 to-gray-800/95 backdrop-blur-lg border border-gray-700 rounded-lg p-6">
            {/* Header */}
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">Conjunction Playback</h3>
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">
                        {conjunction.satellite_name} vs {conjunction.debris_name}
                    </span>
                    <span className={`font-semibold ${Math.abs(currentTime) < 60 ? 'text-red-400' : 'text-gray-300'
                        }`}>
                        TCA {formatTime(currentTime)}
                    </span>
                </div>
            </div>

            {/* Timeline */}
            <div className="mb-6">
                <div
                    className="relative h-12 bg-gray-800 rounded-lg cursor-pointer overflow-hidden"
                    onClick={handleTimelineClick}
                >
                    {/* Progress bar */}
                    <div
                        className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-purple-600 transition-all"
                        style={{ width: `${getProgressPercentage()}%` }}
                    />

                    {/* TCA marker */}
                    <div
                        className="absolute inset-y-0 w-1 bg-red-500"
                        style={{ left: '50%' }}
                    >
                        <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-2 py-0.5 rounded whitespace-nowrap">
                            TCA
                        </div>
                    </div>

                    {/* Current time marker */}
                    <div
                        className="absolute inset-y-0 w-1 bg-white shadow-lg"
                        style={{ left: `${getProgressPercentage()}%` }}
                    >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-gray-900 text-xs px-2 py-1 rounded font-semibold whitespace-nowrap shadow-lg">
                            {formatTime(currentTime)}
                        </div>
                    </div>

                    {/* Time labels */}
                    <div className="absolute inset-x-0 bottom-1 flex justify-between px-2 text-xs text-gray-500">
                        <span>-15:00</span>
                        <span>+15:00</span>
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-4">
                {/* Playback buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleReset}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                        title="Reset to start"
                    >
                        <SkipBack className="w-5 h-5 text-white" />
                    </button>

                    <button
                        onClick={() => setCurrentTime(prev => Math.max(timeRange.start, prev - 60))}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                        title="Rewind 1 minute"
                    >
                        <Rewind className="w-5 h-5 text-white" />
                    </button>

                    <button
                        onClick={handlePlayPause}
                        className={`p-3 rounded-lg transition ${isPlaying
                                ? 'bg-orange-600 hover:bg-orange-700'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                        title={isPlaying ? 'Pause' : 'Play'}
                    >
                        {isPlaying ? (
                            <Pause className="w-6 h-6 text-white" />
                        ) : (
                            <Play className="w-6 h-6 text-white" />
                        )}
                    </button>

                    <button
                        onClick={() => setCurrentTime(prev => Math.min(timeRange.end, prev + 60))}
                        className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                        title="Forward 1 minute"
                    >
                        <FastForward className="w-5 h-5 text-white" />
                    </button>

                    <button
                        onClick={handleSkipToTCA}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition"
                        title="Jump to TCA"
                    >
                        <SkipForward className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Speed controls */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">Speed:</span>
                    {speedOptions.map(option => (
                        <button
                            key={option.value}
                            onClick={() => setSpeed(option.value)}
                            className={`px-3 py-1 rounded-lg text-sm font-semibold transition ${speed === option.value
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Info */}
            <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-3 gap-4 text-sm">
                <div>
                    <span className="text-gray-400">Miss Distance:</span>
                    <span className="ml-2 text-white font-semibold">
                        {conjunction.miss_distance.toFixed(3)} km
                    </span>
                </div>
                <div>
                    <span className="text-gray-400">Rel Velocity:</span>
                    <span className="ml-2 text-white font-semibold">
                        {conjunction.relative_velocity.toFixed(2)} km/s
                    </span>
                </div>
                <div>
                    <span className="text-gray-400">PoC:</span>
                    <span className="ml-2 text-white font-semibold">
                        {conjunction.poc_ml.toExponential(2)}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ConjunctionPlayback;
