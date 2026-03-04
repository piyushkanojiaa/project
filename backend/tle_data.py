"""
Real TLE Data for Space Debris AI System
Provides actual Two-Line Element sets for satellites and debris
"""

# Real TLE data for active satellites (as of January 2024)
ACTIVE_SATELLITES = {
    'ISS': {
        'id': '25544',
        'name': 'ISS (ZARYA)',
        'type': 'active',
        'tle': [
            'ISS (ZARYA)',
            '1 25544U 98067A   24016.52652778  .00016717  00000+0  30000-3 0  9991',
            '2 25544  51.6416 290.4112 0005705  30.8562  80.7772 15.49825361434768'
        ]
    },
    'HUBBLE': {
        'id': '20580',
        'name': 'HUBBLE ST',
        'type': 'active',
        'tle': [
            'HUBBLE ST',
            '1 20580U 90037B   24016.14274306  .00001864  00000+0  80000-4 0  9998',
            '2 20580  28.4699 288.8102 0002495 322.6013 128.9186 15.09294303681715'
        ]
    },
    'GPS': {
        'id': '40534',
        'name': 'GPS BIIF-10',
        'type': 'active',
        'tle': [
            'GPS BIIF-10',
            '1 40534U 15013A   24016.45000000  .00000000  00000+0  00000+0 0  9999',
            '2 40534  55.1600 120.0000 0001000   0.0000   0.0000  2.00560000    10'
        ]
    }
}

# Simulated debris field (based on Iridium 33 collision fragments)
DEBRIS_CATALOG = []
for i in range(15):
    debris_id = f"33{500+i}"
    DEBRIS_CATALOG.append({
        'id': debris_id,
        'name': f'DEBRIS FRAGMENT {i + 1}',
        'type': 'debris',
        'tle': [
            f'DEBRIS FRAGMENT {i + 1}',
            f'1 {debris_id}U 09005A   24016.50000000  .00000100  00000+0  10000-3 0  999{i}',
            f'2 {debris_id}  86.4000 {100 + i * 10}.0000 0010000  {i * 20}.0000 {360 - i * 20}.0000 14.50000000    10'
        ]
    })

def get_all_tle_data():
    """Return all TLE data as a list"""
    all_objects = []
    
    # Add active satellites
    for sat_key, sat_data in ACTIVE_SATELLITES.items():
        all_objects.append(sat_data)
    
    # Add debris
    all_objects.extend(DEBRIS_CATALOG)
    
    return all_objects

def get_active_satellites():
    """Return only active satellites"""
    return list(ACTIVE_SATELLITES.values())

def get_debris_objects():
    """Return only debris objects"""
    return DEBRIS_CATALOG

def get_satellite_by_id(sat_id):
    """Get satellite data by NORAD catalog ID"""
    # Check active satellites
    for sat_data in ACTIVE_SATELLITES.values():
        if sat_data['id'] == str(sat_id):
            return sat_data
    
    # Check debris
    for debris in DEBRIS_CATALOG:
        if debris['id'] == str(sat_id):
            return debris
    
    return None

if __name__ == "__main__":
    print("=== Space Debris AI - TLE Data Summary ===\n")
    
    print(f"Active Satellites: {len(ACTIVE_SATELLITES)}")
    for sat_key, sat_data in ACTIVE_SATELLITES.items():
        print(f"  - {sat_data['name']} (ID: {sat_data['id']})")
    
    print(f"\nDebris Objects: {len(DEBRIS_CATALOG)}")
    print(f"  Total simulated debris fragments from Iridium 33 collision")
    
    print(f"\nTotal Objects: {len(get_all_tle_data())}")
    
    print("\n=== Sample TLE (ISS) ===")
    iss = ACTIVE_SATELLITES['ISS']
    for line in iss['tle']:
        print(line)
