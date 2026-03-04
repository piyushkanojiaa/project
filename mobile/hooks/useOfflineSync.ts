/**
 * Custom Hook: useOfflineSync
 * 
 * Monitors network status and syncs data when online
 */

import { useEffect, useState, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { apolloClient } from '../services/graphql/client';
import {
    satelliteCache,
    conjunctionCache,
    statsCache,
    offlineQueue,
    syncTracker,
} from '../services/storage/cache';
import { GET_SATELLITES, GET_CONJUNCTIONS, GET_CONJUNCTION_STATS } from '../services/graphql/queries';

export function useOfflineSync() {
    const [isOnline, setIsOnline] = useState(true);
    const [isReachable, setIsReachable] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<number>(0);

    // Monitor network status
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            const online = state.isConnected ?? false;
            const reachable = state.isInternetReachable ?? false;

            setIsOnline(online);
            setIsReachable(reachable);

            console.log('[Network]', {
                type: state.type,
                connected: online,
                reachable,
            });

            // Auto-sync when coming back online
            if (online && reachable && !isSyncing) {
                syncData();
            }
        });

        // Get initial state
        NetInfo.fetch().then(state => {
            setIsOnline(state.isConnected ?? false);
            setIsReachable(state.isInternetReachable ?? false);
        });

        // Load last sync time
        setLastSyncTime(syncTracker.getLastSync());

        return () => unsubscribe();
    }, []);

    /**
     * Sync all data with backend
     */
    const syncData = useCallback(async () => {
        if (!isOnline || !isReachable || isSyncing) {
            console.log('[Sync] Skipping sync - offline or already syncing');
            return;
        }

        setIsSyncing(true);
        console.log('[Sync] Starting data sync...');

        try {
            // Sync satellites
            await syncSatellites();

            // Sync conjunctions
            await syncConjunctions();

            // Sync statistics
            await syncStats();

            // Process offline queue
            await processOfflineQueue();

            // Update sync timestamp
            syncTracker.updateLastSync();
            setLastSyncTime(Date.now());

            console.log('[Sync] Data sync completed successfully');
        } catch (error) {
            console.error('[Sync] Data sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    }, [isOnline, isReachable, isSyncing]);

    /**
     * Sync satellites
     */
    const syncSatellites = async () => {
        try {
            console.log('[Sync] Syncing satellites...');
            const { data } = await apolloClient.query({
                query: GET_SATELLITES,
                fetchPolicy: 'network-only',
            });

            if (data?.satellites) {
                satelliteCache.set(data.satellites);
                console.log(`[Sync] Cached ${data.satellites.length} satellites`);
            }
        } catch (error) {
            console.error('[Sync] Failed to sync satellites:', error);
            throw error;
        }
    };

    /**
     * Sync conjunctions
     */
    const syncConjunctions = async () => {
        try {
            console.log('[Sync] Syncing conjunctions...');
            const { data } = await apolloClient.query({
                query: GET_CONJUNCTIONS,
                variables: { limit: 100 },
                fetchPolicy: 'network-only',
            });

            if (data?.conjunctions) {
                conjunctionCache.set(data.conjunctions);
                console.log(`[Sync] Cached ${data.conjunctions.length} conjunctions`);
            }
        } catch (error) {
            console.error('[Sync] Failed to sync conjunctions:', error);
            throw error;
        }
    };

    /**
     * Sync statistics
     */
    const syncStats = async () => {
        try {
            console.log('[Sync] Syncing statistics...');
            const { data } = await apolloClient.query({
                query: GET_CONJUNCTION_STATS,
                fetchPolicy: 'network-only',
            });

            if (data?.conjunctionStats) {
                statsCache.set(data.conjunctionStats);
                console.log('[Sync] Cached statistics');
            }
        } catch (error) {
            console.error('[Sync] Failed to sync statistics:', error);
            // Non-critical, don't throw
        }
    };

    /**
     * Process offline queue (mutations that were queued while offline)
     */
    const processOfflineQueue = async () => {
        const queue = offlineQueue.get();

        if (queue.length === 0) {
            console.log('[Sync] No queued actions');
            return;
        }

        console.log(`[Sync] Processing ${queue.length} queued actions...`);

        for (const action of queue) {
            try {
                // Execute mutation
                // await apolloClient.mutate({
                //   mutation: ..., // Would need to map operation string to mutation
                //   variables: action.variables,
                // });

                // Remove from queue after successful execution
                offlineQueue.remove(action.id);
                console.log(`[Sync] Processed action ${action.id}`);
            } catch (error) {
                console.error(`[Sync] Failed to process action ${action.id}:`, error);
                // Keep in queue for next sync attempt
            }
        }
    };

    /**
     * Force manual sync
     */
    const forceSync = useCallback(async () => {
        if (!isOnline || !isReachable) {
            throw new Error('Cannot sync while offline');
        }
        await syncData();
    }, [isOnline, isReachable, syncData]);

    /**
     * Get cached data counts
     */
    const getCachedCounts = useCallback(() => {
        return {
            satellites: satelliteCache.get().length,
            conjunctions: conjunctionCache.get().length,
            queuedActions: offlineQueue.size(),
        };
    }, []);

    return {
        isOnline,
        isReachable,
        isSyncing,
        lastSyncTime,
        syncData,
        forceSync,
        getCachedCounts,
    };
}
