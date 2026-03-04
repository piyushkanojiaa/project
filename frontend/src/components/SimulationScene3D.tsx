import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { SatelliteData, TLE_DATA } from '../tleData';
import { propagateSGP4, PropagatedPosition } from '../utils/sgp4Propagator';
import { analyzeCollision, formatPoC } from '../utils/collisionAI';
import ConjunctionHeatmap from './ConjunctionHeatmap';
import HeatmapControls from './HeatmapControls';
import { getConjunctionAnalysis } from '../services/api';
import {
    transformToHeatmapFormat,
    filterByTimeRange,
    filterByAltitude,
    HeatmapMode,
    AltitudeBand,
    HeatmapPoint,
    generateSampleHeatmapData
} from '../services/heatmapDataService';

interface SimulationScene3DProps {
    onSelectSat: (sat: SatelliteData | null) => void;
    onAlert: (alerts: string[]) => void;
}

// Constants
const EARTH_RADIUS = 6371; // km
const SCALE = 0.001;
const EARTH_SEGMENTS = 128;
const SAT_SIZE_MULTIPLIER = 50;

// Ultra-Realistic Earth Component with Error Handling
function Earth() {
    const earthRef = useRef<THREE.Mesh>(null);
    const atmosphereRef = useRef<THREE.Mesh>(null);
    const cloudsRef = useRef<THREE.Mesh>(null);

    // Load textures with useTexture hook (better error handling)
    // Using jsdelivr CDN - supports CORS!
    const [colorMap, bumpMap, specularMap, cloudsMap] = useTexture([
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_atmos_2048.jpg',
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_normal_2048.jpg',
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_specular_2048.jpg',
        'https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/textures/planets/earth_clouds_1024.png',
    ]);

    //Configure textures for better quality
    useEffect(() => {
        [colorMap, bumpMap, specularMap, cloudsMap].forEach(texture => {
            if (texture) {
                texture.anisotropy = 16; // Better quality at angles
                texture.minFilter = THREE.LinearMipmapLinearFilter;
                texture.magFilter = THREE.LinearFilter;
                texture.generateMipmaps = true;
            }
        });
    }, [colorMap, bumpMap, specularMap, cloudsMap]);

    useFrame((state, delta) => {
        // Realistic Earth rotation (360° in 24 hours = 0.00417° per second)
        if (earthRef.current) {
            earthRef.current.rotation.y += delta * 0.05;
        }
        if (cloudsRef.current) {
            cloudsRef.current.rotation.y += delta * 0.06;
            cloudsRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.15) * 0.03;
        }
    });

    // Subtle atmosphere shader (reduced glow)
    const atmosphereMaterial = useMemo(() => new THREE.ShaderMaterial({
        uniforms: {
            coefficient: { value: 0.7 },
            power: { value: 4.0 },
            glowColor: { value: new THREE.Color(0x6699cc) },
        },
        vertexShader: `
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                vNormal = normalize(normalMatrix * normal);
                vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: `
            uniform float coefficient;
            uniform float power;
            uniform vec3 glowColor;
            varying vec3 vNormal;
            varying vec3 vPosition;
            
            void main() {
                vec3 viewDir = normalize(-vPosition);
                float intensity = pow(coefficient - dot(viewDir, vNormal), power);
                intensity = clamp(intensity, 0.0, 1.0) * 0.5; // Reduced intensity
                
                // Subtle blue atmospheric rim
                vec3 atmosphereColor = mix(glowColor, vec3(0.3, 0.5, 0.8), 0.3);
                vec3 finalColor = atmosphereColor * intensity;
                
                gl_FragColor = vec4(finalColor, intensity * 0.7);
            }
        `,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
    }), []);

    return (
        <group>
            {/* Earth surface with real textures */}
            <mesh ref={earthRef} receiveShadow castShadow>
                <sphereGeometry args={[EARTH_RADIUS * SCALE, EARTH_SEGMENTS, EARTH_SEGMENTS]} />
                <meshPhongMaterial
                    map={colorMap}
                    bumpMap={bumpMap}
                    bumpScale={0.03}
                    specularMap={specularMap}
                    specular={new THREE.Color(0x444444)}
                    shininess={25}
                    emissive={new THREE.Color(0x0a0a0a)}
                    emissiveIntensity={0.1}
                />
            </mesh>

            {/* Outer atmosphere glow */}
            <mesh ref={atmosphereRef} scale={1.03}>
                <sphereGeometry args={[EARTH_RADIUS * SCALE, 64, 64]} />
                <primitive object={atmosphereMaterial} attach="material" />
            </mesh>

            {/* Clouds layer - realistic and dynamic */}
            <mesh ref={cloudsRef} scale={1.015}>
                <sphereGeometry args={[EARTH_RADIUS * SCALE, 64, 64]} />
                <meshPhongMaterial
                    map={cloudsMap}
                    transparent
                    opacity={0.35}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
            </mesh>

            {/* Inner atmospheric haze */}
            <mesh scale={1.008}>
                <sphereGeometry args={[EARTH_RADIUS * SCALE, 32, 32]} />
                <meshBasicMaterial
                    color={0xaaddff}
                    transparent
                    opacity={0.08}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>
        </group>
    );
}

// Loading fallback for Earth
function EarthFallback() {
    return (
        <mesh>
            <sphereGeometry args={[EARTH_RADIUS * SCALE, 64, 64]} />
            <meshPhongMaterial
                color={0x2277bb}
                emissive={0x0a2540}
                specular={0x333333}
                shininess={10}
            />
        </mesh>
    );
}

// Debris - Irregular, Tumbling, Jagged
function DebrisMarker({ satellite, position, onClick }: {
    satellite: SatelliteData;
    position: THREE.Vector3;
    onClick: () => void;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const [hovered, setHovered] = useState(false);
    const { camera } = useThree();

    // Random debris shape parameters - more dramatic
    const debrisShape = useMemo(() => ({
        scale: 0.8 + Math.random() * 2.0, // Larger size
        rotationSpeed: [Math.random() * 0.08, Math.random() * 0.08, Math.random() * 0.08], // Faster tumbling
        color: Math.random() > 0.3 ? 0xff4444 : 0x888888, // More red dangerous colors
    }), []);

    useFrame((state) => {
        if (groupRef.current) {
            // Chaotic tumbling rotation
            groupRef.current.rotation.x += debrisShape.rotationSpeed[0];
            groupRef.current.rotation.y += debrisShape.rotationSpeed[1];
            groupRef.current.rotation.z += debrisShape.rotationSpeed[2];
        }
    });

    const size = SAT_SIZE_MULTIPLIER * SCALE * debrisShape.scale;

    return (
        <group position={position}>
            <group ref={groupRef}>
                {/* Irregular debris shape - jagged */}
                <mesh onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
                    <dodecahedronGeometry args={[size * 1.5, 0]} />
                    <meshStandardMaterial
                        color={debrisShape.color}
                        metalness={0.4}
                        roughness={0.9}
                        emissive={0xff3344}
                        emissiveIntensity={0.2}
                    />
                </mesh>

                {/* Random protruding parts */}
                <mesh position={[size * 0.8, size * 0.5, 0]} rotation={[0.5, 0.3, 0.2]}>
                    <boxGeometry args={[size * 0.5, size * 0.3, size * 0.3]} />
                    <meshStandardMaterial color={debrisShape.color} metalness={0.3} roughness={0.95} />
                </mesh>
            </group>

            {/* Danger glow (red) - Enhanced pulsing */}
            <mesh>
                <ringGeometry args={[size * 3, size * 5, 32]} />
                <meshBasicMaterial
                    color={0xff2222}
                    transparent
                    opacity={0.7}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Outer danger halo */}
            <mesh>
                <ringGeometry args={[size * 5, size * 7, 32]} />
                <meshBasicMaterial
                    color={0xff6600}
                    transparent
                    opacity={0.3}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Hover indicator */}
            {hovered && (
                <mesh>
                    <ringGeometry args={[size * 4, size * 5, 32]} />
                    <meshBasicMaterial
                        color={0xffff00}
                        transparent
                        opacity={0.8}
                        blending={THREE.AdditiveBlending}
                        side={THREE.DoubleSide}
                        depthWrite={false}
                    />
                </mesh>
            )}
        </group>
    );
}

// Active Satellite - Detailed, Clean, Green Glow
function SatelliteMarker({ satellite, position, onClick }: {
    satellite: SatelliteData;
    position: THREE.Vector3;
    onClick: () => void;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const glowRef = useRef<THREE.Mesh>(null);
    const [hovered, setHovered] = useState(false);
    const { camera } = useThree();

    useFrame((state) => {
        if (groupRef.current) {
            // Smooth, controlled satellite rotation
            groupRef.current.rotation.y += 0.003;
        }
        if (glowRef.current) {
            glowRef.current.lookAt(camera.position);
            const pulse = 1.5 + Math.sin(state.clock.elapsedTime * 2.0) * 0.2;
            glowRef.current.scale.set(pulse, pulse, 1);
        }
    });

    const size = SAT_SIZE_MULTIPLIER * SCALE;

    return (
        <group position={position}>
            <group ref={groupRef}>
                {/* Main satellite body - sleek with bright cyan glow */}
                <mesh onClick={onClick} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
                    <boxGeometry args={[size * 2.5, size * 2, size * 2]} />
                    <meshStandardMaterial
                        color={0x0a1a3e}
                        metalness={0.95}
                        roughness={0.1}
                        emissive={0x00ffff}
                        emissiveIntensity={2.0}
                    />
                </mesh>

                {/* Solar panels - left */}
                <mesh position={[-size * 3.5, 0, 0]}>
                    <boxGeometry args={[size * 3, size * 0.1, size * 4]} />
                    <meshStandardMaterial
                        color={0x0a2a3a}
                        metalness={0.8}
                        roughness={0.2}
                        emissive={0x0066ff}
                        emissiveIntensity={0.5}
                    />
                </mesh>

                {/* Solar panels - right */}
                <mesh position={[size * 3.5, 0, 0]}>
                    <boxGeometry args={[size * 3, size * 0.1, size * 4]} />
                    <meshStandardMaterial
                        color={0x0a2a3a}
                        metalness={0.8}
                        roughness={0.2}
                        emissive={0x0066ff}
                        emissiveIntensity={0.5}
                    />
                </mesh>

                {/* Antenna */}
                <mesh position={[0, size * 2, 0]}>
                    <cylinderGeometry args={[size * 0.1, size * 0.1, size * 3, 8]} />
                    <meshStandardMaterial color={0xcccccc} metalness={0.9} roughness={0.1} />
                </mesh>

                {/* Communication dish */}
                <mesh position={[0, size * 3.5, 0]} rotation={[Math.PI / 4, 0, 0]}>
                    <coneGeometry args={[size * 0.8, size * 0.5, 16]} />
                    <meshStandardMaterial color={0xdddddd} metalness={0.7} roughness={0.3} />
                </mesh>
            </group>

            {/* Active status glow (green) */}
            <mesh ref={glowRef}>
                <ringGeometry args={[size * 4, size * 5, 64]} />
                <meshBasicMaterial
                    color={0x00ff88}
                    transparent
                    opacity={0.6}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* Hover indicator */}
            {hovered && (
                <>
                    <mesh>
                        <ringGeometry args={[size * 7, size * 8, 64]} />
                        <meshBasicMaterial
                            color={0xffff00}
                            transparent
                            opacity={0.9}
                            blending={THREE.AdditiveBlending}
                            side={THREE.DoubleSide}
                            depthWrite={false}
                        />
                    </mesh>
                    {/* Selection beam */}
                    <mesh rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[size * 0.5, size * 0.5, 1000, 32, 1, true]} />
                        <meshBasicMaterial
                            color={0xffff00}
                            transparent
                            opacity={0.1}
                            blending={THREE.AdditiveBlending}
                            side={THREE.DoubleSide}
                            depthWrite={false}
                        />
                    </mesh>
                </>
            )}
        </group>
    );
}

// Optimized Orbit Trail
function OrbitTrail({ points, color }: { points: THREE.Vector3[]; color: number }) {
    const geometry = useMemo(() => {
        if (points.length < 2) return null;
        const geom = new THREE.BufferGeometry().setFromPoints(points);

        const colors = new Float32Array(points.length * 3);
        for (let i = 0; i < points.length; i++) {
            const alpha = i / points.length;
            const c = new THREE.Color(color);
            colors[i * 3] = c.r * alpha;
            colors[i * 3 + 1] = c.g * alpha;
            colors[i * 3 + 2] = c.b * alpha;
        }
        geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        return geom;
    }, [points, color]);

    if (!geometry) return null;

    return (
        <line>
            <primitive object={geometry} attach="geometry" />
            <lineBasicMaterial
                vertexColors
                transparent
                opacity={0.7}
                depthWrite={false}
            />
        </line>
    );
}

// Main Scene
function Scene({ onSelectSat, onAlert, isPaused, speedMultiplier, showOrbits }: SimulationScene3DProps & {
    isPaused: boolean;
    speedMultiplier: number;
    showOrbits: boolean;
}) {
    const [satellites, setSatellites] = useState<{
        data: SatelliteData;
        position: THREE.Vector3;
        trail: THREE.Vector3[];
    }[]>([]);
    const [simulationTime, setSimulationTime] = useState(new Date());
    const [satelliteCount, setSatelliteCount] = useState(0);

    useEffect(() => {
        // Try to fetch from API first, fall back to static data
        const loadSatellites = async () => {
            let satellitesToProcess: SatelliteData[] = [];

            try {
                const response = await fetch('http://localhost:8000/api/satellites');
                if (response.ok) {
                    const apiData = await response.json();
                    console.log(`📡 Backend has ${apiData.length} satellites`);

                    // Convert API format and take up to 500 for performance
                    satellitesToProcess = apiData.slice(0, 500).map((sat: any) => ({
                        id: sat.id,
                        name: sat.name,
                        type: sat.type as 'active' | 'debris',
                        tle1: sat.tle?.[0] || '',
                        tle2: sat.tle?.[1] || ''
                    })).filter((s: SatelliteData) => s.tle1 && s.tle2);

                    console.log(`✅ Loading ${satellitesToProcess.length} satellites from API`);
                }
            } catch (error) {
                console.warn('⚠️ API fetch failed, using static data:', error);
            }

            // Fall back to static data if API failed or returned empty
            if (satellitesToProcess.length === 0) {
                satellitesToProcess = TLE_DATA;
                console.log(`📦 Using ${TLE_DATA.length} static satellites`);
            }

            setSatelliteCount(satellitesToProcess.length);

            // Process satellites
            const initialSatellites = satellitesToProcess.map(sat => {
                try {
                    const eciPosition = propagateSGP4(sat, new Date());
                    if (!eciPosition) return null;

                    const position = new THREE.Vector3(
                        eciPosition.x * SCALE,
                        eciPosition.z * SCALE,
                        -eciPosition.y * SCALE
                    );

                    return {
                        data: sat,
                        position,
                        trail: [position.clone()],
                    };
                } catch (err) {
                    return null;
                }
            }).filter(Boolean) as any[];

            console.log(`🛰️ Rendered ${initialSatellites.length} satellites successfully`);
            setSatellites(initialSatellites);
        };

        loadSatellites();
    }, []);

    useFrame((state, delta) => {
        if (isPaused || satellites.length === 0) return;

        const timeStep = delta * 1000 * speedMultiplier;
        const newTime = new Date(simulationTime.getTime() + timeStep);
        setSimulationTime(newTime);

        const updatedSatellites = satellites.map(sat => {
            const eciPosition = propagateSGP4(sat.data, newTime);
            if (!eciPosition) return sat;

            const position = new THREE.Vector3(
                eciPosition.x * SCALE,
                eciPosition.z * SCALE,
                -eciPosition.y * SCALE
            );

            const newTrail = [...sat.trail, position.clone()].slice(-100);

            return {
                ...sat,
                position: position.clone(),
                trail: newTrail,
            };
        });

        setSatellites(updatedSatellites);

        const alerts: string[] = [];
        for (let i = 0; i < updatedSatellites.length; i++) {
            for (let j = i + 1; j < updatedSatellites.length; j++) {
                const sat1 = updatedSatellites[i];
                const sat2 = updatedSatellites[j];
                const distance = sat1.position.distanceTo(sat2.position) / SCALE;

                if (distance < 100) {
                    const riskLevel = distance < 25 ? 'HIGH' : distance < 50 ? 'MEDIUM' : 'LOW';
                    const riskIcon = riskLevel === 'HIGH' ? '🔴' : riskLevel === 'MEDIUM' ? '🟡' : '🟢';

                    alerts.push(
                        `${riskIcon} ${sat1.data.name} ↔ ${sat2.data.name}\n` +
                        `   📏 Distance: ${distance.toFixed(1)} km`
                    );
                }
            }
        }

        onAlert(alerts);
    });

    return (
        <>
            <ambientLight intensity={0.35} />
            <directionalLight
                position={[15, 10, 5]}
                intensity={4.0}
                castShadow
                shadow-mapSize={[4096, 4096]}
            />
            <pointLight position={[-10, -5, -10]} intensity={0.8} color={0x6699ff} />
            <pointLight position={[5, 5, 10]} intensity={0.5} color={0xffffff} />
            <pointLight position={[0, 15, 0]} intensity={0.4} color={0xff9966} />
            <hemisphereLight args={[0x8899ff, 0x112233, 0.3]} />

            <Suspense fallback={<EarthFallback />}>
                <Earth />
            </Suspense>

            <Stars
                radius={150}
                depth={100}
                count={15000}
                factor={6}
                saturation={0}
                fade
                speed={0.2}
            />

            {satellites.map((sat) => (
                <React.Fragment key={sat.data.id}>
                    {sat.data.type === 'active' ? (
                        <SatelliteMarker
                            satellite={sat.data}
                            position={sat.position}
                            onClick={() => onSelectSat(sat.data)}
                        />
                    ) : (
                        <DebrisMarker
                            satellite={sat.data}
                            position={sat.position}
                            onClick={() => onSelectSat(sat.data)}
                        />
                    )}

                    {showOrbits && sat.trail.length > 1 && (
                        <OrbitTrail
                            points={sat.trail}
                            color={sat.data.type === 'active' ? 0x00ff88 : 0xff3344}
                        />
                    )}
                </React.Fragment>
            ))}

            <OrbitControls
                enablePan
                enableZoom
                enableRotate
                zoomSpeed={1.0}
                panSpeed={0.8}
                rotateSpeed={0.6}
                minDistance={EARTH_RADIUS * SCALE * 1.3}
                maxDistance={EARTH_RADIUS * SCALE * 20}
                enableDamping
                dampingFactor={0.05}
            />
        </>
    );
}

// Main Component
const SimulationScene3D: React.FC<SimulationScene3DProps> = ({ onSelectSat, onAlert }) => {
    const [isPaused, setIsPaused] = useState(false);
    const [speedMultiplier, setSpeedMultiplier] = useState(1);
    const [showOrbits, setShowOrbits] = useState(true);

    // Heatmap state
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [showHeatmapControls, setShowHeatmapControls] = useState(false);
    const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
    const [heatmapMode, setHeatmapMode] = useState<HeatmapMode>('risk');
    const [timeRange, setTimeRange] = useState(24);
    const [intensity, setIntensity] = useState(1.0);
    const [radiusPixels, setRadiusPixels] = useState(30);
    const [opacity, setOpacity] = useState(0.8);
    const [altitudeBand, setAltitudeBand] = useState<AltitudeBand>('ALL');
    const [colorScheme, setColorScheme] = useState<'fire' | 'cool' | 'rainbow'>('fire');
    const [showHexagons, setShowHexagons] = useState(false);
    const [showScatter, setShowScatter] = useState(true);
    const [deckViewState, setDeckViewState] = useState({
        target: [0, 0, 0],
        zoom: 0,
        rotationX: 0,
        rotationOrbit: 0,
    });

    // Load conjunction data for heatmap
    useEffect(() => {
        if (showHeatmap) {
            // Fetch conjunctions from API
            getConjunctionAnalysis()
                .then((conjunctions) => {
                    const heatmapData = transformToHeatmapFormat(conjunctions, heatmapMode);
                    let filteredPoints = heatmapData.points;

                    // Apply filters
                    filteredPoints = filterByTimeRange(filteredPoints, timeRange);
                    filteredPoints = filterByAltitude(filteredPoints, altitudeBand);

                    setHeatmapPoints(filteredPoints);
                })
                .catch(() => {
                    // Fallback to sample data
                    const sampleData = generateSampleHeatmapData(200);
                    setHeatmapPoints(sampleData.points);
                });
        }
    }, [showHeatmap, heatmapMode, timeRange, altitudeBand]);

    return (
        <div className="relative w-full h-full bg-black">
            {/* Three.js Canvas (bottom layer) */}
            <Canvas
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                shadows
                gl={{
                    antialias: true,
                    alpha: false,
                    powerPreference: "high-performance",
                    preserveDrawingBuffer: false,
                }}
                camera={{
                    position: [EARTH_RADIUS * SCALE * 4, EARTH_RADIUS * SCALE * 3, EARTH_RADIUS * SCALE * 4],
                    fov: 45,
                    near: 0.1,
                    far: 10000
                }}
                dpr={[1, 2]}
            >
                <Scene
                    onSelectSat={onSelectSat}
                    onAlert={onAlert}
                    isPaused={isPaused}
                    speedMultiplier={speedMultiplier}
                    showOrbits={showOrbits}
                />
            </Canvas>

            {/* deck.gl Overlay (top layer) */}
            {showHeatmap && heatmapPoints.length > 0 && (
                <ConjunctionHeatmap
                    points={heatmapPoints}
                    mode={heatmapMode}
                    intensity={intensity}
                    radiusPixels={radiusPixels}
                    opacity={opacity}
                    colorRange={undefined} // Use default from component
                    viewState={deckViewState}
                    onViewStateChange={setDeckViewState}
                    showHexagons={showHexagons}
                    showScatter={showScatter}
                />
            )}

            {/* Heatmap Controls Panel */}
            <HeatmapControls
                visible={showHeatmapControls}
                mode={heatmapMode}
                timeRange={timeRange}
                intensity={intensity}
                radiusPixels={radiusPixels}
                opacity={opacity}
                altitudeBand={altitudeBand}
                colorScheme={colorScheme}
                showHexagons={showHexagons}
                showScatter={showScatter}
                onModeChange={setHeatmapMode}
                onTimeRangeChange={setTimeRange}
                onIntensityChange={setIntensity}
                onRadiusChange={setRadiusPixels}
                onOpacityChange={setOpacity}
                onAltitudeBandChange={setAltitudeBand}
                onColorSchemeChange={setColorScheme}
                onShowHexagonsChange={setShowHexagons}
                onShowScatterChange={setShowScatter}
                onClose={() => setShowHeatmapControls(false)}
            />

            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                <div className="bg-black/70 backdrop-blur-lg border border-gray-700 rounded-lg p-3 flex items-center gap-2">
                    <button
                        onClick={() => setIsPaused(!isPaused)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold transition"
                    >
                        {isPaused ? '▶️ Play' : '⏸️ Pause'}
                    </button>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded font-semibold transition"
                    >
                        🔄 Reset
                    </button>
                    <button
                        onClick={() => {
                            setShowHeatmap(!showHeatmap);
                            if (!showHeatmap) setShowHeatmapControls(true);
                        }}
                        className={`px-4 py-2 rounded font-semibold transition ${showHeatmap ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600' : 'bg-gray-700 hover:bg-gray-600'
                            }`}
                    >
                        🔥 {showHeatmap ? 'Hide' : 'Show'} Heatmap
                    </button>
                    {showHeatmap && (
                        <button
                            onClick={() => setShowHeatmapControls(!showHeatmapControls)}
                            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 rounded font-semibold transition"
                        >
                            ⚙️ Settings
                        </button>
                    )}
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

            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-lg border border-green-500/30 rounded-lg px-3 py-2 z-10">
                <div className="text-xs text-gray-400">Renderer</div>
                <div className="text-sm font-bold text-green-400">3D WebGL (NASA HD)</div>
            </div>

            <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-lg border border-blue-500/30 rounded-lg px-4 py-3 z-10">
                <div className="text-xs text-gray-400 mb-1">Controls</div>
                <div className="text-xs space-y-1">
                    <div>🖱️ Left Drag: Rotate</div>
                    <div>🔍 Scroll: Zoom</div>
                    <div>🖱️ Right Drag: Pan</div>
                </div>
            </div>
        </div>
    );
};

export default SimulationScene3D;
