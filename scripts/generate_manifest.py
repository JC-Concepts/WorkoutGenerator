#!/usr/bin/env python3
"""
Generate workouts.json from workout files
Parses .zwo and .xml files to extract workout metadata
"""
import os
import json
import xml.etree.ElementTree as ET
from datetime import datetime

WORKOUTS_DIR = 'workouts'
OUTPUT_FILE = 'workouts.json'

# Alternative paths to check if workouts folder doesn't exist
ALTERNATIVE_PATHS = [
    'WOdb/zwift_workouts_all_collections_ordered_Nov20',
    '../WOdb/zwift_workouts_all_collections_ordered_Nov20',
    'WOdb',
]

# Also check parent directory for WOdb
PARENT_WOdb_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'WOdb', 'zwift_workouts_all_collections_ordered_Nov20')

ZONES = {
    1: (0, 0.55),
    2: (0.55, 0.75),
    3: (0.75, 0.90),
    4: (0.90, 1.05),
    5: (1.05, float('inf'))
}

def categorize_duration(seconds):
    """Categorize workout duration"""
    minutes = seconds / 60
    if minutes < 30:
        return 'less_30'
    elif minutes <= 45:
        return '30_45'
    elif minutes <= 60:
        return '45_60'
    elif minutes <= 90:
        return '60_90'
    else:
        return 'greater_90'

def get_primary_zone(power_values):
    """Determine primary zone based on power values"""
    if not power_values:
        return 3
    
    avg_power = sum(power_values) / len(power_values)
    
    for zone, (low, high) in ZONES.items():
        if low <= avg_power < high:
            return zone
    return 4

def parse_zwo_file(file_path):
    """Parse .zwo file"""
    try:
        tree = ET.parse(file_path)
        root = tree.getroot()
        
        # Handle both workout_file and workout root elements
        if root.tag == 'workout_file':
            name = root.findtext('name', 'Unknown')
            description = root.findtext('description', '')
            author = root.findtext('author', 'Unknown')
            workout = root.find('workout')
        else:
            name = root.get('name', 'Unknown')
            description = root.findtext('description', '')
            author = root.findtext('author', 'Unknown')
            workout = root
        
        if workout is None:
            return None
        
        total_duration = 0
        power_values = []
        
        for elem in workout:
            # Get duration from various attribute names (handle floats)
            duration = elem.get('Duration') or elem.get('duration') or '0'
            if duration:
                try:
                    total_duration += int(float(duration))
                except (ValueError, TypeError):
                    pass
            
            # Get power from various attribute formats
            power = elem.get('Power') or elem.get('power')
            power_low = elem.get('PowerLow') or elem.get('powerLow', '0')
            power_high = elem.get('PowerHigh') or elem.get('powerHigh', '0')
            
            try:
                if power:
                    power_values.append(float(power) * 100)
                elif power_low and power_high:
                    power_values.append((float(power_low) + float(power_high)) / 2 * 100)
            except (ValueError, TypeError):
                pass
        
        if not power_values:
            power_values = [0]
        
        primary_zone = get_primary_zone([p/100 for p in power_values if p > 0])
        
        avg_power = sum(power_values) / len(power_values) if power_values else 0
        tss = int(total_duration / 36 * avg_power / 100) if avg_power > 0 else 0
        
        return {
            'name': name.strip() if name else 'Unknown',
            'description': description.strip() if description else '',
            'author': author.strip() if author else 'Unknown',
            'duration_seconds': total_duration,
            'duration_category': categorize_duration(total_duration),
            'tss': max(0, tss),
            'primary_zone': primary_zone,
            'avg_power': round(avg_power)
        }
    except Exception as e:
        print(f"Error parsing {file_path}: {e}")
        return None

def parse_xml_file(file_path):
    """Parse .xml file (Zwift format)"""
    return parse_zwo_file(file_path)

def get_category_from_path(file_path):
    """Extract category from file path"""
    parts = file_path.split(os.sep)
    if len(parts) >= 2:
        return parts[0]
    return 'Unknown'

def generate_manifest(workouts_dir=None):
    """Generate workouts.json from workout files"""
    global WORKOUTS_DIR
    if workouts_dir:
        WORKOUTS_DIR = workouts_dir
    
    workouts = []
    workout_id = 1
    
    print(f"Scanning {WORKOUTS_DIR} directory...")
    
    for root, dirs, files in os.walk(WORKOUTS_DIR):
        for file in files:
            if file.endswith('.zwo') or file.endswith('.xml'):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, WORKOUTS_DIR)
                
                if file.endswith('.zwo'):
                    workout_data = parse_zwo_file(file_path)
                else:
                    workout_data = parse_xml_file(file_path)
                
                if workout_data:
                    category = get_category_from_path(rel_path)
                    
                    workout = {
                        'id': f'workout_{workout_id:04d}',
                        'name': workout_data['name'],
                        'description': workout_data.get('description', ''),
                        'author': workout_data.get('author', 'Unknown'),
                        'category': category,
                        'subcategory': '',
                        'file': rel_path.replace(os.sep, '/'),
                        'duration_seconds': workout_data['duration_seconds'],
                        'duration_category': workout_data['duration_category'],
                        'tss': workout_data['tss'],
                        'primary_zone': workout_data['primary_zone'],
                        'avg_power': workout_data['avg_power']
                    }
                    
                    workouts.append(workout)
                    workout_id += 1
                    
                    if (workout_id - 1) % 100 == 0:
                        print(f"Processed {workout_id - 1} workouts...")
    
    manifest = {
        'version': datetime.now().strftime('%Y.%m.%d'),
        'lastUpdated': datetime.now().isoformat(),
        'workouts': workouts
    }
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"\nManifest generated successfully!")
    print(f"Total workouts: {len(workouts)}")
    print(f"Output file: {OUTPUT_FILE}")

if __name__ == '__main__':
    # Check if workouts directory exists, try alternatives
    workouts_path = WORKOUTS_DIR
    
    if not os.path.exists(workouts_path):
        print(f"Warning: '{workouts_path}' not found. Checking alternative locations...")
        for alt_path in ALTERNATIVE_PATHS:
            if os.path.exists(alt_path):
                workouts_path = alt_path
                print(f"Found workouts at: {workouts_path}")
                break
    
    if not os.path.exists(workouts_path):
        print(f"Error: No workouts directory found!")
        print(f"Tried: {WORKOUTS_DIR}")
        for alt_path in ALTERNATIVE_PATHS:
            print(f"  - {alt_path}")
        exit(1)
    
    generate_manifest(workouts_path)
