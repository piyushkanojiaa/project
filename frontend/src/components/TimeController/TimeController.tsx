import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import './TimeController.css';

interface TimeControllerProps {
    currentTime: Date;
    onTimeChange: (time: Date) => void;
    onSpeedChange: (speed: number) => void;
    isPlaying?: boolean;
    onPlayPauseToggle?: () => void;
}

export const TimeController: React.FC<TimeControllerProps> = ({
    currentTime,
    onTimeChange,
    onSpeedChange,
    isPlaying = false,
    onPlayPauseToggle
}) => {
    const [speed, setSpeed] = useState(1.0);
    const [scrubPosition, setScrubPosition] = useState(0); // -1 to +1 (-24h to +24h)
    const [showFineControl, setShowFineControl] = useState(false);

    // Speed presets (logarithmic scale)
    const speedPresets = [
        { label: '0.0005x', value: 0.0005, icon: '🐌' },
        { label: '0.001x', value: 0.001, icon: '🐛' },
        { label: '0.01x', value: 0.01, icon: '🐢' },
        { label: '0.1x', value: 0.1, icon: '🚶' },
        { label: '0.5x', value: 0.5, icon: '🏃' },
        { label: '1x', value: 1.0, icon: '▶️' },
        { label: '2x', value: 2.0, icon: '⏩' },
        { label: '5x', value: 5.0, icon: '🚄' },
        { label: '10x', value: 10.0, icon: '🚀' }
    ];

    // Quick jump options
    const jumpOptions = [
        { label: '-24h', hours: -24 },
        { label: '-12h', hours: -12 },
        { label: '-6h', hours: -6 },
        { label: '-1h', hours: -1 },
        { label: 'Now', hours: 0 },
        { label: '+1h', hours: 1 },
        { label: '+6h', hours: 6 },
        { label: '+12h', hours: 12 },
        { label: '+24h', hours: 24 }
    ];

    const handleSpeedChange = useCallback((newSpeed: number) => {
        setSpeed(newSpeed);
        onSpeedChange(newSpeed);
    }, [onSpeedChange]);

    const handleScrub = useCallback((position: number) => {
        // Position: -1 (-24h) to +1 (+24h)
        const baseTime = new Date();
        const offset = position * 24 * 60 * 60 * 1000; // milliseconds
        const newTime = new Date(baseTime.getTime() + offset);

        setScrubPosition(position);
        onTimeChange(newTime);
    }, [onTimeChange]);

    const handleQuickJump = useCallback((hours: number) => {
        const newTime = new Date();
        newTime.setHours(newTime.getHours() + hours);

        const position = hours / 24; // Convert to -1 to +1 range
        setScrubPosition(position);
        onTimeChange(newTime);
    }, [onTimeChange]);

    const formatTime = (date: Date): string => {
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    const formatSpeed = (s: number): string => {
        if (s >= 1) {
            return `${s.toFixed(s >= 10 ? 0 : 1)}x`;
        } else if (s >= 0.01) {
            return `${s.toFixed(2)}x`;
        } else {
            return `${s.toFixed(4)}x`;
        }
    };

    return (
        <motion.div
            className="time-controller"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {/* Header */}
            <div className="time-controller-header">
                <h3 className="time-controller-title">
                    <span className="icon">⏱️</span>
                    Time Control
                </h3>
                <div className="current-time">{formatTime(currentTime)}</div>
            </div>

            {/* Playback Controls */}
            <div className="playback-controls">
                <button
                    className={`control-button ${isPlaying ? 'active' : ''}`}
                    onClick={onPlayPauseToggle}
                    title={isPlaying ? 'Pause simulation' : 'Play simulation'}
                >
                    {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>

                <button
                    className="control-button"
                    onClick={() => handleQuickJump(0)}
                    title="Reset to current time"
                >
                    ⏮️ Reset
                </button>

                <button
                    className="control-button secondary"
                    onClick={() => setShowFineControl(!showFineControl)}
                    title="Toggle fine control"
                >
                    ⚙️ {showFineControl ? 'Hide' : 'Fine'}
                </button>
            </div>

            {/* Speed Presets */}
            <div className="speed-section">
                <label className="section-label">Simulation Speed</label>

                <div className="speed-presets">
                    {speedPresets.map((preset) => (
                        <button
                            key={preset.value}
                            className={`speed-preset ${speed === preset.value ? 'active' : ''}`}
                            onClick={() => handleSpeedChange(preset.value)}
                            title={`${preset.label} speed`}
                        >
                            <span className="preset-icon">{preset.icon}</span>
                            <span className="preset-label">{preset.label}</span>
                        </button>
                    ))}
                </div>

                <div className="speed-display">
                    <span className="speed-value">{formatSpeed(speed)}</span>
                    <span className="speed-description">
                        {speed < 0.01 ? 'Ultra Slow' :
                            speed < 0.1 ? 'Very Slow' :
                                speed < 1 ? 'Slow' :
                                    speed === 1 ? 'Real Time' :
                                        speed <= 2 ? 'Fast' :
                                            speed <= 5 ? 'Very Fast' : 'Ultra Fast'}
                    </span>
                </div>
            </div>

            {/* Fine Speed Control */}
            {showFineControl && (
                <motion.div
                    className="fine-control-section"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                >
                    <label className="section-label">Fine Speed Adjustment</label>

                    <div className="fine-slider-container">
                        <span className="slider-label">0.0005x</span>
                        <input
                            type="range"
                            min="-3.3"
                            max="1"
                            step="0.01"
                            value={Math.log10(speed)}
                            onChange={(e) => handleSpeedChange(Math.pow(10, parseFloat(e.target.value)))}
                            className="fine-speed-slider"
                        />
                        <span className="slider-label">10x</span>
                    </div>

                    {/* Precise input */}
                    <div className="precise-input">
                        <input
                            type="number"
                            min="0.0005"
                            max="10"
                            step="0.0001"
                            value={speed}
                            onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (val >= 0.0005 && val <= 10) {
                                    handleSpeedChange(val);
                                }
                            }}
                            className="speed-number-input"
                        />
                    </div>
                </motion.div>
            )}

            {/* Timeline Scrubber */}
            <div className="timeline-section">
                <label className="section-label">Timeline Navigation</label>

                <div className="timeline-labels">
                    <span className="timeline-label-start">-24h</span>
                    <span className="timeline-label-center">NOW</span>
                    <span className="timeline-label-end">+24h</span>
                </div>

                <div className="timeline-scrubber">
                    <div className="timeline-track">
                        <div className="timeline-center-marker" />
                        <input
                            type="range"
                            min="-1"
                            max="1"
                            step="0.001"
                            value={scrubPosition}
                            onChange={(e) => handleScrub(parseFloat(e.target.value))}
                            className="timeline-slider"
                        />
                    </div>
                </div>

                <div className="timeline-position-display">
                    {scrubPosition === 0 ? (
                        <span className="position-text current">Current Time</span>
                    ) : (
                        <span className="position-text">
                            {scrubPosition < 0 ? '-' : '+'}{Math.abs(scrubPosition * 24).toFixed(1)} hours
                        </span>
                    )}
                </div>
            </div>

            {/* Quick Jump Buttons */}
            <div className="quick-jump-section">
                <label className="section-label">Quick Jump</label>

                <div className="quick-jump-buttons">
                    {jumpOptions.map((option) => (
                        <button
                            key={option.hours}
                            className={`quick-jump-button ${option.hours === 0 ? 'current' : ''}`}
                            onClick={() => handleQuickJump(option.hours)}
                            title={`Jump to ${option.label}`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Time Stats */}
            <div className="time-stats">
                <div className="stat-row">
                    <span className="stat-label">Time Offset:</span>
                    <span className="stat-value">
                        {scrubPosition === 0 ? 'None' :
                            `${scrubPosition > 0 ? '+' : ''}${(scrubPosition * 24).toFixed(2)}h`}
                    </span>
                </div>
                <div className="stat-row">
                    <span className="stat-label">Simulation Rate:</span>
                    <span className="stat-value">{formatSpeed(speed)}</span>
                </div>
            </div>
        </motion.div>
    );
};

export default TimeController;
