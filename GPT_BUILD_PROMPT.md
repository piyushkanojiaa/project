# 🛰️ Build a Space Debris Tracking & Collision Avoidance Platform

## Project Brief

Build a production-grade web application for **real-time space debris monitoring and collision avoidance**. The system should track satellites and debris in Earth orbit, predict collision probabilities using AI/ML, and provide an interactive 3D visualization similar to Google Earth.

---

## Core Requirements

### 1. **3D Visualization (Primary Feature)**

Create a stunning **Google Earth-style 3D globe** using Three.js + React Three Fiber:

**Earth Rendering:**
- Photorealistic sphere (6371 km radius)
- Blue atmospheric glow using custom shader (Fresnel effect)
- Animated cloud layer (semi-transparent, rotates slowly)
- Phong shading with specular highlights for oceans
- 8000+ procedural stars background with depth/parallax

**Satellite Rendering:**
- 18 tracked objects (3 active satellites + 15 debris fragments)
- Color-coded: Green for active satellites, Red for debris
- Billboard sprites (always face camera)
- Glowing halo effect (2x size, additive blending)
- Animated orbit trails (last 150 positions, fading opacity)

**Interactive Controls:**
- OrbitControls from @react-three/drei
- Left drag: Rotate view around Earth
- Scroll: Zoom in/out (1.5x to 10x Earth radius)
- Right drag: Pan camera
- Click satellite to select and show details

**Lighting:**
- Ambient light (0.3 intensity)
- Directional sun light (position [5,3,5], intensity 1.5)
- Point fill light (position [-5,-3,-5], intensity 0.5)

---

### 2. **2D Canvas Fallback**

Create a lightweight 2D Canvas-based view as fallback:
- Top-down orbital map
- Simple 2D projection using orthographic view
- Gradient Earth circle
- Satellite dots with trails
- Faster performance for older devices

**Toggle between 2D/3D modes with visible button (top-left)**

---

### 3. **Real Orbital Mechanics (SGP4)**

Implement satellite propagation using the SGP4 algorithm:

**Use satellite.js library:**
```bash
npm install satellite.js
```

**TLE Data Format:**
```javascript
const TLE_DATA = [
  {
    id: "25544",
    name: "ISS (ZARYA)",
    type: "active",
    tle1: "1 25544U 98067A   24016.52652778  .00016717  00000+0  30000-3 0  9991",
    tle2: "2 25544  51.6416 290.4112 0005705  30.8562  80.7772 15.49825361434768"
  },
  // Add Hubble, GPS satellites, and debris fragments
];
```

**Propagation:**
- Update positions at 60 FPS using `satellite.propagate(satrec, date)`
- Convert ECI coordinates to Three.js world space
- Handle time acceleration (0.5x, 1x, 2x, 5x, 10x speed)

---

### 4. **Dashboard UI (React + TypeScript)**

**Left Sidebar:**
- System status panel showing:
  - Tracked Objects: 18
  - Active Satellites: 3
  - Propagator: SGP4/JS
  - Status: LIVE
  - Collision Risk: LOW/MEDIUM/HIGH
- Selected satellite telemetry (NORAD ID, type, TLE data)
- Active alerts panel with collision warnings

**Top Controls:**
- Pause/Play button
- Reset simulation button
- Speed multiplier selector (0.5x - 10x)
- Show/Hide orbit trails checkbox
- 2D/3D toggle buttons

**Top-Right HUD:**
- MODE: 2D / 3D
- FOV: 45°
- CAM: ORBIT

**Bottom-Right:**
- Control hints (rotate, zoom, pan instructions)

---

### 5. **Collision Detection AI**

Implement basic collision detection:

**Multi-stage Screening:**
1. **Voxel Grid:** Divide space into 100km cubes, only check pairs in same voxel
2. **AABB Filtering:** Check axis-aligned bounding box intersection
3. **Distance Check:** Flag if satellites within 50km

