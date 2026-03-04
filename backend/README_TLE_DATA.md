# Real TLE Data Integration for Space Debris AI

This directory contains real Two-Line Element (TLE) data for the Space Debris Detection & Collision Avoidance AI system.

## Data Sources

### Active Satellites (3 objects)
| Name | NORAD ID | Type | Details |
|------|----------|------|---------|
| **ISS (ZARYA)** | 25544 | Space Station | International Space Station, LEO ~408 km |
| **HUBBLE ST** | 20580 | Telescope | Hubble Space Telescope, LEO ~540 km |
| **GPS BIIF-10** | 40534 | Navigation | GPS satellite, MEO ~20,200 km |

### Debris Field (15 objects)
- Simulated debris fragments based on Iridium 33 collision event
- NORAD IDs: 33500-33514
- Highly inclined orbits (~86.4°) representing polar debris cloud
- Used for collision screening demonstrations

## TLE Format

Two-Line Element sets follow the standard NORAD/NASA format:

```
Line 0: Satellite Name
Line 1: 1 NNNNNC NNNNNAAA NNNNN.NNNNNNNN +.NNNNNNNN +NNNNN-N +NNNNN-N N NNNNN
Line 2: 2 NNNNN NNN.NNNN NNN.NNNN NNNNNNN NNN.NNNN NNN.NNNN NN.NNNNNNNNNNNNNN
```

## Usage

### Frontend (TypeScript/React)
```typescript
import { TLE_DATA } from './tleData';

// Get all objects
const allObjects = TLE_DATA;

// Filter active satellites
const satellites = TLE_DATA.filter(obj => obj.type === 'active');

// Filter debris
const debris = TLE_DATA.filter(obj => obj.type === 'debris');
```

### Backend (Python)
```python
from tle_data import get_all_tle_data, get_active_satellites, get_debris_objects

# Get all TLE data
all_data = get_all_tle_data()

# Get only active satellites
satellites = get_active_satellites()

# Get only debris
debris = get_debris_objects()

# Example: Parse ISS TLE
from examples import parse_tle_to_state

iss_data = get_satellite_by_id('25544')
tle_string = '\n'.join(iss_data['tle'])
iss_state = parse_tle_to_state(tle_string)
```

## Data Freshness

**Epoch**: January 16, 2024

> ⚠️ **Note**: TLE data becomes less accurate over time due to atmospheric drag and gravitational perturbations. For production use, fetch latest TLEs from:
> - [Space-Track.org](https://www.space-track.org) (free registration required)
> - [Celestrak](https://celestrak.org/NORAD/elements/)
> - [N2YO API](https://www.n2yo.com/api/)

## Updating TLE Data

### Manual Update
Replace the TLE strings in `tleData.ts` (frontend) or `tle_data.py` (backend) with fresh data from Space-Track.org or Celestrak.

### Automated Update (Recommended for Production)
```python
# Install Space-Track client
pip install spacetrack

# Fetch latest TLEs
from spacetrack import SpaceTrackClient
st = SpaceTrackClient('username', 'password')

# Get ISS
iss_tle = st.tle_latest(norad_cat_id=25544, format='3le')

# Get Hubble
hubble_tle = st.tle_latest(norad_cat_id=20580, format='3le')
```

## Integration with Examples

The real TLE data can be used directly with the backend examples:

```python
from tle_data import ACTIVE_SATELLITES
from examples import parse_tle_to_state, example_end_to_end_conjunction_analysis

# Use real ISS TLE
iss_tle = '\n'.join(ACTIVE_SATELLITES['ISS']['tle'])
iss_state = parse_tle_to_state(iss_tle)

# Use real Hubble TLE
hubble_tle = '\n'.join(ACTIVE_SATELLITES['HUBBLE']['tle'])
hubble_state = parse_tle_to_state(hubble_tle)
```

## Orbital Parameters (Extracted from TLEs)

| Object | Semi-Major Axis | Inclination | Period | Eccentricity |
|--------|-----------------|-------------|---------|--------------|
| ISS | 6,778 km | 51.64° | ~93 min | 0.0006 |
| Hubble | 6,918 km | 28.47° | ~96 min | 0.0002 |
| GPS BIIF-10 | 26,560 km | 55.16° | ~718 min | 0.0001 |

## Debris Cloud Characteristics

- **Source**: Simulated Iridium 33 collision event (Feb 2009)
- **Orbit Type**: Highly-inclined Low Earth Orbit (LEO)
- **Inclination**: 86.4° (near-polar)
- **Altitude Range**: ~790 km
- **Orbital Period**: ~96 minutes
- **Coverage**: Fragments distributed across 360° RAAN

This debris field is ideal for testing conjunction screening algorithms due to:
1. High inclination creates multiple crossing opportunities
2. Similar altitudes to ISS and Hubble
3. Large number of objects for batch processing tests

## Technical Notes

1. **Mean Motion**: Higher mean motion = lower orbit
   - ISS: 15.50 rev/day (lower orbit)
   - GPS: 2.00 rev/day (higher orbit)

2. **Drag Term (B*)**: ISS has high drag (0.00003) vs GPS (0.0) due to atmospheric density

3. **Element Set Number**: Last digit changes with each TLE update

## Files

- `tleData.ts` - TypeScript/JavaScript frontend data
- `tle_data.py` - Python backend data module
- `README.md` - This file

---

**Last Updated**: January 16, 2026  
**Data Epoch**: January 16, 2024  
**Total Objects**: 18 (3 active + 15 debris)
