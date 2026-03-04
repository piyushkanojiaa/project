import { Tabs } from 'expo-router';
import React from 'react';
import { ApolloProvider } from '@apollo/client';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import { apolloClient } from '../services/graphql/client';
import { StatusBar } from 'expo-status-bar';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ErrorBoundary from '../components/ErrorBoundary';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#00ffff',
    background: '#000510',
    surface: 'rgba(10, 25, 47, 0.95)',
    text: '#ffffff',
  },
};

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ApolloProvider client={apolloClient}>
        <PaperProvider theme={theme}>
          <StatusBar style="light" />
          <Tabs
            screenOptions={{
              headerStyle: {
                backgroundColor: 'rgba(10, 25, 47, 0.95)',
              },
              headerTintColor: '#00ffff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
              tabBarStyle: {
                backgroundColor: 'rgba(10, 25, 47, 0.95)',
                borderTopColor: 'rgba(0, 255, 255, 0.3)',
              },
              tabBarActiveTintColor: '#00ffff',
              tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.5)',
            }}
          >
            <Tabs.Screen
              name="index"
              options={{
                title: 'Dashboard',
                tabBarIcon: ({ color }) => (
                  <MaterialCommunityIcons name="view-dashboard" size={24} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="satellites"
              options={{
                title: 'Satellites',
                tabBarIcon: ({ color }) => (
                  <MaterialCommunityIcons name="satellite-variant" size={24} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="conjunctions"
              options={{
                title: 'Conjunctions',
                tabBarIcon: ({ color }) => (
                  <MaterialCommunityIcons name="alert-circle" size={24} color={color} />
                ),
              }}
            />
            <Tabs.Screen
              name="settings"
              options={{
                title: 'Settings',
                tabBarIcon: ({ color }) => (
                  <MaterialCommunityIcons name="cog" size={24} color={color} />
                ),
              }}
            />
          </Tabs>
        </PaperProvider>
      </ApolloProvider>
    </ErrorBoundary>
  );
}
