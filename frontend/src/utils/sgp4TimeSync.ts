/**
 * SGP4 Time Synchronization Utility
 * Propagates satellite positions to specific times for playback animation
 */

import * as satellite from 'satellite.js';

export interface Position3D {
    x: number;
    y: number;
    z: number;
}

export interface TLE {
    line1: string;
    line2: string;
}

export interface TimeOffsetResult {
    position: Position3D;
    velocity: Position3D;
    timestamp: Date;
}

/**
 * Propagate satellite to specific time offset from TCA
 * @param tle - Two-Line Element set
 * @param tcaTime - Time of Closest Approach (Date)
 * @param offsetSeconds - Seconds offset from TCA (negative = before, positive = after)
 * @returns Position and velocity at the specified time
 */
export function propagateToTimeOffset(
    tle: TLE,
    tcaTime: Date,
    offsetSeconds: number
): TimeOffsetResult | null {
    try {
        // Parse TLE
        const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

        // Calculate target time
        const targetTime = new Date(tcaTime.getTime() + offsetSeconds * 1000);

        // Propagate using SGP4
        const positionAndVelocity = satellite.propagate(satrec, targetTime);

        // Check for errors
        if (positionAndVelocity.position === false ||
            typeof positionAndVelocity.position === 'boolean') {
            console.error('SGP4 propagation failed');
            return null;
        }

        // Extract position (ECI coordinates in km)
        const position = positionAndVelocity.position as satellite.EciVec3<number>;
        const velocity = positionAndVelocity.velocity as satellite.EciVec3<number>;

        return {
            position: {
                x: position.x,
                y: position.y,
                z: position.z
            },
            velocity: {
                x: velocity.x,
                y: velocity.y,
                z: velocity.z
            },
            timestamp: targetTime
        };
    } catch (error) {
        console.error('Error in propagateToTimeOffset:', error);
        return null;
    }
}

/**
 * Propagate both satellites in a conjunction event
 * @param satelliteTLE - Primary satellite TLE
 * @param debrisTLE - Debris object TLE
 * @param tcaTime - Time of Closest Approach
 * @param offsetSeconds - Seconds offset from TCA
 * @returns Positions of both objects
 */
export function propagateConjunctionPair(
    satelliteTLE: TLE,
    debrisTLE: TLE,
    tcaTime: Date,
    offsetSeconds: number
): {
    satellite: TimeOffsetResult | null;
    debris: TimeOffsetResult | null;
    missDistance: number;
} {
    const satResult = propagateToTimeOffset(satelliteTLE, tcaTime, offsetSeconds);
    const debResult = propagateToTimeOffset(debrisTLE, tcaTime, offsetSeconds);

    // Calculate miss distance (if both propagations successful)
    let missDistance = 0;
    if (satResult && debResult) {
        const dx = satResult.position.x - debResult.position.x;
        const dy = satResult.position.y - debResult.position.y;
        const dz = satResult.position.z - debResult.position.z;
        missDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    return {
        satellite: satResult,
        debris: debResult,
        missDistance
    };
}

/**
 * Generate trajectory points for animation path
 * @param tle - Satellite TLE
 * @param tcaTime - Time of Closest Approach
 * @param startOffset - Start time offset (seconds)
 * @param endOffset - End time offset (seconds)
 * @param stepSize - Time step between points (seconds)
 * @returns Array of position points
 */
export function generateTrajectory(
    tle: TLE,
    tcaTime: Date,
    startOffset: number = -900,  // -15 minutes
    endOffset: number = 900,     // +15 minutes
    stepSize: number = 10        // 10 second intervals
): Position3D[] {
    const trajectory: Position3D[] = [];

    for (let t = startOffset; t <= endOffset; t += stepSize) {
        const result = propagateToTimeOffset(tle, tcaTime, t);
        if (result) {
            trajectory.push(result.position);
        }
    }

    return trajectory;
}

/**
 * Calculate miss distance at TCA
 * @param satelliteTLE - Primary satellite TLE
 * @param debrisTLE - Debris TLE
 * @param tcaTime - Time of Closest Approach
 * @returns Miss distance in kilometers
 */
export function calculateMissDistanceAtTCA(
    satelliteTLE: TLE,
    debrisTLE: TLE,
    tcaTime: Date
): number {
    const result = propagateConjunctionPair(satelliteTLE, debrisTLE, tcaTime, 0);
    return result.missDistance;
}

/**
 * Convert ECI coordinates to Three.js scene coordinates
 * Earth radius = 6371 km, scale to reasonable Three.js units
 */
export function eciToSceneCoordinates(
    eciPosition: Position3D,
    scale: number = 0.001  // Scale factor for Three.js scene
): { x: number; y: number; z: number } {
    return {
        x: eciPosition.x * scale,
        y: eciPosition.z * scale,  // Swap Y and Z for Three.js
        z: -eciPosition.y * scale  // Invert Y
    };
}
