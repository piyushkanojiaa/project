/**
 * Settings Screen
 * 
 * App settings and preferences
 */

import React from 'react';
import { ScrollView, StyleSheet, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { List, Switch, Text, TextInput, Button, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
    const [apiUrl, setApiUrl] = React.useState('http://localhost:8000');
    const [notificationsEnabled, setNotificationsEnabled] = React.useState(true);
    const [criticalAlerts, setCriticalAlerts] = React.useState(true);
    const [highAlerts, setHighAlerts] = React.useState(true);
    const [updateInterval, setUpdateInterval] = React.useState('30');

    React.useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedApiUrl = await AsyncStorage.getItem('apiUrl');
            const savedNotifications = await AsyncStorage.getItem('notificationsEnabled');
            const savedCritical = await AsyncStorage.getItem('criticalAlerts');
            const savedHigh = await AsyncStorage.getItem('highAlerts');
            const savedInterval = await AsyncStorage.getItem('updateInterval');

            if (savedApiUrl) setApiUrl(savedApiUrl);
            if (savedNotifications) setNotificationsEnabled(savedNotifications === 'true');
            if (savedCritical) setCriticalAlerts(savedCritical === 'true');
            if (savedHigh) setHighAlerts(savedHigh === 'true');
            if (savedInterval) setUpdateInterval(savedInterval);
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const saveSettings = async () => {
        try {
            await AsyncStorage.setItem('apiUrl', apiUrl);
            await AsyncStorage.setItem('notificationsEnabled', String(notificationsEnabled));
            await AsyncStorage.setItem('criticalAlerts', String(criticalAlerts));
            await AsyncStorage.setItem('highAlerts', String(highAlerts));
            await AsyncStorage.setItem('updateInterval', updateInterval);

            Alert.alert('Success', 'Settings saved! Please restart the app for changes to take effect.');
        } catch (error) {
            Alert.alert('Error', 'Failed to save settings');
            console.error('Error saving settings:', error);
        }
    };

    const clearCache = async () => {
        Alert.alert(
            'Clear Cache',
            'Are you sure you want to clear all cached data?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Clear',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await AsyncStorage.clear();
                            Alert.alert('Success', 'Cache cleared');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to clear cache');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView}>
                {/* API Settings */}
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    API Configuration
                </Text>
                <View style={styles.card}>
                    <TextInput
                        label="API Base URL"
                        value={apiUrl}
                        onChangeText={setApiUrl}
                        mode="outlined"
                        style={styles.input}
                        theme={{ colors: { text: '#ffffff' } }}
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    <Text variant="bodySmall" style={styles.hint}>
                        Example: http://192.168.1.100:8000
                    </Text>
                </View>

                <Divider style={styles.divider} />

                {/* Notification Settings */}
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    Notifications
                </Text>
                <View style={styles.card}>
                    <List.Item
                        title="Enable Notifications"
                        titleStyle={styles.itemTitle}
                        description="Receive alerts for conjunction events"
                        descriptionStyle={styles.itemDescription}
                        right={() => (
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={setNotificationsEnabled}
                                color="#00ffff"
                            />
                        )}
                    />
                    <List.Item
                        title="Critical Risk Alerts"
                        titleStyle={styles.itemTitle}
                        description="Notify for critical risk conjunctions"
                        descriptionStyle={styles.itemDescription}
                        disabled={!notificationsEnabled}
                        right={() => (
                            <Switch
                                value={criticalAlerts}
                                onValueChange={setCriticalAlerts}
                                disabled={!notificationsEnabled}
                                color="#ff3366"
                            />
                        )}
                    />
                    <List.Item
                        title="High Risk Alerts"
                        titleStyle={styles.itemTitle}
                        description="Notify for high risk conjunctions"
                        descriptionStyle={styles.itemDescription}
                        disabled={!notificationsEnabled}
                        right={() => (
                            <Switch
                                value={highAlerts}
                                onValueChange={setHighAlerts}
                                disabled={!notificationsEnabled}
                                color="#ff9800"
                            />
                        )}
                    />
                </View>

                <Divider style={styles.divider} />

                {/* Data Settings */}
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    Data Updates
                </Text>
                <View style={styles.card}>
                    <TextInput
                        label="Update Interval (seconds)"
                        value={updateInterval}
                        onChangeText={setUpdateInterval}
                        mode="outlined"
                        keyboardType="numeric"
                        style={styles.input}
                        theme={{ colors: { text: '#ffffff' } }}
                    />
                    <Text variant="bodySmall" style={styles.hint}>
                        How often to refresh data (minimum: 30 seconds)
                    </Text>
                </View>

                <Divider style={styles.divider} />

                {/* App Info */}
                <Text variant="titleMedium" style={styles.sectionTitle}>
                    About
                </Text>
                <View style={styles.card}>
                    <List.Item
                        title="Version"
                        titleStyle={styles.itemTitle}
                        description="1.0.0"
                        descriptionStyle={styles.itemDescription}
                    />
                    <List.Item
                        title="Backend Status"
                        titleStyle={styles.itemTitle}
                        description="Connected"
                        descriptionStyle={[styles.itemDescription, { color: '#4caf50' }]}
                    />
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <Button
                        mode="contained"
                        onPress={saveSettings}
                        style={styles.saveButton}
                        buttonColor="#00ffff"
                        textColor="#000510"
                    >
                        Save Settings
                    </Button>
                    <Button
                        mode="outlined"
                        onPress={clearCache}
                        style={styles.clearButton}
                        textColor="#ff9800"
                    >
                        Clear Cache
                    </Button>
                </View>

                <View style={styles.footer}>
                    <Text variant="bodySmall" style={styles.footerText}>
                        Orbital Guard AI © 2026
                    </Text>
                </View>
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
    card: {
        backgroundColor: 'rgba(10, 25, 47, 0.6)',
        marginHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    input: {
        marginHorizontal: 16,
        marginVertical: 8,
        backgroundColor: 'rgba(10, 25, 47, 0.95)',
    },
    hint: {
        color: 'rgba(255, 255, 255, 0.5)',
        marginHorizontal: 16,
        marginBottom: 8,
    },
    itemTitle: {
        color: '#ffffff',
    },
    itemDescription: {
        color: 'rgba(255, 255, 255, 0.6)',
    },
    divider: {
        marginVertical: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    actions: {
        marginHorizontal: 16,
        marginTop: 24,
        gap: 12,
    },
    saveButton: {
        borderRadius: 8,
    },
    clearButton: {
        borderRadius: 8,
        borderColor: '#ff9800',
    },
    footer: {
        alignItems: 'center',
        marginVertical: 32,
    },
    footerText: {
        color: 'rgba(255, 255, 255, 0.3)',
    },
});
