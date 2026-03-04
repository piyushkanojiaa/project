/**
 * Custom Hook: useConjunctions
 * 
 * Fetches and manages conjunction data with filtering
 */

import { useQuery } from '@apollo/client';
import { GET_CONJUNCTIONS } from '../services/graphql/queries';
import { Conjunction, ConjunctionFilter } from '../types';

interface UseConjunctionsOptions {
    filter?: ConjunctionFilter;
    limit?: number;
    pollInterval?: number;
}

export function useConjunctions(options: UseConjunctionsOptions = {}) {
    const { filter, limit = 50, pollInterval = 60000 } = options; // Poll every 60s

    const { data, loading, error, refetch } = useQuery(GET_CONJUNCTIONS, {
        variables: { filter, limit },
        pollInterval,
        notifyOnNetworkStatusChange: true,
    });

    const conjunctions: Conjunction[] = data?.conjunctions || [];

    // Statistics
    const criticalCount = conjunctions.filter(c => c.riskLevel === 'CRITICAL').length;
    const highCount = conjunctions.filter(c => c.riskLevel === 'HIGH').length;
    const activeCount = conjunctions.filter(c => c.status === 'ACTIVE').length;

    return {
        conjunctions,
        loading,
        error,
        refetch,
        stats: {
            total: conjunctions.length,
            critical: criticalCount,
            high: highCount,
            active: activeCount,
        },
    };
}
