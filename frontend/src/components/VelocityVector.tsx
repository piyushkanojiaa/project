import React from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';

interface VelocityVectorProps {
    position: [number, number, number];
    velocity: [number, number, number];
    color: number;
    scale?: number;
}

export const VelocityVector: React.FC<VelocityVectorProps> = ({
    position,
    velocity,
    color,
    scale = 0.1
}) => {
    // Calculate endpoint
    const endpoint: [number, number, number] = [
        position[0] + velocity[0] * scale,
        position[1] + velocity[1] * scale,
        position[2] + velocity[2] * scale
    ];

    const points = [
        new THREE.Vector3(...position),
        new THREE.Vector3(...endpoint)
    ];

    return (
        <group>
            {/* Velocity line */}
            <Line
                points={points}
                color={color}
                lineWidth={2}
                transparent
                opacity={0.8}
            />

            {/* Arrowhead */}
            <mesh position={endpoint}>
                <coneGeometry args={[0.02, 0.05, 8]} />
                <meshBasicMaterial color={color} />
            </mesh>
        </group>
    );
};

export default VelocityVector;