**Alert Display:**
- Show red dashed lines between close objects
- Display probability of collision (PoC) estimate
- Highlight both satellites with pulsing circles
- Add to alerts panel with risk level (🔴 HIGH, 🟡 MEDIUM, 🟢 LOW)

**Alert Format:**
```
🔴 ISS ↔ DEBRIS-3
   📊 PoC: 2.4e-4 (1 in 4,167)
   ⏱️ TCA: in 4.2 hours
   📏 Miss: 0.8 km
```

---

### 6. **Landing Page**

Create an impressive hero section:

**Design:**
- Full-screen gradient background (dark blue to black)
- Animated particle field or subtle Earth rotation
- Large hero text: "Orbital Guard AI"
- Subtitle: "Enterprise-grade Space Debris Detection & Collision Avoidance"
- CTA button: "Launch Dashboard" → Navigate to /dashboard

**Features Section:**
- 3 cards showcasing:
  1. Real-time Tracking (SGP4 propagation)
  2. AI-Powered Collision Detection
  3. 3D Visualization (Google Earth style)

**Navigation:**
- Top navbar with links: Home, About, Analytics, Dashboard
- Sticky navigation with blur effect

---

### 7. **Technology Stack**

**Frontend:**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.x",
  "three": "^0.160.0",
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.96.0",
  "satellite.js": "^5.0.0",
  "lucide-react": "^0.x",
  "typescript": "^5.x",
  "vite": "^4.x",
  "tailwindcss": "^3.x"
}
```

**Setup:**
```bash
npm create vite@latest orbital-guard -- --template react-ts
cd orbital-guard
npm install three @react-three/fiber @react-three/drei satellite.js
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

---

### 8. **File Structure**

```
orbital-guard/
├── src/
│   ├── App.tsx                    # Main dashboard
│   ├── main.tsx                   # Entry point
│   ├── components/
│   │   ├── SimulationScene3D.tsx  # Three.js 3D view
│   │   ├── SimulationScene.tsx    # Canvas 2D view
│   │   └── ui/
│   │       ├── Navbar.tsx
│   │       └── AlertPanel.tsx
│   ├── pages/
│   │   ├── LandingPage.tsx
│   │   ├── AboutPage.tsx
│   │   └── AnalyticsPage.tsx
│   ├── utils/
│   │   ├── sgp4Propagator.ts      # SGP4 utilities
│   │   └── collisionDetection.ts  # Collision algorithms
│   ├── data/
│   │   └── tleData.ts             # Satellite TLE database
│   └── styles/
│       └── index.css
├── public/
│   └── textures/                  # Optional Earth textures
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## Design Specifications

### Color Palette

```css
/* Dark Theme (Primary) */
--bg-primary: #0a0a20;        /* Deep space black */
--bg-secondary: #1a1a3e;      /* Dark blue */
--accent-blue: #3b82f6;        /* Active satellites */
--accent-purple: #a855f7;      /* 3D mode indicator */
--accent-green: #22c55e;       /* Active status */
--accent-red: #ef4444;         /* Debris/alerts */
--text-primary: #ffffff;
--text-secondary: #9ca3af;
```

### Typography

- **Headings:** Font weight 700, gradient text effects
- **Body:** Font weight 400, `font-family: Inter, system-ui`
- **Monospace:** For data/stats, `font-family: 'Courier New', monospace`

### Visual Effects

- **Glassmorphism:** `backdrop-blur-lg` with `bg-black/70`
- **Glow effects:** Box shadows with color blur
- **Smooth transitions:** All interactive elements have 200ms transitions
- **Hover states:** Slight scale/opacity changes

---

## Key Features to Implement

### ✅ Must-Have (Phase 1)

1. **3D Earth** with atmospheric glow
2. **18 tracked satellites** with real TLE data
3. **SGP4 propagation** updating at 60 FPS
4. **Interactive camera** (rotate, zoom, pan)
5. **2D/3D toggle** with smooth transition
6. **Time controls** (pause, play, speed multiplier)
7. **Landing page** with hero section
8. **Dashboard** with sidebar and controls

### 🎯 Should-Have (Phase 2)

9. **Collision detection** with visual alerts
10. **Orbit trails** with fading effect
11. **Satellite selection** showing telemetry
12. **Risk assessment** panel
13. **Responsive design** (desktop + tablet)

### 💎 Nice-to-Have (Phase 3)

14. **Photorealistic Earth textures** (8K NASA Blue Marble)
15. **Day/night cycle** with city lights
16. **Maneuver planning** visualization
17. **Historical tracking** (rewind time)
18. **Export reports** (PDF/JSON)

---

## Implementation Priorities

### Week 1: Foundation
- [ ] Setup Vite + React + TypeScript project
- [ ] Configure Tailwind CSS
- [ ] Create basic routing (Landing, Dashboard)
- [ ] Implement TLE data structure

### Week 2: 3D Visualization
- [ ] Setup Three.js scene with Earth
- [ ] Add atmospheric shader
- [ ] Implement OrbitControls
- [ ] Add starfield background

### Week 3: Satellite Tracking
- [ ] Integrate satellite.js for SGP4
- [ ] Propagate 18 satellites in real-time
- [ ] Add orbit trails
- [ ] Implement time controls

### Week 4: Polish & Features
- [ ] Add 2D canvas fallback
- [ ] Implement collision detection
- [ ] Build alert system
- [ ] UI polish and testing

---

## Performance Targets

- **FPS:** 60 FPS minimum
- **Initial Load:** <3 seconds
- **Memory:** <500 MB
- **Bundle Size:** <2 MB (without textures)

---

## Testing Checklist

- [ ] All satellites render correctly
- [ ] Camera controls smooth (no lag)
- [ ] Time acceleration works (0.5x - 10x)
- [ ] 2D/3D toggle seamless
- [ ] Collision alerts trigger correctly
- [ ] Responsive on 1920x1080 screens
- [ ] No console errors
- [ ] SGP4 calculations accurate

---

## Additional Notes

### SGP4 Coordinate Transformation

```typescript
// Convert ECI (Earth-Centered Inertial) to Three.js
const SCALE = 0.0001; // km to Three.js units

