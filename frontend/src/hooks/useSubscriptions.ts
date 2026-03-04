/**
 * Custom React Hooks for GraphQL Subscriptions
 * 
 * Real-time data hooks using WebSocket subscriptions
 */

import { useEffect, useState, useCallback } from 'react';
import { useSubscription } from '@apollo/client';
import { toast } from 'react-hot-toast';
import {
    CONJUNCTION_CREATED,
    CONJUNCTION_UPDATED,
    CRITICAL_ALERT,
    SATELLITE_POSITION_UPDATED,
    STATS_UPDATED,
} from '../services/subscriptions';

// ============================================================
// Types
// ============================================================

interface Conjunction {
    id: string;
    satelliteName: string;
    debrisName: string;
    tca: string;
    missDistance: number;
    probability: number;
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    relativeVelocity: number;
    status: string;
    createdAt: string;
    updatedAt: string;
}

interface Satellite {
    id: string;
    name: string;
    noradId: string;
    type: string;
    altitude: number;
    position: {
        x: number;
        y: number;
        z: number;
        lat?: number;
        lng?: number;
        altitude?: number;
    };
    velocity?: {
        vx: number;
        vy: number;
        vz: number;
        magnitude?: number;
    };
    lastUpdated: string;
    isActive: boolean;
}

interface ConjunctionStatistics {
    totalConjunctions: number;
    averageProbability: number;
    timeRangeDays: number;
    byRiskLevel: Array<{
        riskLevel: string;
        count: number;
        percentage: number;
    }>;
    highestRiskConjunction?: Conjunction;
}

// ============================================================
// Hooks
// ============================================================

/**
 * Subscribe to new conjunction events
 */
export function useNewConjunctions(minRiskLevel?: string) {
    const [conjunctions, setConjunctions] = useState<Conjunction[]>([]);

    const { data, loading, error } = useSubscription(CONJUNCTION_CREATED, {
        variables: { minRiskLevel },
        onError: (err) => {
            console.error('Conjunction subscription error:', err);
            toast.error('Connection lost. Attempting to reconnect...');
        },
    });

    useEffect(() => {
        if (data?.conjunctionCreated) {
            const newConjunction = data.conjunctionCreated;

            // Add to list
            setConjunctions((prev) => [newConjunction, ...prev].slice(0, 50)); // Keep last 50

            // Show notification
            if (newConjunction.riskLevel === 'CRITICAL') {
                toast.error(`🚨 Critical conjunction detected: ${newConjunction.satelliteName}`, {
                    duration: 10000,
                });
            } else if (newConjunction.riskLevel === 'HIGH') {
                toast.warning(`⚠️ High risk conjunction: ${newConjunction.satelliteName}`, {
                    duration: 6000,
                });
            }
        }
    }, [data]);

    return { conjunctions, loading, error };
}

/**
 * Subscribe to conjunction updates (risk level changes)
 */
export function useConjunctionUpdates(conjunctionId?: string, minRiskLevel?: string) {
    const [updates, setUpdates] = useState<Conjunction[]>([]);

    const { data, loading, error } = useSubscription(CONJUNCTION_UPDATED, {
        variables: { conjunctionId, minRiskLevel },
        skip: !conjunctionId && !minRiskLevel,
    });

    useEffect(() => {
        if (data?.conjunctionUpdated) {
            const updated = data.conjunctionUpdated;
            setUpdates((prev) => [updated, ...prev].slice(0, 20));

            // Notify on risk level increase
            if (updated.riskLevel === 'CRITICAL') {
                toast.error(`⚠️ Conjunction ${updated.id} escalated to CRITICAL`);
            }
        }
    }, [data]);

    return { updates, loading, error };
}

/**
 * Subscribe to critical alerts only
 */
export function useCriticalAlerts() {
    const [alerts, setAlerts] = useState<Conjunction[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const { data, loading, error } = useSubscription(CRITICAL_ALERT, {
        onError: (err) => console.error('Critical alert subscription error:', err),
    });

    useEffect(() => {
        if (data?.criticalAlert) {
            const alert = data.criticalAlert;

            setAlerts((prev) => [alert, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Show alert notification with sound
            toast.error(
                `🚨 CRITICAL ALERT\n${alert.satelliteName} ↔ ${alert.debrisName}\nMiss distance: ${alert.missDistance.toFixed(2)} km`,
                {
                    duration: 15000,
                    position: 'top-center',
                }
            );

            // Play notification sound (if available)
            try {
                const audio = new Audio('/alert.mp3');
                audio.play().catch(() => { });
            } catch { }
        }
    }, [data]);

    const clearUnread = useCallback(() => {
        setUnreadCount(0);
    }, []);

    return { alerts, unreadCount, clearUnread, loading, error };
}

/**
 * Subscribe to satellite position updates
 */
export function useSatelliteTracking(noradId?: string, updateInterval: number = 30) {
    const [satellites, setSatellites] = useState<Map<string, Satellite>>(new Map());

    const { data, loading, error } = useSubscription(SATELLITE_POSITION_UPDATED, {
        variables: { noradId, updateInterval },
        onError: (err) => console.error('Satellite tracking error:', err),
    });

    useEffect(() => {
        if (data?.satellitePositionUpdated) {
            const satellite = data.satellitePositionUpdated;

            setSatellites((prev) => {
                const updated = new Map(prev);
                updated.set(satellite.id, satellite);
                return updated;
            });
        }
    }, [data]);

    return {
        satellites: Array.from(satellites.values()),
        satelliteMap: satellites,
        loading,
        error,
    };
}

/**
 * Subscribe to system statistics updates
 */
export function useLiveStatistics(updateInterval: number = 60) {
    const [stats, setStats] = useState<ConjunctionStatistics | null>(null);
    const [history, setHistory] = useState<ConjunctionStatistics[]>([]);

    const { data, loading, error } = useSubscription(STATS_UPDATED, {
        variables: { updateInterval },
    });

    useEffect(() => {
        if (data?.statsUpdated) {
            const newStats = data.statsUpdated;

            setStats(newStats);
            setHistory((prev) => [...prev, newStats].slice(-60)); // Keep last 60 updates
        }
    }, [data]);

    return { stats, history, loading, error };
}

/**
 * Master hook that combines all subscriptions
 */
export function useRealTimeUpdates(options?: {
    enableConjunctions?: boolean;
    enableSatellites?: boolean;
    enableStats?: boolean;
    enableAlerts?: boolean;
    minRiskLevel?: string;
}) {
    const {
        enableConjunctions = true,
        enableSatellites = false,
        enableStats = true,
        enableAlerts = true,
        minRiskLevel,
    } = options || {};

    const conjunctions = useNewConjunctions(
        enableConjunctions ? minRiskLevel : undefined
    );

    const alerts = useCriticalAlerts();
    const stats = useLiveStatistics(enableStats ? 60 : undefined);

    const satellites = useSatelliteTracking(
        undefined,
        enableSatellites ? 30 : undefined
    );

    const isConnected = !conjunctions.error && !stats.error;
    const isLoading = conjunctions.loading || stats.loading;

    return {
        conjunctions: conjunctions.conjunctions,
        alerts: alerts.alerts,
        unreadAlerts: alerts.unreadCount,
        clearAlerts: alerts.clearUnread,
        stats: stats.stats,
        statsHistory: stats.history,
        satellites: satellites.satellites,
        isConnected,
        isLoading,
    };
}
