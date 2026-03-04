/**
 * Heatmap Data Service
 * 
 * Handles data transformation and management for deck.gl heatmap visualization
 * of conjunction events in orbital space.
 */

import { ConjunctionAnalysis } from './api';

export interface HeatmapPoint {
    position: [number, number, number]; // ECI coordinates [x, y, z]
    weight: number; // Risk level or density weight (0-1)
    timestamp: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    altitude: number; // km
    conjunctionId: string;
}

export interface HeatmapMetadata {
    totalPoints: number;
    timeRange: string;
    maxWeight: number;
    minWeight: number;
    altitude: {
        min: number;
        max: number;
        mean: number;
    };
}

export interface HeatmapData {
    points: HeatmapPoint[];
    metadata: HeatmapMetadata;
}

export type HeatmapMode = 'density' | 'risk' | 'altitude';
export type AltitudeBand = 'LEO' | 'MEO' | 'GEO' | 'ALL';

const ALTITUDE_BANDS = {
    LEO: { min: 160, max: 2000 },
    MEO: { min: 2000, max: 35786 },
    GEO: { min: 35786, max: Infinity },
    ALL: { min: 0, max: Infinity },
};

const RISK_WEIGHTS = {
    LOW: 0.25,
    MEDIUM: 0.5,
    HIGH: 0.75,
    CRITICAL: 1.0,
};

/**
 * Convert satellite position to ECI coordinates for heatmap
 */
function getECIPosition(sat: any): [number, number, number] {
    // If position is already provided, use it
    if (sat.position && Array.isArray(sat.position)) {
        return sat.position as [number, number, number];
    }

    // Otherwise estimate from altitude and angles (simplified)
    const altitude = sat.altitude || 500; // km
    const radius = 6371 + altitude; // Earth radius + altitude

    // Use random angles if not provided (for demo)
    const theta = Math.random() * 2 * Math.PI;
    const phi = Math.random() * Math.PI;

    return [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.sin(phi) * Math.sin(theta),
        radius * Math.cos(phi),
    ];
}

/**
 * Extract altitude from position or metadata
 */
function extractAltitude(sat: any): number {
    if (sat.altitude !== undefined) {
        return sat.altitude;
    }

    if (sat.position && Array.isArray(sat.position)) {
        const [x, y, z] = sat.position;
        const radius = Math.sqrt(x * x + y * y + z * z);
        return radius - 6371; // Subtract Earth radius
    }

    // Default to LEO
    return 500;
}

/**
 * Transform conjunction analysis data to heatmap format
 */
export function transformToHeatmapFormat(
    conjunctions: ConjunctionAnalysis[],
    mode: HeatmapMode = 'risk'
): HeatmapData {
    const points: HeatmapPoint[] = conjunctions.map((conj) => {
        const position = getECIPosition({
            position: conj.satellite_position,
            altitude: conj.altitude,
        });

        const altitude = extractAltitude({
            position: conj.satellite_position,
            altitude: conj.altitude,
        });

        // Calculate weight based on mode
        let weight = 0.5;
        switch (mode) {
            case 'risk':
                weight = RISK_WEIGHTS[conj.risk_level as keyof typeof RISK_WEIGHTS] || 0.5;
                break;
            case 'density':
                weight = 0.7; // Uniform weight for density visualization
                break;
            case 'altitude':
                // Normalize altitude to 0-1 range (0-2000km LEO range)
                weight = Math.min(altitude / 2000, 1.0);
                break;
        }

        return {
            position,
            weight,
            timestamp: conj.tca_timestamp || Date.now() / 1000,
            riskLevel: conj.risk_level as HeatmapPoint['riskLevel'],
            altitude,
            conjunctionId: conj.conjunction_id,
        };
    });

    // Calculate metadata
    const weights = points.map((p) => p.weight);
    const altitudes = points.map((p) => p.altitude);

    const metadata: HeatmapMetadata = {
        totalPoints: points.length,
        timeRange: '24h', // TODO: Calculate from timestamps
        maxWeight: Math.max(...weights, 0.01),
        minWeight: Math.min(...weights, 0.01),
        altitude: {
            min: Math.min(...altitudes, 0),
            max: Math.max(...altitudes, 0),
            mean: altitudes.reduce((a, b) => a + b, 0) / (altitudes.length || 1),
        },
    };

    return { points, metadata };
}

/**
 * Filter points by time range
 */
export function filterByTimeRange(
    points: HeatmapPoint[],
    timeRangeHours: number
): HeatmapPoint[] {
    const now = Date.now() / 1000;
    const cutoff = now - timeRangeHours * 3600;

    return points.filter((p) => p.timestamp >= cutoff);
}

/**
 * Filter points by altitude band
 */
export function filterByAltitude(
    points: HeatmapPoint[],
    band: AltitudeBand
): HeatmapPoint[] {
    if (band === 'ALL') {
        return points;
    }

    const { min, max } = ALTITUDE_BANDS[band];
    return points.filter((p) => p.altitude >= min && p.altitude < max);
}

