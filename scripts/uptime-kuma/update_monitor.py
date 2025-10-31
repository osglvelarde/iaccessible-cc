#!/usr/bin/env python3
"""
Update an existing monitor in Uptime Kuma using the uptime-kuma-api wrapper.

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
        
        # Validate required fields
        if 'id' not in input_data:
            raise ValueError('Monitor ID is required')
        
        monitor_id = int(input_data['id'])
        
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
            
            # Get existing monitor to merge with updates
            existing_monitor = api.get_monitor(monitor_id)
            
            # Prepare update kwargs according to uptime-kuma-api documentation
            # edit_monitor(id_, **kwargs) - id is first positional parameter
            monitor_kwargs = {}
            
            # Merge with existing monitor values, override with input_data if provided
            # Name
            if 'name' in input_data:
                monitor_kwargs['name'] = input_data['name']
            elif 'name' in existing_monitor:
                monitor_kwargs['name'] = existing_monitor['name']
            
            # URL
            if 'url' in input_data:
                monitor_kwargs['url'] = input_data['url']
            elif 'url' in existing_monitor:
                monitor_kwargs['url'] = existing_monitor['url']
            
            # Type
            if 'type' in input_data or 'type' in existing_monitor:
                monitor_kwargs['type'] = monitor_type
            
            # Interval
            if 'heartbeatInterval' in input_data:
                monitor_kwargs['interval'] = input_data['heartbeatInterval']
            elif 'interval' in existing_monitor:
                monitor_kwargs['interval'] = existing_monitor['interval']
            
            # Retry settings
            if 'retries' in input_data:
                monitor_kwargs['maxretries'] = input_data['retries']
            elif 'maxretries' in existing_monitor:
                monitor_kwargs['maxretries'] = existing_monitor['maxretries']
            
            if 'heartbeatRetryInterval' in input_data:
                monitor_kwargs['retryInterval'] = input_data['heartbeatRetryInterval']
            elif 'retryInterval' in existing_monitor:
                monitor_kwargs['retryInterval'] = existing_monitor['retryInterval']
            
            # Timeout
            if 'requestTimeout' in input_data:
                monitor_kwargs['timeout'] = input_data['requestTimeout']
            elif 'timeout' in existing_monitor:
                monitor_kwargs['timeout'] = existing_monitor['timeout']
            
            # HTTP method
            if 'httpMethod' in input_data or 'method' in input_data:
                monitor_kwargs['method'] = input_data.get('httpMethod') or input_data.get('method', 'GET')
            elif 'method' in existing_monitor:
                monitor_kwargs['method'] = existing_monitor['method']
            
            # Body
            if 'body' in input_data:
                monitor_kwargs['body'] = input_data['body']
            elif 'body' in existing_monitor:
                monitor_kwargs['body'] = existing_monitor['body']
            
            # Body encoding - map to httpBodyEncoding
            if 'bodyEncoding' in input_data:
                body_encoding = input_data.get('bodyEncoding', 'json').lower()
                if body_encoding == 'json':
                    monitor_kwargs['httpBodyEncoding'] = 'json'
                elif body_encoding == 'xml':
                    monitor_kwargs['httpBodyEncoding'] = 'xml'
            elif 'httpBodyEncoding' in existing_monitor:
                monitor_kwargs['httpBodyEncoding'] = existing_monitor['httpBodyEncoding']
            
            # Keyword
            if 'keyword' in input_data:
                monitor_kwargs['keyword'] = input_data['keyword']
            elif 'keyword' in existing_monitor:
                monitor_kwargs['keyword'] = existing_monitor['keyword']
            
            # Max redirects
            if 'maxredirects' in input_data:
                monitor_kwargs['maxredirects'] = input_data['maxredirects']
            elif 'maxredirects' in existing_monitor:
                monitor_kwargs['maxredirects'] = existing_monitor['maxredirects']
            
            # Accepted status codes (not expectedStatusCode - that parameter doesn't exist)
            if 'acceptedStatusCodes' in input_data:
                monitor_kwargs['accepted_statuscodes'] = input_data['acceptedStatusCodes']
            elif 'accepted_statuscodes' in existing_monitor:
                monitor_kwargs['accepted_statuscodes'] = existing_monitor['accepted_statuscodes']
            
            # Headers - should be string
            if 'headers' in input_data:
                headers = input_data['headers']
                if isinstance(headers, list):
                    header_lines = []
                    for h in headers:
                        if isinstance(h, dict):
                            header_lines.append(f"{h.get('key', '')}: {h.get('value', '')}")
                        else:
                            header_lines.append(str(h))
                    monitor_kwargs['headers'] = '\n'.join(header_lines)
                else:
                    monitor_kwargs['headers'] = str(headers)
            elif 'headers' in existing_monitor and existing_monitor['headers']:
                monitor_kwargs['headers'] = existing_monitor['headers']
            
            # Notification ID List
            if 'notificationIDList' in input_data:
                monitor_kwargs['notificationIDList'] = input_data['notificationIDList']
            elif 'notificationIDList' in existing_monitor:
                monitor_kwargs['notificationIDList'] = existing_monitor['notificationIDList']
            
            # Auth method - convert to AuthMethod enum
            if 'authMethod' in input_data:
                auth_str = input_data.get('authMethod', 'none').lower()
                auth_map = {
                    'none': AuthMethod.NONE,
                    'basic': AuthMethod.HTTP_BASIC,
                    'ntlm': AuthMethod.NTLM,
                }
                monitor_kwargs['authMethod'] = auth_map.get(auth_str, AuthMethod.NONE)
            elif 'authMethod' in existing_monitor:
                monitor_kwargs['authMethod'] = existing_monitor['authMethod']
            
            # Update monitor - id is first positional parameter, not keyword
            result = api.edit_monitor(monitor_id, **monitor_kwargs)
            
            # Output success result
            output = {
                'success': True,
                'monitorID': monitor_id,
                'message': result.get('msg', 'Monitor updated successfully') if isinstance(result, dict) else 'Monitor updated successfully'
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
