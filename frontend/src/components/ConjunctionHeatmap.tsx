/**
 * Conjunction Heatmap Component
 * 
 * GPU-accelerated heatmap visualization using deck.gl to display
 * conjunction hotspots, satellite density, and risk patterns.
 */

import React, { useMemo, useCallback } from 'react';
import DeckGL from '@deck.gl/react';
import { HeatmapLayer, HexagonLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { COORDINATE_SYSTEM } from '@deck.gl/core';
import type { Color, Position } from '@deck.gl/core';
import { HeatmapPoint, HeatmapMode } from '../services/heatmapDataService';

export interface ConjunctionHeatmapProps {
    points: HeatmapPoint[];
    mode?: HeatmapMode;
    intensity?: number;
    radiusPixels?: number;
    opacity?: number;
    colorRange?: Color[];
    viewState: any;
    onViewStateChange: (viewState: any) => void;
    showHexagons?: boolean;
    showScatter?: boolean;
}

// Color gradients for different visualization modes
const COLOR_RANGES = {
    fire: [
        [255, 255, 204] as Color,  // Light yellow
        [255, 237, 160] as Color,  // Yellow
        [254, 217, 118] as Color,  // Orange-yellow
        [254, 178, 76] as Color,   // Orange
        [253, 141, 60] as Color,   // Dark orange
        [252, 78, 42] as Color,    // Red-orange
        [227, 26, 28] as Color,    // Red
        [189, 0, 38] as Color,     // Dark red
    ],
    cool: [
        [247, 251, 255] as Color,  // Very light blue
        [222, 235, 247] as Color,  // Light blue
        [198, 219, 239] as Color,  // Blue
        [158, 202, 225] as Color,  // Medium blue
        [107, 174, 214] as Color,  // Blue
        [66, 146, 198] as Color,   // Dark blue
        [33, 113, 181] as Color,   // Darker blue
        [8, 69, 148] as Color,     // Very dark blue
    ],
    rainbow: [
        [158, 1, 66] as Color,     // Dark purple
        [213, 62, 79] as Color,    // Red
        [244, 109, 67] as Color,   // Orange
        [253, 174, 97] as Color,   // Light orange
        [254, 224, 139] as Color,  // Yellow
        [230, 245, 152] as Color,  // Light green
        [171, 221, 164] as Color,  // Green
        [102, 194, 165] as Color,  // Cyan
    ],
};

const EARTH_RADIUS = 6371; // km
const SCALE = 0.001; // Scale factor to match Three.js scene

/**
 * Main Conjunction Heatmap Component
 */
export default function ConjunctionHeatmap({
    points,
    mode = 'risk',
    intensity = 1.0,
    radiusPixels = 30,
    opacity = 0.8,
    colorRange = COLOR_RANGES.fire,
    viewState,
    onViewStateChange,
    showHexagons = false,
    showScatter = true,
}: ConjunctionHeatmapProps) {

    // Transform points to deck.gl format (scaled to match Three.js)
    const scaledPoints = useMemo(() => {
        return points.map((point) => ({
            position: [
                point.position[0] * SCALE,
                point.position[2] * SCALE,  // Swap Y and Z for Three.js coordinate system
                -point.position[1] * SCALE,
            ] as Position,
            weight: point.weight,
            radius: radiusPixels,
            color: getRiskColor(point.riskLevel),
        }));
    }, [points, radiusPixels]);

    // Heatmap Layer - Shows density/risk gradients
    const heatmapLayer = useMemo(() => {
        return new HeatmapLayer({
            id: 'conjunction-heatmap',
            data: scaledPoints,
            coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
            getPosition: (d: any) => d.position,
            getWeight: (d: any) => d.weight * intensity,
            radiusPixels: radiusPixels,
            opacity: opacity,
            colorRange: colorRange,
            threshold: 0.05,
            intensity: intensity,
            aggregation: 'SUM',
            pickable: false,
        });
    }, [scaledPoints, intensity, radiusPixels, opacity, colorRange]);

    // Scatterplot Layer - Individual conjunction points
    const scatterLayer = useMemo(() => {
        if (!showScatter) return null;

        return new ScatterplotLayer({
            id: 'conjunction-scatter',
            data: scaledPoints,
            coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
            getPosition: (d: any) => d.position,
            getRadius: (d: any) => d.weight * radiusPixels * 2,
            getFillColor: (d: any) => [...d.color, opacity * 255],
            getLineColor: [255, 255, 255, 100],
            lineWidthMinPixels: 1,
            pickable: true,
            opacity: opacity * 0.6,
            radiusMinPixels: 2,
            radiusMaxPixels: 50,
        });
    }, [scaledPoints, showScatter, radiusPixels, opacity]);

    // Hexagon Layer - 3D spatial aggregation
    const hexagonLayer = useMemo(() => {
        if (!showHexagons) return null;

        return new HexagonLayer({
            id: 'conjunction-hexagons',
            data: scaledPoints,
            coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
            getPosition: (d: any) => d.position,
            getElevationWeight: (d: any) => d.weight,
            getColorWeight: (d: any) => d.weight,
            elevationScale: 100,
            radius: 50,
            coverage: 0.8,
            extruded: true,
            pickable: true,
            opacity: opacity * 0.7,
            colorRange: colorRange,
        });
    }, [scaledPoints, showHexagons, opacity, colorRange]);

    // Combine layers
    const layers = useMemo(() => {
        return [
            heatmapLayer,
            hexagonLayer,
            scatterLayer,
        ].filter(Boolean);
    }, [heatmapLayer, hexagonLayer, scatterLayer]);

    // Tooltip handler
    const getTooltip = useCallback(({ object }: any) => {
        if (!object) return null;

        return {
            html: `
        <div style="background: rgba(0,0,0,0.8); padding: 8px; border-radius: 4px; color: white;">
          <strong>Conjunction Event</strong><br/>
          Weight: ${(object.weight * 100).toFixed(1)}%<br/>
          Position: [${object.position.map((v: number) => v.toFixed(0)).join(', ')}]
        </div>
      `,
        };
    }, []);

    return (
        <DeckGL
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
            }}
            viewState={viewState}
            onViewStateChange={({ viewState }) => onViewStateChange(viewState)}
            controller={false} // Let Three.js controls handle camera
            layers={layers}
            getTooltip={getTooltip}
            parameters={{
                blend: true,
                blendFunc: ['SRC_ALPHA', 'ONE_MINUS_SRC_ALPHA'],
                depthTest: false, // Disable depth test for overlay effect
            }}
        />
    );
}

/**
 * Get color for risk level
 */
function getRiskColor(riskLevel: string): Color {
    switch (riskLevel) {
        case 'LOW':
            return [76, 175, 80]; // Green
        case 'MEDIUM':
            return [255, 193, 7]; // Yellow
        case 'HIGH':
            return [255, 152, 0]; // Orange
        case 'CRITICAL':
            return [244, 67, 54]; // Red
        default:
            return [158, 158, 158]; // Gray
    }
}
