/**
 * API service for fetching satellite and conjunction data
 */

const API_BASE_URL = 'http://localhost:8000';

// Types
export interface ConjunctionAnalysis {
    conjunction_id: string;
    satellite_id: string;
    satellite_name: string;
    debris_id: string;
    debris_name: string;
    time_to_tca: number;
    tca_timestamp: number;
    miss_distance: number;
    relative_velocity: number;
    poc_analytic: number;
    poc_ml: number;
    risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    maneuver_required: boolean;
}

export interface SatelliteData {
    id: string;
    name: string;
    type: 'active' | 'debris';
    tle: [string, string];
}

// Helper functions
export function formatProbability(prob: number): string {
    if (prob >= 0.01) return `${(prob * 100).toFixed(2)}%`;
    if (prob >= 1e-4) return `${(prob * 100).toFixed(4)}%`;
    return prob.toExponential(2);
}

export function formatTimeToTCA(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 24) {
        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
}

export function getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
        case 'CRITICAL': return '#ef4444';
        case 'HIGH': return '#f97316';
        case 'MEDIUM': return '#eab308';
        case 'LOW': return '#22c55e';
        default: return '#6b7280';
    }
}

export function calculateAgreement(pocAnalytic: number, pocMl: number): number {
    if (pocAnalytic === 0 && pocMl === 0) return 100;
    if (pocAnalytic === 0 || pocMl === 0) return 0;

    const logDiff = Math.abs(Math.log10(pocAnalytic) - Math.log10(pocMl));
    const agreement = Math.max(0, 100 - logDiff * 20);
    return Math.round(agreement);
}

// API Functions
export async function getSatellites(): Promise<SatelliteData[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/satellites`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching satellites:', error);
        return [];
    }
}

export async function getConjunctionAnalysis(horizonSeconds: number = 86400): Promise<ConjunctionAnalysis[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/conjunctions?count=20`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error fetching conjunctions:', error);
        // Return mock data for demo purposes
        return [
            {
                conjunction_id: 'CONJ-0001',
                satellite_id: '25544',
                satellite_name: 'ISS (ZARYA)',
                debris_id: 'DEBRIS-001',
                debris_name: 'DEBRIS FRAGMENT 1',
                time_to_tca: 3600,
                tca_timestamp: Date.now() / 1000 + 3600,
                miss_distance: 0.8,
                relative_velocity: 7.2,
                poc_analytic: 1.2e-5,
                poc_ml: 1.5e-5,
                risk_level: 'HIGH',
                maneuver_required: true
            },
            {
                conjunction_id: 'CONJ-0002',
                satellite_id: '20580',
                satellite_name: 'HUBBLE ST',
                debris_id: 'DEBRIS-002',
                debris_name: 'DEBRIS FRAGMENT 2',
                time_to_tca: 7200,
                tca_timestamp: Date.now() / 1000 + 7200,
                miss_distance: 2.5,
                relative_velocity: 5.8,
                poc_analytic: 3.4e-6,
                poc_ml: 4.1e-6,
                risk_level: 'MEDIUM',
                maneuver_required: false
            }
        ];
    }
}

export async function predictCollision(data: any): Promise<any> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('Error predicting collision:', error);
        return null;
    }
}

export default {
    getSatellites,
    getConjunctionAnalysis,
    predictCollision,
};
