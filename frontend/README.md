# Space Debris AI - Frontend Visualization

## Overview

Interactive React-based visualization for real-time orbital tracking and collision prediction.

## Features

- **Real-time Orbital Simulation**: Physics-based propagation with adjustable time scale
- **Collision Detection**: Multi-stage conjunction analysis with visual warnings
- **Risk Assessment**: Color-coded severity levels (Critical, High, Medium, Low)
- **Maneuver Planning**: AI-generated collision avoidance recommendations
- **Interactive Controls**: Add satellites, adjust simulation speed, select objects

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Technical Details

### Orbital Mechanics
- Keplerian propagation with eccentric anomaly calculation
- Support for various orbital regimes (LEO, MEO, GEO)
- Real-time state vector computation

### Collision Detection
- Time-horizon scanning (configurable, default 1 hour)
- Distance threshold-based alerts
- Relative velocity computation

### Visualization
- HTML5 Canvas rendering
- Earth-centered inertial (ECI) reference frame
- Dynamic orbit visualization
- Collision corridor highlighting

## Components

- **SpaceDebrisAI.jsx**: Main component with simulation logic
- **Canvas Rendering**: 2D orbital visualization
- **Alert Panel**: Real-time conjunction warnings
- **Control Panel**: Simulation controls and satellite management

## Performance

- 60 FPS rendering
- Support for 100+ satellites and 1000+ debris objects
- Efficient spatial filtering and update cycles
