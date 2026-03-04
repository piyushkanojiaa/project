/**
 * TypeScript Type Definitions
 * 
 * Shared types for the mobile app
 */

// Risk Levels
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Satellite Types
export type SatelliteType = 'ACTIVE' | 'DEBRIS' | 'UNKNOWN';

// Conjunction Status
export type ConjunctionStatus = 'ACTIVE' | 'ARCHIVED' | 'RESOLVED';

// Position (ECI or Lat/Lng/Alt)
export interface Position {
    latitude?: number;
    longitude?: number;
    altitude?: number;
    x?: number;
    y?: number;
    z?: number;
}

// Velocity
export interface Velocity {
    x: number;
    y: number;
    z: number;
}

// TLE (Two-Line Element)
export interface TLE {
    line1: string;
    line2: string;
    epoch?: string;
}

// Satellite
export interface Satellite {
    id: string;
    noradId: number;
    name: string;
    type: SatelliteType;
    tle: TLE;
    position?: Position;
    velocity?: Velocity;
    altitude?: number;
}

// Conjunction
export interface Conjunction {
    id: string;
    satelliteId: string;
    debrisId: string;
    tca: string; // Time of Closest Approach (ISO string)
    missDistance: number; // km
    relativeVelocity?: number; // km/s
    probability: number; // 0-1
    riskLevel: RiskLevel;
    status: ConjunctionStatus;
    satellite?: Satellite;
    debris?: Satellite;
}

// Conjunction Statistics
export interface ConjunctionStatistics {
    total: number;
    active: number;
    archived: number;
    byRiskLevel: Array<{
        level: RiskLevel;
        count: number;
        percentage: number;
    }>;
    byStatus: Array<{
        status: ConjunctionStatus;
        count: number;
    }>;
}

// Risk Trend
export interface RiskTrend {
    date: string;
    totalConjunctions: number;
    averageRisk: number;
    highRiskCount: number;
    criticalRiskCount: number;
}

// Collision Prediction
export interface CollisionPrediction {
    probability: number;
    riskLevel: RiskLevel;
    confidence: number;
    recommendation: string;
    closestApproach: {
        time: string;
        distance: number;
        relativeVelocity: number;
    };
}

// Filters
export interface SatelliteFilter {
    type?: SatelliteType;
    altitudeRange?: {
        min: number;
        max: number;
    };
    search?: string;
}

export interface ConjunctionFilter {
    riskLevel?: RiskLevel[];
    status?: ConjunctionStatus;
    dateRange?: {
        start: string;
        end: string;
    };
    minProbability?: number;
}

// Navigation Types
export type RootStackParamList = {
    '(tabs)': undefined;
    SatelliteDetails: { satelliteId: string };
    ConjunctionDetails: { conjunctionId: string };
    Settings: undefined;
};

export type TabParamList = {
    index: undefined;
    satellites: undefined;
    conjunctions: undefined;
    analytics: undefined;
    settings: undefined;
};
