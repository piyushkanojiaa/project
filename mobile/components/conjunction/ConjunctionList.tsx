/**
 * Conjunction List Component
 * 
 * Displays filterable list of conjunction events
 */

import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Chip, Text, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { Conjunction, RiskLevel } from '../../types';
import ConjunctionCard from './ConjunctionCard';

interface ConjunctionListProps {
    conjunctions: Conjunction[];
    onSelect: (conjunction: Conjunction) => void;
    loading?: boolean;
}

export default function ConjunctionList({ conjunctions, onSelect, loading }: ConjunctionListProps) {
    const [riskFilter, setRiskFilter] = React.useState<RiskLevel | 'ALL'>('ALL');
    const [sortBy, setSortBy] = React.useState<'tca' | 'risk' | 'distance'>('tca');

    const filtered = React.useMemo(() => {
        let result = [...conjunctions];

        // Filter by risk level
        if (riskFilter !== 'ALL') {
            result = result.filter(c => c.riskLevel === riskFilter);
        }

        // Sort
        result.sort((a, b) => {
            switch (sortBy) {
                case 'tca':
                    return new Date(a.tca).getTime() - new Date(b.tca).getTime();
                case 'risk':
                    const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
                    return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
                case 'distance':
                    return a.missDistance - b.missDistance;
                default:
                    return 0;
            }
        });

        return result;
    }, [conjunctions, riskFilter, sortBy]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00ffff" />
                <Text style={styles.loadingText}>Loading conjunctions...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Risk Filter */}
            <View style={styles.filters}>
                <Chip
                    selected={riskFilter === 'ALL'}
                    onPress={() => setRiskFilter('ALL')}
                    style={styles.chip}
                    selectedColor="#00ffff"
                >
                    All ({conjunctions.length})
                </Chip>
                <Chip
                    selected={riskFilter === 'CRITICAL'}
                    onPress={() => setRiskFilter('CRITICAL')}
                    style={styles.chip}
                    selectedColor="#ff3366"
                >
                    Critical ({conjunctions.filter(c => c.riskLevel === 'CRITICAL').length})
                </Chip>
                <Chip
                    selected={riskFilter === 'HIGH'}
                    onPress={() => setRiskFilter('HIGH')}
                    style={styles.chip}
                    selectedColor="#ff9800"
                >
                    High ({conjunctions.filter(c => c.riskLevel === 'HIGH').length})
                </Chip>
            </View>

            {/* Sort Options */}
            <SegmentedButtons
                value={sortBy}
                onValueChange={(value) => setSortBy(value as any)}
                buttons={[
                    { value: 'tca', label: 'Time', icon: 'clock-outline' },
                    { value: 'risk', label: 'Risk', icon: 'alert' },
                    { value: 'distance', label: 'Distance', icon: 'ruler' },
                ]}
                style={styles.segmented}
                theme={{ colors: { secondaryContainer: '#00ffff' } }}
            />

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <ConjunctionCard
                        conjunction={item}
                        onPress={() => onSelect(item)}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {riskFilter !== 'ALL'
                                ? `No ${riskFilter.toLowerCase()} risk conjunctions`
                                : 'No conjunction events'}
                        </Text>
                    </View>
                }
                contentContainerStyle={filtered.length === 0 ? styles.emptyList : undefined}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000510',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000510',
    },
    loadingText: {
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 16,
    },
    filters: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    chip: {
        backgroundColor: 'rgba(10, 25, 47, 0.95)',
    },
    segmented: {
        marginHorizontal: 16,
        marginBottom: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 16,
    },
    emptyList: {
        flexGrow: 1,
    },
});