const position = new THREE.Vector3(
  eciPosition.x * SCALE,      // X stays X
  eciPosition.z * SCALE,      // Z becomes Y (up in Three.js)
  -eciPosition.y * SCALE      // Y becomes -Z (depth)
);
```

### Atmospheric Shader (GLSL)

```glsl
// Vertex Shader
varying vec3 vNormal;
void main() {
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment Shader
uniform vec3 glowColor;
varying vec3 vNormal;
void main() {
  float intensity = pow(0.5 - dot(vNormal, vec3(0, 0, 1.0)), 3.5);
  gl_FragColor = vec4(glowColor, 1.0) * intensity;
}
```

---

## Success Criteria

The project is successful when:

✅ Earth looks photorealistic with atmospheric glow  
✅ All 18 satellites tracked smoothly at 60 FPS  
✅ SGP4 propagation mathematically accurate  
✅ Interactive controls feel like Google Earth  
✅ UI is modern, professional, and intuitive  
✅ Collision detection identifies close encounters  
✅ System is demo-ready for presentations  

---

## References & Resources

**TLE Data Sources:**
- Space-Track.org (requires free account)
- CelesTrak: https://celestrak.org/

**Libraries Documentation:**
- satellite.js: https://github.com/shashwatak/satellite-js
- Three.js: https://threejs.org/docs/
- React Three Fiber: https://docs.pmnd.rs/react-three-fiber

**Orbital Mechanics:**
- SGP4 Algorithm: Vallado et al. (2006)
- TLE Format: https://en.wikipedia.org/wiki/Two-line_element_set

---

**Project Goal:** Create an enterprise-grade space debris tracking platform with stunning 3D visualization that demonstrates both technical skill and visual design excellence.

**Time Estimate:** 3-4 weeks for full implementation  
**Difficulty:** Advanced (requires 3D graphics + orbital mechanics knowledge)  
**Impact:** High (solves real space safety problem with impressive demo)
