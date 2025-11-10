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