/**
 * Filter points by minimum risk level
 */
export function filterByRiskLevel(
    points: HeatmapPoint[],
    minRiskLevel: HeatmapPoint['riskLevel']
): HeatmapPoint[] {
    const riskOrder = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const minIndex = riskOrder.indexOf(minRiskLevel);

    return points.filter((p) => {
        const pointIndex = riskOrder.indexOf(p.riskLevel);
        return pointIndex >= minIndex;
    });
}

/**
 * Calculate spatial density for a grid
 */
export function calculateSpatialDensity(
    points: HeatmapPoint[],
    gridResolution: number = 50
): Map<string, number> {
    const densityMap = new Map<string, number>();

    points.forEach((point) => {
        const [x, y, z] = point.position;

        // Create grid cell key
        const cellX = Math.floor(x / gridResolution);
        const cellY = Math.floor(y / gridResolution);
        const cellZ = Math.floor(z / gridResolution);
        const key = `${cellX},${cellY},${cellZ}`;

        // Increment density
        densityMap.set(key, (densityMap.get(key) || 0) + point.weight);
    });

    return densityMap;
}

/**
 * Identify high-risk zones (clusters of high-risk conjunctions)
 */
export interface RiskZone {
    center: [number, number, number];
    radius: number;
    riskScore: number;
    conjunctionCount: number;
    avgAltitude: number;
}

export function aggregateRiskZones(
    points: HeatmapPoint[],
    clusterRadius: number = 100 // km
): RiskZone[] {
    // Simple clustering algorithm (can be improved with k-means)
    const zones: RiskZone[] = [];
    const processed = new Set<number>();

    points.forEach((point, index) => {
        if (processed.has(index)) return;

        // Find nearby points within cluster radius
        const cluster: HeatmapPoint[] = [point];
        processed.add(index);

        points.forEach((otherPoint, otherIndex) => {
            if (processed.has(otherIndex)) return;

            const [x1, y1, z1] = point.position;
            const [x2, y2, z2] = otherPoint.position;
            const distance = Math.sqrt(
                (x2 - x1) ** 2 + (y2 - y1) ** 2 + (z2 - z1) ** 2
            );

            if (distance <= clusterRadius) {
                cluster.push(otherPoint);
                processed.add(otherIndex);
            }
        });

        // Only create zone if cluster has multiple points
        if (cluster.length >= 2) {
            const avgX = cluster.reduce((sum, p) => sum + p.position[0], 0) / cluster.length;
            const avgY = cluster.reduce((sum, p) => sum + p.position[1], 0) / cluster.length;
            const avgZ = cluster.reduce((sum, p) => sum + p.position[2], 0) / cluster.length;
            const avgAlt = cluster.reduce((sum, p) => sum + p.altitude, 0) / cluster.length;
            const riskScore = cluster.reduce((sum, p) => sum + p.weight, 0) / cluster.length;

            zones.push({
                center: [avgX, avgY, avgZ],
                radius: clusterRadius,
                riskScore,
                conjunctionCount: cluster.length,
                avgAltitude: avgAlt,
            });
        }
    });

    // Sort by risk score descending
    return zones.sort((a, b) => b.riskScore - a.riskScore);
}

/**
 * Generate sample heatmap data for testing
 */
export function generateSampleHeatmapData(count: number = 100): HeatmapData {
    const points: HeatmapPoint[] = [];

    for (let i = 0; i < count; i++) {
        const altitude = 400 + Math.random() * 600; // 400-1000 km (LEO)
        const radius = 6371 + altitude;

        const theta = Math.random() * 2 * Math.PI;
        const phi = Math.random() * Math.PI;

        const position: [number, number, number] = [
            radius * Math.sin(phi) * Math.cos(theta),
            radius * Math.sin(phi) * Math.sin(theta),
            radius * Math.cos(phi),
        ];

        const riskLevels: HeatmapPoint['riskLevel'][] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];

        points.push({
            position,
            weight: RISK_WEIGHTS[riskLevel],
            timestamp: Date.now() / 1000 - Math.random() * 86400, // Last 24h
            riskLevel,
            altitude,
            conjunctionId: `CONJ-${i.toString().padStart(4, '0')}`,
        });
    }

    return transformToHeatmapFormat(
        points.map((p) => ({
            conjunction_id: p.conjunctionId,
            satellite_id: 'SAT-001',
            satellite_name: 'Test Satellite',
            debris_id: 'DEB-001',
            debris_name: 'Test Debris',
            time_to_tca: 3600,
            tca_timestamp: p.timestamp,
            miss_distance: 1.0,
            relative_velocity: 7.5,
            poc_analytic: p.weight,
            poc_ml: p.weight,
            risk_level: p.riskLevel,
            maneuver_required: p.riskLevel === 'CRITICAL',
            satellite_position: p.position,
            altitude: p.altitude,
        })) as any,
        'risk'
    );
}
