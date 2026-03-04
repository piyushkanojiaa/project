/**
 * Kepler.gl Configuration
 * 
 * Layer definitions, filters, and map styling for Kepler.gl visualization
 */

import type { LayerConfig } from 'kepler.gl/reducers';

// Color schemes matching Orbital Guard AI theme
export const RISK_COLORS = {
    LOW: [76, 175, 80],      // Green
    MEDIUM: [255, 193, 7],   // Yellow
    HIGH: [255, 152, 0],     // Orange
    CRITICAL: [244, 67, 54]  // Red
};

// Default map configuration
export const DEFAULT_MAP_CONFIG = {
    version: 'v1',
    config: {
        visState: {
            filters: [],
            layers: [],
            interactionConfig: {
                tooltip: {
                    fieldsToShow: {},
                    enabled: true
                },
                brush: {
                    size: 0.5,
                    enabled: false
                },
                coordinate: {
                    enabled: false
                }
            },
            layerBlending: 'additive',
            splitMaps: [],
            animationConfig: {
                currentTime: null,
                speed: 1
            }
        },
        mapState: {
            bearing: 0,
            dragRotate: true,
            latitude: 0,
            longitude: 0,
            pitch: 0,
            zoom: 1,
            isSplit: false
        },
        mapStyle: {
            styleType: 'dark',
            topLayerGroups: {},
            visibleLayerGroups: {
                label: true,
                road: true,
                border: false,
                building: true,
                water: true,
                land: true,
                '3d building': false
            },
            threeDBuildingColor: [9.665468314072013, 17.18305478057247, 31.1442867897876],
            mapStyles: {}
        }
    }
};

// Point Layer Configuration - Conjunction Events
export const POINT_LAYER_CONFIG = {
    type: 'point',
    config: {
        dataId: 'conjunctions',
        label: 'Conjunction Events',
        color: [255, 0, 0],
        columns: {
            lat: 'latitude',
            lng: 'longitude',
            altitude: 'altitude'
        },
        isVisible: true,
        visConfig: {
            radius: 10,
            fixedRadius: false,
            opacity: 0.8,
            outline: true,
            thickness: 2,
            strokeColor: [255, 255, 255],
            colorRange: {
                name: 'Custom Risk',
                type: 'custom',
                category: 'Custom',
                colors: [
                    '#4CAF50', // LOW
                    '#FFC107', // MEDIUM
                    '#FF9800', // HIGH
                    '#F44336'  // CRITICAL
                ]
            },
            strokeColorRange: {
                name: 'Global Warming',
                type: 'sequential',
                category: 'Uber',
                colors: ['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']
            },
            radiusRange: [5, 50],
            filled: true
        },
        hidden: false,
        textLabel: [
            {
                field: null,
                color: [255, 255, 255],
                size: 18,
                offset: [0, 0],
                anchor: 'start',
                alignment: 'center'
            }
        ]
    },
    visualChannels: {
        colorField: {
            name: 'risk_level',
            type: 'string'
        },
        colorScale: 'ordinal',
        strokeColorField: null,
        strokeColorScale: 'quantile',
        sizeField: {
            name: 'poc_ml',
            type: 'real'
        },
        sizeScale: 'sqrt'
    }
};

// Arc Layer Configuration - Satellite-to-Debris Connections
export const ARC_LAYER_CONFIG = {
    type: 'arc',
    config: {
        dataId: 'conjunctions',
        label: 'Conjunction Arcs',
        color: [255, 0, 0],
        columns: {
            lat0: 'satellite_lat',
            lng0: 'satellite_lng',
            lat1: 'debris_lat',
            lng1: 'debris_lng'
        },
        isVisible: false,
        visConfig: {
            opacity: 0.8,
            thickness: 2,
            colorRange: {
                name: 'Custom Risk',
                type: 'custom',
                category: 'Custom',
                colors: ['#4CAF50', '#FFC107', '#FF9800', '#F44336']
            },
            sizeRange: [0, 10],
            targetColor: null
        },
        hidden: false,
        textLabel: [
            {
                field: null,
                color: [255, 255, 255],
                size: 18,
                offset: [0, 0],
                anchor: 'start',
                alignment: 'center'
            }
        ]
    },
    visualChannels: {
        colorField: {
            name: 'risk_level',
            type: 'string'
        },
        colorScale: 'ordinal',
        sizeField: {
            name: 'poc_ml',
            type: 'real'
        },
        sizeScale: 'linear'
    }
};

// Hexbin Layer Configuration - Spatial Density
export const HEXBIN_LAYER_CONFIG = {
    type: 'hexagonId',
    config: {
        dataId: 'conjunctions',
        label: 'Hotspot Hexbins',
        color: [255, 0, 0],
        columns: {
            hex_id: 'hex_id'
        },
        isVisible: false,
        visConfig: {
            opacity: 0.8,
            colorRange: {
                name: 'Global Warming',
                type: 'sequential',
                category: 'Uber',
                colors: ['#5A1846', '#900C3F', '#C70039', '#E3611C', '#F1920E', '#FFC300']
            },
            coverage: 1,
            enable3d: true,
            sizeRange: [0, 500],
            coverageRange: [0, 1],
            elevationScale: 5
        },
        hidden: false
    },
    visualChannels: {
        colorField: {
            name: 'poc_ml',
            type: 'real'
        },
        colorScale: 'quantize',
        sizeField: null,
        sizeScale: 'linear',
        coverageField: null,
        coverageScale: 'linear'
    }
};

// Helper function to create Kepler.gl dataset
export interface KeplerDataset {
    info: {
        label: string;
        id: string;
    };
    data: {
        fields: Array<{
            name: string;
            type: string;
            format?: string;
        }>;
        rows: Array<any[]>;
    };
}

export function createKeplerDataset(
    id: string,
    label: string,
    fields: Array<{ name: string; type: string }>,
    rows: Array<any[]>
): KeplerDataset {
    return {
        info: {
            label,
            id
        },
        data: {
            fields,
            rows
        }
    };
}

// Helper function to add data to Kepler.gl
export function getKeplerConfig(datasets: KeplerDataset[]) {
    return {
        datasets,
        config: DEFAULT_MAP_CONFIG.config,
        options: {
            centerMap: true,
            readOnly: false
        }
    };
}
