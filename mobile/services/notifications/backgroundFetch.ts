/**
 * Background Fetch Service
 * 
 * Periodically checks for new high-risk conjunctions in the background
 */

import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { apolloClient } from '../graphql/client';
import { GET_HIGH_RISK_CONJUNCTIONS } from '../graphql/queries';
import { scheduleConjunctionNotification } from './push';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BACKGROUND_FETCH_TASK = 'background-conjunction-check';

/**
 * Define background task
 */
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    try {
        console.log('[Background] Checking for new high-risk conjunctions...');

        // Check if notifications are enabled
        const enabled = await AsyncStorage.getItem('notificationsEnabled');
        if (enabled === 'false') {
            console.log('[Background] Notifications disabled, skipping');
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        // Fetch high-risk conjunctions
        const { data, error } = await apolloClient.query({
            query: GET_HIGH_RISK_CONJUNCTIONS,
            fetchPolicy: 'network-only',
        });

        if (error) {
            console.error('[Background] GraphQL error:', error);
            return BackgroundFetch.BackgroundFetchResult.Failed;
        }

        const conjunctions = data?.conjunctions || [];
        console.log(`[Background] Found ${conjunctions.length} high-risk conjunctions`);

        if (conjunctions.length === 0) {
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        // Get last notified conjunction IDs
        const lastNotifiedStr = await AsyncStorage.getItem('lastNotifiedConjunctions');
        const lastNotified = lastNotifiedStr ? JSON.parse(lastNotifiedStr) : [];

        // Filter new conjunctions
        const newConjunctions = conjunctions.filter(
            (c: any) => !lastNotified.includes(c.id)
        );

        if (newConjunctions.length === 0) {
            console.log('[Background] No new conjunctions');
            return BackgroundFetch.BackgroundFetchResult.NoData;
        }

        console.log(`[Background] ${newConjunctions.length} new conjunctions to notify`);

        // Send notifications for new conjunctions
        for (const conjunction of newConjunctions) {
            await scheduleConjunctionNotification({
                id: conjunction.id,
                riskLevel: conjunction.riskLevel,
                missDistance: conjunction.missDistance,
                probability: conjunction.probability,
                tca: conjunction.tca,
            });
        }

        // Update last notified list
        const updatedNotified = [
            ...lastNotified,
            ...newConjunctions.map((c: any) => c.id),
        ].slice(-50); // Keep last 50

        await AsyncStorage.setItem(
            'lastNotifiedConjunctions',
            JSON.stringify(updatedNotified)
        );

        console.log('[Background] Background fetch completed successfully');
        return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
        console.error('[Background] Background fetch failed:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

/**
 * Register background fetch task
 */
export async function registerBackgroundFetch(): Promise<void> {
    try {
        // Check if already registered
        const isRegistered = await TaskManager.isTaskRegisteredAsync(
            BACKGROUND_FETCH_TASK
        );

        if (isRegistered) {
            console.log('[Background] Task already registered');
            return;
        }

        // Register task
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
            minimumInterval: 60 * 15, // 15 minutes
            stopOnTerminate: false, // Continue after app termination
            startOnBoot: true, // Start on device boot
        });

        console.log('[Background] Background fetch registered');
    } catch (error) {
        console.error('[Background] Error registering background fetch:', error);
    }
}

/**
 * Unregister background fetch task
 */
export async function unregisterBackgroundFetch(): Promise<void> {
    try {
        await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
        console.log('[Background] Background fetch unregistered');
    } catch (error) {
        console.error('[Background] Error unregistering background fetch:', error);
    }
}

/**
 * Get background fetch status
 */
export async function getBackgroundFetchStatus(): Promise<BackgroundFetch.BackgroundFetchStatus> {
    return await BackgroundFetch.getStatusAsync();
}

/**
 * Check if background fetch is available
 */
export async function isBackgroundFetchAvailable(): Promise<boolean> {
    const status = await getBackgroundFetchStatus();
    return status === BackgroundFetch.BackgroundFetchStatus.Available;
}
