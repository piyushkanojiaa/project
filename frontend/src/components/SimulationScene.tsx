import React, { useEffect, useRef, useState } from 'react';
import { SatelliteData, TLE_DATA } from '../tleData';
import { propagateSGP4, eciToCanvas } from '../utils/sgp4Propagator';
import { analyzeCollision, formatPoC } from '../utils/collisionAI';

interface SimulationSceneProps {
    onSelectSat: (sat: SatelliteData | null) => void;
    onAlert: (alerts: string[]) => void;
}

const SimulationScene: React.FC<SimulationSceneProps> = ({ onSelectSat, onAlert }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const simulationTimeRef = useRef<Date>(new Date());
    const [isPaused, setIsPaused] = useState(false);
    const [speedMultiplier, setSpeedMultiplier] = useState(1);
    const [fps, setFps] = useState(60);
    const [showOrbits, setShowOrbits] = useState(true);
    const [hoveredSat, setHoveredSat] = useState<{ sat: SatelliteData; x: number; y: number; distance: number; velocity: number } | null>(null);
    const lastFrameTimeRef = useRef<number>(Date.now());
    const frameCountRef = useRef<number>(0);
    const orbitPathsRef = useRef<Map<string, { x: number; y: number }[]>>(new Map());

    const earthRadius = 150;
    const scale = 0.02;
    const collisionThreshold = 50;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        const updateFPS = () => {
            frameCountRef.current++;
            const now = Date.now();
            const elapsed = now - lastFrameTimeRef.current;

            if (elapsed >= 1000) {
                setFps(Math.round((frameCountRef.current * 1000) / elapsed));
                frameCountRef.current = 0;
                lastFrameTimeRef.current = now;
            }
        };

        const animate = () => {
            if (!isPaused) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Stars background
                ctx.fillStyle = '#0a0a20';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                for (let i = 0; i < 100; i++) {
                    const x = (i * 137.5) % canvas.width;
                    const y = (i * 127.3) % canvas.height;
                    ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + Math.random() * 0.3})`;
                    ctx.fillRect(x, y, 1, 1);
                }

                // Draw Earth
                const earthGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, earthRadius);
                earthGradient.addColorStop(0, '#1e40af');
                earthGradient.addColorStop(0.7, '#1e3a8a');
                earthGradient.addColorStop(1, '#1e293b');
                ctx.fillStyle = earthGradient;
                ctx.beginPath();
                ctx.arc(centerX, centerY, earthRadius, 0, 2 * Math.PI);
                ctx.fill();

                ctx.strokeStyle = '#3b82f6';
                ctx.lineWidth = 2;
                ctx.stroke();

                simulationTimeRef.current = new Date(
                    simulationTimeRef.current.getTime() + (100 * speedMultiplier)
                );

                const currentPositions: { sat: SatelliteData; x: number; y: number; distance: number }[] = [];
                const alerts: string[] = [];

                TLE_DATA.forEach((sat) => {
                    const eciPosition = propagateSGP4(sat, simulationTimeRef.current);
                    if (!eciPosition) return;

                    const position = eciToCanvas(eciPosition, centerX, centerY, scale);

                    const distance = Math.sqrt(
                        eciPosition.x * eciPosition.x +
                        eciPosition.y * eciPosition.y +
                        eciPosition.z * eciPosition.z
                    );

                    const x = position.x;
                    const y = position.y;

                    currentPositions.push({ sat, x, y, distance });

                    // Orbit trail
                    if (showOrbits) {
                        if (!orbitPathsRef.current.has(sat.id)) {
                            orbitPathsRef.current.set(sat.id, []);
                        }
                        const trail = orbitPathsRef.current.get(sat.id)!;
                        trail.push({ x, y });
                        if (trail.length > 150) trail.shift();

                        if (trail.length > 1) {
                            ctx.strokeStyle = sat.type === 'debris' ? '#ef444420' : '#22c55e20';
                            ctx.lineWidth = 1;
                            ctx.beginPath();
                            ctx.moveTo(trail[0].x, trail[0].y);
                            for (let i = 1; i < trail.length; i++) {
                                const alpha = i / trail.length;
                                ctx.globalAlpha = alpha * 0.3;
                                ctx.lineTo(trail[i].x, trail[i].y);
                            }
                            ctx.stroke();
                            ctx.globalAlpha = 1;
                        }
                    }

                    // Draw satellite
                    const color = sat.type === 'debris' ? '#ef4444' : '#22c55e';
                    const size = 6;

                    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 2);
                    gradient.addColorStop(0, color);
                    gradient.addColorStop(1, color + '00');
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    ctx.arc(x, y, size * 2, 0, 2 * Math.PI);
                    ctx.fill();

                    ctx.fillStyle = color;
                    ctx.beginPath();
                    ctx.arc(x, y, size, 0, 2 * Math.PI);
                    ctx.fill();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = '10px monospace';
                    ctx.fillText(sat.name.split(' ')[0], x + 10, y - 5);
                });

                // AI-Powered Collision Detection
                for (let i = 0; i < currentPositions.length; i++) {
                    for (let j = i + 1; j < currentPositions.length; j++) {
                        const sat1 = currentPositions[i];
                        const sat2 = currentPositions[j];

                        const dx = sat1.x - sat2.x;
                        const dy = sat1.y - sat2.y;
                        const screenDistance = Math.sqrt(dx * dx + dy * dy);
                        const actualDistance = screenDistance / scale;

                        if (actualDistance < collisionThreshold) {
                            // Get ECI states for AI analysis
                            const sat1ECI = propagateSGP4(sat1.sat, simulationTimeRef.current);
                            const sat2ECI = propagateSGP4(sat2.sat, simulationTimeRef.current);

                            if (sat1ECI && sat2ECI && sat1ECI.vx !== undefined && sat2ECI.vx !== undefined) {
                                // Run AI Collision Analysis
                                const analysis = analyzeCollision(
                                    [sat1ECI.x, sat1ECI.y, sat1ECI.z],
                                    [sat1ECI.vx, sat1ECI.vy || 0, sat1ECI.vz || 0],
                                    [sat2ECI.x, sat2ECI.y, sat2ECI.z],
                                    [sat2ECI.vx, sat2ECI.vy || 0, sat2ECI.vz || 0],
                                    sat1.sat.type === 'active' ? 5000 : 200,
                                    sat2.sat.type === 'active' ? 5000 : 200,
                                    (sat1.distance / 1000) - 6371
                                );

                                // Alert if PoC exceeds threshold
                                if (analysis.poc > 0.0001) {
                                    // Risk-based color coding
                                    const riskColor = analysis.riskLevel === 'HIGH' ? '#ef4444' :
                                        analysis.riskLevel === 'MEDIUM' ? '#fbbf24' : '#10b981';

                                    // Draw warning line
                                    ctx.strokeStyle = riskColor;
                                    ctx.lineWidth = analysis.riskLevel === 'HIGH' ? 3 : 2;
                                    ctx.setLineDash([5, 5]);
                                    ctx.beginPath();
                                    ctx.moveTo(sat1.x, sat1.y);
                                    ctx.lineTo(sat2.x, sat2.y);
                                    ctx.stroke();
                                    ctx.setLineDash([]);

                                    // Build AI alert message
                                    const riskIcon = analysis.riskLevel === 'HIGH' ? '🔴' :
                                        analysis.riskLevel === 'MEDIUM' ? '🟡' : '🟢';

                                    let alertMsg = `${riskIcon} ${sat1.sat.name} ↔ ${sat2.sat.name}\n`;
                                    alertMsg += `   📊 PoC: ${formatPoC(analysis.poc)} | ML Risk: ${(analysis.mlRiskScore * 100).toFixed(0)}%`;

                                    if (analysis.suggestedManeuver) {
                                        const dv = analysis.suggestedManeuver;
                                        alertMsg += `\n   💡 Suggested: ${dv.deltaV.toFixed(2)} m/s ${dv.direction}`;
                                        alertMsg += `\n   ⛽ Fuel: ${dv.fuelCost.toFixed(1)}kg | Risk ↓${dv.riskReduction.toFixed(0)}%`;
                                    }

                                    alerts.push(alertMsg);

                                    // Highlight satellites
                                    ctx.strokeStyle = riskColor;
                                    ctx.lineWidth = 3;
                                    ctx.beginPath();
                                    ctx.arc(sat1.x, sat1.y, 14, 0, 2 * Math.PI);
                                    ctx.stroke();
                                    ctx.beginPath();
                                    ctx.arc(sat2.x, sat2.y, 14, 0, 2 * Math.PI);
                                    ctx.stroke();

                                    // Display PoC on canvas
                                    const midX = (sat1.x + sat2.x) / 2;
                                    const midY = (sat1.y + sat2.y) / 2;
                                    ctx.fillStyle = riskColor;
                                    ctx.font = 'bold 11px monospace';
                                    ctx.fillText(formatPoC(analysis.poc), midX + 5, midY - 5);
                                }
                            }
                        }
                    }
                }

                onAlert(alerts);
                updateFPS();
            }

            animationRef.current = requestAnimationFrame(animate);
        };

        animate();

        const handleClick = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            const currentTime = simulationTimeRef.current;
            let closestSat: { sat: SatelliteData; distance: number } | null = null;

            TLE_DATA.forEach((sat) => {
                const eciPosition = propagateSGP4(sat, currentTime);
                if (!eciPosition) return;

                const position = eciToCanvas(eciPosition, centerX, centerY, scale);
                const x = position.x;
                const y = position.y;

                const dx = clickX - x;
                const dy = clickY - y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < 15 && (!closestSat || distance < closestSat.distance)) {
                    closestSat = { sat, distance };
                }
            });

            if (closestSat) {
                onSelectSat(closestSat.sat);
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const currentTime = simulationTimeRef.current;
            let closestSat: { sat: SatelliteData; x: number; y: number; distance: number; velocity: number } | null = null;

            TLE_DATA.forEach((sat) => {
                const eciPosition = propagateSGP4(sat, currentTime);
                if (!eciPosition) return;

                const position = eciToCanvas(eciPosition, centerX, centerY, scale);
                const x = position.x;
                const y = position.y;

                const dx = mouseX - x;
                const dy = mouseY - y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Calculate velocity magnitude
                const distanceFromEarth = Math.sqrt(
                    eciPosition.x * eciPosition.x +
                    eciPosition.y * eciPosition.y +
                    eciPosition.z * eciPosition.z
                ) / 1000; // km

                const velocity = 7.8 * Math.sqrt(2 / (distanceFromEarth / 6371) - 1 / (distanceFromEarth / 6371)); // km/s approximation

                if (distance < 20 && (!closestSat || distance < closestSat.distance)) {
                    closestSat = { sat, x, y, distance: distanceFromEarth, velocity };
                }
            });

            setHoveredSat(closestSat);
        };

        canvas.addEventListener('click', handleClick);
        canvas.addEventListener('mousemove', handleMouseMove);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            window.removeEventListener('resize', resizeCanvas);
            canvas.removeEventListener('click', handleClick);
            canvas.removeEventListener('mousemove', handleMouseMove);
        };
    }, [onSelectSat, onAlert, isPaused, speedMultiplier, showOrbits]);

    const resetSimulation = () => {
        simulationTimeRef.current = new Date();
        orbitPathsRef.current.clear();
        onSelectSat(null);
    };

    return (
        <div className="relative w-full h-full">
            <canvas ref={canvasRef} className="w-full h-full" />

            <div className="absolute top-4 left-4 flex flex-col gap-2">
                <div className="bg-black/70 backdrop-blur-lg border border-gray-700 rounded-lg p-3 flex items-center gap-2">
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition"
                    >
                        {isPaused ? '▶️ Play' : '⏸️ Pause'}
                    </button>
                    <button
                        onClick={resetSimulation}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold transition"
                    >
                        🔄 Reset
                    </button>
                </div>

                <div className="bg-black/70 backdrop-blur-lg border border-gray-700 rounded-lg p-3">
                    <div className="text-xs text-gray-400 mb-2">Speed: {speedMultiplier}x</div>
                    <div className="flex gap-1">
                        {[0.5, 1, 2, 5, 10].map((speed) => (
                            <button
                                key={speed}
                                onClick={() => setSpeedMultiplier(speed)}
                                className={`px-2 py-1 rounded text-xs font-mono transition ${speedMultiplier === speed
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                                    }`}
                            >
                                {speed}x
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-black/70 backdrop-blur-lg border border-gray-700 rounded-lg p-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showOrbits}
                            onChange={(e) => setShowOrbits(e.target.checked)}
                            className="w-4 h-4"
                        />
                        <span className="text-sm">Show Orbit Trails</span>
                    </label>
                </div>
            </div>

            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-lg border border-gray-700 rounded-lg px-3 py-2">
                <div className="text-xs text-gray-400">FPS</div>
                <div className="text-2xl font-bold font-mono text-green-400">{fps}</div>
            </div>

            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-lg border border-gray-700 rounded-lg px-4 py-3 w-80">
                <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-400">SIMULATION TIME</div>
                    <div className="text-xs font-mono text-blue-300">
                        {simulationTimeRef.current.toISOString().split('T')[1].split('.')[0]}
                    </div>
                </div>
                <div className="text-sm font-mono text-blue-400 mb-3">
                    {simulationTimeRef.current.toISOString().split('T')[0]}
                </div>

                {/* Timeline Scrubber */}
                <div className="space-y-2">
                    <div className="h-1 bg-gray-800 rounded-full overflow-hidden relative">
                        <div
                            className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${(simulationTimeRef.current.getTime() % 86400000) / 86400000 * 100}%` }}
                        ></div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500">
                        <span>00:00</span>
                        <span className="text-blue-400">⬤ {speedMultiplier}x</span>
                        <span>24:00</span>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={() => {
                            simulationTimeRef.current = new Date(simulationTimeRef.current.getTime() + 3600000);
                        }}
                        className="flex-1 px-2 py-1 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 rounded text-xs font-semibold text-blue-300 transition"
                        title="Jump ahead 1 hour"
                    >
                        +1h
                    </button>
                    <button
                        onClick={() => {
                            simulationTimeRef.current = new Date(simulationTimeRef.current.getTime() + 21600000);
                        }}
                        className="flex-1 px-2 py-1 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded text-xs font-semibold text-purple-300 transition"
                        title="Jump to next conjunction"
                    >
                        ⚡ Next Alert
                    </button>
                </div>
            </div>

            {/* Hover Tooltip */}
            {hoveredSat && (
                <div
                    className="absolute bg-black/90 backdrop-blur-xl border border-blue-500/50 rounded-lg px-4 py-3 pointer-events-none shadow-2xl"
                    style={{
                        left: `${hoveredSat.x + 20}px`,
                        top: `${hoveredSat.y - 60}px`,
                        transform: 'translateY(-50%)',
                    }}
                >
                    <div className="text-sm font-bold text-blue-300 mb-2">{hoveredSat.sat.name}</div>
                    <div className="space-y-1 text-xs">
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-400">Type:</span>
                            <span className={`font-semibold ${hoveredSat.sat.type === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                                {hoveredSat.sat.type.toUpperCase()}
                            </span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-400">Altitude:</span>
                            <span className="text-blue-300 font-mono">{(hoveredSat.distance - 6371).toFixed(0)} km</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-400">Velocity:</span>
                            <span className="text-purple-300 font-mono">{hoveredSat.velocity.toFixed(2)} km/s</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span className="text-gray-400">NORAD:</span>
                            <span className="text-gray-300 font-mono">{hoveredSat.sat.id}</span>
                        </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-gray-500">
                        Click to view full telemetry
                    </div>
                </div>
            )}
        </div>
    );
};

export default SimulationScene;
