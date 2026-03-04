import * as satellite from 'satellite.js';
import { SatelliteData } from '../tleData';

export interface PropagatedPosition {
    x: number;
    y: number;
    z: number;
    velocity: {
        x: number;
        y: number;
        z: number;
    };
}

/**
 * Propagate satellite using SGP4 algorithm
 * @param satData Satellite TLE data
 * @param date Current date/time for propagation
 * @returns Position and velocity in ECI coordinates (km, km/s)
 */
export function propagateSGP4(satData: SatelliteData, date: Date): PropagatedPosition | null {
    try {
        // Parse TLE using satellite.js
        const satrec = satellite.twoline2satrec(satData.tle1, satData.tle2);

        // Propagate to current time
        const positionAndVelocity = satellite.propagate(satrec, date);

        // Check for errors
        if (typeof positionAndVelocity.position === 'boolean' ||
            typeof positionAndVelocity.velocity === 'boolean') {
            console.error(`SGP4 propagation failed for ${satData.name}`);
            return null;
        }

        const position = positionAndVelocity.position as satellite.EciVec3<number>;
        const velocity = positionAndVelocity.velocity as satellite.EciVec3<number>;

        return {
            x: position.x,
            y: position.y,
            z: position.z,
            velocity: {
                x: velocity.x,
                y: velocity.y,
                z: velocity.z
            }
        };
    } catch (error) {
        console.error(`Error propagating ${satData.name}:`, error);
        return null;
    }
}

/**
 * Convert ECI coordinates to screen coordinates for 2D canvas
 * @param position ECI position in km
 * @param centerX Canvas center X
 * @param centerY Canvas center Y
 * @param scale Pixels per km
 * @returns Canvas coordinates {x, y}
 */
export function eciToCanvas(
    position: { x: number; y: number; z: number },
    centerX: number,
    centerY: number,
    scale: number
): { x: number; y: number } {
    // Simple orthographic projection (top-down view)
    // For a side view, use y,z instead of x,y
    return {
        x: centerX + position.x * scale,
        y: centerY + position.y * scale
    };
}

/**
 * Calculate orbital period from TLE mean motion
 * @param meanMotion Revolutions per day
 * @returns Period in seconds
 */
export function calculateOrbitalPeriod(meanMotion: number): number {
    return (24 * 3600) / meanMotion;
}

/**
 * Calculate altitude from position vector
 * @param position ECI position in km
 * @returns Altitude above Earth surface in km
 */
export function calculateAltitude(position: { x: number; y: number; z: number }): number {
    const earthRadius = 6371; // km
    const distance = Math.sqrt(position.x ** 2 + position.y ** 2 + position.z ** 2);
    return distance - earthRadius;
}

/**
 * Calculate velocity magnitude
 * @param velocity Velocity vector in km/s
 * @returns Speed in km/s
 */
export function calculateSpeed(velocity: { x: number; y: number; z: number }): number {
    return Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
}
