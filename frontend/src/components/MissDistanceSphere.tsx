import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MissDistanceSphereProps {
    position: [number, number, number];
    radius: number; // in km (will be scaled)
    visible: boolean;
}

export const MissDistanceSphere: React.FC<MissDistanceSphereProps> = ({
    position,
    radius,
    visible
}) => {
    const meshRef = useRef<THREE.Mesh>(null);
    const SCALE = 0.001; // Match scene scale

    useFrame((state) => {
        if (meshRef.current && visible) {
            // Gentle pulsing animation
            const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
            meshRef.current.scale.setScalar(pulse);

            // Gentle rotation
            meshRef.current.rotation.y += 0.005;
        }
    });

    if (!visible) return null;

    const scaledRadius = radius * SCALE;

    return (
        <group position={position}>
            {/* Outer wireframe sphere */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[scaledRadius, 32, 32]} />
                <meshBasicMaterial
                    color={0xff0000}
                    wireframe
                    transparent
                    opacity={0.3}
                    depthWrite={false}
                />
            </mesh>

            {/* Inner solid sphere */}
            <mesh>
                <sphereGeometry args={[scaledRadius * 0.95, 24, 24]} />
                <meshBasicMaterial
                    color={0xff3344}
                    transparent
                    opacity={0.1}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Outer glow ring */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
                <ringGeometry args={[scaledRadius * 1.1, scaledRadius * 1.3, 64]} />
                <meshBasicMaterial
                    color={0xff0000}
                    transparent
                    opacity={0.4}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </mesh>

            {/* Danger indicator lines */}
            {[0, 60, 120, 180, 240, 300].map((angle) => {
                const rad = (angle * Math.PI) / 180;
                const x = Math.cos(rad) * scaledRadius * 1.5;
                const z = Math.sin(rad) * scaledRadius * 1.5;

                return (
                    <mesh
                        key={angle}
                        position={[x, 0, z]}
                        rotation={[0, rad, 0]}
                    >
                        <boxGeometry args={[scaledRadius * 0.02, scaledRadius * 3, scaledRadius * 0.02]} />
                        <meshBasicMaterial
                            color={0xff0000}
                            transparent
                            opacity={0.2}
                            depthWrite={false}
                        />
                    </mesh>
                );
            })}

            {/* Center marker */}
            <mesh>
                <sphereGeometry args={[scaledRadius * 0.05, 8, 8]} />
                <meshBasicMaterial
                    color={0xff0000}
                    emissive={0xff0000}
                    emissiveIntensity={2}
                />
            </mesh>
        </group>
    );
};

export default MissDistanceSphere;
