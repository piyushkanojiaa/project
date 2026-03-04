/**
 * Network Status Component
 * 
 * Displays network connectivity status banner
 */

import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Banner } from 'react-native-paper';
import { useOfflineSync } from '../../hooks/useOfflineSync';
import { formatDistanceToNow } from 'date-fns';

export default function NetworkStatusBanner() {
    const { isOnline, isReachable, isSyncing, lastSyncTime, forceSync } = useOfflineSync();
    const [visible, setVisible] = React.useState(true);

    // Show banner when offline
    const showBanner = !isOnline || !isReachable;

    if (!showBanner || !visible) {
        return null;
    }

    const lastSyncText = lastSyncTime
        ? `Last synced ${formatDistanceToNow(lastSyncTime, { addSuffix: true })}`
        : 'Never synced';

    return (
        <Banner
            visible={visible}
            actions={[
                {
                    label: 'Dismiss',
                    onPress: () => setVisible(false),
                },
                ...(isOnline && isReachable
                    ? [
                        {
                            label: isSyncing ? 'Syncing...' : 'Sync Now',
                            onPress: forceSync,
                            disabled: isSyncing,
                        },
                    ]
                    : []),
            ]}
            icon="wifi-off"
            style={styles.banner}
        >
            <View>
                <Text style={styles.title}>
                    {!isOnline ? 'No Internet Connection' : 'Internet Not Reachable'}
                </Text>
                <Text style={styles.subtitle}>
                    {isSyncing ? 'Syncing data...' : `Using cached data. ${lastSyncText}`}
                </Text>
            </View>
        </Banner>
    );
}

const styles = StyleSheet.create({
    banner: {
        backgroundColor: 'rgba(255, 152, 0, 0.2)',
    },
    title: {
        color: '#ff9800',
        fontWeight: 'bold',
        fontSize: 14,
    },
    subtitle: {
        color: 'rgba(255, 152, 0, 0.8)',
        fontSize: 12,
        marginTop: 4,
    },
});
