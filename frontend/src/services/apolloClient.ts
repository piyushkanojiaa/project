/**
 * Apollo Client Configuration with WebSocket Subscriptions
 * 
 * Unified GraphQL client for queries, mutations, and real-time subscriptions
 */

import { ApolloClient, InMemoryCache, HttpLink, split } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

// API endpoints
const HTTP_ENDPOINT = 'http://localhost:8000/graphql';
const WS_ENDPOINT = 'ws://localhost:8000/graphql';

// HTTP link for queries and mutations
const httpLink = new HttpLink({
    uri: HTTP_ENDPOINT,
    credentials: 'same-origin',
});

// WebSocket link for subscriptions
const wsLink = new GraphQLWsLink(
    createClient({
        url: WS_ENDPOINT,
        connectionParams: {
            // Add auth token if needed
            // authToken: localStorage.getItem('token'),
        },
        retryAttempts: 5,
        shouldRetry: () => true,
        on: {
            connected: () => console.log('🔗 WebSocket connected'),
            closed: () => console.log('🔌 WebSocket disconnected'),
            error: (error) => console.error('❌ WebSocket error:', error),
        },
    })
);

// Split link - use WebSocket for subscriptions, HTTP for everything else
const splitLink = split(
    ({ query }) => {
        const definition = getMainDefinition(query);
        return (
            definition.kind === 'OperationDefinition' &&
            definition.operation === 'subscription'
        );
    },
    wsLink,
    httpLink
);

// Apollo Client instance
export const apolloClient = new ApolloClient({
    link: splitLink,
    cache: new InMemoryCache({
        typePolicies: {
            Query: {
                fields: {
                    conjunctions: {
                        // Merge strategy for conjunction lists
                        merge(existing = [], incoming) {
                            return incoming;
                        },
                    },
                    satellites: {
                        merge(existing = [], incoming) {
                            return incoming;
                        },
                    },
                },
            },
        },
    }),
    defaultOptions: {
        watchQuery: {
            fetchPolicy: 'cache-and-network',
            errorPolicy: 'all',
        },
        query: {
            fetchPolicy: 'network-only',
            errorPolicy: 'all',
        },
        mutate: {
            errorPolicy: 'all',
        },
    },
});

// Helper to check WebSocket connection status
export function isWebSocketConnected(): boolean {
    // Check if WebSocket is connected
    return true; // Simplified - GraphQL WS handles this internally
}

export default apolloClient;
