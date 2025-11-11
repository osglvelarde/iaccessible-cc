#!/usr/bin/env python3
"""
Delete a monitor from Uptime Kuma using the uptime-kuma-api wrapper.

Reads JSON from stdin:
{
  "id": 1
}

Outputs JSON to stdout:
{
  "success": true,
  "message": "Monitor deleted successfully"
}

or on error:
{
  "success": false,
  "error": "Error message"
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

from uptime_kuma_api import UptimeKumaApi

def main():
    try:
        # Read JSON from stdin
        input_data = json.load(sys.stdin)
        
        # Validate required fields
        if 'id' not in input_data:
            raise ValueError('Monitor ID is required')
        
        monitor_id = int(input_data['id'])
        
        # Get environment variables
        api_url = os.getenv('UPTIME_KUMA_API_URL', 'http://localhost:3003')
        username = os.getenv('UPTIME_KUMA_USERNAME', 'admin')
        password = os.getenv('UPTIME_KUMA_PASSWORD', 'admin123')
        # api_key is not used for Socket.io authentication (only for REST endpoints)
        
        # Connect to Uptime Kuma
        with UptimeKumaApi(api_url) as api:
            # Authenticate using username/password
            # Note: API keys are for REST endpoints only, not Socket.io
            # login_by_token() requires a JWT token from a previous login session
            api.login(username, password)
            
            # Delete monitor
            result = api.delete_monitor(monitor_id)
            
            # Output success result
            output = {
                'success': True,
                'message': result.get('msg', 'Monitor deleted successfully') if isinstance(result, dict) else 'Monitor deleted successfully'
            }
            print(json.dumps(output))
            
    except Exception as e:
        # Output error result
        error_output = {
            'success': False,
            'error': str(e)
        }
        print(json.dumps(error_output))
        sys.exit(1)

if __name__ == '__main__':
    main()

