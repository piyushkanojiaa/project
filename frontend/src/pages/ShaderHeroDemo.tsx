import React from 'react';
import AnimatedShaderHero from '../components/ui/animated-shader-hero.tsx';
import { useNavigate } from 'react-router-dom';

const ShaderHeroDemo: React.FC = () => {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        navigate('/signin-flow');
    };

    const handleExplore = () => {
        navigate('/about');
    };

    return (
        <div className="w-full">
            <AnimatedShaderHero
                trustBadge={{
                    text: "Protecting 18+ satellites in real-time",
                    icons: ["🛰️", "✨"]
                }}
                headline={{
                    line1: "Space Debris Detection",
                    line2: "Powered by AI"
                }}
                subtitle="Real-time satellite tracking, SGP4 propagation, and AI-powered collision prediction. Monitor orbital objects, analyze conjunction risks, and plan avoidance maneuvers—all in one mission control platform."
                buttons={{
                    primary: {
                        text: "Access Dashboard",
                        onClick: handleGetStarted
                    },
                    secondary: {
                        text: "Explore Technology",
                        onClick: handleExplore
                    }
                }}
            />
        </div>
    );
};

export default ShaderHeroDemo;
