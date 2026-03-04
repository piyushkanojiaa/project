/**
 * Offline Storage Service using MMKV
 * 
 * Fast, encrypted key-value storage for offline data caching
 */

import { MMKV } from 'react-native-mmkv';
import { Satellite, Conjunction } from '../../types';

// Initialize MMKV storage
export const storage = new MMKV({
    id: 'orbital-guard-storage',
    encryptionKey: 'orbital-guard-encryption-key-2026',
});

// Storage Keys
const KEYS = {
    SATELLITES: 'satellites',
    SATELLITES_UPDATED: 'satellites_updated',
    CONJUNCTIONS: 'conjunctions',
    CONJUNCTIONS_UPDATED: 'conjunctions_updated',
    HIGH_RISK_CONJUNCTIONS: 'high_risk_conjunctions',
    CONJUNCTION_STATS: 'conjunction_stats',
    LAST_SYNC: 'last_sync',
    OFFLINE_QUEUE: 'offline_queue',
};

/**
 * Satellite Cache
 */
export const satelliteCache = {
    /**
     * Get all satellites from cache
     */
    get: (): Satellite[] => {
        try {
            const data = storage.getString(KEYS.SATELLITES);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading satellites from cache:', error);
            return [];
        }
    },

    /**
     * Save satellites to cache
     */
    set: (satellites: Satellite[]): void => {
        try {
            storage.set(KEYS.SATELLITES, JSON.stringify(satellites));
            storage.set(KEYS.SATELLITES_UPDATED, Date.now());
        } catch (error) {
            console.error('Error saving satellites to cache:', error);
        }
    },

    /**
     * Get last updated timestamp
     */
    getUpdatedAt: (): number => {
        return storage.getNumber(KEYS.SATELLITES_UPDATED) || 0;
    },

    /**
     * Check if cache is stale (older than 5 minutes)
     */
    isStale: (): boolean => {
        const updatedAt = storage.getNumber(KEYS.SATELLITES_UPDATED) || 0;
        const fiveMinutes = 5 * 60 * 1000;
        return Date.now() - updatedAt > fiveMinutes;
    },
};

/**
 * Conjunction Cache
 */
