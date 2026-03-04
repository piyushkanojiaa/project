/**
 * Timeline Player for Time-Series Animation
 * 
 * Playback controls for animating conjunction events over time
 */

import React, { useState, useEffect, useRef } from 'react';

export interface TimelinePlayerProps {
    visible: boolean;
    timeRange: [number, number]; // Unix timestamps [start, end]
    currentTime: number;
    isPlaying: boolean;
    playbackSpeed: number;
    onTimeChange: (time: number) => void;
    onPlayPause: () => void;
    onSpeedChange: (speed: number) => void;
    onReset: () => void;
}

export default function TimelinePlayer({
    visible,
    timeRange,
    currentTime,
    isPlaying,
    playbackSpeed,
    onTimeChange,
    onPlayPause,
    onSpeedChange,
    onReset
}: TimelinePlayerProps) {
    const animationFrameRef = useRef<number>();
    const lastFrameTimeRef = useRef<number>(Date.now());

    // Animation loop
    useEffect(() => {
        if (!isPlaying) {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            return;
        }

        const animate = () => {
            const now = Date.now();
            const deltaMs = now - lastFrameTimeRef.current;
            lastFrameTimeRef.current = now;

            // Advance time based on playback speed
            const timeIncrement = deltaMs * playbackSpeed;
            const newTime = currentTime + timeIncrement;

            if (newTime >= timeRange[1]) {
                // Loop back to start
                onTimeChange(timeRange[0]);
            } else {
                onTimeChange(newTime);
            }

            animationFrameRef.current = requestAnimationFrame(animate);
        };

        animationFrameRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isPlaying, currentTime, playbackSpeed, timeRange, onTimeChange]);

    if (!visible) return null;

    const progress = ((currentTime - timeRange[0]) / (timeRange[1] - timeRange[0])) * 100;

    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDuration = (ms: number) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);
        return `${hours}h ${minutes}m ${seconds}s`;
    };

    return (
        <div
            style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(10, 25, 47, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '16px 24px',
                minWidth: '600px',
                maxWidth: '800px',
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 255, 0.1)',
                zIndex: 2000
            }}
        >
            {/* Timeline Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                fontSize: '12px',
                opacity: 0.8
            }}>
                <div style={{ fontWeight: '600', color: '#00ffff' }}>
                    ⏱️ Timeline Playback
                </div>
                <div>
                    Duration: {formatDuration(timeRange[1] - timeRange[0])}
                </div>
            </div>

            {/* Time Scrubber */}
            <div style={{ marginBottom: '16px' }}>
                <div style={{
                    position: 'relative',
                    height: '6px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    marginBottom: '8px'
                }}>
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: `${progress}%`,
                            background: 'linear-gradient(90deg, #00ffff, #00ccff)',
                            transition: isPlaying ? 'none' : 'width 0.1s'
                        }}
                    />
                </div>

                <input
                    type="range"
                    min={timeRange[0]}
                    max={timeRange[1]}
                    value={currentTime}
                    onChange={(e) => onTimeChange(Number(e.target.value))}
                    style={{
                        width: '100%',
                        accentColor: '#00ffff',
                        cursor: 'pointer'
                    }}
                />

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '11px',
                    opacity: 0.7,
                    marginTop: '4px'
                }}>
                    <span>{formatTime(timeRange[0])}</span>
                    <span style={{ color: '#00ffff', fontWeight: '600' }}>{formatTime(currentTime)}</span>
                    <span>{formatTime(timeRange[1])}</span>
                </div>
            </div>

            {/* Playback Controls */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                {/* Step Back */}
                <button
                    onClick={() => onTimeChange(Math.max(timeRange[0], currentTime - 60000))}
                    style={{
                        padding: '8px 12px',
                        background: 'rgba(0, 30, 60, 0.8)',
                        border: '1px solid rgba(0, 255, 255, 0.3)',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '16px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 50, 80, 0.9)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 30, 60, 0.8)'}
                    title="Step back 1 minute"
                >
                    ⏮️
                </button>

                {/* Play/Pause */}
                <button
                    onClick={onPlayPause}
                    style={{
                        padding: '12px 24px',
                        background: isPlaying
                            ? 'linear-gradient(135deg, #ff6b6b, #ff8e53)'
                            : 'linear-gradient(135deg, #00ffff, #00ccff)',
                        border: 'none',
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '18px',
                        fontWeight: '600',
                        boxShadow: '0 4px 12px rgba(0, 255, 255, 0.3)',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                    {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                </button>

                {/* Step Forward */}
                <button
                    onClick={() => onTimeChange(Math.min(timeRange[1], currentTime + 60000))}
                    style={{
                        padding: '8px 12px',
                        background: 'rgba(0, 30, 60, 0.8)',
                        border: '1px solid rgba(0, 255, 255, 0.3)',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '16px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 50, 80, 0.9)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 30, 60, 0.8)'}
                    title="Step forward 1 minute"
                >
                    ⏭️
                </button>

                {/* Speed Control */}
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>Speed:</span>
                    {[0.5, 1, 2, 5, 10].map((speed) => (
                        <button
                            key={speed}
                            onClick={() => onSpeedChange(speed)}
                            style={{
                                padding: '6px 12px',
                                background: playbackSpeed === speed
                                    ? 'rgba(0, 255, 255, 0.3)'
                                    : 'rgba(0, 30, 60, 0.6)',
                                border: `1px solid ${playbackSpeed === speed ? 'rgba(0, 255, 255, 0.6)' : 'rgba(255, 255, 255, 0.2)'}`,
                                borderRadius: '4px',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: playbackSpeed === speed ? '600' : '400',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => {
                                if (playbackSpeed !== speed) {
                                    e.currentTarget.style.background = 'rgba(0, 50, 80, 0.8)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (playbackSpeed !== speed) {
                                    e.currentTarget.style.background = 'rgba(0, 30, 60, 0.6)';
                                }
                            }}
                        >
                            {speed}x
                        </button>
                    ))}
                </div>

                {/* Reset */}
                <button
                    onClick={onReset}
                    style={{
                        padding: '8px 16px',
                        background: 'rgba(100, 100, 100, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '12px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(150, 150, 150, 0.6)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(100, 100, 100, 0.5)'}
                    title="Reset to start"
                >
                    🔄 Reset
                </button>
            </div>
        </div>
    );
}
