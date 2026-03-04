import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Satellite, Radio, Zap, RefreshCw, Play, Pause, Plus } from 'lucide-react';

const SpaceDebrisAI = () => {
    const [satellites, setSatellites] = useState([]);
    const [debris, setDebris] = useState([]);
    const [collisionAlerts, setCollisionAlerts] = useState([]);
    const [isSimulating, setIsSimulating] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [selectedSat, setSelectedSat] = useState(null);
    const [timeScale, setTimeScale] = useState(100);
    const canvasRef = useRef(null);

    // Orbital mechanics calculations
    const calculateOrbitalPosition = (obj, time) => {
        const n = Math.sqrt(398600.4418 / Math.pow(obj.semiMajorAxis, 3)); // Mean motion
        const M = obj.meanAnomaly + n * time; // Mean anomaly at time t
        let E = M; // Eccentric anomaly (simplified)

        // Newton-Raphson iteration for eccentric anomaly
        for (let i = 0; i < 5; i++) {
            E = E - (E - obj.eccentricity * Math.sin(E) - M) / (1 - obj.eccentricity * Math.cos(E));
        }

        const trueAnomaly = 2 * Math.atan2(
            Math.sqrt(1 + obj.eccentricity) * Math.sin(E / 2),
            Math.sqrt(1 - obj.eccentricity) * Math.cos(E / 2)
        );

        const r = obj.semiMajorAxis * (1 - obj.eccentricity * Math.cos(E));

        // Convert to 3D position
        const x = r * (Math.cos(obj.omega + trueAnomaly) * Math.cos(obj.raan) -
            Math.sin(obj.omega + trueAnomaly) * Math.cos(obj.inclination) * Math.sin(obj.raan));
        const y = r * (Math.cos(obj.omega + trueAnomaly) * Math.sin(obj.raan) +
            Math.sin(obj.omega + trueAnomaly) * Math.cos(obj.inclination) * Math.cos(obj.raan));
        const z = r * Math.sin(obj.omega + trueAnomaly) * Math.sin(obj.inclination);

        return { x, y, z, r };
    };

    // Calculate velocity vector
    const calculateVelocity = (obj, time) => {
        const mu = 398600.4418;
        const pos = calculateOrbitalPosition(obj, time);
        const r = pos.r;
        const v = Math.sqrt(mu * (2 / r - 1 / obj.semiMajorAxis));
        return v;
    };

    // Collision detection using conjunction analysis
    const detectCollisions = (sats, deb, time) => {
        const alerts = [];
        const threshold = 5; // km collision threshold
        const timeHorizon = 3600; // 1 hour look-ahead

        sats.forEach(sat => {
            deb.forEach(d => {
                let minDistance = Infinity;
                let closestTime = 0;

                // Check multiple time steps ahead
                for (let dt = 0; dt < timeHorizon; dt += 60) {
                    const satPos = calculateOrbitalPosition(sat, time + dt);
                    const debPos = calculateOrbitalPosition(d, time + dt);

                    const distance = Math.sqrt(
                        Math.pow(satPos.x - debPos.x, 2) +
                        Math.pow(satPos.y - debPos.y, 2) +
                        Math.pow(satPos.z - debPos.z, 2)
                    );

                    if (distance < minDistance) {
                        minDistance = distance;
                        closestTime = time + dt;
                    }
                }

                if (minDistance < threshold) {
                    const severity = minDistance < 1 ? 'critical' : minDistance < 3 ? 'high' : 'medium';
                    alerts.push({
                        satellite: sat,
                        debris: d,
                        distance: minDistance,
                        time: closestTime,
                        severity,
                        maneuver: calculateAvoidanceManeuver(sat, d, closestTime, minDistance)
                    });
                }
            });
        });

        return alerts.sort((a, b) => a.distance - b.distance);
    };

    // AI-based avoidance maneuver calculation
    const calculateAvoidanceManeuver = (sat, debris, time, distance) => {
        const satPos = calculateOrbitalPosition(sat, time);
        const debPos = calculateOrbitalPosition(debris, time);

        // Calculate required delta-v for collision avoidance
        const relativeVel = {
            x: (satPos.x - debPos.x) / distance,
            y: (satPos.y - debPos.y) / distance,
            z: (satPos.z - debPos.z) / distance
        };

        // Minimum delta-v to move out of collision corridor (5km safety margin)
        const safetyMargin = 5;
        const requiredSeparation = safetyMargin - distance;
        const deltaV = Math.abs(requiredSeparation * 0.1); // Simplified calculation

        // Determine optimal maneuver direction (radial, tangential, or normal)
        const currentVel = calculateVelocity(sat, time);
        const radialDV = deltaV * 0.6; // Radial component
        const tangentialDV = deltaV * 0.8; // Tangential (most efficient)
        const normalDV = deltaV * 0.4; // Normal component

        return {
            type: tangentialDV < radialDV ? 'Tangential Boost' : 'Radial Maneuver',
            deltaV: deltaV.toFixed(3),
            direction: {
                radial: radialDV.toFixed(3),
                tangential: tangentialDV.toFixed(3),
                normal: normalDV.toFixed(3)
            },
            fuelCost: (deltaV * sat.mass * 0.001).toFixed(2), // kg of fuel
            executionTime: Math.max(0, time - currentTime - 600) // 10 min before closest approach
        };
    };

    // Initialize simulation with sample data
    useEffect(() => {
        const initSatellites = [
            {
                id: 'SAT-001',
                name: 'ISS',
                semiMajorAxis: 6771,
                eccentricity: 0.0001,
                inclination: 51.6 * Math.PI / 180,
                raan: 0,
                omega: 0,
                meanAnomaly: 0,
                mass: 420000,
                type: 'station'
            },
            {
                id: 'SAT-002',
                name: 'Hubble',
                semiMajorAxis: 6917,
                eccentricity: 0.0003,
                inclination: 28.5 * Math.PI / 180,
                raan: 45 * Math.PI / 180,
                omega: 0,
                meanAnomaly: 90 * Math.PI / 180,
                mass: 11110,
                type: 'telescope'
            },
            {
                id: 'SAT-003',
                name: 'GPS-IIF-12',
                semiMajorAxis: 26560,
                eccentricity: 0.01,
                inclination: 55 * Math.PI / 180,
                raan: 120 * Math.PI / 180,
                omega: 0,
                meanAnomaly: 180 * Math.PI / 180,
                mass: 1630,
                type: 'navigation'
            }
        ];

        const initDebris = Array.from({ length: 15 }, (_, i) => ({
            id: `DEB-${String(i + 1).padStart(3, '0')}`,
            name: `Debris ${i + 1}`,
            semiMajorAxis: 6500 + Math.random() * 1500,
            eccentricity: Math.random() * 0.05,
            inclination: Math.random() * Math.PI,
            raan: Math.random() * 2 * Math.PI,
            omega: Math.random() * 2 * Math.PI,
            meanAnomaly: Math.random() * 2 * Math.PI,
            mass: 1 + Math.random() * 100,
            type: 'debris'
        }));

        setSatellites(initSatellites);
        setDebris(initDebris);
    }, []);

    // Simulation loop
    useEffect(() => {
        if (!isSimulating) return;

        const interval = setInterval(() => {
            setCurrentTime(t => t + timeScale / 10);
            setCollisionAlerts(detectCollisions(satellites, debris, currentTime));
        }, 100);

        return () => clearInterval(interval);
    }, [isSimulating, satellites, debris, currentTime, timeScale]);

    // Canvas rendering
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const scale = 0.02;

        ctx.fillStyle = '#000814';
        ctx.fillRect(0, 0, width, height);

        // Draw Earth
        ctx.beginPath();
        ctx.arc(centerX, centerY, 6371 * scale, 0, 2 * Math.PI);
        ctx.fillStyle = '#1e3a8a';
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw satellites
        satellites.forEach(sat => {
            const pos = calculateOrbitalPosition(sat, currentTime);
            const x = centerX + pos.x * scale;
            const y = centerY + pos.y * scale;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = sat.id === selectedSat?.id ? '#fbbf24' : '#10b981';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw orbit
            ctx.beginPath();
            for (let i = 0; i <= 360; i += 10) {
                const tempPos = calculateOrbitalPosition({
                    ...sat,
                    meanAnomaly: i * Math.PI / 180
                }, 0);
                const ox = centerX + tempPos.x * scale;
                const oy = centerY + tempPos.y * scale;
                if (i === 0) ctx.moveTo(ox, oy);
                else ctx.lineTo(ox, oy);
            }
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        // Draw debris
        debris.forEach(d => {
            const pos = calculateOrbitalPosition(d, currentTime);
            const x = centerX + pos.x * scale;
            const y = centerY + pos.y * scale;

            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fillStyle = '#ef4444';
            ctx.fill();
        });

        // Draw collision warnings
        collisionAlerts.slice(0, 3).forEach(alert => {
            const satPos = calculateOrbitalPosition(alert.satellite, currentTime);
            const debPos = calculateOrbitalPosition(alert.debris, currentTime);

            ctx.beginPath();
            ctx.moveTo(centerX + satPos.x * scale, centerY + satPos.y * scale);
            ctx.lineTo(centerX + debPos.x * scale, centerY + debPos.y * scale);
            ctx.strokeStyle = alert.severity === 'critical' ? '#dc2626' :
                alert.severity === 'high' ? '#f59e0b' : '#eab308';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    }, [satellites, debris, currentTime, selectedSat, collisionAlerts]);

    const addNewSatellite = () => {
        const newSat = {
            id: `SAT-${String(satellites.length + 1).padStart(3, '0')}`,
            name: `Satellite ${satellites.length + 1}`,
            semiMajorAxis: 6700 + Math.random() * 1000,
            eccentricity: Math.random() * 0.02,
            inclination: Math.random() * Math.PI,
            raan: Math.random() * 2 * Math.PI,
            omega: Math.random() * 2 * Math.PI,
            meanAnomaly: Math.random() * 2 * Math.PI,
            mass: 1000 + Math.random() * 5000,
            type: 'custom'
        };
        setSatellites([...satellites, newSat]);
    };

    const formatTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-blue-400 mb-2 flex items-center gap-2">
                        <Satellite className="w-8 h-8" />
                        Space Debris Collision Avoidance AI
                    </h1>
                    <p className="text-gray-400">Real-time orbital tracking and automated collision prediction system</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Visualization Panel */}
                    <div className="lg:col-span-2 bg-gray-800 rounded-lg p-4 shadow-xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Orbital Visualization</h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsSimulating(!isSimulating)}
                                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${isSimulating ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                >
                                    {isSimulating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                    {isSimulating ? 'Pause' : 'Start'}
                                </button>
                                <button
                                    onClick={() => setCurrentTime(0)}
                                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Reset
                                </button>
                                <button
                                    onClick={addNewSatellite}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Satellite
                                </button>
                            </div>
                        </div>

                        <canvas
                            ref={canvasRef}
                            width={800}
                            height={600}
                            className="w-full bg-gray-950 rounded-lg border border-gray-700"
                        />

                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm">
                                <span className="text-gray-400">Simulation Time: </span>
                                <span className="text-blue-400 font-mono">{formatTime(currentTime)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-400">Speed:</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="1000"
                                    value={timeScale}
                                    onChange={(e) => setTimeScale(Number(e.target.value))}
                                    className="w-32"
                                />
                                <span className="text-sm text-blue-400">{timeScale}x</span>
                            </div>
                        </div>

                        <div className="mt-4 flex gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                <span>Active Satellites ({satellites.length})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span>Debris ({debris.length})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                                <span>Selected</span>
                            </div>
                        </div>
                    </div>

                    {/* Collision Alerts Panel */}
                    <div className="bg-gray-800 rounded-lg p-4 shadow-xl">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            Collision Alerts ({collisionAlerts.length})
                        </h2>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                            {collisionAlerts.length === 0 ? (
                                <div className="text-center text-gray-500 py-8">
                                    <Radio className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                    <p>No collision threats detected</p>
                                </div>
                            ) : (
                                collisionAlerts.map((alert, idx) => (
                                    <div
                                        key={idx}
                                        className={`p-3 rounded-lg border-l-4 ${alert.severity === 'critical'
                                                ? 'bg-red-900/30 border-red-500'
                                                : alert.severity === 'high'
                                                    ? 'bg-orange-900/30 border-orange-500'
                                                    : 'bg-yellow-900/30 border-yellow-500'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-semibold text-sm">{alert.satellite.name}</div>
                                                <div className="text-xs text-gray-400">vs {alert.debris.name}</div>
                                            </div>
                                            <span className={`text-xs px-2 py-1 rounded ${alert.severity === 'critical'
                                                    ? 'bg-red-500 text-white'
                                                    : alert.severity === 'high'
                                                        ? 'bg-orange-500 text-white'
                                                        : 'bg-yellow-500 text-black'
                                                }`}>
                                                {alert.severity.toUpperCase()}
                                            </span>
                                        </div>

                                        <div className="text-xs space-y-1 text-gray-300">
                                            <div>Min Distance: <span className="text-red-400 font-mono">{alert.distance.toFixed(2)} km</span></div>
                                            <div>Closest at: <span className="font-mono">{formatTime(alert.time)}</span></div>
                                            <div>Time to CA: <span className="font-mono">{formatTime(Math.max(0, alert.time - currentTime))}</span></div>
                                        </div>

                                        <div className="mt-2 pt-2 border-t border-gray-700">
                                            <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                                                <Zap className="w-3 h-3" />
                                                Recommended Maneuver
                                            </div>
                                            <div className="text-xs space-y-1 text-gray-300">
                                                <div>{alert.maneuver.type}</div>
                                                <div>ΔV: <span className="text-blue-400 font-mono">{alert.maneuver.deltaV} m/s</span></div>
                                                <div>Fuel: <span className="text-purple-400 font-mono">{alert.maneuver.fuelCost} kg</span></div>
                                                <div>Execute in: <span className="font-mono">{formatTime(alert.maneuver.executionTime)}</span></div>
                                            </div>

                                            <button
                                                onClick={() => setSelectedSat(alert.satellite)}
                                                className="mt-2 w-full px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                                            >
                                                View Satellite
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Satellite Details Panel */}
                    <div className="lg:col-span-3 bg-gray-800 rounded-lg p-4 shadow-xl">
                        <h2 className="text-xl font-semibold mb-4">Tracked Assets</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {satellites.map(sat => {
                                const pos = calculateOrbitalPosition(sat, currentTime);
                                const vel = calculateVelocity(sat, currentTime);
                                return (
                                    <div
                                        key={sat.id}
                                        onClick={() => setSelectedSat(sat)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedSat?.id === sat.id
                                                ? 'border-yellow-500 bg-yellow-900/20'
                                                : 'border-gray-700 hover:border-gray-600 bg-gray-900/50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-semibold">{sat.name}</div>
                                                <div className="text-xs text-gray-400">{sat.id}</div>
                                            </div>
                                            <Satellite className="w-5 h-5 text-green-500" />
                                        </div>
                                        <div className="text-xs space-y-1 text-gray-300">
                                            <div>Altitude: <span className="text-blue-400 font-mono">{(pos.r - 6371).toFixed(0)} km</span></div>
                                            <div>Velocity: <span className="text-purple-400 font-mono">{vel.toFixed(2)} km/s</span></div>
                                            <div>Mass: <span className="font-mono">{sat.mass.toLocaleString()} kg</span></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SpaceDebrisAI;