export const conjunctionCache = {
    /**
     * Get all conjunctions from cache
     */
    get: (): Conjunction[] => {
        try {
            const data = storage.getString(KEYS.CONJUNCTIONS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading conjunctions from cache:', error);
            return [];
        }
    },

    /**
     * Save conjunctions to cache
     */
    set: (conjunctions: Conjunction[]): void => {
        try {
            storage.set(KEYS.CONJUNCTIONS, JSON.stringify(conjunctions));
            storage.set(KEYS.CONJUNCTIONS_UPDATED, Date.now());
        } catch (error) {
            console.error('Error saving conjunctions to cache:', error);
        }
    },

    /**
     * Get high-risk conjunctions
     */
    getHighRisk: (): Conjunction[] => {
        try {
            const data = storage.getString(KEYS.HIGH_RISK_CONJUNCTIONS);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading high-risk conjunctions:', error);
            return [];
        }
    },

    /**
     * Save high-risk conjunctions
     */
    setHighRisk: (conjunctions: Conjunction[]): void => {
        try {
            storage.set(KEYS.HIGH_RISK_CONJUNCTIONS, JSON.stringify(conjunctions));
        } catch (error) {
            console.error('Error saving high-risk conjunctions:', error);
        }
    },

    /**
     * Get last updated timestamp
     */
    getUpdatedAt: (): number => {
        return storage.getNumber(KEYS.CONJUNCTIONS_UPDATED) || 0;
    },

    /**
     * Check if cache is stale (older than 10 minutes)
     */
    isStale: (): boolean => {
        const updatedAt = storage.getNumber(KEYS.CONJUNCTIONS_UPDATED) || 0;
        const tenMinutes = 10 * 60 * 1000;
        return Date.now() - updatedAt > tenMinutes;
    },
};

/**
 * Statistics Cache
 */
export const statsCache = {
    /**
     * Get conjunction statistics
     */
    get: (): any => {
        try {
            const data = storage.getString(KEYS.CONJUNCTION_STATS);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error reading stats from cache:', error);
            return null;
        }
    },

    /**
     * Save statistics
     */
    set: (stats: any): void => {
        try {
            storage.set(KEYS.CONJUNCTION_STATS, JSON.stringify(stats));
        } catch (error) {
            console.error('Error saving stats to cache:', error);
        }
    },
};

/**
 * Offline Queue for mutations
 */
interface QueuedAction {
    id: string;
    type: 'mutation';
    operation: string;
    variables: any;
    timestamp: number;
}

export const offlineQueue = {
    /**
     * Add action to queue
     */
    add: (operation: string, variables: any): void => {
        try {
            const queue = offlineQueue.get();
            const action: QueuedAction = {
                id: `${Date.now()}-${Math.random()}`,
                type: 'mutation',
                operation,
                variables,
                timestamp: Date.now(),
            };
            queue.push(action);
            storage.set(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
        } catch (error) {
            console.error('Error adding to offline queue:', error);
        }
    },

    /**
     * Get all queued actions
     */
    get: (): QueuedAction[] => {
        try {
            const data = storage.getString(KEYS.OFFLINE_QUEUE);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading offline queue:', error);
            return [];
        }
    },

    /**
     * Remove action from queue
     */
    remove: (id: string): void => {
        try {
            const queue = offlineQueue.get().filter(action => action.id !== id);
            storage.set(KEYS.OFFLINE_QUEUE, JSON.stringify(queue));
        } catch (error) {
            console.error('Error removing from offline queue:', error);
        }
    },

    /**
     * Clear entire queue
     */
    clear: (): void => {
        try {
            storage.set(KEYS.OFFLINE_QUEUE, JSON.stringify([]));
        } catch (error) {
            console.error('Error clearing offline queue:', error);
        }
    },

    /**
     * Get queue size
     */
    size: (): number => {
        return offlineQueue.get().length;
    },
};

/**
 * Last Sync Tracker
 */
export const syncTracker = {
    /**
     * Get last sync timestamp
     */
    getLastSync: (): number => {
        return storage.getNumber(KEYS.LAST_SYNC) || 0;
    },

    /**
     * Update last sync timestamp
     */
    updateLastSync: (): void => {
        storage.set(KEYS.LAST_SYNC, Date.now());
    },

    /**
     * Get time since last sync (in minutes)
     */
    getTimeSinceSync: (): number => {
        const lastSync = syncTracker.getLastSync();
        if (!lastSync) return Infinity;
        return (Date.now() - lastSync) / (60 * 1000);
    },
};

/**
 * Clear all cached data
 */
export const clearAllCache = (): void => {
    try {
        storage.clearAll();
        console.log('Cache cleared successfully');
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
};

/**
 * Get cache size (approximate in bytes)
 */
export const getCacheSize = (): number => {
    try {
        let size = 0;
        const keys = [
            KEYS.SATELLITES,
            KEYS.CONJUNCTIONS,
            KEYS.HIGH_RISK_CONJUNCTIONS,
            KEYS.CONJUNCTION_STATS,
            KEYS.OFFLINE_QUEUE,
        ];

        keys.forEach(key => {
            const data = storage.getString(key);
            if (data) {
                size += new Blob([data]).size;
            }
        });

        return size;
    } catch (error) {
        console.error('Error calculating cache size:', error);
        return 0;
    }
};

/**
 * Get cache info
 */
export const getCacheInfo = () => {
    return {
        satellites: {
            count: satelliteCache.get().length,
            updatedAt: satelliteCache.getUpdatedAt(),
            isStale: satelliteCache.isStale(),
        },
        conjunctions: {
            count: conjunctionCache.get().length,
            updatedAt: conjunctionCache.getUpdatedAt(),
            isStale: conjunctionCache.isStale(),
        },
        offlineQueue: {
            size: offlineQueue.size(),
        },
        lastSync: syncTracker.getLastSync(),
        timeSinceSync: syncTracker.getTimeSinceSync(),
        totalSize: getCacheSize(),
    };
};
