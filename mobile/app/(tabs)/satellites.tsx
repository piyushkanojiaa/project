/**
 * Satellites Screen
 * 
 * Displays list of all tracked satellites with search and filtering
 */

import React from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSatellites } from '../../hooks/useSatellites';
import SatelliteList from '../../components/satellite/SatelliteList';

export default function SatellitesScreen() {
    const { satellites, loading, refetch } = useSatellites();
    const [refreshing, setRefreshing] = React.useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await refetch();
        setRefreshing(false);
    };

    const handleSelectSatellite = (satellite: any) => {
        // TODO: Navigate to satellite details
        console.log('Selected satellite:', satellite.name);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <SatelliteList
                satellites={satellites}
                onSelect={handleSelectSatellite}
                loading={loading}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000510',
    },
});
