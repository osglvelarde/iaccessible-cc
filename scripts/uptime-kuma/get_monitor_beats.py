#!/usr/bin/env python3
"""
Get monitor beats (heartbeat history) from Uptime Kuma using the uptime-kuma-api wrapper.

Reads JSON from stdin:
{
  "id": 1,
  "hours": 1
}

Outputs JSON to stdout:
{
  "success": true,
  "beats": [
    {
      "id": 25,
      "monitor_id": 1,
      "status": 1,
      "ping": 201,
      "msg": "200 - OK",
      "time": "2022-12-15 12:38:42.661",
      "duration": 0,
      "important": true,
      "down_count": 0
    },
    ...
  ]
}
"""

import sys
import json
import os
from pathlib import Path

# Add .python-packages directory to Python path (for Render deployment)
# This ensures uptime-kuma-api is found even if PYTHONPATH isn't set correctly
project_root = Path(__file__).parent.parent.parent
python_packages_path = project_root / '.python-packages'
if python_packages_path.exists():
    sys.path.insert(0, str(python_packages_path))
    print(f"[get_monitor_beats] Added .python-packages to sys.path: {python_packages_path}", file=sys.stderr)
    # Debug: List contents of .python-packages
    try:
        contents = list(python_packages_path.iterdir())
        print(f"[get_monitor_beats] Contents of .python-packages: {[str(c.name) for c in contents[:10]]}", file=sys.stderr)
        # Check for uptime_kuma_api specifically
        uptime_kuma_path = python_packages_path / 'uptime_kuma_api'
        if uptime_kuma_path.exists():
            print(f"[get_monitor_beats] Found uptime_kuma_api directory", file=sys.stderr)
        else:
            print(f"[get_monitor_beats] WARNING: uptime_kuma_api directory not found in .python-packages", file=sys.stderr)
            # Try to find it
            for item in python_packages_path.iterdir():
                if 'uptime' in item.name.lower() or 'kuma' in item.name.lower():
                    print(f"[get_monitor_beats] Found related item: {item.name}", file=sys.stderr)
    except Exception as e:
        print(f"[get_monitor_beats] Error listing .python-packages: {e}", file=sys.stderr)
    # Debug: Show sys.path
    print(f"[get_monitor_beats] sys.path: {sys.path[:3]}", file=sys.stderr)
else:
    print(f"[get_monitor_beats] WARNING: .python-packages directory not found at {python_packages_path}", file=sys.stderr)
    print(f"[get_monitor_beats] Current working directory: {os.getcwd()}", file=sys.stderr)
    print(f"[get_monitor_beats] Script location: {__file__}", file=sys.stderr)
    print(f"[get_monitor_beats] Project root: {project_root}", file=sys.stderr)

from uptime_kuma_api import UptimeKumaApi

def main():
    try:
        # Read JSON from stdin
        input_data = json.load(sys.stdin)
        
        # Validate required fields
        if 'id' not in input_data:
            raise ValueError('Monitor ID is required')
        
        monitor_id = int(input_data['id'])
        hours = int(input_data.get('hours', 1))
        
        # Get environment variables
        api_url = os.getenv('UPTIME_KUMA_API_URL', 'http://localhost:3003')
        username = os.getenv('UPTIME_KUMA_USERNAME', 'admin')
        password = os.getenv('UPTIME_KUMA_PASSWORD', 'admin123')
        
        # Debug logging (mask password)
        print(f"[get_monitor_beats] Connecting to: {api_url}", file=sys.stderr)
        print(f"[get_monitor_beats] Username: {username}", file=sys.stderr)
        print(f"[get_monitor_beats] Password: {'***' if password else '(not set)'}", file=sys.stderr)
        
        # Connect to Uptime Kuma
        with UptimeKumaApi(api_url) as api:
            # Authenticate using username/password
            api.login(username, password)
            
            # Get monitor beats
            beats = api.get_monitor_beats(monitor_id, hours)
            
            # Normalize beats data - ensure all fields are properly serialized
            normalized_beats = []
            if isinstance(beats, list):
                for beat in beats:
                    normalized_beat = {}
                    # Copy all fields
                    for key, value in beat.items():
                        # Handle MonitorStatus enum objects
                        if key == 'status' and hasattr(value, 'value'):
                            normalized_beat[key] = value.value
                        # Handle any other enum types
                        elif hasattr(value, 'value'):
                            normalized_beat[key] = value.value
                        # Handle datetime objects
                        elif hasattr(value, 'isoformat'):
                            normalized_beat[key] = str(value)
                        else:
                            normalized_beat[key] = value
                    normalized_beats.append(normalized_beat)
            
            # Output success result
            output = {
                'success': True,
                'beats': normalized_beats
            }
            print(json.dumps(output, default=str))  # default=str handles any remaining non-serializable objects
            
    except Exception as e:
        # Output error result
        import traceback
        error_output = {
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }
        print(json.dumps(error_output))
        sys.exit(1)

if __name__ == '__main__':
    main()

