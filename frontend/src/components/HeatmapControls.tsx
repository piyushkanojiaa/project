/**
 * Heatmap Controls Component
 * 
 * UI panel for controlling heatmap visualization settings
 */

import React from 'react';
import { HeatmapMode, AltitudeBand } from '../services/heatmapDataService';

export interface HeatmapControlsProps {
    visible: boolean;
    mode: HeatmapMode;
    timeRange: number;
    intensity: number;
    radiusPixels: number;
    opacity: number;
    altitudeBand: AltitudeBand;
    colorScheme: 'fire' | 'cool' | 'rainbow';
    showHexagons: boolean;
    showScatter: boolean;
    onModeChange: (mode: HeatmapMode) => void;
    onTimeRangeChange: (hours: number) => void;
    onIntensityChange: (intensity: number) => void;
    onRadiusChange: (radius: number) => void;
    onOpacityChange: (opacity: number) => void;
    onAltitudeBandChange: (band: AltitudeBand) => void;
    onColorSchemeChange: (scheme: 'fire' | 'cool' | 'rainbow') => void;
    onShowHexagonsChange: (show: boolean) => void;
    onShowScatterChange: (show: boolean) => void;
    onClose: () => void;
}

export default function HeatmapControls({
    visible,
    mode,
    timeRange,
    intensity,
    radiusPixels,
    opacity,
    altitudeBand,
    colorScheme,
    showHexagons,
    showScatter,
    onModeChange,
    onTimeRangeChange,
    onIntensityChange,
    onRadiusChange,
    onOpacityChange,
    onAltitudeBandChange,
    onColorSchemeChange,
    onShowHexagonsChange,
    onShowScatterChange,
    onClose,
}: HeatmapControlsProps) {
    if (!visible) return null;

    return (
        <div
            style={{
                position: 'absolute',
                top: '80px',
                right: '20px',
                backgroundColor: 'rgba(10, 25, 47, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                minWidth: '280px',
                maxWidth: '320px',
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 255, 0.1)',
                zIndex: 1000,
                maxHeight: '80vh',
                overflowY: 'auto',
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                borderBottom: '2px solid rgba(0, 255, 255, 0.3)',
                paddingBottom: '12px',
            }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#00ffff',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                }}>
                    🔥 Heatmap Settings
                </h3>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '20px',
                        cursor: 'pointer',
                        padding: '0',
                        lineHeight: '1',
                    }}
                >
                    ×
                </button>
            </div>

            {/* Heatmap Mode */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#00ccff' }}>
                    Visualization Mode
                </label>
                <select
                    value={mode}
                    onChange={(e) => onModeChange(e.target.value as HeatmapMode)}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(0, 30, 60, 0.8)',
                        border: '1px solid rgba(0, 255, 255, 0.3)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                        cursor: 'pointer',
                    }}
                >
                    <option value="density">Density Map</option>
                    <option value="risk">Risk Level</option>
                    <option value="altitude">Altitude Distribution</option>
                </select>
            </div>

            {/* Time Range */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#00ccff' }}>
                    Time Range
                </label>
                <select
                    value={timeRange}
                    onChange={(e) => onTimeRangeChange(Number(e.target.value))}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(0, 30, 60, 0.8)',
                        border: '1px solid rgba(0, 255, 255, 0.3)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                        cursor: 'pointer',
                    }}
                >
                    <option value={1}>Last 1 Hour</option>
                    <option value={6}>Last 6 Hours</option>
                    <option value={24}>Last 24 Hours</option>
                    <option value={168}>Last 7 Days</option>
                </select>
            </div>

            {/* Altitude Band */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#00ccff' }}>
                    Altitude Filter
                </label>
                <select
                    value={altitudeBand}
                    onChange={(e) => onAltitudeBandChange(e.target.value as AltitudeBand)}
                    style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(0, 30, 60, 0.8)',
                        border: '1px solid rgba(0, 255, 255, 0.3)',
                        borderRadius: '6px',
                        color: 'white',
                        fontSize: '13px',
                        cursor: 'pointer',
                    }}
                >
                    <option value="ALL">All Altitudes</option>
                    <option value="LEO">LEO (160-2000 km)</option>
                    <option value="MEO">MEO (2000-35786 km)</option>
                    <option value="GEO">GEO (35786+ km)</option>
                </select>
            </div>

            {/* Color Scheme */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#00ccff' }}>
                    Color Gradient
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {(['fire', 'cool', 'rainbow'] as const).map((scheme) => (
                        <button
                            key={scheme}
                            onClick={() => onColorSchemeChange(scheme)}
                            style={{
                                flex: 1,
                                padding: '6px',
                                backgroundColor: colorScheme === scheme ? 'rgba(0, 255, 255, 0.3)' : 'rgba(0, 30, 60, 0.8)',
                                border: '1px solid rgba(0, 255, 255, 0.3)',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: '12px',
                                cursor: 'pointer',
                                textTransform: 'capitalize',
                            }}
                        >
                            {scheme}
                        </button>
                    ))}
                </div>
            </div>

            {/* Intensity Slider */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#00ccff' }}>
                    Intensity: {(intensity * 100).toFixed(0)}%
                </label>
                <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={intensity}
                    onChange={(e) => onIntensityChange(Number(e.target.value))}
                    style={{
                        width: '100%',
                        accentColor: '#00ffff',
                    }}
                />
            </div>

            {/* Radius Slider */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#00ccff' }}>
                    Point Radius: {radiusPixels}px
                </label>
                <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={radiusPixels}
                    onChange={(e) => onRadiusChange(Number(e.target.value))}
                    style={{
                        width: '100%',
                        accentColor: '#00ffff',
                    }}
                />
            </div>

            {/* Opacity Slider */}
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#00ccff' }}>
                    Opacity: {(opacity * 100).toFixed(0)}%
                </label>
                <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={opacity}
                    onChange={(e) => onOpacityChange(Number(e.target.value))}
                    style={{
                        width: '100%',
                        accentColor: '#00ffff',
                    }}
                />
            </div>

            {/* Layer Toggles */}
            <div style={{
                borderTop: '1px solid rgba(0, 255, 255, 0.2)',
                paddingTop: '12px',
                marginTop: '12px',
            }}>
                <label style={{ display: 'block', marginBottom: '12px', fontWeight: '500', color: '#00ccff' }}>
                    Layer Options
                </label>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                    <input
                        type="checkbox"
                        checked={showScatter}
                        onChange={(e) => onShowScatterChange(e.target.checked)}
                        style={{
                            marginRight: '8px',
                            accentColor: '#00ffff',
                        }}
                    />
                    <span style={{ fontSize: '13px' }}>Show Individual Points</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <input
                        type="checkbox"
                        checked={showHexagons}
                        onChange={(e) => onShowHexagonsChange(e.target.checked)}
                        style={{
                            marginRight: '8px',
                            accentColor: '#00ffff',
                        }}
                    />
                    <span style={{ fontSize: '13px' }}>Show 3D Hexagons</span>
                </div>
            </div>
        </div>
    );
}
