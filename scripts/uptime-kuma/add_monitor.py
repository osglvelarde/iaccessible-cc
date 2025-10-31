#!/usr/bin/env python3
"""
Add a new monitor to Uptime Kuma using the uptime-kuma-api wrapper.

Reads JSON from stdin and outputs JSON to stdout.
"""

import sys
import json
import os
from uptime_kuma_api import UptimeKumaApi, MonitorType, AuthMethod

def main():
    try:
        # Read JSON from stdin
        input_data = json.load(sys.stdin)
        
        # Get environment variables
        api_url = os.getenv('UPTIME_KUMA_API_URL', 'http://localhost:3003')
        username = os.getenv('UPTIME_KUMA_USERNAME', 'admin')
        password = os.getenv('UPTIME_KUMA_PASSWORD', 'admin123')
        # Note: API keys are for REST endpoints only, not Socket.io authentication
        
        # Map monitor type string to MonitorType enum
        type_map = {
            'http': MonitorType.HTTP,
            'https': MonitorType.HTTP,  # HTTP includes HTTPS
            'tcp': MonitorType.PORT,  # PORT is the TCP Port monitor type
            'ping': MonitorType.PING,
            'dns': MonitorType.DNS,
        }
        
        monitor_type = type_map.get(input_data.get('type', 'https'), MonitorType.HTTP)
        
        # Connect to Uptime Kuma
        with UptimeKumaApi(api_url) as api:
            # Authenticate using username/password
            # Note: API keys are for REST endpoints only, not Socket.io
            # login_by_token() requires a JWT token from a previous login session
            api.login(username, password)
            
            # Prepare monitor kwargs according to uptime-kuma-api documentation
            monitor_kwargs = {
                'type': monitor_type,
                'name': input_data.get('name', ''),
            }
            
            # Add optional parameters if provided
            if input_data.get('url'):
                monitor_kwargs['url'] = input_data['url']
            if 'heartbeatInterval' in input_data:
                monitor_kwargs['interval'] = input_data.get('heartbeatInterval', 60)
            if 'heartbeatRetryInterval' in input_data:
                monitor_kwargs['retryInterval'] = input_data.get('heartbeatRetryInterval', 60)
            if 'retries' in input_data:
                monitor_kwargs['maxretries'] = input_data.get('retries', 0)
            if 'requestTimeout' in input_data:
                monitor_kwargs['timeout'] = input_data.get('requestTimeout', 48)
            if input_data.get('httpMethod') or input_data.get('method'):
                monitor_kwargs['method'] = input_data.get('httpMethod') or input_data.get('method', 'GET')
            if 'body' in input_data:
                monitor_kwargs['body'] = input_data.get('body', '')
            if input_data.get('bodyEncoding'):
                # Map to httpBodyEncoding (allowed values: "json", "xml")
                body_encoding = input_data.get('bodyEncoding', 'json').lower()
                if body_encoding == 'json':
                    monitor_kwargs['httpBodyEncoding'] = 'json'
                elif body_encoding == 'xml':
                    monitor_kwargs['httpBodyEncoding'] = 'xml'
                else:
                    monitor_kwargs['httpBodyEncoding'] = 'json'  # Default
            if 'keyword' in input_data:
                monitor_kwargs['keyword'] = input_data.get('keyword', '')
            if 'maxredirects' in input_data:
                monitor_kwargs['maxredirects'] = input_data.get('maxredirects', 10)
            
            # accepted_statuscodes should be a list (no expectedStatusCode parameter)
            if input_data.get('acceptedStatusCodes'):
                monitor_kwargs['accepted_statuscodes'] = input_data['acceptedStatusCodes']
            
            # headers should be a string, not a list
            if input_data.get('headers'):
                headers = input_data['headers']
                if isinstance(headers, list):
                    # Convert list of objects to string format (Header: Value format)
                    header_lines = []
                    for h in headers:
                        if isinstance(h, dict):
                            header_lines.append(f"{h.get('key', '')}: {h.get('value', '')}")
                        else:
                            header_lines.append(str(h))
                    monitor_kwargs['headers'] = '\n'.join(header_lines)
                else:
                    monitor_kwargs['headers'] = str(headers)
            
            # notificationIDList should be a list
            if input_data.get('notificationIDList'):
                monitor_kwargs['notificationIDList'] = input_data['notificationIDList']
            
            # authMethod - convert string to AuthMethod enum
            if input_data.get('authMethod'):
                auth_str = input_data.get('authMethod', 'none').lower()
                auth_map = {
                    'none': AuthMethod.NONE,
                    'basic': AuthMethod.HTTP_BASIC,
                    'ntlm': AuthMethod.NTLM,
                }
                monitor_kwargs['authMethod'] = auth_map.get(auth_str, AuthMethod.NONE)
            
            # Add monitor using **kwargs to match the API signature
            result = api.add_monitor(**monitor_kwargs)
            
            # Output success result
            output = {
                'success': True,
                'monitorID': result.get('monitorId') if isinstance(result, dict) else None,
                'message': result.get('msg', 'Monitor added successfully') if isinstance(result, dict) else 'Monitor added successfully'
            }
            print(json.dumps(output))
            
    except Exception as e:
        # Output error result with more details for debugging
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
