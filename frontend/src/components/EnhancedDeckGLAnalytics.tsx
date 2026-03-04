/**
 * Enhanced deck.gl Analytics Component
 * 
 * Advanced spatial analytics with filtering, time animation, and multiple layers
 * Alternative to Kepler.gl with full React 18 compatibility
 */

import React, { useState, useMemo } from 'react';
import { DeckGL } from '@deck.gl/react';
import { HeatmapLayer, HexagonLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer, ArcLayer } from '@deck.gl/layers';
import type { PickingInfo } from '@deck.gl/core';
import { getConjunctionAnalysis, type ConjunctionAnalysis } from '../services/api';
import { transformToHeatmapFormat, filterByTimeRange, filterByAltitude, filterByRiskLevel, generateSampleHeatmapData } from '../services/heatmapDataService';
import type { HeatmapPoint } from '../services/heatmapDataService';
import AdvancedFilterPanel, { DEFAULT_FILTERS, type FilterState } from './AdvancedFilterPanel';
import TimelinePlayer from './TimelinePlayer';
import LayerManager, { DEFAULT_LAYER_SETTINGS, type LayerSettings } from './LayerManager';

const SCALE = 0.0001; // Coordinate scaling

export default function EnhancedDeckGLAnalytics() {
    const [conjunctionData, setConjunctionData] = useState<ConjunctionAnalysis[]>([]);
    const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);

    // UI State
    const [showFilters, setShowFilters] = useState(false);
    const [showTimeline, setShowTimeline] = useState(false);
    const [showLayers, setShowLayers] = useState(false);

    // Filter State
    const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);

    // Timeline State
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);

    // Layer State
    const [layerSettings, setLayerSettings] = useState<LayerSettings>(DEFAULT_LAYER_SETTINGS);

    // deck.gl view state
    const [viewState, setViewState] = useState({
        longitude: 0,
        latitude: 0,
        zoom: 1,
        pitch: 45,
        bearing: 0
    });

    // Load data on mount
    React.useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await getConjunctionAnalysis();
            setConjunctionData(data);
            const points = transformToHeatmapFormat(data);
            setHeatmapPoints(points);
        } catch (error) {
            console.warn('API unavailable, using sample data:', error);
            const samplePoints = generateSampleHeatmapData(200);
            setHeatmapPoints(samplePoints);
        }
    };

    // Apply filters to data
    const filteredPoints = useMemo(() => {
        let points = [...heatmapPoints];

        // Time filter
        points = filterByTimeRange(points, filters.timeRange[0], filters.timeRange[1]);

        // Risk level filter
        points = points.filter(p => filters.riskLevels.has(p.riskLevel));

        // Altitude filter
        points = filterByAltitude(points, filters.altitudeRange[0], filters.altitudeRange[1]);

        // PoC threshold filter
        points = points.filter(p => p.weight >= filters.pocThreshold);

        // Timeline filter (if playing)
        if (showTimeline) {
            const timeWindow = 3600000; // 1 hour window
            points = points.filter(p =>
                p.timestamp >= currentTime - timeWindow &&
                p.timestamp <= currentTime + timeWindow
            );
        }

        return points;
    }, [heatmapPoints, filters, showTimeline, currentTime]);

    // Create layers based on settings
    const layers = useMemo(() => {
        const layerList = [];

        // Heatmap Layer
        if (layerSettings.heatmap.visible) {
            layerList.push(
                new HeatmapLayer({
                    id: 'heatmap-layer',
                    data: filteredPoints,
                    getPosition: (d) => [d.position[0] * SCALE, d.position[2] * SCALE, -d.position[1] * SCALE],
                    getWeight: (d) => d.weight,
                    radiusPixels: 30,
                    intensity: 1,
                    threshold: 0.03,
                    opacity: layerSettings.heatmap.opacity,
                    colorRange: [
                        [76, 175, 80],    // Green
                        [255, 193, 7],    // Yellow
                        [255, 152, 0],    // Orange
                        [244, 67, 54]     // Red
                    ]
                })
            );
        }

        // Scatterplot Layer
        if (layerSettings.scatter.visible) {
            layerList.push(
                new ScatterplotLayer({
                    id: 'scatter-layer',
                    data: filteredPoints,
                    getPosition: (d) => [d.position[0] * SCALE, d.position[2] * SCALE, -d.position[1] * SCALE],
                    getFillColor: (d) => {
                        const colors = {
                            LOW: [76, 175, 80],
                            MEDIUM: [255, 193, 7],
                            HIGH: [255, 152, 0],
                            CRITICAL: [244, 67, 54]
                        };
                        return [...colors[d.riskLevel], 200];
                    },
                    getRadius: (d) => d.weight * 50,
                    radiusMinPixels: 3,
                    radiusMaxPixels: 30,
                    opacity: layerSettings.scatter.opacity,
                    pickable: true
                })
            );
        }

        // Hexagon Layer
        if (layerSettings.hexagon.visible) {
            layerList.push(
                new HexagonLayer({
                    id: 'hexagon-layer',
                    data: filteredPoints,
                    getPosition: (d) => [d.position[0] * SCALE, d.position[2] * SCALE],
                    radius: 50000,
                    elevationScale: 1000,
                    extruded: true,
                    opacity: layerSettings.hexagon.opacity,
                    colorRange: [
                        [255, 255, 178],
                        [254, 204, 92],
                        [253, 141, 60],
                        [240, 59, 32],
                        [189, 0, 38]
                    ]
                })
            );
        }

        // Arc Layer (conjunction connections)
        if (layerSettings.arc.visible && conjunctionData.length > 0) {
            const arcData = conjunctionData.slice(0, 50).map(c => ({
                source: c.satellite_position || [6871, 0, 0],
                target: c.debris_position || [6871 + Math.random() * 100, Math.random() * 100, Math.random() * 100],
                riskLevel: c.risk_level
            }));

            layerList.push(
                new ArcLayer({
                    id: 'arc-layer',
                    data: arcData,
                    getSourcePosition: (d) => [d.source[0] * SCALE, d.source[2] * SCALE, -d.source[1] * SCALE],
                    getTargetPosition: (d) => [d.target[0] * SCALE, d.target[2] * SCALE, -d.target[1] * SCALE],
                    getSourceColor: [0, 255, 255],
                    getTargetColor: (d) => {
                        const colors = {
                            LOW: [76, 175, 80],
                            MEDIUM: [255, 193, 7],
                            HIGH: [255, 152, 0],
                            CRITICAL: [244, 67, 54]
                        };
                        return colors[d.riskLevel as keyof typeof colors];
                    },
                    getWidth: 2,
                    opacity: layerSettings.arc.opacity
                })
            );
        }

        return layerList;
    }, [filteredPoints, layerSettings, conjunctionData]);

    const handleTooltip = (info: PickingInfo) => {
        if (!info.object) return null;

        const point = info.object as HeatmapPoint;
        return {
            html: `
        <div style="padding: 8px; background: rgba(0, 0, 0, 0.8); color: white; border-radius: 4px; font-family: monospace; font-size: 11px;">
          <strong>Conjunction Event</strong><br/>
          Risk: ${point.riskLevel}<br/>
          Weight: ${(point.weight * 100).toFixed(3)}%<br/>
          Altitude: ${point.altitude.toFixed(0)} km<br/>
          Time: ${new Date(point.timestamp).toLocaleString()}
        </div>
      `,
            style: {
                backgroundColor: 'transparent',
                border: 'none'
            }
        };
    };

    return (
        <div style={{ position: 'relative', width: '100%', height: '800px', borderRadius: '12px', overflow: 'hidden', background: '#000' }}>
            {/* deck.gl Map */}
            <DeckGL
                initialViewState={viewState}
                controller={true}
                layers={layers}
                getTooltip={handleTooltip}
                onViewStateChange={({ viewState: newViewState }) => setViewState(newViewState as any)}
            >
                {/* Dark basemap background */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'radial-gradient(circle at center, #0a1929 0%, #000510 100%)',
                    zIndex: -1
                }} />
            </DeckGL>

            {/* Control Buttons */}
            <div style={{
                position: 'absolute',
                top: '20px',
                left: showFilters ? '380px' : '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                transition: 'left 0.3s',
                zIndex: 1500
            }}>
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    style={{
                        padding: '10px 16px',
                        background: showFilters ? 'rgba(0, 255, 255, 0.3)' : 'rgba(10, 25, 47, 0.9)',
                        border: `1px solid ${showFilters ? 'rgba(0, 255, 255, 0.6)' : 'rgba(0, 255, 255, 0.3)'}`,
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s'
                    }}
                >
                    {showFilters ? '✓ Filters' : '🎛️ Filters'}
                </button>

                <button
                    onClick={() => setShowTimeline(!showTimeline)}
                    style={{
                        padding: '10px 16px',
                        background: showTimeline ? 'rgba(0, 255, 255, 0.3)' : 'rgba(10, 25, 47, 0.9)',
                        border: `1px solid ${showTimeline ? 'rgba(0, 255, 255, 0.6)' : 'rgba(0, 255, 255, 0.3)'}`,
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s'
                    }}
                >
                    {showTimeline ? '✓ Timeline' : '⏱️ Timeline'}
                </button>

                <button
                    onClick={() => setShowLayers(!showLayers)}
                    style={{
                        padding: '10px 16px',
                        background: showLayers ? 'rgba(0, 255, 255, 0.3)' : 'rgba(10, 25, 47, 0.9)',
                        border: `1px solid ${showLayers ? 'rgba(0, 255, 255, 0.6)' : 'rgba(0, 255, 255, 0.3)'}`,
                        borderRadius: '8px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '600',
                        backdropFilter: 'blur(10px)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                        transition: 'all 0.2s'
                    }}
                >
                    {showLayers ? '✓ Layers' : '🗂️ Layers'}
                </button>
            </div>

            {/* Stats Display */}
            <div style={{
                position: 'absolute',
                bottom: showTimeline ? '130px' : '20px',
                right: showLayers ? '340px' : '20px',
                background: 'rgba(10, 25, 47, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '8px',
                padding: '12px 16px',
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                fontSize: '12px',
                transition: 'all 0.3s',
                zIndex: 1500
            }}>
                <div style={{ fontWeight: '600', color: '#00ffff', marginBottom: '4px' }}>
                    📊 Data Stats
                </div>
                <div style={{ opacity: 0.9 }}>
                    {filteredPoints.length} events displayed
                </div>
            </div>

            {/* Panels */}
            <AdvancedFilterPanel
                visible={showFilters}
                filters={filters}
                onFiltersChange={setFilters}
                onClose={() => setShowFilters(false)}
                onReset={() => setFilters(DEFAULT_FILTERS)}
            />

            <TimelinePlayer
                visible={showTimeline}
                timeRange={[filters.timeRange[0], filters.timeRange[1]]}
                currentTime={currentTime}
                isPlaying={isPlaying}
                playbackSpeed={playbackSpeed}
                onTimeChange={setCurrentTime}
                onPlayPause={() => setIsPlaying(!isPlaying)}
                onSpeedChange={setPlaybackSpeed}
                onReset={() => setCurrentTime(filters.timeRange[0])}
            />

            <LayerManager
                visible={showLayers}
                layers={layerSettings}
                onLayersChange={setLayerSettings}
                onClose={() => setShowLayers(false)}
            />
        </div>
    );
}
