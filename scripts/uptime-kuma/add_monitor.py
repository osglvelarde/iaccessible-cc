#!/usr/bin/env python3
"""
Add a new monitor to Uptime Kuma using the uptime-kuma-api wrapper.

Reads JSON from stdin and outputs JSON to stdout.
"""

import sys
import json
import os
import time
import urllib.request
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
        
        # Debug logging (mask password)
        print(f"[add_monitor] ===== CONNECTION DETAILS =====", file=sys.stderr)
        print(f"[add_monitor] Connecting to: {api_url}", file=sys.stderr)
        print(f"[add_monitor] Username: {username}", file=sys.stderr)
        password_length = len(password) if password else 0
        print(f"[add_monitor] Password set: {'Yes' if password else 'No'} (length: {password_length})", file=sys.stderr)
        print(f"[add_monitor] Password value (first 3 chars): {password[:3] if password and len(password) >= 3 else '(too short)'}", file=sys.stderr)
        print(f"[add_monitor] Password value (last 3 chars): {password[-3:] if password and len(password) >= 3 else '(too short)'}", file=sys.stderr)
        print(f"[add_monitor] Full password (for debugging): {repr(password)}", file=sys.stderr)
        print(f"[add_monitor] ==============================", file=sys.stderr)
        
        # Map monitor type string to MonitorType enum
        type_map = {
            'http': MonitorType.HTTP,
            'https': MonitorType.HTTP,  # HTTP includes HTTPS
            'tcp': MonitorType.PORT,  # PORT is the TCP Port monitor type
            'ping': MonitorType.PING,
            'dns': MonitorType.DNS,
        }
        
        monitor_type = type_map.get(input_data.get('type', 'https'), MonitorType.HTTP)
        
        # For Render services, wake up the service first with a simple HTTP request
        # This helps avoid Socket.io timeout errors when the service is sleeping
        if 'onrender.com' in api_url or 'render.com' in api_url:
            print(f"[add_monitor] Detected Render service, sending wake-up request...", file=sys.stderr)
            try:
                # Make a simple HTTP request to wake up the service
                wake_url = api_url.rstrip('/') + '/api/status-page'
                print(f"[add_monitor] Wake-up request to: {wake_url}", file=sys.stderr)
                req = urllib.request.Request(wake_url)
                req.add_header('User-Agent', 'iaccessible-cc/1.0')
                with urllib.request.urlopen(req, timeout=30) as response:
                    print(f"[add_monitor] Wake-up request successful (status: {response.getcode()})", file=sys.stderr)
                # Give the service a moment to fully wake up
                time.sleep(2)
            except Exception as wake_error:
                print(f"[add_monitor] Wake-up request failed (non-fatal): {wake_error}", file=sys.stderr)
                # Continue anyway - the service might already be awake
        
        # Connect to Uptime Kuma with increased timeout for Render services
        # Render free tier services can be slow to wake up, so use 60 second timeout
        timeout_seconds = 60.0
        print(f"[add_monitor] Creating UptimeKumaApi connection with {timeout_seconds}s timeout", file=sys.stderr)
        
        with UptimeKumaApi(api_url, timeout=timeout_seconds) as api:
            # Monkey-patch to inject 'conditions' field for Uptime Kuma v2 compatibility
            # Uptime Kuma v2 requires 'conditions' to be NOT NULL, but the library doesn't support it
            # Patch _build_monitor_data if it exists (this is the method that builds the data dict)
            if hasattr(api, '_build_monitor_data'):
                original_build_monitor_data = api._build_monitor_data
                
                def patched_build_monitor_data(**kwargs):
                    data = original_build_monitor_data(**kwargs)
                    # Add conditions field if not present (required by Uptime Kuma v2)
                    if 'conditions' not in data or data['conditions'] is None:
                        data['conditions'] = []  # Default to empty array for new monitors
                        print(f"[add_monitor] Injected 'conditions' field (empty array) for Uptime Kuma v2 compatibility", file=sys.stderr)
                    else:
                        print(f"[add_monitor] 'conditions' field already present: {data.get('conditions')}", file=sys.stderr)
                    return data
                
                api._build_monitor_data = patched_build_monitor_data
                print(f"[add_monitor] Successfully patched _build_monitor_data method for Uptime Kuma v2", file=sys.stderr)
            else:
                # Fallback: patch _call method to inject conditions into data before sending
                print(f"[add_monitor] _build_monitor_data not found, patching _call method instead", file=sys.stderr)
                original_call = api._call
                
                def patched_call(event, data=None, **kwargs):
                    # If this is an 'add' event for a monitor, inject conditions
                    if event == 'add' and isinstance(data, dict):
                        if 'conditions' not in data or data['conditions'] is None:
                            data['conditions'] = []
                            print(f"[add_monitor] Injected 'conditions' field via _call patch for Uptime Kuma v2", file=sys.stderr)
                    return original_call(event, data, **kwargs)
                
                api._call = patched_call
            
            # Authenticate using username/password
            # Note: API keys are for REST endpoints only, not Socket.io
            # login_by_token() requires a JWT token from a previous login session
            try:
                # Log exact values being used (mask password)
                print(f"[add_monitor] Attempting login with:", file=sys.stderr)
                print(f"[add_monitor]   URL: {api_url}", file=sys.stderr)
                print(f"[add_monitor]   Username: {username}", file=sys.stderr)
                print(f"[add_monitor]   Password length: {len(password) if password else 0}", file=sys.stderr)
                print(f"[add_monitor]   Password starts with: {password[:3] if password and len(password) >= 3 else '(too short)'}", file=sys.stderr)
                print(f"[add_monitor]   Password ends with: {password[-3:] if password and len(password) >= 3 else '(too short)'}", file=sys.stderr)
                
                # Retry login up to 3 times with exponential backoff for Render services
                max_retries = 3
                retry_delay = 2  # Start with 2 seconds
                
                for attempt in range(1, max_retries + 1):
                    try:
                        print(f"[add_monitor] Login attempt {attempt}/{max_retries}", file=sys.stderr)
                        api.login(username, password)
                        print(f"[add_monitor] Authentication successful", file=sys.stderr)
                        break  # Success, exit retry loop
                    except Exception as login_error:
                        error_type = type(login_error).__name__
                        if error_type == 'TimeoutError' and attempt < max_retries:
                            # Wait before retrying (exponential backoff)
                            print(f"[add_monitor] Timeout on attempt {attempt}, waiting {retry_delay}s before retry...", file=sys.stderr)
                            time.sleep(retry_delay)
                            retry_delay *= 2  # Exponential backoff: 2s, 4s, 8s
                        else:
                            # Not a timeout or last attempt, re-raise
                            raise
            except Exception as auth_error:
                error_msg = str(auth_error)
                print(f"[add_monitor] Authentication failed: {error_msg}", file=sys.stderr)
                print(f"[add_monitor] Error type: {type(auth_error).__name__}", file=sys.stderr)
                print(f"[add_monitor] Attempted login with username: '{username}', password length: {len(password) if password else 0}", file=sys.stderr)
                # Print full error details
                import traceback
                print(f"[add_monitor] Full error traceback:", file=sys.stderr)
                traceback.print_exc(file=sys.stderr)
                raise
            
            # Prepare monitor kwargs according to uptime-kuma-api documentation
            # Note: 'conditions' is required by the database but not accepted as a parameter
            # The uptime-kuma-api wrapper should handle this internally
            # Reference: UptimeSpecs.txt lines 416-615
            monitor_kwargs = {
                'type': monitor_type,
                'name': input_data.get('name', ''),
            }
            
            # Add optional parameters if provided (following UptimeSpecs.txt)
            if input_data.get('url'):
                monitor_kwargs['url'] = input_data['url']
            if input_data.get('description'):
                monitor_kwargs['description'] = input_data['description']
            if input_data.get('parent'):
                monitor_kwargs['parent'] = input_data['parent']
            if 'heartbeatInterval' in input_data:
                monitor_kwargs['interval'] = input_data.get('heartbeatInterval', 60)
            if 'heartbeatRetryInterval' in input_data:
                monitor_kwargs['retryInterval'] = input_data.get('heartbeatRetryInterval', 60)
            if 'resendInterval' in input_data:
                monitor_kwargs['resendInterval'] = input_data.get('resendInterval', 0)
            if 'retries' in input_data:
                monitor_kwargs['maxretries'] = input_data.get('retries', 0)
            if 'upsideDown' in input_data:
                monitor_kwargs['upsideDown'] = bool(input_data.get('upsideDown', False))
            if 'requestTimeout' in input_data:
                monitor_kwargs['timeout'] = input_data.get('requestTimeout', 48)
            if input_data.get('httpMethod') or input_data.get('method'):
                monitor_kwargs['method'] = input_data.get('httpMethod') or input_data.get('method', 'GET')
            if 'body' in input_data:
                monitor_kwargs['body'] = input_data.get('body', '')
            if input_data.get('bodyEncoding'):
                # Map to httpBodyEncoding (allowed values: "json", "xml" per specs)
                body_encoding = input_data.get('bodyEncoding', 'json').lower()
                if body_encoding == 'json':
                    monitor_kwargs['httpBodyEncoding'] = 'json'
                elif body_encoding == 'xml':
                    monitor_kwargs['httpBodyEncoding'] = 'xml'
                else:
                    monitor_kwargs['httpBodyEncoding'] = 'json'  # Default
            if 'keyword' in input_data:
                monitor_kwargs['keyword'] = input_data.get('keyword', '')
            if 'invertKeyword' in input_data:
                monitor_kwargs['invertKeyword'] = bool(input_data.get('invertKeyword', False))
            if 'maxredirects' in input_data:
                monitor_kwargs['maxredirects'] = input_data.get('maxredirects', 10)
            if 'expiryNotification' in input_data:
                monitor_kwargs['expiryNotification'] = bool(input_data.get('expiryNotification', False))
            if 'ignoreTls' in input_data:
                monitor_kwargs['ignoreTls'] = bool(input_data.get('ignoreTls', False))
            if 'proxyId' in input_data:
                monitor_kwargs['proxyId'] = input_data.get('proxyId')
            
            # accepted_statuscodes should be a list (per specs line 448)
            if input_data.get('acceptedStatusCodes'):
                monitor_kwargs['accepted_statuscodes'] = input_data['acceptedStatusCodes']
            
            # headers should be a string, not a list (per specs line 458)
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
            
            # notificationIDList should be a list (per specs line 438)
            if input_data.get('notificationIDList'):
                monitor_kwargs['notificationIDList'] = input_data['notificationIDList']
            
            # authMethod - convert string to AuthMethod enum (per specs line 460)
            if input_data.get('authMethod'):
                auth_str = input_data.get('authMethod', 'none').lower()
                auth_map = {
                    'none': AuthMethod.NONE,
                    'basic': AuthMethod.HTTP_BASIC,
                    'ntlm': AuthMethod.NTLM,
                    'mtls': AuthMethod.MTLS,
                }
                monitor_kwargs['authMethod'] = auth_map.get(auth_str, AuthMethod.NONE)
            
            # Basic auth credentials (per specs lines 468-470)
            if input_data.get('basicAuthUser'):
                monitor_kwargs['basic_auth_user'] = input_data['basicAuthUser']
            if input_data.get('basicAuthPass'):
                monitor_kwargs['basic_auth_pass'] = input_data['basicAuthPass']
            
            # NTLM auth (per specs lines 472-474)
            if input_data.get('authDomain'):
                monitor_kwargs['authDomain'] = input_data['authDomain']
            if input_data.get('authWorkstation'):
                monitor_kwargs['authWorkstation'] = input_data['authWorkstation']
            
            # mTLS certificates (per specs lines 462-466)
            if input_data.get('tlsCert'):
                monitor_kwargs['tlsCert'] = input_data['tlsCert']
            if input_data.get('tlsKey'):
                monitor_kwargs['tlsKey'] = input_data['tlsKey']
            if input_data.get('tlsCa'):
                monitor_kwargs['tlsCa'] = input_data['tlsCa']
            
            # OAuth2 (per specs lines 476-484)
            if input_data.get('oauthAuthMethod'):
                monitor_kwargs['oauth_auth_method'] = input_data['oauthAuthMethod']
            if input_data.get('oauthTokenUrl'):
                monitor_kwargs['oauth_token_url'] = input_data['oauthTokenUrl']
            if input_data.get('oauthClientId'):
                monitor_kwargs['oauth_client_id'] = input_data['oauthClientId']
            if input_data.get('oauthClientSecret'):
                monitor_kwargs['oauth_client_secret'] = input_data['oauthClientSecret']
            if input_data.get('oauthScopes'):
                monitor_kwargs['oauth_scopes'] = input_data['oauthScopes']
            
            # Add monitor using **kwargs to match the API signature
            result = api.add_monitor(**monitor_kwargs)
            
            # Output success result
            # According to UptimeSpecs.txt, the response has 'monitorID' (capital ID), not 'monitorId'
            # Try both formats for compatibility
            monitor_id = None
            if isinstance(result, dict):
                monitor_id = result.get('monitorID') or result.get('monitorId')
            
            output = {
                'success': True,
                'monitorID': monitor_id,
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
