/**
 * Custom Hook: useNotifications
 * 
 * Manages notification permissions, listeners, and background fetch
 */

import { useEffect, useState, useCallback } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
    registerForPushNotifications,
    addNotificationResponseListener,
    addNotificationReceivedListener,
    areNotificationsEnabled,
    clearAllNotifications,
} from '../services/notifications/push';
import {
    registerBackgroundFetch,
    unregisterBackgroundFetch,
    isBackgroundFetchAvailable,
} from '../services/notifications/backgroundFetch';

export function useNotifications() {
    const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
    const [notification, setNotification] = useState<Notifications.Notification | null>(null);
    const [isEnabled, setIsEnabled] = useState(false);
    const [backgroundFetchEnabled, setBackgroundFetchEnabled] = useState(false);

    // Initialize notifications
    useEffect(() => {
        let isMounted = true;

        const initialize = async () => {
            // Check if enabled
            const enabled = await areNotificationsEnabled();
            if (isMounted) setIsEnabled(enabled);

            // Register for push
            if (enabled) {
                const token = await registerForPushNotifications();
                if (isMounted) setExpoPushToken(token);

                // Register background fetch
                const bgAvailable = await isBackgroundFetchAvailable();
                if (bgAvailable) {
                    await registerBackgroundFetch();
                    if (isMounted) setBackgroundFetchEnabled(true);
                }
            }
        };

        initialize();

        return () => {
            isMounted = false;
        };
    }, []);

    // Notification response listener (when user taps notification)
    useEffect(() => {
        const subscription = addNotificationResponseListener((response) => {
            console.log('Notification tapped:', response);

            // Handle navigation based on notification data
            const { conjunctionId, riskLevel } = response.notification.request.content.data as any;

            if (conjunctionId) {
                // TODO: Navigate to conjunction details
                console.log('Navigate to conjunction:', conjunctionId);
            }
        });

        return () => subscription.remove();
    }, []);

    // Notification received listener (when notification arrives while app is open)
    useEffect(() => {
        const subscription = addNotificationReceivedListener((notification) => {
            console.log('Notification received:', notification);
            setNotification(notification);
        });

        return () => subscription.remove();
    }, []);

    // Request permissions
    const requestPermissions = useCallback(async () => {
        const token = await registerForPushNotifications();
        setExpoPushToken(token);

        const enabled = await areNotificationsEnabled();
        setIsEnabled(enabled);

        if (enabled) {
            const bgAvailable = await isBackgroundFetchAvailable();
            if (bgAvailable) {
                await registerBackgroundFetch();
                setBackgroundFetchEnabled(true);
            }
        }

        return token;
    }, []);

    // Clear all notifications
    const clearAll = useCallback(async () => {
        await clearAllNotifications();
        setNotification(null);
    }, []);

    // Disable background fetch
    const disableBackgroundFetch = useCallback(async () => {
        await unregisterBackgroundFetch();
        setBackgroundFetchEnabled(false);
    }, []);

    return {
        expoPushToken,
        notification,
        isEnabled,
        backgroundFetchEnabled,
        requestPermissions,
        clearAll,
        disableBackgroundFetch,
    };
}
