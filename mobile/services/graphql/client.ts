/**
 * GraphQL Apollo Client Configuration
 * 
 * Configured for offline support and caching
 */

import { ApolloClient, InMemoryCache, HttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update this with your actual API URL
const API_URL = 'http://localhost:8000/graphql';

// HTTP Link
const httpLink = new HttpLink({
    uri: API_URL,
});

// Auth Link - adds auth token to requests
const authLink = setContext(async (_, { headers }) => {
    try {
        const token = await AsyncStorage.getItem('authToken');
        return {
            headers: {
                ...headers,
                authorization: token ? `Bearer ${token}` : '',
            },
        };
    } catch (error) {
        console.error('Error getting auth token:', error);
        return { headers };
    }
});

// Error Link - handles network and GraphQL errors
const errorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
        graphQLErrors.forEach(({ message, locations, path }) => {
            console.error(
                `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${path}`
            );
        });
    }
    if (networkError) {
        console.error(`[Network error]: ${networkError}`);
    }
});

// In-Memory Cache configuration
const cache = new InMemoryCache({
    typePolicies: {
        Query: {
            fields: {
                satellites: {
                    keyArgs: ['filter'],
                    merge(existing = [], incoming) {
                        return incoming;
                    },
                },
                conjunctions: {
                    keyArgs: ['filter'],
                    merge(existing = [], incoming) {
                        return incoming;
                    },
                },
            },
        },
    },
});

// Apollo Client instance
export const apolloClient = new ApolloClient({
    link: from([errorLink, authLink, httpLink]),
    cache,
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'cache-and-network',
            errorPolicy: 'all',
        },
        query: {
            fetchPolicy: 'cache-first',
            errorPolicy: 'all',
        },
        mutate: {
            errorPolicy: 'all',
        },
    },
});

// Helper to update API URL (for settings)
export const updateApiUrl = (newUrl: string) => {
    // Note: This requires recreating the client
    // For production, consider using a dynamic link
    console.warn('API URL update requires app restart');
};
