/**
 * Satellite List Component
 * 
 * Displays searchable, filterable list of satellites
 */

import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { List, Searchbar, Chip, Text, ActivityIndicator } from 'react-native-paper';
import { Satellite, SatelliteType } from '../../types';

interface SatelliteListProps {
    satellites: Satellite[];
    onSelect: (satellite: Satellite) => void;
    loading?: boolean;
}

export default function SatelliteList({ satellites, onSelect, loading }: SatelliteListProps) {
    const [search, setSearch] = React.useState('');
    const [filter, setFilter] = React.useState<'ALL' | SatelliteType>('ALL');

    const filtered = React.useMemo(() => {
        return satellites.filter(sat => {
            const matchesSearch = sat.name.toLowerCase().includes(search.toLowerCase()) ||
                sat.noradId.toString().includes(search);
            const matchesFilter = filter === 'ALL' || sat.type === filter;
            return matchesSearch && matchesFilter;
        });
    }, [satellites, search, filter]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#00ffff" />
                <Text style={styles.loadingText}>Loading satellites...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Searchbar
                placeholder="Search satellites..."
                onChangeText={setSearch}
                value={search}
                style={styles.search}
                iconColor="#00ffff"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                theme={{ colors: { text: '#ffffff' } }}
            />

            <View style={styles.filters}>
                <Chip
                    selected={filter === 'ALL'}
                    onPress={() => setFilter('ALL')}
                    style={styles.chip}
                    selectedColor="#00ffff"
                >
                    All ({satellites.length})
                </Chip>
                <Chip
                    selected={filter === 'ACTIVE'}
                    onPress={() => setFilter('ACTIVE')}
                    style={styles.chip}
                    selectedColor="#00ffff"
                >
                    Active ({satellites.filter(s => s.type === 'ACTIVE').length})
                </Chip>
                <Chip
                    selected={filter === 'DEBRIS'}
                    onPress={() => setFilter('DEBRIS')}
                    style={styles.chip}
                    selectedColor="#00ffff"
                >
                    Debris ({satellites.filter(s => s.type === 'DEBRIS').length})
                </Chip>
            </View>

            <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <List.Item
                        title={item.name}
                        titleStyle={styles.itemTitle}
                        description={`NORAD: ${item.noradId}${item.altitude ? ` | Alt: ${item.altitude.toFixed(0)} km` : ''}`}
                        descriptionStyle={styles.itemDescription}
                        left={props => (
                            <List.Icon
                                {...props}
                                icon={item.type === 'ACTIVE' ? 'satellite-variant' : 'alert-circle'}
                                color={item.type === 'ACTIVE' ? '#00ffff' : '#ff9800'}
                            />
                        )}
                        right={props => (
                            <List.Icon {...props} icon="chevron-right" color="#00ffff" />
                        )}
                        onPress={() => onSelect(item)}
                        style={styles.item}
                    />
                )}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>
                            {search ? 'No satellites match your search' : 'No satellites found'}
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
    search: {
        margin: 16,
        marginBottom: 8,
        backgroundColor: 'rgba(10, 25, 47, 0.95)',
    },
    filters: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    chip: {
        backgroundColor: 'rgba(10, 25, 47, 0.95)',
    },
    item: {
        backgroundColor: 'rgba(10, 25, 47, 0.6)',
        marginVertical: 4,
        marginHorizontal: 16,
        borderRadius: 8,
    },
    itemTitle: {
        color: '#ffffff',
        fontWeight: '600',
    },
    itemDescription: {
        color: 'rgba(255, 255, 255, 0.6)',
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
