/**
 * Kepler.gl Analytics Component
 * 
 * Embedded Kepler.gl map for advanced spatial analytics
 */

import React, { useEffect, useState } from 'react';
import { Provider, useDispatch } from 'react-redux';
import KeplerGl from 'kepler.gl';
import { addDataToMap } from 'kepler.gl/actions';
import { store } from '../store/keplerStore';
import { getConjunctionAnalysis } from '../services/api';
import { transformToKeplerDataset, generateSampleKeplerData } from '../utils/keplerDataTransform';
import { getKeplerConfig } from '../config/keplerConfig';

// Map container component
function KeplerMapContainer() {
    const dispatch = useDispatch();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Try to fetch real data from API
            try {
                const conjunctions = await getConjunctionAnalysis();
                const dataset = transformToKeplerDataset(conjunctions);
                const config = getKeplerConfig([dataset]);

                // Add data to Kepler.gl
                dispatch(
                    addDataToMap({
                        datasets: config.datasets,
                        config: config.config,
                        options: config.options
                    })
                );
            } catch (apiError) {
                // Fallback to sample data
                console.warn('API unavailable, using sample data:', apiError);
                const sampleDataset = generateSampleKeplerData(200);
                const config = getKeplerConfig([sampleDataset]);

                dispatch(
                    addDataToMap({
                        datasets: config.datasets,
                        config: config.config,
                        options: config.options
                    })
                );
            }

            setIsLoading(false);
        } catch (err) {
            console.error('Error loading Kepler.gl data:', err);
            setError('Failed to load visualization data');
            setIsLoading(false);
        }
    };

    if (error) {
        return (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0a1929',
                color: 'white'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <h3>❌ Error Loading Map</h3>
                    <p>{error}</p>
                    <button
                        onClick={loadData}
                        style={{
                            marginTop: '16px',
                            padding: '8px 16px',
                            background: '#00ffff',
                            color: '#0a1929',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#0a1929',
                color: 'white'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '50px',
                        height: '50px',
                        border: '4px solid rgba(0, 255, 255, 0.3)',
                        borderTop: '4px solid #00ffff',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                        margin: '0 auto 16px'
                    }} />
                    <p>Loading Kepler.gl Analytics...</p>
                    <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
                </div>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <KeplerGl
                id="map"
                mapboxApiAccessToken={undefined} // Use free basemap
                width="100%"
                height="100%"
            />

            {/* Branding overlay */}
            <div style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'rgba(10, 25, 47, 0.9)',
                backdropFilter: 'blur(10px',
                padding: '12px 20px',
                borderRadius: '8px',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                zIndex: 1000,
                pointerEvents: 'none'
            }}>
                <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#00ffff',
                    marginBottom: '4px'
                }}>
                    🛰️ Orbital Guard AI
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                    Advanced Spatial Analytics
                </div>
            </div>

            {/* Instructions overlay */}
            <div style={{
                position: 'absolute',
                bottom: '16px',
                right: '16px',
                background: 'rgba(10, 25, 47, 0.9)',
                backdropFilter: 'blur(10px)',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                fontSize: '11px',
                maxWidth: '250px',
                zIndex: 1000,
                pointerEvents: 'none'
            }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#00ffff' }}>
                    💡 Quick Tips
                </div>
                <div style={{ opacity: 0.9 }}>
                    • Use filters panel (left) to filter data<br />
                    • Toggle layers to show/hide visualizations<br />
                    • Click play button for time animation<br />
                    • Export config from settings menu
                </div>
            </div>
        </div>
    );
}

// Main component with Redux Provider
export default function KeplerAnalytics() {
    return (
        <Provider store={store}>
            <div style={{ width: '100%', height: '800px', borderRadius: '12px', overflow: 'hidden' }}>
                <KeplerMapContainer />
            </div>
        </Provider>
    );
}
