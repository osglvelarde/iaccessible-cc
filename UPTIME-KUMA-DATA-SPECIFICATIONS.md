# Uptime Kuma Data Specifications

This document describes the metadata and data collected from Uptime Kuma monitoring system, including monitor configurations, heartbeat data, and metrics tracked by the iaccessible-cc application.

## Table of Contents

1. [Monitor Metadata](#monitor-metadata)
2. [Heartbeat Data](#heartbeat-data)
3. [Metrics and Statistics](#metrics-and-statistics)
4. [Real-time Events](#real-time-events)
5. [Data Collection Methods](#data-collection-methods)
6. [Data Storage and Retention](#data-storage-and-retention)

---

## Monitor Metadata

### Core Monitor Information

Each monitor in Uptime Kuma contains the following metadata:

| Field | Type | Description | Source |
|-------|------|-------------|--------|
| `id` | `number` | Unique monitor identifier | Prometheus metrics / API |
| `name` | `string` | Human-readable monitor name | Prometheus metrics / API |
| `url` | `string` | Target URL or endpoint to monitor | Prometheus metrics / API |
| `type` | `string` | Monitor type: `http`, `https`, `tcp`, `ping`, `dns` | Prometheus metrics / API |
| `status` | `0 \| 1 \| 2` | Current status: `0` = down, `1` = up, `2` = pending | Prometheus metrics / Real-time |

### Monitor Configuration

When creating or updating a monitor, the following configuration options are available:

#### Basic Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | `string` | *required* | Monitor display name |
| `url` | `string` | *required* | Target URL or endpoint |
| `type` | `string` | `'https'` | Monitor type (http/https/tcp/ping/dns) |
| `heartbeatInterval` | `number` | `60` | Check interval in seconds |
| `heartbeatRetryInterval` | `number` | `60` | Retry interval in seconds |
| `retries` | `number` | `0` | Number of retry attempts |
| `requestTimeout` | `number` | `48` | Request timeout in seconds |

#### HTTP/HTTPS Specific Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `httpMethod` | `string` | `'GET'` | HTTP method (GET, POST, PUT, DELETE, etc.) |
| `body` | `string` | `''` | Request body content |
| `bodyEncoding` | `string` | `'JSON'` | Body encoding (JSON, XML, etc.) |
| `headers` | `array` | `[]` | Custom HTTP headers (array of `{key, value}`) |
| `acceptedStatusCodes` | `array` | `["200-299"]` | Acceptable HTTP status code ranges |
| `maxredirects` | `number` | `10` | Maximum number of redirects to follow |
| `keyword` | `string` | `''` | Required keyword in response body |
| `ignoredKeywords` | `array` | `[]` | Keywords that indicate failure |
| `authMethod` | `string` | `'none'` | Authentication method (none, basic, ntlm) |
| `basicAuthUser` | `string` | `''` | Basic auth username (if applicable) |
| `basicAuthPass` | `string` | `''` | Basic auth password (if applicable) |

#### Advanced Configuration

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `tags` | `array` | `[]` | Monitor tags for organization |
| `notificationIDList` | `array` | `[]` | List of notification channel IDs |
| `description` | `string` | `''` | Monitor description |
| `parent` | `string` | `''` | Parent monitor group ID |
| `upsideDown` | `boolean` | `false` | Invert status logic |
| `ignoreTls` | `boolean` | `false` | Ignore TLS/SSL certificate errors |

---

## Heartbeat Data

### Real-time Heartbeat Events

Real-time heartbeat events are received via Socket.io connection and contain:

| Field | Type | Description |
|-------|------|-------------|
| `monitorID` | `number` | Monitor identifier |
| `status` | `0 \| 1 \| 2` | Status: `0` = down, `1` = up, `2` = pending |
| `msg` | `string` | Status message (e.g., "200 - OK", error message) |
| `time` | `string` | Timestamp in format `'YYYY-MM-DD HH:mm:ss.SSS'` |
| `ping` | `number` | Response time in milliseconds (may be `undefined` for down events) |
| `duration` | `number` | Duration since last heartbeat in seconds (optional) |
| `important` | `boolean` | Whether this is an important heartbeat (optional) |
| `down_count` | `number` | Count of consecutive down events (optional) |

### Historical Heartbeat Data (Monitor Beats)

Historical heartbeat data retrieved from Uptime Kuma database:

| Field | Type | Description |
|-------|------|-------------|
| `id` | `number` | Unique heartbeat identifier |
| `monitor_id` | `number` | Monitor identifier |
| `status` | `0 \| 1 \| 2` | Status: `0` = down, `1` = up, `2` = pending |
| `ping` | `number` | Response time in milliseconds (0 if unavailable) |
| `msg` | `string` | Status message |
| `time` | `string` | Timestamp string (e.g., `'2022-12-15 12:38:42.661'`) |
| `duration` | `number` | Duration since last heartbeat in seconds |
| `important` | `boolean` | Whether this is an important heartbeat |
| `down_count` | `number` | Count of consecutive down events |

### Heartbeat Data Collection

- **Real-time**: Via Socket.io connection (`/api/uptime-kuma/heartbeats`)
- **Historical**: Via Python script (`get_monitor_beats.py`) for time ranges (default: 1 hour)
- **Combined**: Application merges real-time and historical data for complete view

---

## Metrics and Statistics

### Monitor-Level Metrics

Calculated from Prometheus metrics and heartbeat data:

| Metric | Type | Description | Calculation |
|--------|------|-------------|-------------|
| `uptime` | `number` | Uptime percentage (0-100) | From Prometheus `monitor_uptime` metric |
| `avgResponseTime` | `number` | Average response time in milliseconds | From Prometheus `monitor_response_time` or calculated from heartbeats |
| `maxResponseTime` | `number` | Maximum response time in milliseconds | From Prometheus `monitor_max_response_time` |
| `minResponseTime` | `number` | Minimum response time in milliseconds | From Prometheus `monitor_min_response_time` |
| `lastCheckTime` | `number` | Unix timestamp (ms) of last check | From Prometheus `monitor_last_check` |
| `certDaysRemaining` | `number` | SSL certificate days remaining (HTTPS only) | From Prometheus `monitor_cert_days_remaining` |
| `statusMessage` | `string` | Status message or error description | From latest heartbeat or Prometheus metrics |

### Prometheus Metrics Collected

The application parses the following Prometheus metrics from Uptime Kuma:

1. **`monitor_status`**
   - Format: `monitor_status{monitor_id="X",monitor_name="...",monitor_type="...",monitor_url="..."} value`
   - Value: `0` (down), `1` (up), `2` (pending)

2. **`monitor_response_time`**
   - Average response time in milliseconds

3. **`monitor_max_response_time`**
   - Maximum response time in milliseconds

4. **`monitor_min_response_time`**
   - Minimum response time in milliseconds

5. **`monitor_uptime`**
   - Uptime percentage (0-100)

6. **`monitor_last_check`**
   - Unix timestamp of last check

7. **`monitor_cert_days_remaining`** (HTTPS only)
   - Days until SSL certificate expiration

### Calculated Metrics

The application calculates additional metrics from heartbeat data:

- **Average Response Time (Last Hour)**: Calculated from heartbeats within the last 60 minutes
- **Response Time Trend**: Tracked via heartbeat chart visualization
- **Uptime Percentage**: Derived from status history

---

## Real-time Events

### Socket.io Events

The application subscribes to the following Socket.io events:

| Event | Description | Data Structure |
|-------|-------------|----------------|
| `heartbeat` | Real-time heartbeat event | `HeartbeatEvent` interface |
| `token` | Authentication token | `{ token: string }` or `string` |
| `connect` | Socket connection established | - |
| `connect_error` | Connection error | Error object |
| `disconnect` | Socket disconnected | - |

### Server-Sent Events (SSE)

The application provides SSE endpoint for real-time heartbeats:

- **Endpoint**: `/api/uptime-kuma/heartbeats?monitorId={id}`
- **Format**: Server-Sent Events (text/event-stream)
- **Events**:
  - `connected`: Connection established
  - `heartbeat`: New heartbeat received
  - `status`: Connection status update
  - `ping`: Keep-alive ping
  - `error`: Error occurred

---

## Data Collection Methods

### 1. Prometheus Metrics Endpoint

**Endpoint**: `/api/uptime-kuma/metrics`  
**Method**: GET  
**Format**: Prometheus text format  
**Frequency**: On-demand (when monitor list is refreshed)

**Data Retrieved**:
- Monitor status
- Response time statistics
- Uptime percentages
- SSL certificate information
- Last check timestamps

### 2. Python Scripts (Socket.io API)

**Scripts**:
- `add_monitor.py`: Create new monitor
- `get_monitor_beats.py`: Retrieve historical heartbeat data
- `update_monitor.py`: Update existing monitor
- `delete_monitor.py`: Delete monitor

**Library**: `uptime-kuma-api` (Python wrapper for Uptime Kuma Socket.io API)

**Data Retrieved**:
- Historical heartbeat data (beats)
- Monitor creation/update results
- Authentication tokens

### 3. Real-time Socket.io Connection

**Connection**: Direct Socket.io connection to Uptime Kuma  
**Authentication**: Username/password or API token  
**Events**: Real-time heartbeat events

**Data Retrieved**:
- Live heartbeat events
- Status changes
- Response time updates

### 4. Server-Sent Events (SSE)

**Endpoint**: `/api/uptime-kuma/heartbeats`  
**Method**: GET with `monitorId` query parameter  
**Format**: Server-Sent Events stream

**Data Retrieved**:
- Real-time heartbeat events (proxied from Socket.io)
- Connection status
- Error notifications

---

## Data Storage and Retention

### Client-Side Storage

- **Real-time Heartbeats**: Stored in React component state (in-memory)
- **Historical Beats**: Cached in component state for current session
- **Monitor List**: Cached in component state, refreshed from Prometheus metrics

### Server-Side Storage

- **No Persistent Storage**: The application does not store monitor or heartbeat data persistently
- **All Data**: Retrieved on-demand from Uptime Kuma via:
  - Prometheus metrics endpoint
  - Python scripts (Socket.io API)
  - Real-time Socket.io connection

### Data Retention

- **Real-time Heartbeats**: Retained in memory during active session
- **Historical Beats**: Retrieved for specified time range (default: 1 hour)
- **Monitor Metadata**: Refreshed on each page load or manual refresh

### Data Flow

```
Uptime Kuma Server
    ↓
1. Prometheus Metrics (/api/metrics)
    ↓
   Monitor List & Statistics
    ↓
2. Python Scripts (Socket.io API)
    ↓
   Historical Heartbeat Data
    ↓
3. Socket.io Connection
    ↓
   Real-time Heartbeat Events
    ↓
Next.js Application
    ↓
React Components (In-Memory State)
    ↓
UI Display (Charts, Cards, Tables)
```

---

## Status Values

### Monitor Status

| Value | Meaning | Description |
|-------|---------|-------------|
| `0` | Down | Monitor is currently down/failing |
| `1` | Up | Monitor is currently up/healthy |
| `2` | Pending | Monitor check is in progress |

### Status Summary

| Status | Description |
|--------|-------------|
| `ok` | All monitors are operational |
| `error` | One or more monitors are down |

---

## Response Time Metrics

### Units

- All response times are measured in **milliseconds (ms)**
- Average response time calculated from heartbeats with `ping > 0`
- Response times of `0` or `undefined` indicate unavailable data (typically down events)

### Calculation

- **Average Response Time**: Sum of all response times / count of valid heartbeats
- **Time Range**: Default calculation uses last 60 minutes of heartbeat data
- **Filtering**: Only heartbeats with valid timestamps and positive ping values are included

---

## SSL Certificate Monitoring

For HTTPS monitors, the following SSL certificate data is collected:

| Field | Type | Description |
|-------|------|-------------|
| `certDaysRemaining` | `number` | Days until certificate expiration |
| **Alert Threshold**: Typically alerts when < 30 days remaining |

---

## Notification Integration

Monitors can be configured with notification channels:

| Field | Type | Description |
|-------|------|-------------|
| `notificationIDList` | `array<number>` | List of notification channel IDs |
| **Supported Channels**: Email, Slack, Discord, Telegram, Webhook, etc. |

---

## Tags and Organization

Monitors can be organized using tags:

| Field | Type | Description |
|-------|------|-------------|
| `tags` | `array<string>` | Monitor tags for filtering and organization |
| **Use Cases**: Environment (production, staging), Service type, Team ownership |

---

## Data Validation

### Required Fields

When creating a monitor, the following fields are required:
- `name`: Monitor name
- `url`: Target URL
- `type`: Monitor type

### Optional Fields

All other configuration fields are optional and have sensible defaults.

### Data Type Validation

- Monitor IDs: Must be positive integers
- Response times: Must be non-negative numbers (0 or positive)
- Status values: Must be 0, 1, or 2
- Timestamps: Must be valid date strings or Unix timestamps

---

## Error Handling

### Common Error Scenarios

1. **Connection Timeout**: When Uptime Kuma is slow or unavailable
   - Timeout: 65 seconds for Python scripts
   - Fallback: Real-time heartbeats continue to work

2. **Authentication Errors**: Invalid credentials
   - Error: `authIncorrectCreds`
   - Solution: Verify environment variables

3. **Module Not Found**: Python dependencies missing
   - Error: `ModuleNotFoundError: No module named 'uptime_kuma_api'`
   - Solution: Ensure Python packages are installed

4. **Network Errors**: Connection failures
   - Retry logic: Exponential backoff for login attempts
   - Wake-up requests: For Render services (cold start mitigation)

---

## API Endpoints

### Application API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/uptime-kuma/metrics` | GET | Get Prometheus metrics from Uptime Kuma |
| `/api/uptime-kuma/monitors` | POST | Create a new monitor |
| `/api/uptime-kuma/monitor-beats` | GET | Get historical heartbeat data |
| `/api/uptime-kuma/heartbeats` | GET | SSE stream for real-time heartbeats |
| `/api/uptime-kuma/test-auth` | GET | Test authentication and connection |
| `/api/debug/paths` | GET | Debug endpoint for path verification |

---

## Environment Variables

Required environment variables for Uptime Kuma integration:

| Variable | Description | Example |
|----------|-------------|---------|
| `UPTIME_KUMA_API_URL` | Uptime Kuma server URL | `https://uptime-monitoring-tool.onrender.com` |
| `UPTIME_KUMA_USERNAME` | Username for authentication | `iaccessible-admin` |
| `UPTIME_KUMA_PASSWORD` | Password for authentication | `***` |
| `UPTIME_KUMA_API_KEY` | API key for metrics endpoint | `uk1_...` |

---

## Version Information

- **Uptime Kuma Version**: 2.0.2 (Docker)
- **Python Library**: `uptime-kuma-api >= 1.23.0`
- **Integration Method**: Socket.io + Prometheus metrics
- **Last Updated**: 2025-01-XX

---

## References

- [Uptime Kuma Documentation](https://github.com/louislam/uptime-kuma)
- [Uptime Kuma API Python Library](https://github.com/lucasheld/uptime-kuma-api)
- [Prometheus Metrics Format](https://prometheus.io/docs/instrumenting/exposition_formats/)

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-XX  
**Maintained By**: iaccessible-cc Development Team

