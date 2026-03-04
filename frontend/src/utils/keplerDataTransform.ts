/**
 * Kepler.gl Data Transformation Utilities
 * 
 * Transform conjunction data from API to Kepler.gl format
 * Convert ECI coordinates to geographic lat/lng
 */

import type { ConjunctionAnalysis } from '../services/api';
import type { KeplerDataset } from '../config/keplerConfig';
import { createKeplerDataset } from '../config/keplerConfig';

/**
 * Convert ECI (Earth-Centered Inertial) to Latitude/Longitude
 * Simplified conversion for demonstration
 */
export function eciToLatLng(
    eciPosition: [number, number, number] | undefined,
    timestamp?: number
): [number, number] {
    if (!eciPosition) {
        // Default to random position if not provided
        return [
            (Math.random() - 0.5) * 180, // latitude -90 to 90
            (Math.random() - 0.5) * 360  // longitude -180 to 180
        ];
    }

    const [x, y, z] = eciPosition;

    // Calculate radius from Earth center
    const r = Math.sqrt(x * x + y * y + z * z);

    // Calculate latitude (geocentric)
    const lat = Math.asin(z / r) * (180 / Math.PI);

    // Calculate longitude
    // Note: This is simplified and doesn't account for Earth rotation (GMST)
    // For production, use a proper astronomical library like Skyfield
    const lng = Math.atan2(y, x) * (180 / Math.PI);

    return [lat, lng];
}

/**
 * Calculate altitude from ECI position
 */
export function calculateAltitude(eciPosition: [number, number, number] | undefined): number {
    if (!eciPosition) return 500; // Default altitude

    const [x, y, z] = eciPosition;
    const radius = Math.sqrt(x * x + y * y + z * z);
    const EARTH_RADIUS_KM = 6371;

    return Math.max(radius - EARTH_RADIUS_KM, 0);
}

/**
 * Transform conjunction data to Kepler.gl dataset format
 */
export function transformToKeplerDataset(
    conjunctions: ConjunctionAnalysis[]
): KeplerDataset {
    // Define fields (columns) for the dataset
    const fields = [
        { name: 'conjunction_id', type: 'string' },
        { name: 'latitude', type: 'real' },
        { name: 'longitude', type: 'real' },
        { name: 'altitude', type: 'real' },
        { name: 'timestamp', type: 'timestamp' },
        { name: 'risk_level', type: 'string' },
        { name: 'poc_ml', type: 'real' },
        { name: 'poc_analytic', type: 'real' },
        { name: 'satellite_name', type: 'string' },
        { name: 'debris_name', type: 'string' },
        { name: 'miss_distance', type: 'real' },
        { name: 'relative_velocity', type: 'real' },
        { name: 'time_to_tca', type: 'real' },
        { name: 'maneuver_required', type: 'boolean' }
    ];

    // Transform each conjunction to a row
    const rows = conjunctions.map(conj => {
        const [lat, lng] = eciToLatLng(
            conj.satellite_position as [number, number, number] | undefined,
            conj.tca_timestamp
        );

        const altitude = conj.altitude || calculateAltitude(
            conj.satellite_position as [number, number, number] | undefined
        );

        return [
            conj.conjunction_id,
            lat,
            lng,
            altitude,
            conj.tca_timestamp * 1000, // Convert to milliseconds
            conj.risk_level,
            conj.poc_ml,
            conj.poc_analytic,
            conj.satellite_name,
            conj.debris_name,
            conj.miss_distance,
            conj.relative_velocity,
            conj.time_to_tca,
            conj.maneuver_required
        ];
    });

    return createKeplerDataset(
        'conjunctions',
        'Conjunction Events',
        fields,
        rows
    );
}

/**
 * Create GeoJSON features for conjunctions
 */
export function createGeoJsonFeatures(conjunctions: ConjunctionAnalysis[]) {
    const features = conjunctions.map(conj => {
        const [lat, lng] = eciToLatLng(
            conj.satellite_position as [number, number, number] | undefined,
            conj.tca_timestamp
        );

        const altitude = conj.altitude || calculateAltitude(
            conj.satellite_position as [number, number, number] | undefined
        );

        return {
            type: 'Feature' as const,
            geometry: {
                type: 'Point' as const,
                coordinates: [lng, lat, altitude]
            },
            properties: {
                conjunction_id: conj.conjunction_id,
                timestamp: conj.tca_timestamp * 1000,
                risk_level: conj.risk_level,
                poc_ml: conj.poc_ml,
                poc_analytic: conj.poc_analytic,
                satellite_name: conj.satellite_name,
                debris_name: conj.debris_name,
                miss_distance: conj.miss_distance,
                relative_velocity: conj.relative_velocity,
                time_to_tca: conj.time_to_tca,
                maneuver_required: conj.maneuver_required
            }
        };
    });

    return {
        type: 'FeatureCollection' as const,
        features
    };
}

/**
 * Generate sample Kepler.gl data for testing
 */
export function generateSampleKeplerData(count: number = 100): KeplerDataset {
    const fields = [
        { name: 'conjunction_id', type: 'string' },
        { name: 'latitude', type: 'real' },
        { name: 'longitude', type: 'real' },
        { name: 'altitude', type: 'real' },
        { name: 'timestamp', type: 'timestamp' },
        { name: 'risk_level', type: 'string' },
        { name: 'poc_ml', type: 'real' }
    ];

    const riskLevels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const now = Date.now();

    const rows = Array.from({ length: count }, (_, i) => {
        const lat = (Math.random() - 0.5) * 180;
        const lng = (Math.random() - 0.5) * 360;
        const altitude = 400 + Math.random() * 600; // LEO range
        const timestamp = now - Math.random() * 86400000; // Last 24h
        const riskLevel = riskLevels[Math.floor(Math.random() * riskLevels.length)];
        const poc = Math.random() * 0.001;

        return [
            `CONJ-${i.toString().padStart(4, '0')}`,
            lat,
            lng,
            altitude,
            timestamp,
            riskLevel,
            poc
        ];
    });

    return createKeplerDataset(
        'conjunctions',
        'Sample Conjunction Events',
        fields,
        rows
    );
}
