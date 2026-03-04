/**
 * Dashboard Stats Card Component
 * 
 * Displays key statistics in a card format
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, ActivityIndicator } from 'react-native-paper';

interface StatsCardProps {
    stats: {
        totalSatellites: number;
        activeConjunctions: number;
        criticalRisk: number;
    };
    loading?: boolean;
}

export default function StatsCard({ stats, loading }: StatsCardProps) {
    if (loading) {
        return (
            <Card style={styles.card}>
                <Card.Content style={styles.loadingContainer}>
                    <ActivityIndicator size="large" />
                </Card.Content>
            </Card>
        );
    }

    return (
        <Card style={styles.card}>
            <Card.Content>
                <Text variant="titleLarge" style={styles.title}>
                    System Status
                </Text>

                <View style={styles.statsGrid}>
                    <StatItem
                        label="Active Satellites"
                        value={stats.totalSatellites}
                        color="#00ffff"
                    />
                    <StatItem
                        label="Active Conjunctions"
                        value={stats.activeConjunctions}
                        color="#ffaa00"
                    />
                    <StatItem
                        label="Critical Risks"
                        value={stats.criticalRisk}
                        color="#ff3366"
                    />
                </View>
            </Card.Content>
        </Card>
    );
}

interface StatItemProps {
    label: string;
    value: number;
    color: string;
}

function StatItem({ label, value, color }: StatItemProps) {
    return (
        <View style={styles.statItem}>
            <Text variant="displaySmall" style={[styles.statValue, { color }]}>
                {value}
            </Text>
            <Text variant="bodyMedium" style={styles.statLabel}>
                {label}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        margin: 16,
        backgroundColor: 'rgba(10, 25, 47, 0.95)',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
    },
    title: {
        color: '#00ffff',
        marginBottom: 16,
        fontWeight: 'bold',
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingVertical: 8,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
    },
});
