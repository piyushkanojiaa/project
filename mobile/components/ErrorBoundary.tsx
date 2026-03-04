/**
 * Error Boundary Component
 * 
 * Catches and displays React errors gracefully
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Button } from 'react-native-paper';
import * as Updates from 'expo-updates';

interface Props {
    children: React.ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    handleReload = async () => {
        try {
            await Updates.reloadAsync();
        } catch (error) {
            console.error('Error reloading app:', error);
            // Fallback: reset state
            this.setState({
                hasError: false,
                error: null,
                errorInfo: null,
            });
        }
    };

    handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <ScrollView contentContainerStyle={styles.content}>
                        <Text style={styles.emoji}>⚠️</Text>
                        <Text style={styles.title}>Something went wrong</Text>
                        <Text style={styles.message}>
                            The app encountered an unexpected error. Try reloading or contact support if the
                            problem persists.
                        </Text>

                        {__DEV__ && this.state.error && (
                            <View style={styles.errorDetails}>
                                <Text style={styles.errorTitle}>Error Details (Dev Only):</Text>
                                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                                {this.state.errorInfo && (
                                    <Text style={styles.errorText}>{this.state.errorInfo.componentStack}</Text>
                                )}
                            </View>
                        )}

                        <View style={styles.actions}>
                            <Button
                                mode="contained"
                                onPress={this.handleReload}
                                style={styles.button}
                                buttonColor="#00ffff"
                                textColor="#000510"
                            >
                                Reload App
                            </Button>
                            <Button
                                mode="outlined"
                                onPress={this.handleReset}
                                style={styles.button}
                                textColor="#00ffff"
                            >
                                Try Again
                            </Button>
                        </View>
                    </ScrollView>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000510',
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.7)',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    errorDetails: {
        backgroundColor: 'rgba(255, 51, 102, 0.1)',
        padding: 16,
        borderRadius: 8,
        marginBottom: 24,
        width: '100%',
    },
    errorTitle: {
        color: '#ff3366',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    errorText: {
        color: '#ff3366',
        fontSize: 12,
        fontFamily: 'monospace',
    },
    actions: {
        width: '100%',
        gap: 12,
    },
    button: {
        borderRadius: 8,
    },
});
