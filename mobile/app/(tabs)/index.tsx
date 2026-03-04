/**
 * Dashboard Screen (Home/Index)
 *  
 * Main dashboard showing system stats, recent conjunctions, and quick access
 */

import React from 'react';
import { ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useSatellites } from '../../hooks/useSatellites';
import { useConjunctions } from '../../hooks/useConjunctions';
import StatsCard from '../../components/dashboard/StatsCard';
import ConjunctionCard from '../../components/conjunction/ConjunctionCard';

export default function DashboardScreen() {
  const { satellites, loading: satLoading, refetch: refetchSats } = useSatellites();
  const {
    conjunctions,
    loading: conjLoading,
    refetch: refetchConj,
    stats: conjStats,
  } = useConjunctions({ limit: 10 });

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchSats(), refetchConj()]);
    setRefreshing(false);
  };

  const stats = {
    totalSatellites: satellites.length,
    activeConjunctions: conjStats.active,
    criticalRisk: conjStats.critical,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#00ffff"
          />
        }
      >
        {/* System Stats */}
        <StatsCard stats={stats} loading={satLoading || conjLoading} />

        {/* Recent Conjunctions */}
        <Text variant="headlineSmall" style={styles.sectionTitle}>
          Recent Conjunctions
        </Text>

        {conjunctions.map((conjunction) => (
          <ConjunctionCard
            key={conjunction.id}
            conjunction={conjunction}
            onPress={() => {
              // Navigate to details
              console.log('Navigate to conjunction:', conjunction.id);
            }}
          />
        ))}

        {conjunctions.length === 0 && !conjLoading && (
          <Text style={styles.emptyText}>No conjunction events</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000510',
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    color: '#00ffff',
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
    marginVertical: 32,
  },
});
