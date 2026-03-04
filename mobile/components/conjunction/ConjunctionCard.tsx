/**
 * Conjunction Card Component
 * 
 * Displays conjunction information in a card format
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { Conjunction } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface ConjunctionCardProps {
    conjunction: Conjunction;
    onPress?: () => void;
}

export default function ConjunctionCard({ conjunction, onPress }: ConjunctionCardProps) {
    const riskColor = getRiskColor(conjunction.riskLevel);

    return (
        <Card style={styles.card} onPress={onPress}>
            <Card.Content>
                {/* Header */}
                <View style={styles.header}>
                    <Text variant="titleMedium" style={styles.title}>
                        Event #{conjunction.id.slice(0, 8)}
                    </Text>
                    <Chip
                        style={[styles.riskBadge, { backgroundColor: riskColor }]}
                        textStyle={styles.riskText}
                    >
                        {conjunction.riskLevel}
                    </Chip>
                </View>

                {/* Details */}
                <View style={styles.details}>
                    <DetailRow
                        label="Miss Distance"
                        value={`${conjunction.missDistance.toFixed(3)} km`}
                        icon="ruler"
                    />
                    <DetailRow
                        label="Probability"
                        value={`${(conjunction.probability * 100).toFixed(4)}%`}
                        icon="percent"
                    />
                    <DetailRow
                        label="TCA"
                        value={formatDistanceToNow(new Date(conjunction.tca), { addSuffix: true })}
                        icon="clock-outline"
                    />
                </View>

                {/* Objects */}
                <View style={styles.objects}>
                    <Chip icon="satellite-variant" mode="outlined" style={styles.chip}>
                        Sat {conjunction.satelliteId.slice(0, 6)}
                    </Chip>
                    <Chip icon="alert-circle" mode="outlined" style={styles.chip}>
                        Debris {conjunction.debrisId.slice(0, 6)}
                    </Chip>
                </View>
            </Card.Content>
        </Card>
    );
}

interface DetailRowProps {
    label: string;
    value: string;
    icon: string;
}

function DetailRow({ label, value }: DetailRowProps) {
    return (
        <View style={styles.row}>
            <Text variant="bodySmall" style={styles.label}>{label}:</Text>
            <Text variant="bodyMedium" style={styles.value}>{value}</Text>
        </View>
    );
}

function getRiskColor(level: string): string {
    switch (level) {
        case 'CRITICAL': return '#ff3366';
        case 'HIGH': return '#ff9800';
        case 'MEDIUM': return '#ffaa00';
        case 'LOW': return '#4caf50';
        default: return '#9e9e9e';
    }
}

const styles = StyleSheet.create({
    card: {
        marginVertical: 8,
        marginHorizontal: 16,
        backgroundColor: 'rgba(10, 25, 47, 0.95)',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        color: '#ffffff',
        fontWeight: '600',
    },
    riskBadge: {
        height: 28,
    },
    riskText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 11,
    },
    details: {
        marginBottom: 12,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 4,
    },
    label: {
        color: 'rgba(255, 255, 255, 0.6)',
    },
    value: {
        color: '#ffffff',
        fontWeight: '500',
    },
    objects: {
        flexDirection: 'row',
        gap: 8,
    },
    chip: {
        borderColor: '#00ffff',
    },
});
