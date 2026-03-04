/**
 * Layer Manager Component
 * 
 * UI for toggling visibility and controlling deck.gl layers
 */

import React from 'react';

export interface LayerSettings {
    heatmap: { visible: boolean; opacity: number };
    scatter: { visible: boolean; opacity: number };
    hexagon: { visible: boolean; opacity: number };
    arc: { visible: boolean; opacity: number };
    path: { visible: boolean; opacity: number };
}

export interface LayerManagerProps {
    visible: boolean;
    layers: LayerSettings;
    onLayersChange: (layers: LayerSettings) => void;
    onClose: () => void;
}

export const DEFAULT_LAYER_SETTINGS: LayerSettings = {
    heatmap: { visible: true, opacity: 0.8 },
    scatter: { visible: true, opacity: 0.8 },
    hexagon: { visible: false, opacity: 0.8 },
    arc: { visible: false, opacity: 0.6 },
    path: { visible: false, opacity: 0.7 }
};

export default function LayerManager({
    visible,
    layers,
    onLayersChange,
    onClose
}: LayerManagerProps) {
    if (!visible) return null;

    const handleToggle = (layerKey: keyof LayerSettings) => {
        onLayersChange({
            ...layers,
            [layerKey]: {
                ...layers[layerKey],
                visible: !layers[layerKey].visible
            }
        });
    };

    const handleOpacityChange = (layerKey: keyof LayerSettings, opacity: number) => {
        onLayersChange({
            ...layers,
            [layerKey]: {
                ...layers[layerKey],
                opacity
            }
        });
    };

    const layerInfo: Record<keyof LayerSettings, { icon: string; name: string; description: string }> = {
        heatmap: {
            icon: '🌡️',
            name: 'Heatmap',
            description: 'Smooth gradient density visualization'
        },
        scatter: {
            icon: '🔵',
            name: 'Scatter Points',
            description: 'Individual conjunction points'
        },
        hexagon: {
            icon: '⬡',
            name: '3D Hexagons',
            description: 'Spatial aggregation bins'
        },
        arc: {
            icon: '〰️',
            name: 'Connection Arcs',
            description: 'Satellite-to-debris links'
        },
        path: {
            icon: '📍',
            name: 'Trajectories',
            description: 'Satellite orbital paths'
        }
    };

    return (
        <div
            style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                backgroundColor: 'rgba(10, 25, 47, 0.95)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0, 255, 255, 0.3)',
                borderRadius: '12px',
                padding: '20px',
                minWidth: '280px',
                maxWidth: '320px',
                color: 'white',
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 255, 255, 0.1)',
                zIndex: 2000,
                maxHeight: '85vh',
                overflowY: 'auto'
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                borderBottom: '2px solid rgba(0, 255, 255, 0.3)',
                paddingBottom: '12px'
            }}>
                <h3 style={{
                    margin: 0,
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#00ffff',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                }}>
                    🗂️ Layers
                </h3>
                <button
                    onClick={onClose}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'rgba(255, 255, 255, 0.6)',
                        fontSize: '20px',
                        cursor: 'pointer',
                        padding: '0',
                        lineHeight: '1'
                    }}
                >
                    ×
                </button>
            </div>

            {/* Layer Controls */}
            {(Object.keys(layers) as Array<keyof LayerSettings>).map((layerKey) => {
                const layer = layers[layerKey];
                const info = layerInfo[layerKey];

                return (
                    <div
                        key={layerKey}
                        style={{
                            marginBottom: '16px',
                            padding: '12px',
                            borderRadius: '8px',
                            background: layer.visible
                                ? 'rgba(0, 255, 255, 0.1)'
                                : 'rgba(0, 30, 60, 0.4)',
                            border: `1px solid ${layer.visible ? 'rgba(0, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.1)'}`,
                            transition: 'all 0.2s'
                        }}
                    >
                        {/* Layer Header with Toggle */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: layer.visible ? '12px' : '0'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                <span style={{ fontSize: '18px' }}>{info.icon}</span>
                                <div>
                                    <div style={{ fontWeight: '600', fontSize: '13px' }}>
                                        {info.name}
                                    </div>
                                    <div style={{
                                        fontSize: '10px',
                                        opacity: 0.7,
                                        marginTop: '2px'
                                    }}>
                                        {info.description}
                                    </div>
                                </div>
                            </div>

                            {/* Toggle Switch */}
                            <label style={{
                                position: 'relative',
                                display: 'inline-block',
                                width: '44px',
                                height: '24px',
                                cursor: 'pointer'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={layer.visible}
                                    onChange={() => handleToggle(layerKey)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                />
                                <span style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: layer.visible ? '#00ffff' : 'rgba(255, 255, 255, 0.2)',
                                    borderRadius: '24px',
                                    transition: '0.3s',
                                    boxShadow: layer.visible ? '0 0 8px rgba(0, 255, 255, 0.5)' : 'none'
                                }}>
                                    <span style={{
                                        position: 'absolute',
                                        content: '""',
                                        height: '18px',
                                        width: '18px',
                                        left: layer.visible ? '23px' : '3px',
                                        bottom: '3px',
                                        backgroundColor: 'white',
                                        borderRadius: '50%',
                                        transition: '0.3s'
                                    }} />
                                </span>
                            </label>
                        </div>

                        {/* Opacity Slider (only when visible) */}
                        {layer.visible && (
                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '6px'
                                }}>
                                    <span style={{ fontSize: '11px', opacity: 0.8 }}>Opacity</span>
                                    <span style={{ fontSize: '11px', fontWeight: '600', color: '#00ffff' }}>
                                        {Math.round(layer.opacity * 100)}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={layer.opacity}
                                    onChange={(e) => handleOpacityChange(layerKey, Number(e.target.value))}
                                    style={{
                                        width: '100%',
                                        accentColor: '#00ffff'
                                    }}
                                />
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Quick Actions */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginTop: '20px',
                paddingTop: '16px',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <button
                    onClick={() => {
                        const allVisible: LayerSettings = {
                            heatmap: { visible: true, opacity: layers.heatmap.opacity },
                            scatter: { visible: true, opacity: layers.scatter.opacity },
                            hexagon: { visible: true, opacity: layers.hexagon.opacity },
                            arc: { visible: true, opacity: layers.arc.opacity },
                            path: { visible: true, opacity: layers.path.opacity }
                        };
                        onLayersChange(allVisible);
                    }}
                    style={{
                        flex: 1,
                        padding: '8px',
                        background: 'rgba(0, 255, 255, 0.2)',
                        border: '1px solid rgba(0, 255, 255, 0.4)',
                        borderRadius: '6px',
                        color: '#00ffff',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(0, 255, 255, 0.3)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(0, 255, 255, 0.2)'}
                >
                    👁️ Show All
                </button>
                <button
                    onClick={() => {
                        const allHidden: LayerSettings = {
                            heatmap: { visible: false, opacity: layers.heatmap.opacity },
                            scatter: { visible: false, opacity: layers.scatter.opacity },
                            hexagon: { visible: false, opacity: layers.hexagon.opacity },
                            arc: { visible: false, opacity: layers.arc.opacity },
                            path: { visible: false, opacity: layers.path.opacity }
                        };
                        onLayersChange(allHidden);
                    }}
                    style={{
                        flex: 1,
                        padding: '8px',
                        background: 'rgba(100, 100, 100, 0.3)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        borderRadius: '6px',
                        color: 'rgba(255, 255, 255, 0.8)',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: '500',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(100, 100, 100, 0.4)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(100, 100, 100, 0.3)'}
                >
                    🚫 Hide All
                </button>
            </div>

            {/* Layer Summary */}
            <div style={{
                marginTop: '16px',
                padding: '10px',
                background: 'rgba(0, 100, 150, 0.2)',
                borderRadius: '6px',
                border: '1px solid rgba(0, 255, 255, 0.2)',
                fontSize: '11px',
                textAlign: 'center',
                opacity: 0.8
            }}>
                {Object.values(layers).filter(l => l.visible).length} of {Object.keys(layers).length} layers visible
            </div>
        </div>
    );
}
