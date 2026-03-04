/**
 * Custom Hook: useSatellites
 * 
 * Fetches and manages satellite data with caching
 */

import { useQuery } from '@apollo/client';
import { GET_SATELLITES } from '../services/graphql/queries';
import { Satellite, SatelliteFilter } from '../types';

interface UseSatellitesOptions {
    filter?: SatelliteFilter;
    pollInterval?: number;
}

export function useSatellites(options: UseSatellitesOptions = {}) {
    const { filter, pollInterval = 30000 } = options; // Poll every 30s by default

    const { data, loading, error, refetch } = useQuery(GET_SATELLITES, {
        variables: { filter },
        pollInterval,
        notifyOnNetworkStatusChange: true,
    });

    const satellites: Satellite[] = data?.satellites || [];

    return {
        satellites,
        loading,
        error,
        refetch,
        count: satellites.length,
    };
}
