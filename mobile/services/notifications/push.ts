/**
 * Push Notification Service
 * 
 * Handles push notification registration, permissions, and local notifications
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

/**
 * Register for push notifications
 * Requests permissions and gets push token
 */
export async function registerForPushNotifications(): Promise<string | null> {
    let token = null;

    if (!Device.isDevice) {
        console.warn('Push notifications only work on physical devices');
        return null;
    }

    try {
        // Android notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#00FFFF',
            });

            // Create channels for different risk levels
            await Notifications.setNotificationChannelAsync('critical', {
                name: 'Critical Risk Alerts',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 500, 250, 500],
                lightColor: '#FF3366',
                sound: 'default',
            });

            await Notifications.setNotificationChannelAsync('high', {
                name: 'High Risk Alerts',
                importance: Notifications.AndroidImportance.HIGH,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF9800',
            });
        }

        // Request permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.warn('Push notification permission denied');
            return null;
        }

        // Get push token
        token = (
            await Notifications.getExpoPushTokenAsync({
                projectId: Constants.expoConfig?.extra?.eas?.projectId,
            })
        ).data;

        // Save token
        await AsyncStorage.setItem('pushToken', token);
        console.log('Push token:', token);

        return token;
    } catch (error) {
        console.error('Error registering for push notifications:', error);
        return null;
    }
}

/**
 * Schedule a local notification for a conjunction event
 */
export async function scheduleConjunctionNotification(
    conjunction: {
        id: string;
        riskLevel: string;
        missDistance: number;
        probability: number;
        tca: string;
    }
): Promise<string | null> {
    try {
        // Check if notifications are enabled
        const enabled = await AsyncStorage.getItem('notificationsEnabled');
        if (enabled === 'false') {
            return null;
        }

        // Check risk level preferences
        const criticalEnabled = await AsyncStorage.getItem('criticalAlerts');
        const highEnabled = await AsyncStorage.getItem('highAlerts');

        if (conjunction.riskLevel === 'CRITICAL' && criticalEnabled === 'false') {
            return null;
        }
        if (conjunction.riskLevel === 'HIGH' && highEnabled === 'false') {
            return null;
        }

        // Determine notification channel
        let categoryIdentifier = 'conjunction-alert';
        let channelId = 'default';

        if (conjunction.riskLevel === 'CRITICAL') {
            categoryIdentifier = 'critical-conjunction';
            channelId = 'critical';
        } else if (conjunction.riskLevel === 'HIGH') {
            categoryIdentifier = 'high-conjunction';
            channelId = 'high';
        }

        // Schedule notification
        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title: getNotificationTitle(conjunction.riskLevel),
                body: getNotificationBody(conjunction),
                data: {
                    conjunctionId: conjunction.id,
                    riskLevel: conjunction.riskLevel,
                },
                categoryIdentifier,
                sound: true,
                priority: Notifications.AndroidNotificationPriority.HIGH,
            },
            trigger: null, // Immediate
        });

        // Update badge count
        const currentBadge = await Notifications.getBadgeCountAsync();
        await Notifications.setBadgeCountAsync(currentBadge + 1);

        return notificationId;
    } catch (error) {
        console.error('Error scheduling notification:', error);
        return null;
    }
}

/**
 * Send immediate notification
 */
export async function sendImmediateNotification(
    title: string,
    body: string,
    data?: any
): Promise<string | null> {
    try {
        const notificationId = await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
            },
            trigger: null,
        });

        return notificationId;
    } catch (error) {
        console.error('Error sending notification:', error);
        return null;
    }
}

/**
 * Clear all notifications
 */
export async function clearAllNotifications(): Promise<void> {
    try {
        await Notifications.dismissAllNotificationsAsync();
        await Notifications.setBadgeCountAsync(0);
    } catch (error) {
        console.error('Error clearing notifications:', error);
    }
}

/**
 * Cancel specific notification
 */
export async function cancelNotification(notificationId: string): Promise<void> {
    try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
        console.error('Error canceling notification:', error);
    }
}

/**
 * Add notification response listener
 */
export function addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
) {
    return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Add notification received listener (when app is in foreground)
 */
export function addNotificationReceivedListener(
    callback: (notification: Notifications.Notification) => void
) {
    return Notifications.addNotificationReceivedListener(callback);
}

// Helper functions

function getNotificationTitle(riskLevel: string): string {
    switch (riskLevel) {
        case 'CRITICAL':
            return '🚨 CRITICAL RISK CONJUNCTION DETECTED';
        case 'HIGH':
            return '⚠️ High Risk Conjunction Alert';
        case 'MEDIUM':
            return '⚡ Medium Risk Conjunction';
        case 'LOW':
            return 'ℹ️ Low Risk Conjunction';
        default:
            return 'Conjunction Detected';
    }
}

function getNotificationBody(conjunction: {
    missDistance: number;
    probability: number;
    tca: string;
}): string {
    const distance = conjunction.missDistance.toFixed(3);
    const prob = (conjunction.probability * 100).toFixed(4);
    const time = new Date(conjunction.tca).toLocaleString();

    return `Miss distance: ${distance} km\nProbability: ${prob}%\nTCA: ${time}`;
}

/**
 * Check if notifications are enabled
 */
export async function areNotificationsEnabled(): Promise<boolean> {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
}

/**
 * Get push token from storage
 */
export async function getPushToken(): Promise<string | null> {
    try {
        return await AsyncStorage.getItem('pushToken');
    } catch (error) {
        console.error('Error getting push token:', error);
        return null;
    }
}
