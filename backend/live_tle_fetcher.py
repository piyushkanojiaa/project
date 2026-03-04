"""
Live TLE Data Fetcher from Celestrak
Fetches real satellite orbital data from public APIs

Sources:
- Celestrak: https://celestrak.org/NORAD/elements/
- Categories: Active satellites, debris, rocket bodies
"""

import requests
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import json
from pathlib import Path
import time


class LiveTLEFetcher:
    """Fetch and cache real TLE data from Celestrak"""
    
    # Celestrak GP data endpoints (JSON format)
    CELESTRAK_BASE = "https://celestrak.org/NORAD/elements/gp.php"
    
    CATEGORIES = {
        'stations': 'STATIONS',  # ISS, Tiangong, etc.
        'active': 'ACTIVE',      # Active satellites
        'analyst': 'ANALYST',    # Analyst satellites
        'starlink': 'STARLINK',  # Starlink constellation
        'oneweb': 'ONEWEB',      # OneWeb constellation
        'debris': 'DEBRIS',      # Tracked debris (limited public access)
    }
    
    def __init__(self, cache_dir: str = "./tle_cache", cache_hours: int = 6):
        """
        Initialize TLE fetcher
        
        Args:
            cache_dir: Directory to cache TLE data
            cache_hours: Hours before refreshing cache (default: 6)
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        self.cache_hours = cache_hours
        self.data = {}
        
    def fetch_category(self, category: str, format: str = 'json') -> List[Dict]:
        """
        Fetch TLE data for a specific category
        
        Args:
            category: Category key from CATEGORIES
            format: Response format ('json' or 'tle')
        
        Returns:
            List of satellite dictionaries with TLE data
        """
        if category not in self.CATEGORIES:
            raise ValueError(f"Unknown category: {category}. Options: {list(self.CATEGORIES.keys())}")
        
        # Check cache first
        cached_data = self._load_from_cache(category)
        if cached_data:
            print(f"✓ Loaded {len(cached_data)} objects from cache ({category})")
            return cached_data
        
        # Fetch from Celestrak
        cat_name = self.CATEGORIES[category]
        url = f"{self.CELESTRAK_BASE}?GROUP={cat_name}&FORMAT={format.upper()}"
        
        print(f"Fetching {category} from Celestrak...")
        
        try:
            response = requests.get(url, timeout=30)
            response.raise_for_status()
            
            if format == 'json':
                data = response.json()
                satellites = self._parse_json_response(data, category)
            else:
                # Parse TLE format
                satellites = self._parse_tle_response(response.text, category)
            
            # Cache the data
            self._save_to_cache(category, satellites)
            
            print(f"✓ Fetched {len(satellites)} objects ({category})")
            return satellites
            
        except requests.RequestException as e:
            print(f"✗ Error fetching {category}: {e}")
            return []
    
    def fetch_all_active(self) -> List[Dict]:
        """Fetch all active satellites and stations"""
        all_sats = []
        
        for cat in ['stations', 'active', 'starlink']:
            sats = self.fetch_category(cat)
            all_sats.extend(sats)
            time.sleep(1)  # Rate limiting
        
        print(f"\n✓ Total fetched: {len(all_sats)} satellites")
        return all_sats
    
    def _parse_json_response(self, data: List[Dict], category: str) -> List[Dict]:
        """Parse JSON response from Celestrak GP API"""
        satellites = []
        
        for obj in data:
            try:
                sat = {
                    'id': str(obj.get('NORAD_CAT_ID', 'UNKNOWN')),
                    'name': obj.get('OBJECT_NAME', 'UNKNOWN').strip(),
                    'tle': [
                        obj.get('TLE_LINE1', ''),
                        obj.get('TLE_LINE2', '')
                    ],
                    'type': 'satellite' if category in ['stations', 'active', 'starlink', 'oneweb'] else 'debris',
                    'epoch': obj.get('EPOCH', ''),
                    'mean_motion': obj.get('MEAN_MOTION', 0),
                    'eccentricity': obj.get('ECCENTRICITY', 0),
                    'inclination': obj.get('INCLINATION', 0),
                    'category': category,
                }
                satellites.append(sat)
            except Exception as e:
                print(f"Warning: Failed to parse object: {e}")
                continue
        
        return satellites
    
    def _parse_tle_response(self, text: str, category: str) -> List[Dict]:
        """Parse traditional TLE format (3-line elements)"""
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        satellites = []
        
        for i in range(0, len(lines), 3):
            if i + 2 >= len(lines):
                break
            
            try:
                name = lines[i]
                tle1 = lines[i + 1]
                tle2 = lines[i + 2]
                
                # Extract NORAD ID from line 1
                norad_id = tle1.split()[1][:5]
                
                sat = {
                    'id': norad_id,
                    'name': name,
                    'tle': [tle1, tle2],
                    'type': 'satellite' if category in ['stations', 'active'] else 'debris',
                    'category': category,
                }
                satellites.append(sat)
            except Exception as e:
                print(f"Warning: Failed to parse TLE: {e}")
                continue
        
        return satellites
    
    def _load_from_cache(self, category: str) -> Optional[List[Dict]]:
        """Load data from cache if fresh enough"""
        cache_file = self.cache_dir / f"{category}.json"
        
        if not cache_file.exists():
            return None
        
        # Check if cache is fresh
        file_age = datetime.now() - datetime.fromtimestamp(cache_file.stat().st_mtime)
        if file_age > timedelta(hours=self.cache_hours):
            print(f"Cache expired for {category} (age: {file_age})")
            return None
        
        try:
            with open(cache_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Warning: Failed to load cache: {e}")
            return None
    
    def _save_to_cache(self, category: str, data: List[Dict]):
        """Save data to cache"""
        cache_file = self.cache_dir / f"{category}.json"
        
        try:
            with open(cache_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"Warning: Failed to save cache: {e}")
    
    def get_satellite_count(self) -> Dict[str, int]:
        """Get count of satellites by category"""
        counts = {}
        for cat in self.CATEGORIES:
            cache_file = self.cache_dir / f"{cat}.json"
            if cache_file.exists():
                try:
                    with open(cache_file, 'r') as f:
                        data = json.load(f)
                        counts[cat] = len(data)
                except:
                    counts[cat] = 0
            else:
                counts[cat] = 0
        return counts


# Convenience functions
def fetch_live_tle_data(categories: List[str] = None) -> List[Dict]:
    """
    Fetch live TLE data from Celestrak
    
    Args:
        categories: List of category keys to fetch (default: stations, active)
    
    Returns:
        Combined list of satellite dictionaries
    """
    if categories is None:
        categories = ['stations', 'active']
    
    fetcher = LiveTLEFetcher()
    all_data = []
    
    for cat in categories:
        data = fetcher.fetch_category(cat)
        all_data.extend(data)
    
    return all_data


if __name__ == "__main__":
    print("=" * 80)
    print("LIVE TLE DATA FETCHER - Celestrak Integration")
    print("=" * 80)
    
    fetcher = LiveTLEFetcher()
    
    # Fetch active satellites
    print("\nFetching space stations...")
    stations = fetcher.fetch_category('stations')
    
    print("\nFetching active satellites...")
    active = fetcher.fetch_category('active')
    
    print("\nFetching Starlink constellation...")
    starlink = fetcher.fetch_category('starlink')
    
    # Display summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)
    counts = fetcher.get_satellite_count()
    total = sum(counts.values())
    
    for cat, count in counts.items():
        print(f"{cat:15s}: {count:5d} objects")
    
    print(f"{'TOTAL':15s}: {total:5d} objects")
    
    # Show sample data
    if stations:
        print("\n" + "-" * 80)
        print("SAMPLE: Space Stations")
        print("-" * 80)
        for sat in stations[:3]:
            print(f"\nName: {sat['name']}")
            print(f"NORAD ID: {sat['id']}")
            print(f"TLE Line 1: {sat['tle'][0][:50]}...")
            print(f"TLE Line 2: {sat['tle'][1][:50]}...")
