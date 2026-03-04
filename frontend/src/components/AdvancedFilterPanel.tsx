/**
 * Advanced Filter Panel for deck.gl Analytics
 * 
 * Multi-dimensional filtering UI for conjunction data
 */

import React, { useState } from 'react';

export interface FilterState {
    timeRange: [number, number]; // Unix timestamps
    riskLevels: Set<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>;
    altitudeRange: [number, number]; // km
    pocThreshold: number; // 0-1
    satelliteTypes: Set<'ACTIVE' | 'DEBRIS'>;
}

export interface AdvancedFilterPanelProps {
    visible: boolean;
    filters: FilterState;
    onFiltersChange: (filters: FilterState) => void;
    onClose: () => void;
    onReset: () => void;
}

export const DEFAULT_FILTERS: FilterState = {
    timeRange: [Date.now() - 86400000, Date.now()], // Last 24h
    riskLevels: new Set(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    altitudeRange: [0, 2000], // LEO range
    pocThreshold: 0,
    satelliteTypes: new Set(['ACTIVE', 'DEBRIS'])
};

export default function AdvancedFilterPanel({
    visible,
    filters,
    onFiltersChange,
    onClose,
    onReset
}: AdvancedFilterPanelProps) {
    if (!visible) return null;

    const handleRiskLevelToggle = (level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') => {
        const newRiskLevels = new Set(filters.riskLevels);
        if (newRiskLevels.has(level)) {
            newRiskLevels.delete(level);
        } else {
            newRiskLevels.add(level);
        }
        onFiltersChange({ ...filters, riskLevels: newRiskLevels });
    };

    const handleSatelliteTypeToggle = (type: 'ACTIVE' | 'DEBRIS') => {
        const newTypes = new Set(filters.satelliteTypes);
        if (newTypes.has(type)) {
            newTypes.delete(type);
        } else {
            newTypes.add(type);
        }
        onFiltersChange({ ...filters, satelliteTypes: newTypes });
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div
            style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                backgroundColor: 'rgba(10, 25, 47, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                minWidth: '300px',
                maxWidth: '350px',
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 255, 0.1)',
                zIndex: 2000,
                maxHeight: '85vh',
                overflowY: 'auto'
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                borderBottom: '2px solid rgba(0, 255, 255, 0.3)',
                paddingBottom: '12px'
            }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#00ffff',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    🎛️ Advanced Filters
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
                        lineHeight: '1'
                    }}
                >
                    ×
                </button>
            </div>

            {/* Time Range */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#00ccff' }}>
                    Time Range
                </label>
                <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
                    {formatDate(filters.timeRange[0])} → {formatDate(filters.timeRange[1])}
                </div>
                <input
                    type="range"
                    min="1"
                    max="168"
                    value={(Date.now() - filters.timeRange[0]) / 3600000}
                    onChange={(e) => {
                        const hoursAgo = Number(e.target.value);
                        onFiltersChange({
                            ...filters,
                            timeRange: [Date.now() - hoursAgo * 3600000, Date.now()]
                        });
                    }}
                    style={{ width: '100%', accentColor: '#00ffff' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>
                    <span>1h ago</span>
                    <span>7d ago</span>
                </div>
            </div>

            {/* Risk Levels */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#00ccff' }}>
                    Risk Levels
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((level) => (
                        <label
                            key={level}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                                padding: '8px',
                                borderRadius: '6px',
                                background: filters.riskLevels.has(level)
                                    ? 'rgba(0, 255, 255, 0.2)'
                                    : 'rgba(0, 30, 60, 0.5)',
                                border: `1px solid ${filters.riskLevels.has(level) ? 'rgba(0, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                                transition: 'all 0.2s'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={filters.riskLevels.has(level)}
                                onChange={() => handleRiskLevelToggle(level)}
                                style={{ marginRight: '8px', accentColor: '#00ffff' }}
                            />
                            <span style={{
                                fontSize: '12px',
                                color: level === 'LOW' ? '#4CAF50' :
                                    level === 'MEDIUM' ? '#FFC107' :
                                        level === 'HIGH' ? '#FF9800' : '#F44336'
                            }}>
                                {level}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Altitude Range */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#00ccff' }}>
                    Altitude: {filters.altitudeRange[0]} - {filters.altitudeRange[1]} km
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="range"
                        min="0"
                        max="2000"
                        value={filters.altitudeRange[0]}
                        onChange={(e) => {
                            const min = Number(e.target.value);
                            if (min < filters.altitudeRange[1]) {
                                onFiltersChange({
                                    ...filters,
                                    altitudeRange: [min, filters.altitudeRange[1]]
                                });
                            }
                        }}
                        style={{ flex: 1, accentColor: '#00ffff' }}
                    />
                    <input
                        type="range"
                        min="0"
                        max="2000"
                        value={filters.altitudeRange[1]}
                        onChange={(e) => {
                            const max = Number(e.target.value);
                            if (max > filters.altitudeRange[0]) {
                                onFiltersChange({
                                    ...filters,
                                    altitudeRange: [filters.altitudeRange[0], max]
                                });
                            }
                        }}
                        style={{ flex: 1, accentColor: '#00ffff' }}
                    />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', opacity: 0.6, marginTop: '4px' }}>
                    <span>LEO (160-2000km)</span>
                    <span>MEO (2000+)</span>
                </div>
            </div>

            {/* PoC Threshold */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#00ccff' }}>
                    Min Probability of Collision: {(filters.pocThreshold * 100).toFixed(3)}%
                </label>
                <input
                    type="range"
                    min="0"
                    max="0.001"
                    step="0.00001"
                    value={filters.pocThreshold}
                    onChange={(e) => onFiltersChange({ ...filters, pocThreshold: Number(e.target.value) })}
                    style={{ width: '100%', accentColor: '#00ffff' }}
                />
            </div>

            {/* Satellite Types */}
            <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#00ccff' }}>
                    Object Types
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {(['ACTIVE', 'DEBRIS'] as const).map((type) => (
                        <label
                            key={type}
                            style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                padding: '10px',
                                borderRadius: '6px',
                                background: filters.satelliteTypes.has(type)
                                    ? 'rgba(0, 255, 255, 0.2)'
                                    : 'rgba(0, 30, 60, 0.5)',
                                border: `1px solid ${filters.satelliteTypes.has(type) ? 'rgba(0, 255, 255, 0.5)' : 'rgba(255, 255, 255, 0.1)'}`,
                                transition: 'all 0.2s'
                            }}
                        >
                            <input
                                type="checkbox"
                                checked={filters.satelliteTypes.has(type)}
                                onChange={() => handleSatelliteTypeToggle(type)}
                                style={{ marginRight: '8px', accentColor: '#00ffff' }}
                            />
                            <span style={{ fontSize: '13px' }}>
                                {type === 'ACTIVE' ? '🛰️ Active' : '🗑️ Debris'}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Filter Summary */}
            <div style={{
                padding: '12px',
                background: 'rgba(0, 100, 150, 0.2)',
                borderRadius: '6px',
                marginBottom: '16px',
                border: '1px solid rgba(0, 255, 255, 0.2)'
            }}>
                <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '4px' }}>Active Filters:</div>
                <div style={{ fontSize: '12px', fontWeight: '500' }}>
                    {filters.riskLevels.size} risk levels • {filters.satelliteTypes.size} object types
                </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
                <button
                    onClick={onReset}
                    style={{
                        flex: 1,
                        padding: '10px',
                        background: 'rgba(255, 100, 100, 0.2)',
                        border: '1px solid rgba(255, 100, 100, 0.5)',
                        borderRadius: '6px',
                        color: '#ff6b6b',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 100, 100, 0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 100, 100, 0.2)'}
                >
                    🔄 Reset
                </button>
                <button
                    onClick={onClose}
                    style={{
                        flex: 1,
                        padding: '10px',
                        background: 'rgba(0, 255, 255, 0.2)',
                        border: '1px solid rgba(0, 255, 255, 0.5)',
                        borderRadius: '6px',
                        color: '#00ffff',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 255, 255, 0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 255, 255, 0.2)'}
                >
                    ✓ Apply
                </button>
            </div>
        </div>
    );
}
